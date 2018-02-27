import { Config } from './../';
import { QueryBuilder } from './QueryBuilder';
import { Connection } from './Connection';
import { StackerJS } from 'stackerjs-types';


export namespace DB
{

    export class Factory
    {
        private static dbConnection:StackerJS.DB.Connection;

        public static getQueryBuilder():StackerJS.DB.QueryBuilder
        {
            if (this.getDriver() === 'mysql')
                return new QueryBuilder.MySQL.MySQLQueryBuilder();
        }

        public static getQueryCriteria():StackerJS.DB.QueryCriteria
        {
            if (this.getDriver() === 'mysql')
                return new QueryBuilder.SQLCriteria();
        }

        public static getConnection():StackerJS.DB.Connection
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

}