const { MVC, Http } = require("./../../../lib");


class SiteController extends MVC.Controller 
{

    routes() 
    {
        return {
            'get': {
                '/home': 'indexAction',
                '/about-us': 'aboutUsAction',
                '/app-version': 'appVersionAction',
                '/multiple': [
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
        return 1;
    }

    multi()
    {
        return;
    }

    async ple()
    {
        return Promise.resolve("Executed multiple");
    }

}
exports.SiteController = SiteController;
