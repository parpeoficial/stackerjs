[![Travis](https://img.shields.io/travis/parpeoficial/parstack.svg)](https://travis-ci.org/parpeoficial/parstack)
[![Codecov](https://img.shields.io/codecov/c/github/parpeoficial/parstack.svg)](https://codecov.io/gh/parpeoficial/parstack)

# ParStack
A Stack built in NodeJS using ExpressJS, for building NodeJS microservices.

## Table of Contents
* Introduction
* Configuration
* Contributions
    * Testing

### Installation
```bash
    npm install -g typescript istanbul
    npm install parstack --save
```

### Configuration
Most of parstack configuration can be declared on .env file in project root.

#### Connection
For DB Connection until now **only MySQL** driver is implemented.
* DB_DRIVER=mysql - Defines database driver
* DB_HOST=127.0.0.1 - Defines database host
* DB_NAME=database - Defines database name
* DB_USER=root - Defines database user
* DB_PASS=p455w0rd - Defines database access password

### Http
Parstack implements Http request and response classes based on ExpressJS.

#### Http.Request
Brings information about made request. Always received on callback action executed during request.

For example a request made to /person/:id.
```typescript
    import { Http } from 'parstack';

    const viewAction = (request:Http.Request):string =>
        `Looking for ${request.get('id')} ?`;
```

#### Http.Response
Callbacks can return a string, an object or even Http.Response class defining response information.

```typescript
    import { Http } from 'parstack';

    const viewAction = (request:Http.Request):Http.Response =>
        new Http.Response()
            .setStatusCode(404)
            .setHeader('Allow-anything', '1230')
            .setContent({
                'status': false,
                'message': [ 'Person not found or not existent' ]
            });
```

### Contributions
It's possible to contribute to Parstack.
Fork the project check for enhancements and bugs and make a Pull Request.
If your PR receive 3 approves from Parpe team it will be accepted and merged.

#### Testing
```bash
    npm run build
    npm run test
```