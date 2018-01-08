import { Config } from './../';
import { QueryBuilder } from './QueryBuilder';
import { Connection } from './Connection';


export namespace DB
{

    export class Factory
    {
        private static dbConnection:Connection;

        public static getQueryBuilder():QueryBuilder
        {
            if (this.getDriver() === 'mysql')
                return new QueryBuilder.MySQL.MySQLQueryBuilder();
        }

        public static getQueryCriteria():QueryCriteria
        {
            if (this.getDriver() === 'mysql')
                return new QueryBuilder.SQLCriteria();
        }

        public static getConnection():Connection
        {
            if (this.dbConnection)
                return this.dbConnection;

            if (this.getDriver() === 'mysql')
                return this.dbConnection = new Connection.MySQL.MySQLConnection();
        }

        private static getDriver():string
        {
            return Config.get('db.driver', 'mysql');
        }
    }

    export interface Connection
    {

        close():void;

        connect():void;

        getConn():any;

        isConnected():boolean;

        makeConnection():any;

        query(query:Array<string>|string, params?:any):Promise<Array<any>|QueryResults>;

    }

    export interface QueryResults
    {

        lastInsertedId?:number|string;

        changedRows?:number;

        affectedRows?:number;

    }

    export interface QueryBuilder
    {

        insert():QueryBuilderInsert;

        update():QueryBuilderUpdate;

        delete():QueryBuilderDelete;

        select():QueryBuilderSelect;

    }

    export interface QueryCriteria
    {

        like(field:string, value:string):string;

        eq(field:string, value:any):string;

        neq(field:string, value:any):string;

        lt(field:string, value:any):string;

        lte(field:string, value:any):string;

        gt(field:string, value:any):string;

        gte(field:string, value:any):string;

        andX(...criterias):string;

        orX(...criterias):string;

    }

    export interface QueryBuilderQueries
    {

        set(values:string|any, value?:string|number|boolean|Date):QueryBuilderQueries

        where(where:string|any):QueryBuilderQueries;

        treatValue(value:any, treatString?:boolean):any;

        toSql():string;

    }

    export interface QueryBuilderInsert extends QueryBuilderQueries
    {

        into(tableName:string):QueryBuilderQueries

    }

    export interface QueryBuilderUpdate extends QueryBuilderQueries
    {

        into(tableName:string):QueryBuilderQueries;

        where(where:string):QueryBuilderQueries;

    }

    export interface QueryBuilderDelete extends QueryBuilderQueries
    {

        from(tableName:string):QueryBuilderQueries;

        where(where:string):QueryBuilderQueries;

    }

    export interface QueryBuilderSelect extends QueryBuilderQueries
    {

        set(...fields):QueryBuilderSelect;

        from(tableName:string):QueryBuilderSelect;

        join(type:string, tableName:string, on:string):QueryBuilderSelect

        where(where:string):QueryBuilderSelect;

        group(...fields):QueryBuilderSelect;

        having(having:string):QueryBuilderSelect;

        order(order:string|Array<string>):QueryBuilderSelect;

        limit(limit:number):QueryBuilderSelect;
        
        offset(offset:number):QueryBuilderSelect;
        
    }

}