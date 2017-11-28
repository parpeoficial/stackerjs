import { Http } from './Http';


export namespace MVC
{

    export abstract class Controller implements IController
    {

        abstract routes():IControllerRoute;

    }

    export interface IController
    {

        routes():IControllerRoute;

    }

    export interface IControllerRoute
    {

        get?:any;

        post?:any;

        put?:any;

        delete?:any;

    }

    export interface IMiddleware
    {

        do(request?:Http.Request):any;

    }

}