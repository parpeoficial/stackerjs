import { readFileSync } from "fs";
import { Command } from "../lib/Command";


export class HelpCommand extends Command 
{

    constructor() 
    {
        super(...arguments);
        this.name = "Help";
        this.description = "Describe core commands";
        this.route = "help";
    }

    handle() 
    {
        let pack = this.getPackageInformation();
        this.line(`${pack.name}@${pack.version}`);
        this.line("Powered by StackerJS");
        this.line("\n");

        this.line("dump            Prepare .autoload file with commands information");
        this.line("                so them can be executed.");
        this.line("Options:");
        this.line("   -v           Log off on bash step by step.\n");

        this.line("list            List all commands registered from core and");
        this.line("                customized by dev team.");
    }

    getPackageInformation() 
    {
        return JSON.parse(readFileSync(`${process.cwd()}/package.json`, {
            encoding: "utf8"
        }));
    }

}