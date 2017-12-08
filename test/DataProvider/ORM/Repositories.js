const { ORM } = require("./../../../lib");
const { Contact } = require("./Entities");


class ContactRepository extends ORM.BaseRepository 
{
    
    constructor() 
    {
        super(...arguments);
        this.entity = new Contact();
    }

    beforeValidate(entity)
    {
        if (!entity['test_before_validate'])
            return super.beforeValidate(entity);

        if (entity['test_before_validate_insert_error'])
            this.addError(new Error('any message'));

        return false;
    }

    beforeSave(entity)
    {
        if (!entity['test_before_save'])
            return super.beforeSave(entity);

        if (entity['test_before_save_insert_error'])
            this.addError(new Error('any message'));

        return false;
    }

}
exports.ContactRepository = ContactRepository;
