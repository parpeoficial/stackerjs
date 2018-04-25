import { unlinkSync } from "fs";
import { expect } from "chai";
import { Forklift } from "./../../index";


describe.only("Test/Functional/ForkliftTest", function () {

    this.timeout(10000);

    describe("Dump", () => {
        it("Should create a .autoload file by dumping commands data into it", () => {
            let output = Forklift("dump -v");
            expect(output.indexOf("Fetched autoload")).to.be.equal(0);
            expect(output.indexOf("Fetched commands")).to.be.equal(1);
            expect(output.indexOf("Dumped commands")).to.be.equal(2);
        });

        it("Should dump new commands into .autoloadfile", () => {
            let output = Forklift("dump");
            expect(output).to.be.empty;
        });
    });

    describe("List", () => {
        it("Should list commands", () => {
            let output = Forklift("list").join(" ");
            expect(output.indexOf("List all commands from application")).to.be.above(0);
        });
    });

    after(() => unlinkSync("node_modules/.bin/.autoload"));

});