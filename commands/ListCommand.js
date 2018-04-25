const { existsSync, readFileSync } = require("fs");
const Table = require("cli-table");
const { Command } = require("./../index");


class ListCommand extends Command {

    constructor() {
        super(...arguments);
        this.name = "List commands";
        this.description = "List all commands from application";
        this.route = "list";
    }

    handle() {
        let { commands } = this.getCommands();
        let table = new Table({
            head: ["Command", "Name", "Description"],
            colWidths: [30, 30, 55]
        });

        Object.keys(commands).map(c => commands[c])
            .forEach(command => {
                let { route, name, description } = command;
                table.push([route, name, description]);
            });

        this.line(table.toString());
    }

    getCommands() {
        return existsSync(`${process.cwd()}/node_modules/.bin/.autoload`) ?
            JSON.parse(readFileSync(`${process.cwd()}/node_modules/.bin/.autoload`, { encoding: "utf8" })) : { commands: {} };
    }

}
module.exports = ListCommand;