const { expect } = require("chai");
const { DB } = require("./../../../../lib");


describe('QueryBuilderTest', () => 
{

    describe('MySQLQueryBuilder', () => 
    {
        describe('InsertQueryBuilderTest', () => 
        {
            it('Should create query the common way', () => 
            {
                expect(DB.Factory.getQueryBuilder().insert()
                    .into('table_name')
                    .set({
                        'name': 'person name',
                        'birth_year': 1992,
                        'status': true
                    })
                    .toSql()).to.be.equal(
                        'INSERT INTO table_name (`name`, `birth_year`, `status`) ' +
                        'VALUES ("person name", 1992, 1);'
                    );
            });

            it('Should create query the detailed way', () => 
            {
                expect(DB.Factory.getQueryBuilder().insert()
                    .into('logs')
                    .set('user_id', 1)
                    .set('message', 'Inserted something on database')
                    .set('when', new Date('2017-10-20 16:50:00'))
                    .toSql()).to.be.equal(
                        'INSERT INTO logs (`user_id`, `message`, `when`) ' +
                        'VALUES (1, "Inserted something on database", "2017-10-20 16:50:00");'
                    );
            });
        });

        describe('SelectQueryBuilderTest', () => 
        {
            it('Should create a select query without trouble', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('id', 'name', 'table_name.active')
                    .toSql()).to.be.equal(
                        'SELECT `table_name`.`id`, `table_name`.`name`, `table_name`.`active` ' +
                        'FROM table_name;'
                    );
            });

            it('Should JOIN queries', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('table_name.*')
                    .join('LEFT', 'other_table', 'table_name.id = other_table.fk_id')
                    .toSql()).to.be.equal(
                        'SELECT `table_name`.* FROM table_name ' +
                        'LEFT JOIN other_table ON table_name.id = other_table.fk_id;'
                    );
            });

            it('Should GROUP query results', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('*')
                    .group('table_name.average')
                    .toSql()).to.be.equal(
                        'SELECT `table_name`.* FROM table_name ' +
                        'GROUP BY table_name.average;'
                    );
            });

            it('Should LIMIT and OFFSET results', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('id', ['first_name', 'name'])
                    .limit(10)
                    .offset(20)
                    .toSql()).to.be.equal(
                        'SELECT `table_name`.`id`, `table_name`.`first_name` AS name ' +
                        'FROM table_name LIMIT 10 OFFSET 20;'
                    );
            });

            it('Should filter queries without trouble', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('*')
                    .where('active = 1')
                    .toSql()).to.be.equal(
                        'SELECT `table_name`.* FROM table_name WHERE active = 1;'
                    );
            });

            it('Should filter query using QueryCriteria', () => 
            {
                let criteria = DB.Factory.getQueryCriteria();
                expect(DB.Factory.getQueryBuilder()
                    .select()
                    .from('table_name')
                    .set('*')
                    .where(
                        criteria.andX(criteria.eq('active', 1), 
                        criteria.gt('value', 100), criteria.lt('value', 1000))
                    ).toSql()).to.be.equal(
                        'SELECT `table_name`.* FROM table_name ' +
                        'WHERE (active = 1 AND value > 100 AND value < 1000);'
                    );
            });
            
            it('Should test queries with HAVING', () => 
            {
                let criteria = DB.Factory.getQueryCriteria();
                expect(
                    DB.Factory.getQueryBuilder()
                        .select()
                        .set('*')
                        .from('table_name')
                        .having(
                            criteria.eq('active', false)
                        )
                        .toSql()
                ).to.be.equal(
                    'SELECT * FROM table_name ' +
                    'HAVING active = 0;' 
                );
            });

            it('Should test queries with ORDER', () => 
            {
                expect(
                    DB.Factory.getQueryBuilder()
                        .select()
                        .set('*')
                        .from('table_name')
                        .order(['name DESC'])
                        .toSql()
                ).to.be.equal('SELECT * FROM table_name ORDER BY name DESC;');
            });
        });

        describe('UpdateQueryBuilderTest', () => 
        {
            it('Should create update query without trouble', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .update()
                    .into('table_name')
                    .set('name', 'other person')
                    .set('status', false)
                    .toSql()).to.be.equal(
                        'UPDATE table_name SET `name` = "other person", `status` = 0;'
                    );
            });

            it('Should create filtered update query', () => 
            {
                let criteria = DB.Factory.getQueryCriteria();
                expect(DB.Factory.getQueryBuilder()
                    .update()
                    .into('table_name')
                    .set('active', false)
                    .where(criteria.orX(criteria.neq('active', false), criteria.lte('birth_date', new Date('1992-12-30 08:25:01'))))
                    .toSql()).to.be.equal(
                        'UPDATE table_name SET `active` = 0 ' +
                        'WHERE (active <> 0 OR birth_date <= "1992-12-30 08:25:01");'
                    );
            });
        });

        describe('DeleteQueryBuilderTest', () => 
        {
            it('Should create a delete query without trouble', () => 
            {
                expect(DB.Factory.getQueryBuilder()
                    .delete()
                    .from('table_name')
                    .toSql()).to.be.equal('DELETE FROM table_name;');
            });

            it('Should create a delete filtered query', () => 
            {
                let criteria = DB.Factory.getQueryCriteria();
                expect(DB.Factory.getQueryBuilder()
                    .delete()
                    .from('table_name')
                    .where(criteria.gte('id', 3))
                    .toSql()).to.be.equal('DELETE FROM table_name WHERE id >= 3;');
            });
        });
    });
});
