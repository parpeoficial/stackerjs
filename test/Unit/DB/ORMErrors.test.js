const { expect } = require('chai');
const { DB, ORM } = require('./../../../lib');
const { ContactRepository } = require('./../../DataProvider/ORM/Repositories');


describe('ORMErrorsTest', () => 
{

    describe('Testing some database problems', () => 
    {
        it('Should present database errors on inserting', done => 
        {
            let contactRepository = new ContactRepository();

            contactRepository.save({
                'first_name': 'Allucard', 'last_name': 'Castlevania'
            })
                .then(response => {
                    expect(response).to.be.false;
                    expect(contactRepository.getErrors()).to.have.property('Database');
                })
                .then(() => done());
        });

        it('Should present database errors on updating', done => 
        {
            let contactRepository = new ContactRepository();

            contactRepository.save({
                '_attributes': {
                    'id': 1
                },
                'id': 1,
                'first_name': 'Allucard',
                'last_name': 'Castlevania'
            })
                .then(response => {
                    expect(response).to.be.false;
                    expect(contactRepository.hasErrors()).to.be.true;
                })
                .then(() => done());
        });

        it('Should present database errors on deleting', done =>
        {
            let contactRepository = new ContactRepository();

            contactRepository.delete({
                '_attributes': { 'id': 1 },
                'id': 1,
                'first_name': 'Allucard',
                'last_name': 'CastleVania'
            })
                .then(response => {
                    expect(response).to.be.false;
                    expect(contactRepository.hasErrors()).to.be.true;
                })
                .then(() => done());
        });

        it('Should add Errors to repository', () => 
        {
            let contactRepository = new ContactRepository();

            contactRepository.addError(new Error('Errors added with Exception'));
            contactRepository.addError('Adding another error to default field');
            contactRepository.addError('Some field', 'Defining field before sending error');

            expect(contactRepository.hasErrors()).to.be.true;
        });
    });

    after(() => {
        let conn = DB.Factory.getConnection();
        if (conn.isConnected())
            conn.close();
    });

});