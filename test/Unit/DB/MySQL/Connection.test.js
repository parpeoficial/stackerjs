const { expect } = require("chai");
const { DB } = require("./../../../../lib");


describe('ConnectionTest', function () 
{

    this.timeout(6000);

    it('Should check if database is connected', done => 
    {
        DB.Factory.getConnection().close()
            .then(() => {
                expect(DB.Factory.getConnection().isConnected()).to.be.false;
            })
            .then(() => done());
    });

    it('Should check database connection', done => 
    {
        DB.Factory.getConnection().close()
            .then(response => expect(response).to.be.true)
            .then(() => done());
    });

    it('Should create tables without trouble', done => 
    {
        DB.Factory.getConnection().query([
            "CREATE TABLE IF NOT EXISTS contacts ( \
                id         INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                first_name VARCHAR(100)                       NOT NULL, \
                last_name  VARCHAR(100)                       NOT NULL \
            );",
            "CREATE TABLE IF NOT EXISTS contact_phones ( \
                id           INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                contact_id   INTEGER                            NOT NULL, \
                phone_number VARCHAR(20)                        NOT NULL, \
                active       BOOLEAN DEFAULT TRUE \
            );",
            "CREATE TABLE IF NOT EXISTS contacts_schedules ( \
            id          INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
            contact_id  INTEGER                            NOT NULL, \
            schedule_id INTEGER                            NOT NULL \
            );",
            "CREATE TABLE IF NOT EXISTS schedules ( \
                id         INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, \
                start_time DATETIME                           NOT NULL, \
                end_time   DATETIME                           NOT NULL, \
                active     BOOLEAN DEFAULT TRUE \
            );"
        ]).then(() => done());
    });

    it('Should check if database is connected', () => 
    {
        expect(DB.Factory.getConnection().isConnected()).to.be.true;
    });

    describe('Executing queries', () => 
    {        
        it('Should execute insert query without trouble', (done) => 
        {
            DB.Factory.getConnection()
                .query(
                    'INSERT INTO contacts (first_name, last_name) VALUES (?, ?);',
                    ['V', 'G']
                )
                .then((results) => {
                    expect(results).to.have.property('lastInsertedId');
                }).then(() => done());
        });

        it('Should execute select query without trouble', (done) => 
        {
            DB.Factory.getConnection().query('SELECT * FROM contacts;')
                .then((results) => {
                    expect(results).to.be.instanceOf(Array);
                }).then(() => done());
        });

        it('Should present error executing query', (done) => 
        {
            DB.Factory.getConnection().query('SELECT * FROM xxx')
                .catch((err) => {
                    expect(err).to.be.instanceOf(Error);
                }).then(() => done());
        });
    });

    after(function (done) 
    {
        let connection = DB.Factory.getConnection();
        connection.query([
            'DROP TABLE contacts_schedules;',
            'DROP TABLE contact_phones;',
            'DROP TABLE contacts;',
            'DROP TABLE schedules;'
        ])
            .then(() => connection.close())
            .then(() => done());
    });
});
