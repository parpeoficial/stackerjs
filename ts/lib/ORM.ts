import { DB } from './DB';


export namespace ORM
{

    export class Util
    {

        public static makeEntity(defaultEntity:IEntity, attributes)
        {
            let metadata:ORM.IEntityMetadata = defaultEntity.metadata();
            
            let entity:IEntity = Object.create(defaultEntity);
            Object.defineProperty(entity, '_attributes', {
                'get': () => attributes
            });

            metadata.fields
                .forEach((field:IEntityMetadataField):void => 
                {
                    if (typeof attributes[field.name] !== 'undefined') {
                        if (field.type === 'boolean')
                            entity[field.name] = attributes[field.name] === 1;
                        else if (field.type === 'date')
                            entity[field.name] = new Date(attributes[field.name]);
                        else if (field.type === 'json') {
                            try {
                                entity[field.name] = JSON.parse(attributes[field.name]);
                            } catch (err) { 
                                entity[field.name] = attributes[field.name] 
                            }
                        } else
                            entity[field.name] = attributes[field.name];
                    }
                });

            metadata.relations
                .forEach((relation:ORM.IEntityMetadataRelation):void => {
                    let relationGetterFunction = () => null;
                    if (relation.type === 'HASMANY')
                        relationGetterFunction = this
                            .HASMANYAssociation(entity, relation);
                    else if (relation.type === 'HASONE' || relation.type === 'BELONGSTO')
                        relationGetterFunction = this
                            .HASONEAssociation(entity, relation);
                    else if (relation.type === 'MANYMANY')
                        relationGetterFunction = this
                            .MANYMANYAssociation(entity, relation)

                    Object.defineProperty(entity, relation.name, {
                        'get': relationGetterFunction
                    });
                });

            return Promise.resolve(entity);
        }

        private static MANYMANYAssociation(entity:IEntity, relation:ORM.IEntityMetadataRelation)
        {
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .from(relation.table)
                .set(`${relation.referencedEntity.metadata().table}.*`)
                .join(
                    'INNER', 
                    relation.referencedEntity.metadata().table, 
                    `${relation.table}.${relation.referencedField} = ` +
                    `${relation.referencedEntity.metadata().table}.id`
                )
                .where(expr.eq(relation.field, entity['_attributes']['id']));

            return ():Promise<Array<IEntity>> => DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then((results:Array<any>):Promise<Array<IEntity>> => Promise.all(
                    results.map((result:any):Promise<IEntity> => this
                        .makeEntity(relation.referencedEntity, result))
                ));
        }

        private static HASONEAssociation(entity:IEntity, relation:ORM.IEntityMetadataRelation)
        {
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .from(relation.referencedEntity.metadata().table)
                .set('*')
                .where(expr.eq(relation.referencedField, entity['_attributes'][relation.field]))
                .limit(1);

            return ():Promise<IEntity> => DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then((results:Array<any>):Promise<IEntity> => {
                    if (results.length <= 0)
                        return Promise.resolve(null);

                    return this.makeEntity(relation.referencedEntity, results[0]);
                });
        }

        private static HASMANYAssociation(entity:IEntity, relation:ORM.IEntityMetadataRelation)
        {
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .from(relation.referencedEntity.metadata().table)
                .set('*')
                .where(expr.eq(relation.referencedField, entity[relation.field]));

            return ():Promise<Array<IEntity>> => DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then((results:Array<any>):Promise<Array<IEntity>> => Promise.all(
                        results.map((result:any):Promise<IEntity> => this
                            .makeEntity(relation.referencedEntity, result))
                    ));
        }

    }

    export abstract class BaseRepository implements IRepository
    {

        private errors:any = {};

        abstract entity:IEntity;

        public addError(field?:string, message?:string|Error):void
        {
            if (!message) {
                message = field;
                field = 'Database';
            }

            if (!Array.isArray(this.errors[field]))
                this.errors[field] = [];

            if (message instanceof Error)
                this.errors[field].push(message.message);
            else
                this.errors[field].push(message);
        }

        public getErrors():Array<string>
        {
            return this.errors;
        }

        public hasErrors()
        {
            return Object.keys(this.errors).length > 0;
        }

