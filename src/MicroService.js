import { Router } from "express";
import { DB } from "stackerjs-db";
import { Http } from "stackerjs-http";
import { Config } from "stackerjs-utils";
import * as StackTrace from "stacktrace-js";
import { Integrations } from "./Integrations";

export class MicroService 
{
    constructor(microServiceName = "Micro StackerJS") 
    {
        this.name = microServiceName;
        this.route = new Router();
        this.routes = [];
        this.answered = false;
    }

    setMiddleware(middleware) 
    {
        this.route.use((request, response, next) =>
            this.executeHttp(middleware.do, request, response, next));
    }

    setRoute(method, route, callbacks) 
    {
        if (!Array.isArray(callbacks)) callbacks = [callbacks];

        if (route.substr(0, 1) !== "/") route = `/${route}`;

        this.routes.push({
            method,
            route
        });

        this.route[method](
            route,
            callbacks.map(callback => (request, response, next) =>
                this.executeHttp(callback, request, response, next))
        );
    }

    registerController(controller) 
    {
        const routes = controller.routes();
        Object.keys(routes).map(httpMethod => 
        {
            Object.keys(routes[httpMethod]).map(route => 
            {
                let actions = routes[httpMethod][route];
                if (!Array.isArray(actions)) actions = [actions];

                this.setRoute(
                    httpMethod,
                    route,
                    actions
                        .filter(action =>
                            controller[action] &&
                            typeof controller[action] === "function")
                        .map(action => controller[action].bind(controller))
                );
            });
        });
    }

    getRoute() 
    {
        return this.route;
    }

    getRoutes() 
    {
        return this.routes;
    }

    executeHttp(callback, request, response, next) 
    {
        const treatedRequest = new Http.Request(request);
        this.requestStarted(callback, treatedRequest)
            .then(callbackResponse => 
            {
                if (typeof callbackResponse !== "undefined")
                    this.answered = true;

                return this.requestThen(callbackResponse, response);
            })
            .catch(err => 
            {
                this.answered = true;
                return this.requestCatch(err, treatedRequest, response);
            })
            .then(() => this.requestEnded(next));
    }

    requestThen(callbackResponse, response) 
    {
        if (typeof callbackResponse === "undefined") return;

        if (callbackResponse instanceof Http.Response) 
        {
            response.set(callbackResponse.getHeaders());
            response.status(callbackResponse.getStatusCode());
            const responseContent = callbackResponse.getContent();
            return response[
                typeof responseContent === "object" ? "json" : "send"
            ](callbackResponse.getContent());
        }

        if (typeof callbackResponse === "object") 
        {
            return response.status(200).json(callbackResponse);
        }

        response.set("Content-type", "text/html");
        response.status(200).send(callbackResponse);
    }

    requestCatch(err, request, response) 
    {
        this.logErrorInSlack(err).then(stacktrace => 
        {
            if (
                err instanceof Http.Exception.HttpError ||
                Object.keys(err).indexOf("getMessage") >= 1
            ) 
            {
                if (typeof err.getMessage() === "object")
                    return response
                        .status(err.getCode())
                        .json(err.getMessage());

                return response.status(err.getCode()).send(err.getMessage());
            }

            if (request.getHeaders()["content-type"] === "application/json")
                return response.status(500).json({
                    status: false,
                    data: {
                        messages: [err.message],
                        detailed: stacktrace
                    }
                });

            response
                .status(500)
                .send(`Error 500. <br /><br />Message: ${err.message}.`);
        });
    }

    logErrorInSlack(err) 
    {
        return StackTrace.fromError(err).then(stacktrace => 
        {
            if (
                err instanceof Http.Exception.HttpError ||
                Object.keys(err).indexOf("getMessage") >= 1
            )
                return stacktrace;

            return new Integrations.Slack()
                .attach(err.message, [
                    {
                        color: "#D00000",
                        fields: stacktrace.map(trace => 
                        {
                            return {
                                title: trace.fileName,
                                value: trace.source,
                                short: false
                            };
                        })
                    }
                ])
                .then(() => stacktrace);
        });
    }

    async requestStarted(callback, treatedRequest) 
    {
        try 
        {
            return callback(treatedRequest);
        }
        catch (err) 
        {
            throw err;
        }
    }

    requestEnded(next) 
    {
        if (!this.answered) return next();

        this.answered = false;
        Config.clear();

        let conn = DB.Factory.getConnection();
        if (conn) conn.disconnect();
    }
}
