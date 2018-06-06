import { existsSync } from "fs";
import { Command } from "./Command";
import { resolve } from "path";

export class Forklift extends Command 
{
    parseRoute(receivedRoute) 
    {
        let route = [],
            options = {};
        receivedRoute.filter((item, index) => index > 1).forEach(item => 
        {
            if (item.substr(0, 1) === "-") 
            {
                let [key, value] = item.split("=");
                options[key.replace(/-/g, "")] = value || true;
                return;
            }

            route.push(item);
        });

        return [route.join(" "), options];
    }

    fetchCommand(route) 
    {
        let autoload = this.getAutoLoad(),
            currentRoute = route.split(" ");
        if (autoload) 
        {
            let command,
                params = {};
            Object.keys(autoload.commands).forEach(commandRoute => 
            {
                if (command) return;

                let splittedCommandRoute = commandRoute.split(" "),
                    mightBeParams = {};
                for (let index in splittedCommandRoute) 
                {
                    let item = splittedCommandRoute[index];
                    if (item === currentRoute[index]) continue;

                    if (item.slice(0, 1) === "{" && item.slice(-1) === "}") 
                    {
                        mightBeParams[item.slice(1, -1)] = currentRoute[index];
                        continue;
                    }

                    return;
                }

                params = mightBeParams;
                command = autoload.commands[commandRoute];
            });

            if (command) 
            {
                command.params = params;
                return command;
            }
        }

        return null;
    }

    loadCommand(name) 
    {
        if (existsSync(resolve(this.getCommandsPath(), `${name}.js`)))
            return require(resolve(this.getCommandsPath(), name))[name];

        return require(`stackerjs/commands/${name}`)[name];
    }

    handle(receivedRoute) 
    {
        if (!Array.isArray(receivedRoute))
            receivedRoute = receivedRoute.split(" ");

        if (receivedRoute[0] !== "node")
            receivedRoute.unshift("node", "forklift");

        let [route, options] = this.parseRoute(receivedRoute),
            Command;
        if (route === "dump")
            Command = new (this.loadCommand("PrepareCommand"))({}, options);

        if (!Command) 
        {
            let fetchedCommand = this.fetchCommand(route);
            if (fetchedCommand) 
            {
                let { file, params } = fetchedCommand;
                Command = new (this.loadCommand(file))(params, options);
            }
        }

        if (Command) Command.handle();
        else console.log("Command not found");
    }
}
