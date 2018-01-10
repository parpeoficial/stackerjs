const { expect } = require("chai");
const { Http } = require("./../../../lib");


describe('MakeRequestTest', () => 
{
    it('Should present error making request', done => 
    {
        new Http.MakeRequest()
            .setPort(3000)
            .get('/xxx')
            .catch((err) => expect(err).to.be.instanceOf(Error)).then(() => done());
    });

    it('Should present error making request from another flux', done => 
    {
        new Http.MakeRequest()
            .setPort(3000)
            .post('/xxx')
            .catch((err) => expect(err).to.be.instanceOf(Error)).then(() => done());
    });
});
