import express from "express";
import { json } from "body-parser";
import { Config } from "stackerjs-utils";

export class App 
{
    constructor(name = "StackerJS") 
    {
        this.appRoutes = [];

        this.app = express();
        Config.set("app.name", name);

        this.prepareMiddlewares();
        this.prepareAllRoutesInformation();
    }

    registerMicroService(microservice, prefix = "/") 
    {
        this.app.use(prefix, microservice.getRoute());

        microservice
            .getRoutes()
            .map(route =>
                Object.assign(route, {
                    route: prefix + route.route.substr(1)
                }))
            .forEach(route => this.appRoutes.push(route));
    }

    run(port = 3000) 
    {
        return this.app.listen(port, () =>
            console.log(`App is running at port ${port}`));
    }

    prepareMiddlewares() 
    {
        this.app.use(
            Config.get("app.static.url_prefix", "/static"),
            express.static(Config.get("app.static.folder", "public"))
        );

        this.app.use(json({
            limit: Config.get("app.upload.limit", "10mb")
        }));
    }

    prepareAllRoutesInformation() 
    {
        this.app.get(
            Config.get("app.info.route", "/app/info"),
            (request, response) => 
            {
                const { stackerauth } = request.headers;
                if (!stackerauth || stackerauth !== Config.env("app.secret"))
                    return response.status(403).json({
                        message: [
                            "Must pass correct stackerauth authentication"
                        ],
                        status: false
                    });

                response.json({
                    status: true,
                    data: {
                        routes: this.appRoutes
                    }
                });
            }
        );
    }
}
