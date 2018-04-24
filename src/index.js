import { spawnSync } from "child_process";

export { Http } from "stackerjs-http";
export { DB } from "stackerjs-db";
export { ORM } from "stackerjs-orm";
export { Config, Cache, Utils } from "stackerjs-utils";

export { App } from "./App";
export { Command } from "./Command";
export { Integrations } from "./Integrations";
export { MicroService } from "./MicroService";
export { MVC } from "./MVC";

export const Forklift = route => 
{
    if (route.indexOf("node ./forklift.js") < 0)
        route = `node ./forklift.js ${route}`;

    let splittedRoute = route.split(" ");

    let { output } = spawnSync(splittedRoute[0], splittedRoute.slice(1), { encoding: "utf8" });

    let message = output.filter(message => message && message !== "");
    if (message.length)
        return message[0].split("\n").slice(0, -1);

    return message;
};
