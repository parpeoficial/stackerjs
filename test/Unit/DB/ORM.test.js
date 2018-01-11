const { expect } = require("chai");
const { Config, ORM, DB } = require("./../../../lib");
const { Contact, Schedule, Phone } = require("./../../DataProvider/ORM/Entities");
const { ContactRepository, SchedulesRepository } = require("./../../DataProvider/ORM/Repositories");


describe('ORMTest', function () 
{

    this.timeout(6000);
    before(function (done) 
    {
        let conn = DB.Factory.getConnection();
        conn.connect();
        conn.query([
            "CREATE TABLE IF NOT EXISTS contacts ( \
                id         INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                first_name VARCHAR(100)                       NOT NULL, \
                last_name  VARCHAR(100)                       NOT NULL, \
                status     TINYINT(1)                         DEFAULT 1, \
                life_years TINYINT(3)                         DEFAULT 18, \
                extra      TEXT                               NOT NULL, \
                created_at INTEGER                            NULL, \
                updated_at INTEGER                            NULL \
            );",
            "CREATE TABLE IF NOT EXISTS contact_phones ( \
                id           INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                contact_id   INTEGER                            NOT NULL, \
                phone_number VARCHAR(20)                        NOT NULL, \
                active       BOOLEAN                            DEFAULT TRUE \
            );",
            "INSERT INTO contact_phones (contact_id, phone_number) VALUES (1, '123');",
            "INSERT INTO contact_phones (contact_id, phone_number) VALUES (1, '456');",
            "INSERT INTO contact_phones (contact_id, phone_number) VALUES (1, '789');",
            "CREATE TABLE IF NOT EXISTS contacts_schedules ( \
            id          INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
            contact_id  INTEGER                            NOT NULL, \
            schedule_id INTEGER                            NOT NULL \
            );",
            "INSERT INTO contacts_schedules (contact_id, schedule_id) VALUES (1, 1);",
            "INSERT INTO contacts_schedules (contact_id, schedule_id) VALUES (1, 2);",
            "INSERT INTO contacts_schedules (contact_id, schedule_id) VALUES (1, 3);",
            "CREATE TABLE IF NOT EXISTS schedules ( \
                id         INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                start_time DATETIME                           NOT NULL, \
                end_time   DATETIME                           NOT NULL, \
                extra      TEXT                               NULL,\
                active     BOOLEAN DEFAULT TRUE \
            );",
            "INSERT INTO schedules (start_time, end_time, extra) \
            VALUES ('2017-10-02 17:00:00', '2017-10-02 17:30:00', '_');",
            "INSERT INTO schedules (start_time, end_time, extra) \
            VALUES ('2017-10-03 17:00:00', '2017-10-03 17:30:00', '_');",
            "INSERT INTO schedules (start_time, end_time, extra) \
            VALUES ('2017-10-04 17:00:00', '2017-10-04 17:30:00', '_');",
        ]).then(() => done());
    });

    describe('EntityTest', () => 
    {
        it('Should define an Entity without trouble', () => {
            let contact = new Contact();
            contact.setLastName('Guedes');
            expect(contact.getLastName()).to.be.equal('Guedes');
            contact.setFirstName('Vinicius');
            expect(contact.getFirstName()).to.be.equal('Vinicius');
        });
    });
    
    describe('RepositoryTest', () => 
    {
        describe('Inserting Entitities', () => 
        {
            it('Should save Entity without trouble', (done) => 
            {
                let contact = new Contact();
                contact.setFirstName('Vinicius');
                contact.setLastName('Guedes');

                let contactRepository = new ContactRepository();
                contactRepository.save(contact)
                    .then((response) => {
                        expect(response).to.be.true;
                        expect(contact).to.have.property('primary');
                        expect(contact.getId()).to.be.equal(1);
                    })
                        .then(() => done());
            });

            it('Should validate REQUIRED fields', done => 
            {
                let contact = new Contact();
                contact.setFirstName('Vinicius');

                let contactRepository = new ContactRepository();
                contactRepository.save(contact)
                    .then(response => {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property('last_name');
                    })
                    .then(() => done());
            });

            it('Should validate fields MAX LENGTH', done => 
            {
                let contact = new Contact();
                contact.setFirstName(
                    '01234567890123456789012345678901234567890123456789' +
                    '012345678901234567890123456789012345678901234567891'
                );
                contact.setLastName('Guedes');
                contact.setAge(100);

                let contactRepository = new ContactRepository();
                contactRepository.save(contact)
                    .then(response => {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property('first_name');
                    })
                    .then(() => done());
            });

            it('Should validate fields MIN LENGTH', done => 
            {
                let contact = new Contact();
                contact.setFirstName('Vinicius');
                contact.setLastName('G');
                contact.setAge(17);

                let contactRepository = new ContactRepository();
                contactRepository.save(contact)
                    .then(response => {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property('last_name');
                    })
                    .then(() => done());
            });
        });

        describe('Finding entity list', () => {
            it('Creating entities before start filtering', async () => 
            {
                let contactRepository = new ContactRepository();

                await contactRepository.save({
                    'first_name': 'Joabe', 'last_name': 'Santos'
                });

                await contactRepository.save({
                    'first_name': 'Lucio', 'last_name': 'Pamplona'
                });

                await contactRepository.save({
                    'first_name': 'Felipe', 'last_name': 'Faria'
                });
            });

            it('Should filter through entities by string', (done) => 
            {
                new ContactRepository()
                    .find("first_name LIKE '%Fel%' OR last_name LIKE '%Pam%'")
                    .then((entities) => {
                        expect(entities).to.be.instanceOf(Array);
                        expect(entities.length).to.be.equal(2);
                    })
                    .then(() => done());
            });

            it('Should filter through entities by object', (done) => 
            {
                new ContactRepository()
                    .find({
                        'first_name': 'Joabe',
                        'last_name': {
                            'like': 'San'
                        }
                    })
                    .then((entities) => {
                        expect(entities).to.be.instanceOf(Array);
                        expect(entities.length).to.be.equal(1);
                    })
                    .then(() => done());
            });

            it('Should order results', done => 
            {
                new ContactRepository()
                    .find({}, 10, 0, [ 'first_name', 'last_name' ])
                    .then(entities => {
                        expect(entities).to.be.instanceOf(Array);
                    })
                    .then(() => done());
            })
        });

        describe('Finding and Updating Entity by ID', () => 
        {
            it('Should find an Entity by ID and update it without trouble', async () =>
            {
                let contactRepository = new ContactRepository();
                let contact = await contactRepository.findById(1);
                expect(contact).to.be.instanceOf(Contact);
                expect(contact.getLastName()).to.be.equal('Guedes');
                contact.setFirstName('Rafael');
                contact.setLastName('Ali');

                let response = await contactRepository.save(contact);
                expect(response).to.be.true;
            });
            
            it('Should return true even if no field is updated', async () => 
            {
                let contactRepository = new ContactRepository();
                let contact = await contactRepository.findById(1);

                let response = await contactRepository.save(contact);
                expect(response).to.be.true;
            });
            
            it('Should present error when searching for non existent entity', async () =>
            {
                expect(await new ContactRepository().findById(-10))
                    .to.be.null;
            });
        });

        describe('Finding Entities and it\'s associated datas', () => 
        {
            it('Should find an Entity and associated HASMANY entities', async () => 
            {
                Config.set('timezone', 'BRST');
                let contact = await new ContactRepository().findById(1);
                
                let phones = await contact.getPhones();
                expect(phones.length).to.be.equal(3);
                expect(phones[0].getPhoneNumber()).to.be.equal('123');
                expect(phones[0].isActive()).to.be.true;
            });
            
            it('Should find an Entity and associated BELONGSTO entities', async () => 
            {
                let contact = await new ContactRepository().findById(1);

                let phones = await contact.getPhones();
                expect(phones).to.be.instanceOf(Array);
                expect(phones.length).to.be.equal(3);
                expect(phones[0]).to.be.instanceOf(Phone);
                expect(phones[0].getPhoneNumber()).to.be.equal('123');
                expect(phones[0].isActive()).to.be.true;

                let contactAgain = await phones[0].getContact();
                expect(contactAgain.getId()).to.be.equal(1);
            });
            
            it('Should find and Entity and associated MANYMANY entities', async () => 
            {
                let contact = await new ContactRepository().findById(1);
                
                let schedules = await contact.getSchedules();
                expect(schedules).to.be.instanceOf(Array);
                expect(schedules.length).to.be.equal(3);
                expect(schedules[0]).to.be.instanceOf(Schedule);
                expect(schedules[0].getStartTime()).to.be.instanceOf(Date);
                expect(schedules[0].getStartTime().getFullYear()).to.be.equal(2017);
            });
        });
        
        describe('Counting registers', () => 
        {
            it('Should count amount of contacts without trouble', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.count()
                    .then(result => expect(result).to.be.equal(4))
                    .then(() => done());
            });

            it('Should count amount contacts filtered', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.count({
                    'first_name': ['like', 'Joabe']
                })
                    .then(result => expect(result).to.be.equal(1))
                    .then(() => done());
            });
        });

        describe('Finding and Deleting Entity', () => 
        {
            it('Should find an Entity by ID and delete it without trouble', async () => 
            {
                let contactRepository = new ContactRepository();
                
                let contact = await contactRepository.findById(1);
                expect(contact).to.be.instanceOf(Contact);
                expect(contact.getLastName()).to.be.equal('Ali');
                
                let response = await contactRepository.delete(contact);
                expect(response).to.be.true;
            });
        });

        describe('Repositories events', () => 
        {
            it('Should set default error message when not defined in before validate', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.save({
                    'first_name': 'Vinicius',
                    'last_name': 'Guedes',
                    'test_before_validate': true
                })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it('Should set default error message when not defined in before validate', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.save({
                    'first_name': 'Vinicius',
                    'last_name': 'Guedes',
                    'test_before_validate': true,
                    'test_before_validate_insert_error': true
                })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it('Should set default error message when not defined in before validate', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.save({
                    'first_name': 'Vinicius',
                    'last_name': 'Guedes',
                    'test_before_save': true
                })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it('Should set default error message when not defined in before validate', done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository.save({
                    'first_name': 'Vinicius',
                    'last_name': 'Guedes',
                    'test_before_save': true,
                    'test_before_save_insert_error': true
                })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });
        });
    });

    describe('Saving data without time updates', () => 
    {
        it('Should insert a Schedule without created_at', done => 
        {
            let schedule = { 
                'start_time': new Date(), 
                'end_time': new Date(),
                'extra': { 'some': 'thing' } 
            };

            new SchedulesRepository()
                .save(schedule)
                .then(response => {
                    expect(response).to.be.true;
                    Config.set('schedule.id', schedule['id'])
                })
                .then(() => done());
        });

        it('Should update a Schedule without updated_at', async () => 
        {
            let schedulesRepository = new SchedulesRepository();

            let schedule = await schedulesRepository.findById(Config.get('schedule.id'));

            await schedulesRepository
                .save(schedule)
                .then(response => expect(response).to.be.true);
        });
    });

    after(function (done) 
    {
        let connection = DB.Factory.getConnection();
        Promise.all([
            connection.query('DROP TABLE contacts_schedules;'),
            connection.query('DROP TABLE contact_phones;'),
            connection.query('DROP TABLE contacts;'),
            connection.query('DROP TABLE schedules;')
        ])
            .then(() => connection.close())
            .then(() => done());
    });

});
