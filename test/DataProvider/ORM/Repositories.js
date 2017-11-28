const { ORM } = require("./../../../lib");
const { Contact } = require("./Entities");


class ContactRepository extends ORM.BaseRepository 
{
    
    constructor() 
    {
        super(...arguments);
        this.entity = new Contact();
    }

}
exports.ContactRepository = ContactRepository;
