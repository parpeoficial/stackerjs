const { expect } = require("chai");
const { Http, DB } = require("./../../../lib");


describe('ResponseTest', () => 
{

    describe('Getting Response content', () => 
    {
        it('Should return null when not setted a content', () => 
        {
            expect(new Http.Response().setContent(1).getContent()).to.be.null;
        });
    }); 

});