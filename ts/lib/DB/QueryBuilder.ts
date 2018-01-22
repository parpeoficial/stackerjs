import { DB } from './../';


export namespace QueryBuilder
{

    export class SQLCriteria implements DB.QueryCriteria
    {

        public like(field:string, value:string):string
        {
            value = QueryBuilderQueries.SQLTreatValue(`%${value}%`);
            return `${field} LIKE ${value}`;   
        }

        public eq(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} = ${value}`;
        }

        public neq(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} <> ${value}`;
        }

        public lt(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} < ${value}`;
        }

        public lte(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} <= ${value}`;
        }

        public gt(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} > ${value}`;
        }

        public gte(field:string, value:any):string
        {
            value = QueryBuilderQueries.SQLTreatValue(value);
            return `${field} >= ${value}`;
        }

        public andX():string 
        {
            return '(' + 
                Object.keys(arguments).map(key => `${arguments[key]}`).join(' AND ') +
                ')';
        }

        public orX(criteriaLeftSide:string, criteriaRightSide:string):string 
        {
            return '(' + 
                Object.keys(arguments).map(key => `${arguments[key]}`).join(' OR ') +
                ')';
        }

    }

    abstract class QueryBuilder implements DB.QueryBuilder
    {

        abstract insert():DB.QueryBuilderInsert;

        abstract update():DB.QueryBuilderUpdate;

        abstract delete():DB.QueryBuilderDelete;

        abstract select():DB.QueryBuilderSelect;

    }

    abstract class QueryBuilderQueries implements DB.QueryBuilderQueries
    {

        protected tableName:string;
        protected fields:any = {};
        protected _where:string;

        abstract toSql():string;

        public static SQLTreatValue(value:any, treatString:boolean=true):any
        {
            if (value instanceof Date)
                return this.SQLTreatValue([
                    [
                        value.getFullYear(),
                        this.PadString((value.getMonth() + 1).toString(), 2),
                        this.PadString(value.getDate().toString(), 2)
                    ].join('-'),
                    [
                        this.PadString(value.getHours().toString(), 2),
                        this.PadString(value.getMinutes().toString(), 2),
                        this.PadString(value.getSeconds().toString(), 2)
                    ].join(':')
                ].join(' '), treatString);

            if (typeof value === 'number')
                return value;

            if (typeof value === 'boolean')
                return value ? 1 : 0;

            if (Array.isArray(value) || typeof value === 'object')
                return JSON.stringify(value);

            if (value === '?' || !treatString)
                return value;

            return `"${value}"`;
        }

        public static PadString(text:string, desiredSize:number, completeWith:string = '0'):string
        {
            if (text.length < desiredSize) {
                while (text.length < desiredSize)
                    text = completeWith + text;
            }

            return text;
        }

        public into(tableName:string):DB.QueryBuilderQueries
        {
            this.tableName = tableName;
            return this;
        }

        public from(tableName:string):DB.QueryBuilderQueries
        {
            return this.into(tableName);
        }

        public set(fields:string|any, value:string|number|Date|boolean=null):DB.QueryBuilderQueries
        {
            if (typeof fields === 'object')
                Object.keys(fields)
                    .map((field:string) => this.set(field, fields[field]));
            
            if (typeof fields === 'string')
                this.fields[this.escapeFieldsAndReservedWords(fields)] = value;

            return this;
        }

        public where(where:string|any):DB.QueryBuilderQueries
        {
            this._where = this.parseFilters(where);
            return this;
        }

        public treatValue(value:any, treatString:boolean=true):any
        {
            return QueryBuilderQueries.SQLTreatValue(value, treatString);
        }

        protected treatFieldWithTable(fieldName:string):string
        {
            if (this.tableName && fieldName.indexOf('.') < 0)
                return `${this.escapeFieldsAndReservedWords(this.tableName)}.${fieldName}`;

            return fieldName;
        }

        private parseFilters(filter:string|any):string
        {
            if (typeof filter === 'object') {
                let expr:DB.QueryCriteria = DB.Factory.getQueryCriteria();
                return Object.keys(filter).map((field:string):string => {
                    if (Array.isArray(filter[field])) {
                        let [ comp, value ] = filter[field];
                        return expr[comp.toLowerCase()](field, value);
                    } else if (typeof filter[field] === 'object')
                        return Object.keys(filter[field]).map((comp:string):string => {
                            return expr[comp.toLowerCase()](field, filter[field][comp]);
                        }).join(' AND ');

                    return expr.eq(field, filter[field]);
                }).join(' AND ');
            }

            return filter;
        }

        protected escapeFieldsAndReservedWords(field)
        {
            let regexDetectSQLFunction = /\(([^)]+)\)/;
            if (regexDetectSQLFunction.test(field))
                return field.replace(
                    regexDetectSQLFunction,
                    `(${this.escapeFieldsAndReservedWords(
                        regexDetectSQLFunction.exec(field)[1]
                    )})`
                );
            
            if (field.indexOf(',') >= 0)
                return field.split(',')
                    .map(f => this.escapeFieldsAndReservedWords(f.trim()))
                    .join(',');

            if (field.indexOf('.') >= 0)
                return field.split('.')
                    .map(f => this.escapeFieldsAndReservedWords(f))
                    .join('.');

            if (field.indexOf('*') >= 0)
                return field;

            if (field === '" "' || field === "' '")
                return field;

            return `\`${field}\``;
        }

    }

    export namespace MySQL
    {

        export class MySQLQueryBuilder extends QueryBuilder
        {

            public insert():MySQLQueryBuilderInsert
            {
                return new MySQLQueryBuilderInsert();
            }

            public update():DB.QueryBuilderUpdate
            {
                return new MySQLQueryBuilderUpdate();
            }

            public delete():DB.QueryBuilderDelete
            {
                return new MySQLQueryBuilderDelete();
            }

            public select():DB.QueryBuilderSelect
            {
                return new MySQLQueryBuilderSelect();
            }

        }

        class MySQLQueryBuilderInsert extends QueryBuilderQueries
        {

            public toSql():string
            {
                return `INSERT INTO ${this.tableName} (` +
                    Object.keys(this.fields).map(field => field).join(', ') +
                ') VALUES (' +
                    Object.keys(this.fields)
                        .map(field => this.treatValue(this.fields[field])).join(', ') + 
                ');';
            }

        }

        class MySQLQueryBuilderUpdate extends QueryBuilderQueries
        {

            public toSql():string
            {
                return `UPDATE ${this.tableName} SET ` +
                    Object.keys(this.fields)
                        .map(field => `${field} = ${this.treatValue(this.fields[field])}`)
                        .join(', ') +
                    (this._where ? ` WHERE ${this._where}` : '') +
                    ';';
            }

        }

        class MySQLQueryBuilderDelete extends QueryBuilderQueries
        {

            public toSql():string
            {
                return `DELETE FROM ${this.tableName}` +
                    (this._where ? ` WHERE ${this._where}` : '') +
                    ';';
            }

        }

        class MySQLQueryBuilderSelect extends QueryBuilderQueries
        {

            protected fields:Array<string> = [];
            protected joins:Array<string> = [];
            protected groups:Array<string> = [];
            protected _having:string = null;
            protected _order:Array<string> = [];
            protected _limit:number;
            protected _offset:number;

            public set():MySQLQueryBuilderSelect
            {
                Object.keys(arguments)
                    .forEach((key:string):void => {
                        let arg:any = arguments[key], field:string;
                        if (typeof arg === 'string')
                            field = this.escapeFieldsAndReservedWords(arg);

                        if (Array.isArray(arg))
                            field = `${this.escapeFieldsAndReservedWords(arg[0])} AS ${arg[1]}`;

                        this.fields.push(this.treatFieldWithTable(field));

                        return;
                    });

                return this;
            }

            public from(tableName:string):MySQLQueryBuilderSelect
            {
                super.from(tableName);
                return this;
            }

            public join(type:string, tableName:string, on:string):MySQLQueryBuilderSelect
            {
                this.joins.push(`${type.toUpperCase()} JOIN ${tableName} ON ${on}`);
                return this;
            }

            public where(where:string|any):MySQLQueryBuilderSelect
            {
                super.where(where);
                return this;
            }

            public group():MySQLQueryBuilderSelect
            {
                Object.keys(arguments)
                    .forEach(key => this.groups
                        .push(this.treatFieldWithTable(arguments[key])));

                return this;
            }

            public having(having:string):MySQLQueryBuilderSelect
            {
                this._having = having;
                return this;
            }

            public order(order:string|Array<string>):MySQLQueryBuilderSelect
            {
                if (Array.isArray(order)) {
                    for (let o of order)
                        this.order(o);
                } else
                    this._order.push(order);
                    
                return this;
            }

            public limit(limit:number):MySQLQueryBuilderSelect
            {
                this._limit = limit;
                return this;
            }

            public offset(offset:number):MySQLQueryBuilderSelect
            {
                this._offset = offset;
                return this;
            }

            public toSql():string
            {
                return `SELECT ${this.fields.join(', ')}` + 
                    ` FROM ${this.tableName}` +
                    (this.joins.length > 0 ? ` ${this.joins.join(' ')}` : '') +
                    (this._where ? ` WHERE ${this._where}` : '') +
                    (this.groups.length > 0 ? ` GROUP BY ${this.groups.join(', ')}` : '') +
                    (this._having ? ` HAVING ${this._having}` : '') +
                    (this._order.length > 0 ? ` ORDER BY ${this._order.join(', ')}` : '') +
                    (this._limit ? ` LIMIT ${this._limit}` : '') + 
                    (this._offset ? ` OFFSET ${this._offset}` : '') + 
                    ';';
            }

        }

    }

}