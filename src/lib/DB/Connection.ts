import { createPool, createConnection } from 'mysql';
import { Config } from './../';
import { StackerJS } from 'stackerjs-types';


export namespace Connection
{

    abstract class Connection implements StackerJS.DB.Connection
    {

        protected host:string;
        protected port:string;
        protected user:string;
        protected pass:string;
        protected name:string;
        protected conn:any;

        abstract close():void;

        abstract isConnected():boolean;

        abstract makeConnection():any;

        abstract query(query:Array<string>|string, params:any):Promise<StackerJS.DB.QueryResults|Array<any>>;

        public constructor()
        {
            this.host = Config.get('db.host');
            this.port = Config.get('db.port');
            this.user = Config.get('db.user');
            this.pass = Config.get('db.pass');
            this.name = Config.get('db.name');
        }

        public connect():void
        {
            return this.conn = this.makeConnection();
        }

        public getConn():any
        {
            if (!this.conn)
                this.connect();

            return this.conn;
        }

        public getQueryType(query:string):string
        {
            return query.split(' ')[0] === 'SELECT' ? 'READ' : 'WRITE';
        }

    }

    export namespace MySQL
    {

        export class MySQLConnection extends Connection
        {

            public isConnected():boolean
            {
                if (!this.conn)
                    return false;

                return !this.conn._closed;
            }

            public query(query:Array<string>|string, params:any = {})
            {
                if (Array.isArray(query))
                    return Promise.all(query.map(q => this.query(q)));

                return new Promise((resolve:Function, reject:Function) => {
                    this.getConn().query(
                        query, 
                        params,
                        (err:Error, result:any):void => 
                            err ? reject(err) : resolve(result)
                    );
                })
                    .then((result:any):StackerJS.DB.QueryResults|Array<any> => {
                        if (this.getQueryType(query) === 'READ')
                            return result;

                        return {
                            'affectedRows': result.affectedRows,
                            'changedRows': result.changedRows,
                            'lastInsertedId': result.insertId
                        }
                    });
            }

            public close():Promise<boolean>
            {
                if (!this.conn)
                    return Promise.resolve(true);

                return new Promise(resolve => {
                    this.conn.end(():void => {
                        this.conn = null;
                        resolve(true);
                    });
                });
            }

            public makeConnection():any
            {   
                return createConnection({
                    'host': this.host,
                    'port': this.port || 3306,
                    'user': this.user,
                    'password': this.pass,
                    'database': this.name
                })
            }

        }

    }

}