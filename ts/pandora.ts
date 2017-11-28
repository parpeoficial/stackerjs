/**
 * Pandora is a command manager to help building software the right way with Parstack.
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */











import * as fs from 'fs';
import { Config, DB } from './lib';


let [ , , command, argument ] = process.argv;


const MIGRATIONCLASSMODEL:string = "const { DB } = require('parstack'); \n\
\n\n\
class _MIGRATION_CLASS_NAME_ \n\
{ \n\
\n\
    constructor() \n\
    {\n\
        this.conn = DB.Factory.getConnection();\n\
        this.queryBuilder = DB.Factory.getQueryBuilder();\n\
        this.criteria = DB.Factory.getQueryCriteria();\n\
    }\n\
    \n\
    up()\n\
    {\n\
        // Upgrade code goes here \n\
    }\n\
    \n\
    down()\n\
    {\n\
        // Down grade code goes here \n\
    }\n\
\n\
}\n\
module.exports = _MIGRATION_CLASS_NAME_;";


let whatICanUnbox = {
    'createPath': (path:string):void => 
    {
        let folders:Array<string> = path.split('/');

        folders.reduce((builtPath:string, folder:string):string => {
            builtPath += `/${folder}`;
            if (builtPath !== '' && folder.substr(-3) !== '.js') {
                if (!fs.existsSync(builtPath))
                    fs.mkdirSync(builtPath);
            }

            return builtPath;
        }); 
    },
    'createFile': (filePath:string, content:string):Promise<boolean> => {
        return new Promise((resolve:Function, reject:Function):void => {
            whatICanUnbox.createPath(filePath);

            fs.writeFile(filePath, content, {
                'encoding': 'utf8'
            }, (err:Error):void => err ? reject(err) : resolve(true));
        });
    },

    'help': (err:Error) =>
    {
        console.log(err.message);
    },

    'migrate': (how:string):Promise<boolean> =>
    {
        let conn = DB.Factory.getConnection();
        if (!how)
            how = 'up';

        const getFilePath = (migration:any):string => process.cwd() + 
                `${Config.get('migrations.path')}` +
                `/${migration.migration}.js`;
        const lastMigrationSlot = ():Promise<number> => conn.query(
            'SELECT * FROM migrations ' +
            'WHERE slot IS NOT NULL ORDER BY id DESC LIMIT 1;'
        ).then((lasts:Array<any>):number => lasts.length > 0 ? lasts[0].slot : 0);
        
        return {
            'up': async () =>
            {
                let currentSlot:number = await lastMigrationSlot() + 1;

                return conn.query('SELECT * FROM migrations WHERE slot IS NULL;')
                    .then((toBeMigrated:Array<any>) => {
                        return Promise.all(
                            toBeMigrated
                                .filter(m => fs.existsSync(getFilePath(m)))
                                .map((migration:any):Promise<any> => {
                                    console.log(`Migrating ${migration.migration}`);
                                    let migrationClass = require(getFilePath(migration));
                                    return new migrationClass().up()
                                        .then(() => conn.query(
                                            'UPDATE migrations SET ' +
                                            `slot = ${currentSlot}, ` +
                                            `executed_at = NOW() ` +
                                            `WHERE id = ${migration.id};`
                                        ))
                                        .then(() => console.log(`Migrated ${migration.migration} at ${new Date()}`));
                                })
                        );  
                    })
                    .then(() => true);
            },

            'down': async () =>
            {
                let lastMigratedSlot:number = await lastMigrationSlot();

                return conn.query(`SELECT * FROM migrations WHERE slot = ${lastMigratedSlot};`)
                    .then((toBeRolledback:Array<any>) => {
                        return Promise.all(
                            toBeRolledback
                                .filter(m => fs.existsSync(getFilePath(m)))
                                .map((migration:any) => {
                                    console.log(`Rolling back ${migration.migration}`);
                                    let migrationClass = require(getFilePath(migration));
                                    return new migrationClass().down()
                                        .then(() => conn.query(
                                            'UPDATE migrations SET ' +
                                            `slot = NULL, ` +
                                            `rolledback_at = NOW() ` +
                                            `WHERE id = ${migration.id};`
                                        ))
                                        .then(() => console.log(`Rolledback ${migration.migration} at ${new Date()}`));
                                })
                        )
                    });
            }
        }[how]();
    },

    'unbox': (makeWhat:string, madeFileName:string):Promise<boolean> =>
    {
        return {
            'migration': (name) =>
            {
                name += `_${new Date().getTime()}`;

                let conn = DB.Factory.getConnection();
                return conn.query(
                    "CREATE TABLE IF NOT EXISTS migrations (" +
                        "id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, " +
                        "migration VARCHAR(200) NOT NULL," +
                        "slot INTEGER NULL," +
                        "created_at DATETIME NOT NULL DEFAULT NOW()," +
                        "executed_at DATETIME NULL," +
                        "rolledback_at DATETIME NULL" + 
                    ");"
                )
                    .then(() => conn.query(
                        `INSERT INTO migrations (migration) VALUES ("${name}");`
                    ))
                    .then(():Promise<boolean> => {
                        let filePath:string = process.cwd();
                        filePath += Config.get('migrations.path');
                        filePath += `/${name}.js`;
                        
                        return whatICanUnbox.createFile(
                            filePath,
                            MIGRATIONCLASSMODEL.replace('_MIGRATION_CLASS_NAME_', name)
                        );
                    })
                    .then(() => console.log(`Migration ${name} created`));
            }
        }[makeWhat](madeFileName);
    }
}


const runningPandora = (shouldDoWhat, parameters):Promise<boolean> => 
{
    let [shouldDo, what] = shouldDoWhat.split(':');
    if (typeof whatICanUnbox[shouldDo] !== 'function')
        return Promise.reject(new Error(`Invalid command ${shouldDo}`));

    if (typeof what !== 'undefined')
        return whatICanUnbox[shouldDo](what, parameters);
    
    return whatICanUnbox[shouldDo](parameters);
}
runningPandora(command, argument)
    .then(() => process.exit(0))
    .catch((err:Error) => {
        whatICanUnbox.help(err);
        process.exit(1);
    });