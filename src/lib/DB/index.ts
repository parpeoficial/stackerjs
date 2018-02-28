import { StackerJS } from 'stackerjs-types';
import { Config } from 'stackerjs-utils';
import { Connection } from './Connection';


export namespace DB
{

    export class Factory
    {
        private static dbConnection:StackerJS.DB.Connection;

        public static getQueryBuilder():StackerJS.DB.QueryBuilder
        {
            const { QueryBuilder } = require('stackerjs-db-mysql-adapter');

            return new QueryBuilder();
        }

        public static getQueryCriteria():StackerJS.DB.QueryCriteria
        {
            const { QueryCriteria } = require('stackerjs-db-mysql-adapter');

            return new QueryCriteria();
        }

        public static getConnection():StackerJS.DB.Connection
        {
            if (this.dbConnection)
                return this.dbConnection;

            if (this.getDriver() === 'mysql' || this.getDriver() === 'stackerjs-db-mysql-adapter')
                return this.dbConnection = new Connection.MySQL.MySQLConnection();
        }

        private static getDriver():string
        {
            return Config.get('db.driver', 'mysql');
        }
    }

}