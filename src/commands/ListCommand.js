import Table from "cli-table";
import { Command } from "./../lib";


export class ListCommand extends Command 
{

    constructor() 
    {
        super(...arguments);
        this.name = "List commands";
        this.description = "List all commands from application";
        this.route = "list";
    }

    handle() 
    {
        let { commands } = this.getAutoLoad();
        let table = new Table({
            head: ["Command", "Name", "Description"],
            colWidths: [30, 30, 55]
        });

        Object.keys(commands).map(c => commands[c])
            .forEach(command => 
            {
                let { route, name, description } = command;
                table.push([route, name, description]);
            });

        this.line(table.toString());
    }

}