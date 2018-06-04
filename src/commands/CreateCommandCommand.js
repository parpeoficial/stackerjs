import { existsSync, writeFileSync } from "fs";
import { Utils } from "stackerjs-utils";
import { Command } from "./../lib";


export class CreateCommandCommand extends Command 
{

    constructor() 
    {
        super(...arguments);

        this.name = "Create command";
        this.description = "Create custom commands for you";
        this.route = "command create {name}";
    }

    handle() 
    {
        let command = this.capitalize(Utils.Text.camelCasefy(this.get("name")));
        if (command.slice(-7) !== "Command")
            command += "Command";

        if (existsSync(`${this.getCommandsPath()}/${command}.js`))
            return this.warn(`${command} already exists. Try create one with other name.`);

        let data = this.loadSample("command.js")
            .replace(/__COMMAND_NAME__/g, command);
        writeFileSync(`${this.getCommandsPath()}/${command}.js`, data, { encoding: "utf8" });
        this.line("Command created");
    }

    capitalize(text) 
    {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

}