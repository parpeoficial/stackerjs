#!/usr/bin/env node
'use strict';

import * as child from 'child_process';
import { writeFile } from 'fs';


const FEATURES = {
    'message': text => {
        console.log(text);
    },

    'mvc': {
        'controller': {
            'create': (params, options) => {
                const CONTROLLER_PATTERN:string = "\
import { MVC } from 'stackerjs'; \n\n\n\
\
export class _CONTROLLER_NAME_ extends MVC.Controller\n{ \n\n\
    routes()\n\
    {\n\
        return {\n\
            'get': {\n\
                '/': 'indexAction'\n\
            }\n\
        }\n\
    }\n\n\
    indexAction(request)\n\
    {\n\
        return \"Welcome to _CONTROLLER_NAME_\";\n\
    }\n\n\
}";
                
                let controllerName:string = params[0].replace(/\.(js|ts)/, '');
                writeFile(
                    `${process.cwd()}/${params[0]}`, 
                    CONTROLLER_PATTERN.replace(
                        /\_CONTROLLER\_NAME\_/g,
                        controllerName
                    ),
                    err => {
                        FEATURES.message(`Done!`);
                        FEATURES.message(`Controller ${controllerName} created with success`);
                    }
                );
            }
        }
    }
},
PARAMS = process.argv.filter(arg => arg.substr(-4) !== 'node');


const runner = (() => {
    let options:Array<string> = PARAMS.filter(o => o.substr(0, 1) === '-'),
        params:Array<string> = PARAMS.filter(p => p.substr(0, 1) !== '-' && p.indexOf('/forklift') < 0),
        goal:Array<string> = params.splice(0, 1);

    try {
        let response:Function = eval(`FEATURES.${goal[0].replace(/\:/g, '.')}`);
        if (typeof response !== 'function')
            throw new Error('You are calling something that you shouldn\'t');

        response.call(FEATURES, params, options);
    } catch (err) {
        // Show message that incitates user calling for help
    }
})();