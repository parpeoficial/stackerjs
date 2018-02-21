import { Server } from 'http';
import { Http } from 'stackerjs-http';


declare module "stackerjs" 
{

    export * from 'stackerjs-http'

    export namespace MVC
    {

        export abstract class Controller implements IController
        {
            
            abstract routes():IControllerRoute;
    
        }

        export interface IController
        {
            
            /**
             * Holds controllers routes to defined actions
             */
            routes():IControllerRoute;
    
        }
    
        export interface IControllerRoute
        {
            
            /**
             * Defines GET routes and callbacks
             */
            get?:any;
            
            /**
             * Defines POST routes and callbacks
             */
            post?:any;
    
            /**
             * Defines PUT routes and callbacks
             */
            put?:any;
    
            /**
             * Defines DELETE routes and callbacks
             */
            delete?:any;
    
        }

        export interface IMiddleware
        {
    
            do(request?:Http.Request):any;
    
        }

    }

    export namespace Integrations
    {

        export class Slack
        {

            /**
             * Sends a message on configured Channel into Slack.
             * 
             * @param text Message to be sent
             */
            public text(text:string):Promise<boolean>;

            /**
             * Sends a message with attachment on configured Channel into Slack.
             * 
             * @param text Message to be sent
             * @param attachments Array of attachments
             */
            public attach(text:string, attachments:Array<SlackMessageAttachment>):Promise<boolean>;

            /**
             * Sends message to Slack according to defined configurations on message object.
             * 
             * @param message Message to be sent to Slack
             */
            public send(message:SlackMessage):Promise<boolean>;

        }

        interface SlackMessage
        {
    
            icon_url:string;
    
            username:string;
    
            channel:string;
    
            text:string;
    
            attachments?:Array<SlackMessageAttachment>;
    
        }
    
        interface SlackMessageAttachment
        {
    
            fallback?:string;
    
            pretext?:string;
    
            text?:string;
    
            color:string;
    
            fields:Array<SlackMessageAttachmentField>;
    
        }
    
        interface SlackMessageAttachmentField
        {
    
            title:string;
    
            value:string;
    
            short?:boolean;
    
        }

    }

    export namespace DB
    {
        
        export class Factory
        {
            
            /**
             * Returns a QueryBuilder instance based on database driver
             */
            public static getQueryBuilder():QueryBuilder;
            
            /**
             * Returns a QueryCriteria instance based on database driver
             */
            public static getQueryCriteria():QueryCriteria;
            
            /**
             * Returns a Connection instance based on database driver
             */
            public static getConnection():Connection;

        }
    
        export interface Connection
        {
    
            /**
             * Closes database connection
             */
            close():void;
            
            /**
             * Connects to database
             */
            connect():void;
            
            /**
             * Returns connection driver
             */
            getConn():any;
            
            /**
             * Checks if database is connected
             */
            isConnected():boolean;
            
            /**
             * Creates connection to database
             */
            makeConnection():any;
            
            /**
             * Executes a query or a bunch of them
             * 
             * @param query Can be a query string or an Array of queries
             */
            query(query:Array<string>|string, params?:any):Promise<Array<any>|QueryResults>;
    
        }
    
        export interface QueryResults
        {
            
            /**
             * Returns last inserted id in case it's an insert query
             */
            lastInsertedId?:number|string;
            
            /**
             * Returns number of changed rows
             */
            changedRows?:number;
            
            /**
             * Returns number of affected rows
             */
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
    
            where(where:string|any):QueryBuilderQueries;
    
        }
    
        export interface QueryBuilderDelete extends QueryBuilderQueries
        {
    
            from(tableName:string):QueryBuilderQueries;
    
            where(where:string|any):QueryBuilderQueries;
    
        }
    
        export interface QueryBuilderSelect extends QueryBuilderQueries
        {
    
            set(...fields):QueryBuilderSelect;
    
            from(tableName:string):QueryBuilderSelect;
    
            join(type:string, tableName:string, on:string):QueryBuilderSelect
    
            where(where:string|any):QueryBuilderSelect;
    
            group(...fields):QueryBuilderSelect;

            having(having:string):QueryBuilderSelect;

            order(order:string|Array<string>):QueryBuilderSelect;
    
            limit(limit:number):QueryBuilderSelect;
            
            offset(offset:number):QueryBuilderSelect;
            
        }

    }

    export namespace ORM
    {

        export class Util
        {
            
            /**
             * Make an Entity from database data
             * 
             * @param defaultEntity Sample Entitity to be replicated
             * @param attributes Database row's attributes
             */
            public static makeEntity(defaultEntity:IEntity, attributes);

        }

        export abstract class BaseRepository implements IRepository
        {

            abstract entity:IEntity;

            /**
             * Adds an error message
             * 
             * @param field Or item to where error's message is attached
             * @param message Error's message
             */
            public addError(field?:string|Error, message?:string|Error):void;
            
            /**
             * Returns an array of errors
             */
            public getErrors():Array<string>;
            
            /**
             * Identifies if there's any error message attached to Repository
             */
            public hasErrors():boolean;

            /**
             * Checks if selected entity is valid
             * 
             * @param entity Entity to be verified
             */
            public validate(entity:IEntity):boolean;

            /**
             * Saves an entity, if it's a new record insert it on database
             * but of is an already existent data that it's updated.
             * 
             * @param entity Entity to be saved
             */
            public save(entity:IEntity):Promise<boolean>;
                        
