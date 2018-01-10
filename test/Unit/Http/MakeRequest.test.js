const { expect } = require("chai");
const { Http } = require("./../../../lib");


describe('MakeRequestTest', () => 
{
    it('Should present error making request', done => 
    {
        new Http.MakeRequest()
            .get('/xxx')
            .catch((err) => expect(err).to.be.instanceOf(Error)).then(() => done());
    });

    it('Should present error making request from another flux', done => 
    {
        new Http.MakeRequest()
            .post('/xxx')
            .catch((err) => expect(err).to.be.instanceOf(Error)).then(() => done());
    });
});
