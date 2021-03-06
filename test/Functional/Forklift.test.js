import { unlinkSync } from "fs";
import { Forklift } from "./../../src/lib";

describe("Test/Functional/ForkliftTest", function () 
{
    this.timeout(8000);

    describe("Dump", () => 
    {
        it("Should create a .autoload file by dumping commands data into it", () => 
        {
            new Forklift().handle("dump -v");
        });

        it("Should dump new commands into .autoloadfile", () => 
        {
            new Forklift().handle("dump");
        });
    });

    describe("List", () => 
    {
        it("Should list commands", () => 
        {
            new Forklift().handle("list");
        });
    });

    describe("Help", () => 
    {
        it("Should show off help text for using commands", () => 
        {
            new Forklift().handle("help");
        });
    });

    describe("Commands", () => 
    {
        describe("Create", () => 
        {
            it("Should create a command on commands folder", () => 
            {
                new Forklift().handle("command create testing_command");
            });

            it("Should create a command adding Command in the end of the name", () => 
            {
                new Forklift().handle("command create another_testing");
            });

            it("Should present errors when trying to create a command that already exists", () => 
            {
                new Forklift().handle("command create testing");
            });
        });
    });

    describe("Errors", () => 
    {
        it("Should return error when trying to execute a non existent command", () => 
        {
            new Forklift().handle("dont exist this command");
        });
    });

    after(() => 
    {
        unlinkSync("node_modules/.bin/.autoload");
        unlinkSync("src/commands/TestingCommand.js");
        unlinkSync("src/commands/AnotherTestingCommand.js");
    });
});
