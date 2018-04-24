import { unlinkSync } from "fs";
import { expect } from "chai";
import { Forklift } from "./../../index";


describe.only("Test/Functional/ForkliftTest", function () {

    this.timeout(3000);

    describe("Dump", () => {
        it("Should create a .autoload file by dumping commands data into it", () => {
            let output = Forklift("dump -v");
            console.log(new Set(output));
        });

        it("Should dump new commands into .autoloadfile", () => {
            let output = Forklift("dump -v");
            console.log(output);
        });
    });

    after(() => unlinkSync(".autoload"));

});