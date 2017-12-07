

class Contact 
{
    
    metadata() 
    {
        return {
            'table': 'contacts',
            'fields': [
                { 'type': 'pk', 'name': 'id', 'alias': 'primary' },
                { 
                    'type': 'string', 
                    'name': 'first_name', 
                    'required': true,
                    'max': 100
                },
                { 
                    'type': 'string', 
                    'name': 'last_name', 
                    'required': true,
                    'min': 2
                },
                { 'type': 'boolean', 'name': 'status', 'alias': 'active', 'default': 1 },
                { 'type': 'integer', 'name': 'life_years', 'alias': 'age', 'default': 18 },
                { 'type': 'json', 'name': 'extra', 'default': '{}' }
            ],
            'relations': [
                {
                    'name': 'non-existent',
                    'type': 'NONEXISTENT',
                    'referencedEntity': new Contact(),
                    'field': 'id',
                    'referencedField': 'id'
                },
                {
                    'name': 'phones',
                    'type': 'HASMANY',
                    'referencedEntity': new Phone(),
                    'field': 'id',
                    'referencedField': 'contact_id'
                },
                {
                    'name': 'schedules',
                    'type': 'MANYMANY',
                    'referencedEntity': new Schedule(),
                    'field': 'contact_id',
                    'table': 'contacts_schedules',
                    'referencedField': 'schedule_id'
                }
            ]
        };
    }

    getPhones() 
    {
        return this['phones'] || [];
    }
    
    getSchedules() 
    {
        return this['schedules'] || [];
    }
    
    getId() 
    {
        return this['primary'];
    }
    
    getFirstName() 
    {
        return this['first_name'];
    }
    
    setFirstName(firstName) 
    {
        this['first_name'] = firstName;
    }
    
    getLastName() 
    {
        return this['last_name'];
    }
    
    setLastName(lastName) 
    {
        this['last_name'] = lastName;
    }

    getAge()
    {
        return this['age'];
    }

    setAge(age)
    {
        this['age'] = age;
    }

}
exports.Contact = Contact;


class Phone 
{

    metadata() 
    {
        return {
            'table': 'contact_phones',
            'fields': [
                {
                    'type': 'string',
                    'name': 'phone_number'
                },
                {
                    'type': 'boolean',
                    'name': 'active'
                },
                {
                    'type': 'string',
                    'name': 'nonExistentFieldForTest'
                }
            ],
            'relations': [
                {
                    'name': 'contact',
                    'type': 'BELONGSTO',
                    'referencedEntity': new Contact(),
                    'field': 'contact_id',
                    'referencedField': 'id'
                }
            ]
        };
    }

    getContact() {
        return this['contact'];
    }

    getPhoneNumber() {
        return this['phone_number'];
    }

    isActive() {
        return this['active'];
    }

}
exports.Phone = Phone;


class Schedule 
{

    metadata() 
    {
        return {
            'table': 'schedules',
            'fields': [
                {
                    'type': 'date',
                    'name': 'start_time',
                },
                {
                    'type': 'date',
                    'name': 'end_time'
                },
                { 'type': 'json', 'name': 'extra', 'default': '_' }
            ],
            'relations': []
        };
    }

    getStartTime() {
        return this['start_time'];
    }

    getEndTime() {
        return this['end_time'];
    }
    
}
exports.Schedule = Schedule;