            /**
             * Returns an Entity in case it's found in database
             * 
             * @param id Id of entity to be found
             */
            public findById(id:string|number):Promise<IEntity>;
            
            /**
             * Returns a list of Entities from defined repository
             * 
             * @param filter Filters results
             * @param limit Defines a limit for Array of Entities
             * @param offset Defines where should Array start
             */
            public find(filter?:string|any, limit?:number, offset?:number, order?:string|Array<string>):Promise<Array<IEntity>>;

            /**
             * Returns a single Entity that matches results
             * 
             * @param filter Filter that will be matched with result
             */
            public findOne(filter?:string|any):Promise<IEntity>;

            /**
             * Returns the number of registers in a repository
             * 
             * @param filters Defines a filter for counted entities in repository
             */
            public count(filters?:string|any):Promise<number>;

            /**
             * Deletes an Entity from database.
             * 
             * @param entity Entity to be deleted from database
             */
            public delete(entity:IEntity):Promise<boolean>;

            /**
             * Executed before Entity validation
             * 
             * @param entity 
             */
            protected beforeValidate(entity:IEntity):Promise<boolean>;

            /**
             * Executed after Entity validation
             * 
             * @param entity Entity to be used after validation
             */
            protected afterValidate(entity:IEntity):Promise<boolean>;
            
            /**
             * Executed before Entity be saved
             * 
             * @param entity Entity that will be saved
             */
            protected beforeSave(entity:IEntity):Promise<boolean>;

            /**
             * Executed after Entity being saved
             * 
             * @param entity Entity that was saved
             */
            protected afterSave(entity:IEntity):Promise<boolean>;

            /**
             * Updates an Entity
             * 
             * @param entity Entity to be updated
             */
            protected update(entity:IEntity):Promise<boolean>;

            /**
             * Inserts an Entity
             * 
             * @param entity Entity to be inserted
             */
            protected insert(entity:IEntity):Promise<boolean>;

        }

        export interface IRepository
        {
    
            entity:IEntity;
    
        }
    
        export interface IEntity
        {
    
            metadata():IEntityMetadata;
    
        }
    
        export interface IEntityMetadata
        {
            table:string;
            fields:Array<IEntityMetadataField>;
            relations:Array<IEntityMetadataRelation>;
        }
    
        export interface IEntityMetadataField
        {
            type:string;
            name:string;
            alias?:string;
            required?:boolean;
            max?:number;
            min?:number;
            default?:string|number;
        }
    
        export interface IEntityMetadataRelation
        {
            name:string;
            type:string;
            referencedEntity:IEntity
            field:string;
            table?:string;
            referencedField:string;
        }

    }

    /**
     * Helper that permits setting and consulting informations.
     * Possible parsing .env file in project root in here.
     */
    export class Config
    {

        /**
         * Get a value from Configuration
         * 
         * @param key Key of value that will be gotten
         * @param defaultValue If key is not found, them returns default value
         */
        public static get(key:string, defaultValue?:any);

        /**
         * Sets a value on Configuration based on key
         * 
         * @param key Key to index configuration
         * @param value Configuration value that will be set
         */
        public static set(key:string, value:any):void;
        
        /**
         * Loads all variables in a .env file on Configuration
         */
        public static loadEnvFile():void;
        
    }

    /**
     * Class responsible for implementing functions that permits manage Cache.
     */
    export class Cache
    {

        /**
         * Gets a cache if it's exists
         * @param fileName 
         */
        public static get(fileName:string, defaultValue?:any):string;

        /**
         * Creates a cache file with defined content
         * 
         * @param fileName File name to be defined
         * @param fileContent File content to be cached
         * @param {Date} expiresAt defines a date when cache should expire. Default is 2 hours
         */
        public static set(fileName:string, fileContent:string, expiresAt?:Date):void;

        /**
         * Verifies if there's a cache file with that name
         * 
         * @param fileName File to be checked
         */
        public static has(fileName:string):boolean;

    }

    /**
     * Represents current application.
     */
    export class App
    {

        /**
         * App Constructor
         * 
         * @param name Application name
         */
        public constructor(name:string);

        /**
         * Registers a microservice that will be used in application
         * 
         * @param {MicroService} microservice MicroService class with routes and callbacks configured
         * @param prefix Prefix of MicroService routes
         */
        public registerMicroService(microservice:MicroService, prefix?:string):void;

        /**
         * Executes App
         * 
         * @param port Defines a port for application run on
         */
        public run(port:number):Server;

    }

    /**
     * Manages each microservice in application and its functionalities
     */
    export class MicroService
    {

        /**
         * MicroService constructor
         * 
         * @param microServiceName Microservice's name
         */
        public constructor(microServiceName:string);

        /**
         * Sets a middleware to the microservice routes
         * 
         * @param {MVC.IMiddleware} middleware Middleware class
         */
        public setMiddleware(middleware:MVC.IMiddleware):void

        /**
         * Defines and run a callback according to called route.
         * 
         * @param method HTTP method to be used
         * @param route Route that when called will execute callback
         * @param callback Callback that will be executed
         */
        public setRoute(method:string, route:string, callback:Function):void;

        /**
         * Register a controller to be used as routes and callbacks (actions) bucket.
         * 
         * @param {MVC.IController} controller Controller with routes and actions that will be loaded
         */
        public registerController(controller:MVC.IController):void

    }

}