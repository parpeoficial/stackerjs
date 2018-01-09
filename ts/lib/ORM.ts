import { Config } from './';
import { DB } from './DB';


export namespace ORM
{

    export class Util
    {

        public static makeEntity(defaultEntity:IEntity, attributes)
        {
            let metadata:ORM.IEntityMetadata = defaultEntity.metadata();
            
            let entity:IEntity = Object.create(defaultEntity);
            let _attributes = {};

            metadata.fields
                .forEach((field:IEntityMetadataField):void => 
                {
                    if (typeof attributes[field.name] !== 'undefined') {
                        let name:string = field.alias ? field.alias : field.name;
                        entity[name] = this.fieldValueParser(field.type, attributes[field.name]);
                        _attributes[field.name] = this.fieldValueParser(field.type, attributes[field.name])
                    }
                });

            Object.defineProperty(entity, '_attributes', {
                'get': () => _attributes
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

        private static fieldValueParser(type:string, value:any)
        {
            if (type === 'boolean')
                return value === 1;
            else if (type === 'date')
                return new Date(value);
            else if (type === 'json') {
                try {
                    return JSON.parse(value);
                } catch (err) { 
                    return value; 
                }
            } else if (type === 'created_at' || type === 'updated_at') 
                return value ? value * 1000 : null;
            else
                return value;
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
                .where(expr.eq(relation.referencedField, entity['_attributes'][relation.field]));

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

        public beforeValidate(entity:IEntity):Promise<boolean>
        {
            return Promise.resolve(true);
        }

        public async validate(entity:IEntity):Promise<boolean>
        {
            if (!await this.beforeValidate(entity)) {
                if (!this.hasErrors())
                    this.addError('validation', 'Presented problems before validating');
                return false;
            }

            this.entity.metadata().fields.forEach((field):void => {
                if (field.required && 
                    (!entity[field.alias ? field.alias : field.name] || 
                        entity[field.alias ? field.alias : field.name].length === ''))
                    this.addError(field.name, "Field is required");

                if (field.max && 
                    entity[field.alias ? field.alias : field.name] && 
                    (entity[field.alias ? field.alias : field.name] > field.max || 
                        entity[field.alias ? field.alias : field.name].length > field.max))
                    this.addError(field.name, `Field length must be under ${field.max}`);

                if (field.min && 
                    entity[field.alias ? field.alias : field.name] && 
                    (entity[field.alias ? field.alias : field.name] < field.min || 
                        entity[field.alias ? field.alias : field.name].length < field.min))
                    this.addError(field.name, `Field length must be over ${field.min}`);
            }); 

            return !this.hasErrors();
        }

        public beforeSave(entity:IEntity):Promise<boolean>
        {
            return Promise.resolve(true);
        }

        public async save(entity:IEntity, validate:boolean=true):Promise<boolean>
        {
            this.prepare(entity);

            if (validate && !await this.validate(entity))
                return false;

            if (!await this.beforeSave(entity)) {
                if (!this.hasErrors())
                    this.addError('validation', 'Presented problems before saving');
                return false;
            }

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
                .where(expr.eq(this.getFieldByType('pk'), id))
                .limit(1);
            
            return DB.Factory.getConnection()
                .query(queryBuilder.toSql())
                .then(async (results:Array<any>):Promise<IEntity> => {
                    if (results.length <= 0)
                        return null;

                    return await Util.makeEntity(this.entity, results[0]);
                });
        }

        public find(filter:string|any, limit:number=100, offset:number=0, order?:string|Array<string>):Promise<Array<IEntity>>
        {
            let queryBuilder = DB.Factory.getQueryBuilder()
                .select()
                .from(this.entity.metadata().table)
                .set('*')
                .where(filter)
                .limit(limit)
                .offset(offset);

            if (order)
                queryBuilder.order(order);

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
                .where(expr.eq(this.getFieldByType('pk'), entity[this.getFieldByType('pk')]));

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

            let createdAt:string = this.getFieldByType('created_at');
            if (createdAt)
                entity[createdAt] = parseInt(new Date().getTime().toString().slice(0, -3));

            this.entity.metadata().fields.forEach((field):void => 
            {
                if (field.type !== 'pk' && entity[field.alias ? field.alias : field.name] !== null) {
                    queryBuilder.set(field.name, '?');
                    parameters.push(queryBuilder.treatValue(entity[field.alias ? field.alias : field.name], false));
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

            let updatedAt:string = this.getFieldByType('updated_at');
            if (updatedAt)
                entity[updatedAt] = parseInt(new Date().getTime().toString().slice(0, -3));

            this.entity.metadata().fields.forEach((field):void => 
            {
                let fieldName:string = field.alias ? field.alias : field.name;
                if (field.type !== 'pk') {
                    if (field.type !== 'created_at' && 
                    queryBuilder.treatValue(entity[fieldName]) !== 
                    queryBuilder.treatValue(entity['_attributes'][field.name])) {
                        queryBuilder.set(field.name, '?');
                        parameters.push(queryBuilder.treatValue(entity[fieldName], false));
                    }
                } else
                    queryBuilder.where(expr.eq(field.name, entity[fieldName]));
            });

            if (parameters.length <= 1)
                return Promise.resolve(true);

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
            return !entity['_attributes'] || 
                typeof entity['_attributes'][this.getFieldByType('pk')] === 'undefined' ||
                !entity['_attributes'][this.getFieldByType('pk')];
        }

        protected setEntityId(entity:IEntity, lastInsertedId:any):void
        {
            this.entity.metadata()
                .fields
                .forEach((field):void => {
                    if (field.type === 'pk')
                        entity[field.alias ? field.alias : field.name] = lastInsertedId;
                });
        }

        protected getFieldByType(type:string):string
        {
            for (let field of this.entity.metadata().fields) {
                if (field.type === type)
                    return field.name;
            }

            return null;   
        }

        protected prepare(entity:IEntity)
        {
            this.entity.metadata().fields.forEach((field):void => 
            {
                let fieldName:string = field.alias ? field.alias : field.name;
                if (!entity[fieldName] && (field.default || field.default === 0))
                    entity[fieldName] = field.default;
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