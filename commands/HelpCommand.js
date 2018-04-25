const { readFileSync } = require("fs");
const { Command } = require("../index");

class HelpCommand extends Command 
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
    }

    getPackageInformation() 
    {
        return JSON.parse(readFileSync(`${process.cwd()}/package.json`, {
            encoding: "utf8"
        }));
    }

}
module.exports = HelpCommand;