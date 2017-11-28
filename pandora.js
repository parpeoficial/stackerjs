"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lib_1 = require("./lib");
let [, , command, argument] = process.argv;
const MIGRATIONCLASSMODEL = "const { DB } = require('parstack'); \n\
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
    'createPath': (path) => {
        let folders = path.split('/');
        folders.reduce((builtPath, folder) => {
            builtPath += `/${folder}`;
            if (builtPath !== '' && folder.substr(-3) !== '.js') {
                if (!fs.existsSync(builtPath))
                    fs.mkdirSync(builtPath);
            }
            return builtPath;
        });
    },
    'createFile': (filePath, content) => {
        return new Promise((resolve, reject) => {
            whatICanUnbox.createPath(filePath);
            fs.writeFile(filePath, content, {
                'encoding': 'utf8'
            }, (err) => err ? reject(err) : resolve(true));
        });
    },
    'help': (err) => {
        console.log(err.message);
    },
    'migrate': (how) => {
        let conn = lib_1.DB.Factory.getConnection();
        if (!how)
            how = 'up';
        const getFilePath = (migration) => process.cwd() +
            `${lib_1.Config.get('migrations.path')}` +
            `/${migration.migration}.js`;
        const lastMigrationSlot = () => conn.query('SELECT * FROM migrations ' +
            'WHERE slot IS NOT NULL ORDER BY id DESC LIMIT 1;').then((lasts) => lasts.length > 0 ? lasts[0].slot : 0);
        return {
            'up': () => __awaiter(this, void 0, void 0, function* () {
                let currentSlot = (yield lastMigrationSlot()) + 1;
                return conn.query('SELECT * FROM migrations WHERE slot IS NULL;')
                    .then((toBeMigrated) => {
                    return Promise.all(toBeMigrated
                        .filter(m => fs.existsSync(getFilePath(m)))
                        .map((migration) => {
                        console.log(`Migrating ${migration.migration}`);
                        let migrationClass = require(getFilePath(migration));
                        return new migrationClass().up()
                            .then(() => conn.query('UPDATE migrations SET ' +
                            `slot = ${currentSlot}, ` +
                            `executed_at = NOW() ` +
                            `WHERE id = ${migration.id};`))
                            .then(() => console.log(`Migrated ${migration.migration} at ${new Date()}`));
                    }));
                })
                    .then(() => true);
            }),
            'down': () => __awaiter(this, void 0, void 0, function* () {
                let lastMigratedSlot = yield lastMigrationSlot();
                return conn.query(`SELECT * FROM migrations WHERE slot = ${lastMigratedSlot};`)
                    .then((toBeRolledback) => {
                    return Promise.all(toBeRolledback
                        .filter(m => fs.existsSync(getFilePath(m)))
                        .map((migration) => {
                        console.log(`Rolling back ${migration.migration}`);
                        let migrationClass = require(getFilePath(migration));
                        return new migrationClass().down()
                            .then(() => conn.query('UPDATE migrations SET ' +
                            `slot = NULL, ` +
                            `rolledback_at = NOW() ` +
                            `WHERE id = ${migration.id};`))
                            .then(() => console.log(`Rolledback ${migration.migration} at ${new Date()}`));
                    }));
                });
            })
        }[how]();
    },
    'unbox': (makeWhat, madeFileName) => {
        return {
            'migration': (name) => {
                name += `_${new Date().getTime()}`;
                let conn = lib_1.DB.Factory.getConnection();
                return conn.query("CREATE TABLE IF NOT EXISTS migrations (" +
                    "id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL, " +
                    "migration VARCHAR(200) NOT NULL," +
                    "slot INTEGER NULL," +
                    "created_at DATETIME NOT NULL DEFAULT NOW()," +
                    "executed_at DATETIME NULL," +
                    "rolledback_at DATETIME NULL" +
                    ");")
                    .then(() => conn.query(`INSERT INTO migrations (migration) VALUES ("${name}");`))
                    .then(() => {
                    let filePath = process.cwd();
                    filePath += lib_1.Config.get('migrations.path');
                    filePath += `/${name}.js`;
                    return whatICanUnbox.createFile(filePath, MIGRATIONCLASSMODEL.replace('_MIGRATION_CLASS_NAME_', name));
                })
                    .then(() => console.log(`Migration ${name} created`));
            }
        }[makeWhat](madeFileName);
    }
};
const runningPandora = (shouldDoWhat, parameters) => {
    let [shouldDo, what] = shouldDoWhat.split(':');
    if (typeof whatICanUnbox[shouldDo] !== 'function')
        return Promise.reject(new Error(`Invalid command ${shouldDo}`));
    if (typeof what !== 'undefined')
        return whatICanUnbox[shouldDo](what, parameters);
    return whatICanUnbox[shouldDo](parameters);
};
runningPandora(command, argument)
    .then(() => process.exit(0))
    .catch((err) => {
    whatICanUnbox.help(err);
    process.exit(1);
});
