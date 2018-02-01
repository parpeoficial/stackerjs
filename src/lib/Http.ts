import * as request from 'request';
import { parse as urlparser } from 'url';


export namespace Http
{

    export class MakeRequest
    {

        private headers = {
            'Content-type': 'application/json'
        };
        private host:string = 'localhost';
        private port:number = 80;
        private timeout:number = 3000;

        public setHeader(key:string, value:string):MakeRequest
        {
            this.headers[key] = value;
            return this;
        }

        public setHost(host:string):MakeRequest
        {
            this.host = host;
            return this;
        }

        public setPort(port:number):MakeRequest
        {
            this.port = port;
            return this;
        }

        public setTimeout(timeout:number):MakeRequest
        {
            this.timeout = timeout;
            return this;
        }

        public get(url:string, params:any={}):Promise<Response>
        {
            return this.treatRequest({
                'method': 'GET',
                'url': this.treatUrl(url, params),
                'timeout': this.timeout,
                'headers': this.headers
            });
        }

        public post(url:string, params:any={}, body:any={}):Promise<Response>
        {
            return this.treatRequest({
                'method': 'POST',
                'url': this.treatUrl(url, params),
                'timeout': this.timeout,
                'headers': this.headers,
                'body': JSON.stringify(body)
            });
        }

        public put(url:string, params:any={}, body:any={}):Promise<Response>
        {
            return this.treatRequest({
                'method': 'PUT',
                'url': this.treatUrl(url, params),
                'timeout': this.timeout,
                'headers': this.headers,
                'body': JSON.stringify(body)
            });
        }

        public patch(url:string, params:any={}, body:any={}):Promise<Response>
        {
            return this.treatRequest({
                'method': 'PATCH',
                'url': this.treatUrl(url, params),
                'timeout': this.timeout,
                'headers': this.headers,
                'body': JSON.stringify(body)
            });
        }

        public delete(url:string, params:any={}):Promise<Response>
        {
            return this.treatRequest({
                'method': 'DELETE',
                'url': this.treatUrl(url, params),
                'timeout': this.timeout,
                'headers': this.headers
            });
        }

        private treatRequest(configurations:any):Promise<Response>
        {
            return new Promise((resolve:Function, reject:Function) => 
            {
                request(configurations, (err:Error, response, body) => {
                    if (err)
                        return reject(err);

                    let httpResponse = new Response();
                    httpResponse.setHeaders(response.headers);
                    httpResponse.setStatusCode(response.statusCode);
                    httpResponse.setContent(body);
                    resolve(httpResponse);
                });
            });
        }

        private treatUrl(url:string, params:any={}):string
        {
            let urlInfo = urlparser(url);
            params = Object.keys(params)
                .map((key:string) => {
                    if (Array.isArray(params[key]) || typeof params[key] === 'object')
                        return `${key}=${JSON.stringify(params[key])}`;

                    return `${key}=${params[key]}`;
                });
            if (urlInfo.query)
                urlInfo.query.toString().split('&').map(query => params.push(query));
            
            if (urlInfo.host) {
                url = `${urlInfo.protocol}//${urlInfo.host}${urlInfo.pathname}`;
                url += params.length > 0 ? `?${params.join('&')}` : "";

                return url;
            }
            
            let uri:string = `${this.host}`;
            if (this.port !== 80)
                uri += `:${this.port}`;

            uri += url;
            if (uri.substr(0, 7) !== 'http://' && uri.substr(0, 7) !== 'https:/')
                uri = `http://${uri}`;
                
            if (params.length > 0)
                uri += `?${params.join('&')}`;
            
            return uri;
        }

    }

    export class Request
    {

        private request;
        private params:any;

        constructor(request)
        {            
            this.request = request;
            this.params = Object.assign({}, this.getParams(), this.getQueries());
        }

        public get(key:string, defaultValue:any=null):any
        {
            if (typeof this.params[key] !== 'undefined')
                return this.params[key];
                
            return defaultValue;
        }
        
        public getBody():any
        {
            return this.request.body;
        }

        public getCompleteUrl():string
        {
            return `${this.getProtocol()}://` + 
                `${this.getHostName()}:${this.getPort()}` +
                `${this.getUrl()}`;
        }

        public getHeaders():any
        {
            return this.request.headers;
        }

        public getHostName():string
        {
            return this.request.hostname;
        }

        public getIPAddress():string
        {
            return this.request.ip;
        }

        public getMethod():string
        {
            return this.request.method.toUpperCase();
        }

        public getParams():any
        {
            return this.request.params;
        }

        public getPort():number
        {
            return this.request.socket.localPort;
        }

        public getProtocol():string
        {
            return this.request.protocol;
        }

        public getQueries():any
        {
            let queries:any = this.request.query;
            Object.keys(queries)
                .forEach((field:string):void => {
                    try {
                        queries[field] = JSON.parse(queries[field]);
                    } catch (err) { queries[field] = queries[field]; }
                });

            return queries;
        }

        public getUrl():string
        {
            return this.request.path;
        }

    }

    export class Response
    {

        public static HTTP_OK = 200;
        public static HTTP_CREATED = 201;
        public static HTTP_ACCEPTED = 202;
        public static HTTP_BAD_REQUEST = 400;
        public static HTTP_UNAUTHORIZED = 401;
        public static HTTP_FORBIDDEN = 403;
        public static HTTP_NOT_FOUND = 404;
        public static HTTP_INTERNAL_SERVER_ERROR = 500;

        private headers:any = {};
        private statusCode:number = 200;
        private content:Buffer;

        public getHeaders():any
        {
            return this.headers;
        }

        public setHeaders(headers:any):Response
        {
            Object.keys(headers).forEach(key => this.setHeader(key, headers[key]));

            return this;
        }

        public setHeader(key:string, value:any):Response
        {
            this.headers[key.toLowerCase()] = value;

            return this;
        }

        public getStatusCode():number
        {
            return this.statusCode;
        }

        public setStatusCode(statusCode:number):Response
        {
            this.statusCode = statusCode;
            return this;
        }

        public getContent():any|string
        {
            if (!this.content)
                return null;

            if (this.headers['content-type'] && this.headers['content-type'].indexOf('application/json') >= 0)
                return JSON.parse(this.content.toString());

            return this.content.toString();
        }

        public setContent(content:Buffer|string|number|any):Response
        {
            if (typeof content === 'string')
                return this.setContent(new Buffer(content));

            if (Array.isArray(content) || content.constructor === Object) {
                this.headers['content-type'] = 'application/json';
                return this.setContent(JSON.stringify(content));
            }

            if (content instanceof Buffer)
                this.content = content;

            return this;
        }

    }

    export namespace Exception
    {

        export abstract class HttpError extends Error
        {
    
            protected code = 500;
            public message:any;

            public constructor(message:string|any)
            {
                super(message);
                this.message = message;
            }
    
            public getCode():number
            {
                return this.code;
            }
    
        }

        export class BadRequestError extends HttpError
        { protected code = Response.HTTP_BAD_REQUEST; }

        export class UnauthorizedError extends HttpError
        { protected code = Response.HTTP_UNAUTHORIZED; }

        export class ForbiddenError extends HttpError
        { protected code = Response.HTTP_FORBIDDEN; }

        export class NotFoundError extends HttpError
        { protected code = Response.HTTP_NOT_FOUND; }

    }

}