        public validate(entity:IEntity):boolean
        {
            this.entity.metadata().fields.forEach((field):void => {
                if (field.required && (!entity[field.name] || entity[field.name].length === ''))
                    this.addError(field.name, "Field is required");

                if (field.max && entity[field.name] && (entity[field.name] > field.max || entity[field.name].length > field.max))
                    this.addError(field.name, `Field length must be under ${field.max}`);

                if (field.min && entity[field.name] && (entity[field.name] < field.min || entity[field.name].length < field.min))
                    this.addError(field.name, `Field length must be over ${field.min}`);
            }); 

            return !this.hasErrors();
        }

        public save(entity:IEntity, validate:boolean=true):Promise<boolean>
        {
            this.prepare(entity);

            if (validate && !this.validate(entity))
                return Promise.resolve(false);

            if (this.isNewRecord(entity))
                return this.insert(entity);

            return this.update(entity);
        }

        public findById(id:string|number):Promise<IEntity>
        {
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .set('*')
                .from(this.entity.metadata().table)
                .where(expr.eq(this.getPkField(), id))
                .limit(1);
            
            return DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then(async (results:Array<any>):Promise<IEntity> => {
                    if (results.length <= 0)
                        return null;

                    return await Util.makeEntity(this.entity, results[0]);
                });
        }

        public find(filter:string|any, limit:number=100, offset:number=0):Promise<Array<IEntity>>
        {
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .from(this.entity.metadata().table)
                .set('*')
                .where(filter)
                .limit(limit)
                .offset(offset);

            return DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then((results:Array<any>):Promise<Array<IEntity>> => {
                    return Promise.all(
                        results.map((result):Promise<IEntity> => {
                            return Util.makeEntity(this.entity, result);
                        })
                    );
                });
        }

        public count(filters:string|any=null):Promise<number>
        {
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .set(['COUNT(*)', 'total'])
                .from(this.entity.metadata().table);

            if (filters)
                queryBuilder.where(filters);

            return DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then((results:Array<any>):number => results[0].total);
        }

        public delete(entity:IEntity):Promise<boolean>
        {
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .delete()
                .from(this.entity.metadata().table)
                .where(expr.eq(this.getPkField(), entity[this.getPkField()]));

            return DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then(():boolean => true)
                .catch((err:Error):boolean => {
                    this.addError(err.message);
                    return false;
                });
        }

        protected insert(entity:IEntity):Promise<boolean>
        {
            let parameters:Array<any> = [];
            let queryBuilder = DB.Factory.getQueryBuilder()
                .insert()
                .into(this.entity.metadata().table);

            this.entity.metadata().fields.forEach((field):void => 
            {
                if (field.type !== 'pk') {
                    queryBuilder.set(field.name, '?');
                    parameters.push(queryBuilder.treatValue(entity[field.name], false));
                }
            });

            return DB.Factory.getConnection()
                .query(queryBuilder.toSql(), parameters)
                .then((response:DB.QueryResults):boolean => {
                    this.setEntityId(entity, response.lastInsertedId);
                    return true;
                })
                .catch((err:Error):boolean => {
                    this.addError(err.message);
                    return false
                });
        }

        protected update(entity:IEntity):Promise<boolean>
        {
            let parameters:Array<any> = [];
            let expr = DB.Factory.getQueryCriteria();
            let queryBuilder = DB.Factory.getQueryBuilder()
                .update()
                .into(this.entity.metadata().table);

            this.entity.metadata().fields.forEach((field):void => 
            {
                if (field.type !== 'pk') {
                    queryBuilder.set(field.name, '?');
                    parameters.push(queryBuilder.treatValue(entity[field.name], false));
                } else
                    queryBuilder.where(expr.eq(field.name, entity[field.name]));
            });

            return DB.Factory.getConnection()
                .query(queryBuilder.toSql(), parameters)
                .then((response:DB.QueryResults):boolean => true)
                .catch((err:Error):boolean => {
                    this.addError(err.message);
                    return false;
                });
        }

        protected isNewRecord(entity:IEntity):boolean
        {
            return typeof entity['id'] === 'undefined' || !entity['id'];
        }

        protected setEntityId(entity:IEntity, lastInsertedId:any):void
        {
            this.entity.metadata()
                .fields
                .forEach((field):void => {
                    if (field.type === 'pk')
                        entity[field.name] = lastInsertedId;
                });
        }

        protected getPkField():string
        {
            for (let field of this.entity.metadata().fields) {
                if (field.type === 'pk')
                    return field.name;
            }

            return 'id';
        }

        protected prepare(entity:IEntity)
        {
            this.entity.metadata().fields.forEach((field):void => 
            {
                if (!entity[field.name] && field.default)
                    entity[field.name] = field.default;
            });
        }

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