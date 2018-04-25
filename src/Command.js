

export class Command 
{

    constructor(params = {}, options = {}) 
    {
        this.params = params;
        this.options = options;
    }

    info(message) 
    {
        this.line(message);
    }

    warn(message) 
    {
        this.line(message);
    }

    line(message) 
    {
        console.log(message);
    }

    has(option) 
    {
        return typeof this.options[option] !== "undefined";
    }

    get(option, defaultValue = null) 
    {
        if (!this.has(option))
            return defaultValue;

        return this.options[option];
    }

}