const { MVC, Http } = require("./../../../lib");
const { ContactRepository } = require('./../ORM/Repositories');


class SiteController extends MVC.Controller 
{

    routes() 
    {
        return {
            'get': {
                '/home': 'indexAction',
                '/about-us': 'aboutUsAction',
                '/app-version': 'appVersionAction',
                'multiple': [
                    'multi', 'ple'
                ]
            }
        };
    }
    
    indexAction(request) 
    {
        return new Http.Response().setContent(new Buffer("Welcome to Homepage"));
    }
    
    appVersionAction() 
    {
        return new ContactRepository()
            .find()
            .catch(() => 1);
    }

    multi()
    {
        return;
    }

    ple()
    {
        try {
            return new ContactRepository().find();
        } catch (err) {
            return "Executed multiple";
        }
    }

}
exports.SiteController = SiteController;
