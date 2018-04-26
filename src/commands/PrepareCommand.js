import { readdirSync } from "fs";
import { Command } from "../lib";


export class PrepareCommand extends Command 
{

    constructor(params, options) 
    {
        super(params, options);

        this.name = "Prepare";
        this.description = "Dump all commands informations";
        this.route = "dump";
    }

    handle() 
    {
        let autoload = this.getAutoLoad();
        if (this.has("v"))
            this.line("Fetched autoload");

        this.loadCommands().forEach(command => 
        {
            if (!autoload.commands[command.route])
                autoload.commands[command.route] = command;
        });
        if (this.has("v"))
            this.line("Fetched commands");

        this.saveAutoLoad(autoload);
        if (this.has("v"))
            this.line("Dumped commands");
    }

    loadCommands() 
    {
        return readdirSync(this.getCommandsPath())
            .map(file => 
            {
                let module = require(`${this.getCommandsPath()}/${file}`)[file.slice(0, -3)],
                    command = new module();

                let { name, description, route } = command;
                return {
                    "file": file.slice(0, -3),
                    name, description, route
                };
            });
    }

}