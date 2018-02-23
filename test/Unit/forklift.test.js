const pc = require('child_process');
const { expect } = require('chai');


describe.skip('ForkliftTest', () => 
{

    it('Should create a controller without trouble', done => 
    {
        pc.exec(
            "node ./bin/forklift.js mvc:controller:create SharpController.js -v",
            (err, stdout, stderr) => {
                expect(stdout).to.be.an('string').and.contain('created');

                done();
            }
        )
    });

});