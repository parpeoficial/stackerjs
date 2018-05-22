import { ORM } from "./../../../src/lib";
import { Contact, Schedule } from "./Entities";

class ContactRepository extends ORM.BaseRepository 
{
    constructor() 
    {
        super(...arguments);
        this.entity = new Contact();
    }

    beforeValidate(entity) 
    {
        if (!entity["test_before_validate"])
            return super.beforeValidate(entity);

        if (entity["test_before_validate_insert_error"])
            this.addError(new Error("any message"));

        return false;
    }

    afterValidate(entity) 
    {
        if (entity["test_after_validate_error"]) return false;

        return true;
    }

    beforeSave(entity) 
    {
        if (!entity["test_before_save"]) return super.beforeSave(entity);

        if (entity["test_before_save_insert_error"])
            this.addError(new Error("any message"));

        return false;
    }
}
exports.ContactRepository = ContactRepository;

class SchedulesRepository extends ORM.BaseRepository 
{
    constructor() 
    {
        super(...arguments);
        this.entity = new Schedule();
    }
}
exports.SchedulesRepository = SchedulesRepository;
