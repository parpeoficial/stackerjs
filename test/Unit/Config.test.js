const { expect } = require("chai");
const { Config } = require("./../../lib");


describe('ConfigTest', () => 
{
    it('Should get vars loaded from .env file', () => 
    {
        expect(Config.get('DB_DRIVER')).to.be.equal('mysql');
        expect(Config.get('db.driver')).to.be.equal('mysql');
    });
    
    it('Should set and get data from Configuration', () => 
    {
        Config.set('config.info', 'testing something');
        expect(Config.get('config.info')).to.be.equal('testing something');
    });
    
    it('Should get default value when not found key', () => 
    {
        expect(Config.get('non.existent.key')).to.be.null;
    });
});
