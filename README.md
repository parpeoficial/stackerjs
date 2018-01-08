[![Travis](https://img.shields.io/travis/parpeoficial/stackerjs.svg)](https://travis-ci.org/parpeoficial/stackerjs)
[![Codecov](https://codecov.io/gh/parpeoficial/stackerjs/branch/master/graph/badge.svg)](https://codecov.io/gh/parpeoficial/stackerjs)
[![npm](https://img.shields.io/npm/dt/stackerjs.svg)](https://www.npmjs.com/package/stackerjs)

# StackerJS
A Stack built in NodeJS using ExpressJS, for building NodeJS microservices.

## Table of Contents
* Introduction
* Configuration
* Contributions
    * Testing

### Installation
```bash
    npm install -g typescript istanbul
    npm install stackerjs --save
```

### Configuration
Most of stackerjs configuration can be declared on .env file in project root.

#### Connection
For DB Connection until now **only MySQL** driver is implemented.
* DB_DRIVER=mysql - Defines database driver
* DB_HOST=127.0.0.1 - Defines database host
* DB_NAME=database - Defines database name
* DB_USER=root - Defines database user
* DB_PASS=p455w0rd - Defines database access password

### Http
StackerJS implements Http request and response classes based on ExpressJS.

#### Http.Request
Brings information about made request. Always received on callback action executed during request.

For example a request made to /person/:id.
```typescript
    import { Http } from 'stackerjs';

    const viewAction = (request:Http.Request):string =>
        `Looking for ${request.get('id')} ?`;
```

#### Http.Response
Callbacks can return a string, an object or even Http.Response class defining response information.

```typescript
    import { Http } from 'stackerjs';

    const viewAction = (request:Http.Request):Http.Response =>
        new Http.Response()
            .setStatusCode(404)
            .setHeader('Allow-anything', '1230')
            .setContent({
                'status': false,
                'message': [ 'Person not found or not existent' ]
            });
```

### DB
Possible manipulate database using QueryBuilder and manually creating queries.

#### Connection
Database connection relies on database driver, so, if you wanna get a connection to database the right way is using Factory.

```typescript
    import { DB } from 'stackerjs';

    let conn = DB.Factory.getConnection();
```

#### Query Builder
QueryBuilder depends on your database driver. So, if you want an instance of it, the right way is getting it by Factory.

```typescript
    import { DB } from 'stackerjs';

    let conn = DB.Factory.getConnection();
    let queryBuilder = DB.Factory.getQueryBuilder();

    const getResults = async ():Array<any> =>
        await conn.query(
            queryBuilder.select()
                .set('id', 'name')
                .from('table_name')
                .order('name')
                .toSql()
        );

    getResults()
        .then(results => {
            //Manipulate list of database results
        });
```

### Contributions
It's possible to contribute to StackerJS.
Fork the project check for enhancements and bugs and make a Pull Request.
If your PR receive 3 approves from Parpe team it will be accepted and merged.

#### Testing
```bash
    npm run build
    npm run test
```