import * as fs from 'fs';
import * as express from 'express';
import { Router } from 'express';
import { json } from 'body-parser';
import * as StackTrace from 'stacktrace-js';

export { Http } from 'stackerjs-http';
import { Http } from 'stackerjs-http';

export { MVC } from './MVC';
import { MVC } from './MVC';

export { DB } from 'stackerjs-db';
import { DB } from 'stackerjs-db';

import { Integrations } from './Integrations';
export { Integrations } from './Integrations';

export { ORM } from './ORM';

import { Config, Cache } from 'stackerjs-utils';
export { Config, Cache } from 'stackerjs-utils';


export class App
{

    private app:express;
    private appRoutes:Array<any> = [];

    public constructor(name:string='StackerJS')
    {
        this.app = express();
        Config.set('app.name', name);

        this.app.use(
            Config.get('static.url.prefix', '/static'),
            express.static(Config.get('static.folder', 'public'))
        );
        this.app.use(json({
            'limit': Config.get('upload.limit', '10mb')
        }));

        this.app.get(Config.get('app.info.route', '/app/info'), (request, response):void => {
            let { stackerauth } = request.headers;
            if (!stackerauth || stackerauth !== Config.get('app.secret'))
                return response.status(403).json({
                    'status': false,
                    'message': [ 'Must pass correct stackerauth authentication' ]
                });

            response.json({
                'status': true,
                'data': {
                    'routes': this.appRoutes
                }
            })
        });
    }

    public registerMicroService(microservice:MicroService, prefix:string='/'):void
    {
        this.app.use(prefix, microservice.getRoute());   

        microservice.getRoutes()
            .map(route => Object.assign(route, {
                'route': prefix + (route.route[0] === '/' ? route.route.substr(1) : route.route)
            }))
            .forEach(route => this.appRoutes.push(route));
    }

    public run(port:number=3000)
    {
        return this.app.listen(port, () => console.log(`App is running at port ${port}`));
    }

}

export class MicroService
{

    private name:string;
    private route:Router;
    private routes:Array<any> = [];

    public constructor(microServiceName:string='Micro StackerJS')
    {
        this.name = microServiceName;
        this.route = new Router();
    }

    public setMiddleware(middleware:MVC.IMiddleware):void
    {
        let answered:boolean = false;
        this.route.use((request, response, next):void => 
        {
            let treatedRequest:Http.Request = new Http.Request(request);
            Promise.resolve(this.requestStarted())
                .then(() => {
                    try {
                        return middleware.do(treatedRequest);
                    } catch (err) {
                        throw err;
                    }
                })
                .then((callbackResponse:string|Http.Response) => {
                    if (typeof callbackResponse !== 'undefined')
                        answered = true;

                    return this.requestThen(callbackResponse, response)
                })
                .catch((err:Error) => {
                    answered = true;
                    return this.requestCatch(err, treatedRequest, response)
                })
                .then(() => {
                    if (!answered) 
                        return next();
                    
                    answered = false;
                    return this.requestEnded()
                });
        });
    }

    public setRoute(method:string, route:string, callbacks:Array<Function>|Function):void
    {
        if (!Array.isArray(callbacks))
            callbacks = [callbacks];

        this.routes.push({
            method, route
        });

        let answered:boolean = false;
        this.route[method](
            route, 
            callbacks.map((callback:Function) => (request, response, next:Function) => 
            {
                let treatedRequest:Http.Request = new Http.Request(request);
                Promise.resolve(this.requestStarted())
                    .then(() => {
                        try {
                            return callback(treatedRequest);
                        } catch (err) {
                            throw err;
                        }
                    })
                    .then((callbackResponse:string|Http.Response) => {
                        if (typeof callbackResponse !== 'undefined')
                            answered = true;

                        return this.requestThen(callbackResponse, response)
                    })
                    .catch((err:Error) => {
                        answered = true;
                        return this.requestCatch(err, treatedRequest, response);
                    })
                    .then(() => {
                        if (!answered) 
                            return next();
                        
                        answered = false;
                        return this.requestEnded()
                    });
            })
        );
    }

    public registerController(controller:MVC.IController)
    {
        let routes:MVC.IControllerRoute = controller.routes();
        Object.keys(routes).map((httpMethod:string):void => {
            Object.keys(routes[httpMethod]).map((route:string):void => {
                let actions:Array<string>|string = routes[httpMethod][route];
                if (!Array.isArray(actions))
                    actions = [actions];

                this.setRoute(
                    httpMethod, 
                    route,
                    actions
                        .filter(action => controller[action] && typeof controller[action] === 'function')
                        .map(action => controller[action].bind(controller))
                );
            });
        });
    }

    public getRoute():Router
    {
        return this.route;
    }

    public getRoutes():Array<any>
    {
        return this.routes;
    }

    private requestThen(callbackResponse:string|Http.Response, response:any):void
    {
        if (typeof callbackResponse === 'undefined')
            return;
            
        if (callbackResponse instanceof Http.Response) {
            response.set(callbackResponse.getHeaders());
            response.status(callbackResponse.getStatusCode());
            let responseContent = callbackResponse.getContent();
            return response[typeof responseContent === 'object' ? 'json' : 'send'](callbackResponse.getContent());
        }

        if (typeof callbackResponse === 'object') {
            return response.status(200).json(callbackResponse);
        }

        response.set('Content-type', 'text/html');
        response.status(200).send(callbackResponse);
    }

    private requestCatch(err:any, request:Http.Request, response:any):void
    {
        StackTrace.fromError(err)
            .then(stacktrace => {
                if (err instanceof Http.Exception.HttpError || Object.keys(err).indexOf('getMessage') >= 1)
                    return stacktrace;
                
                return new Integrations.Slack()
                    .attach(err.message, [
                        {
                            'color': "#D00000",
                            'fields': stacktrace.map(trace => {
                                return {
                                    'title': trace.fileName,
                                    'value': trace.source,
                                    'short': false
                                }
                            })
                        }
                    ])
                    .then(() => stacktrace);
            })
            .then(stacktrace => {
                if (err instanceof Http.Exception.HttpError || Object.keys(err).indexOf('getMessage') >= 1) {
                    if (typeof err.getMessage() === 'object')
                        return response
                            .status(err.getCode())
                            .json(err.getMessage());

                    return response.status(err.getCode())
                        .send(err.getMessage());
                }

                if (request.getHeaders()['content-type'] === 'application/json')
                    return response.status(500).json({
                        'status': false,
                        'data': {
                            'messages': [ err.message ],
                            'detailed': stacktrace
                        }
                    });

                response
                    .status(500)
                    .send(`Error 500. <br /><br />Message: ${err.message}.`);
            });
    }

    private requestStarted()
    { }

    private requestEnded()
    {
        Config.clear();
    }

}