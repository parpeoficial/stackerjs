const fs = require('fs');
const { expect } = require('chai');
const { Cache } = require('./../../lib');


describe('CacheTest', () => 
{

    describe('Setting cache', () => 
    {
        it('Should set a cache without trouble', () => 
            Cache.set('okay', 'Hello dear'));

        it('Should set a cache defining expired date', () => 
        {
            let expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.setFullYear() + 1);
            Cache.set('longlife', `Until ${expiresAt.getFullYear()}`, expiresAt);    
        });

        it('Should set an expired cache for posterior testing', () => 
        {
            let expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.setFullYear() - 1);
            Cache.set('expired', `Stopped at ${expiresAt.getFullYear()}`, expiresAt);
        });
    });

    describe('Checking if setted cache exists', () => 
    {
        it('Should say that cache exists', () => 
            expect(Cache.has('okay')).to.be.true);

        it('Should say that cache exists', () => 
            expect(Cache.has('not-okay')).to.be.false);
    });

    describe('Getting cached data', () => 
    {
        it('Should get a cache data without trouble', () => 
            expect(Cache.get('okay')).to.be.equal('Hello dear'));

        it('Should return default value when expired', () => 
            expect(Cache.get('expired')).to.be.null);

        it('Should return default value when non existent cache', () => 
            expect(Cache.get('nonexistent', 2)).to.be.equal(2));
    });

    describe('Deleting cached data', () => 
    {
        it('Should delete cache without trouble', () => 
        {
            expect(Cache.delete('longlife')).to.be.true;
            expect(Cache.has('longlife')).to.be.false;
        });

        it('Should return false when cache already not exists', () => 
            expect(Cache.delete('longlife')).to.be.false);
    });

    const listDir = path => fs.readdirSync(path);
    const remove = filePath => 
        fs.lstatSync(filePath).isDirectory() ? 
            fs.rmdirSync(filePath) : fs.unlinkSync(filePath);
    after(() => {
        listDir(`${process.cwd()}/storage/cache`)
            .forEach(cache => remove(`${process.cwd()}/storage/cache/${cache}`));
        remove(`${process.cwd()}/storage/cache`);
        remove(`${process.cwd()}/storage`);
    });

});