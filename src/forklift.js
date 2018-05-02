#! /usr/bin/node

import { existsSync, readFileSync } from "fs";

const parseRoute = () => 
{
    let route = [], options = {};
    process.argv
        .filter((item, index) => index > 1)
        .forEach(item => 
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
};

const loadCommand = name => existsSync(`./commands/${name}.js`) ?
    require(`./commands/${name}`)[name] : require(`./node_modules/stackerjs/commands/${name}`)[name];

const loadAutoLoad = () => existsSync(`${process.cwd()}/node_modules/.bin/.autoload`) ?
    JSON.parse(readFileSync(`${process.cwd()}/node_modules/.bin/.autoload`, { encoding: "utf8" })) : null;

const fetchCommand = route => 
{
    let autoload = loadAutoLoad(), currentRoute = route.split(" ");
    if (autoload) 
    {
        let command, params = {};
        Object.keys(autoload.commands).forEach(commandRoute => 
        {
            if (command)
                return;

            let splittedCommandRoute = commandRoute.split(" "),
                mightBeParams = {};
            for (let index in splittedCommandRoute) 
            {
                let item = splittedCommandRoute[index];
                if (item === currentRoute[index])
                    continue;

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
};


const main = (route, options) => 
{
    if (route === "dump")
        return new (loadCommand("PrepareCommand"))({}, options);

    if (!Command) 
    {
        let fetchedCommand = fetchCommand(route);
        if (fetchedCommand) 
        {
            let { file, params } = fetchedCommand;
            return new (loadCommand(file))(params, options);
        }
    }

    return null;
};


let Command = main(...parseRoute());
if (Command)
    Command.handle();
else
    console.log("Command not found");