const { existsSync, readdirSync, readFileSync, writeFileSync } = require("fs");
const { Command } = require("../index");


class PrepareCommand extends Command 
{

    constructor(params, options) 
    {
        super(params, options);

        this.name = "Prepare";
        this.description = "Dump all commands informations";
        this.route = "dump";
        this.autoload = `${process.cwd()}/node_modules/.bin/.autoload`;
    }

    handle() 
    {
        let autoload = this.loadAutoLoad();
        if (this.has("v"))
            this.line("Fetched autoload");

        this.loadCommands().forEach(command => 
        {
            if (!autoload.commands[command.route])
                autoload.commands[command.route] = command;
        });
        if (this.has("v"))
            this.line("Fetched commands");

        this.persistAutoLoad(autoload);
        if (this.has("v"))
            this.line("Dumped commands");
    }

    loadAutoLoad() 
    {
        if (existsSync(this.autoload))
            return JSON.parse(readFileSync(this.autoload, { encoding: "utf8" }));

        return {
            "commands": {}
        };
    }

    persistAutoLoad(data) 
    {
        return writeFileSync(this.autoload, JSON.stringify(data, null, 4));
    }

    loadCommands() 
    {
        let commandsDir = `${process.cwd()}/commands`;

        return readdirSync(commandsDir)
            .map(file => 
            {
                let module = require(`${commandsDir}/${file}`),
                    command = new module();

                let { name, description, route } = command;
                return {
                    "file": file.slice(0, -3),
                    name, description, route
                };
            });
    }

}
module.exports = PrepareCommand;