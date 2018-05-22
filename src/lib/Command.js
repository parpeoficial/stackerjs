import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Config } from "./index";

export class Command 
{
    constructor(params = {}, options = {}) 
    {
        this.params = params;
        this.options = options;

        this.autoloadPath = `${process.cwd()}/node_modules/.bin/.autoload`;
    }

    getAutoLoad() 
    {
        return existsSync(this.autoloadPath)
            ? JSON.parse(readFileSync(this.autoloadPath, { encoding: "utf8" }))
            : { commands: {} };
    }

    saveAutoLoad(autoload) 
    {
        return writeFileSync(
            this.autoloadPath,
            JSON.stringify(autoload, null, 4)
        );
    }

    getCommandsPath(core = false) 
    {
        if (core)
            return resolve(
                process.cwd(),
                "node_modules",
                "stackerjs",
                "commands"
            );

        return resolve(process.cwd(), Config.get("path.commands", "commands"));
    }

    loadSample(name) 
    {
        return existsSync(`${process.cwd()}/node_modules/stackerjs/resources/samples/sample.${name}`)
            ? readFileSync(
                `${process.cwd()}/node_modules/stackerjs/resources/samples/sample.${name}`,
                { encoding: "utf8" }
            )
            : readFileSync(
                `${process.cwd()}/resources/samples/sample.${name}`,
                { encoding: "utf8" }
            );
    }

    info(message) 
    {
        this.line(message);
    }

    warn(message) 
    {
        this.line(message);
    }

    line(message) 
    {
        console.log(message);
    }

    has(key) 
    {
        if (typeof this.params[key] !== "undefined") return true;

        return typeof this.options[key] !== "undefined";
    }

    get(key, defaultValue = null) 
    {
        if (!this.has(key)) return defaultValue;

        if (typeof this.params[key] !== "undefined") return this.params[key];

        return this.options[key];
    }
}
