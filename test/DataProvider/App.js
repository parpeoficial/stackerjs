const { MicroService, App, Http } = require("./../../lib");
const { SiteController } = require("./Controller/SiteController");
const { AuthMiddleware } = require('./Middleware/AuthMiddleware');


let microService = new MicroService();
microService.setMiddleware(new AuthMiddleware());

microService.setRoute('get', '/', (request) => "Hello world");
microService.setRoute('get', '/hi-promise', (request) => {
    return new Promise((resolve, reject) => setTimeout(() => resolve('In Promise'), 500));
});
microService.setRoute('put', '/person/:id', (request) => new Http.Response()
    .setStatusCode(Http.Response.HTTP_OK)
    .setContent(request.get('id') > 5 ? "OK" : {
    'status': true,
    'url': {
        'parameter': request.get('id')
    }
}));
microService.setRoute('patch', '/person/:id', (request) => new Http.Response()
    .setStatusCode(Http.Response.HTTP_OK)
    .setContent(request.get('id') > 5 ? "OK" : {
    'status': true,
    'url': {
        'parameter': request.get('id')
    }
}));
microService.setRoute('post', '/person', (request) => {
    return {
        'status': true,
        'data': {
            'person': Object.assign({}, request.getBody()['person'], {
                'id': new Date().getTime().toString()
            })
        },
        'queries': request.getQueries()
    };
});
microService.setRoute('delete', '/person/:id', (request) => {
    if (request.get('id') < 5)
        return null;
    if (request.get('id') < 10)
        throw new Http.Exception.NotFoundError({
            'status': false,
            'message': ['Person not found']
        });
    if (request.get('id') < 15)
        throw new Http.Exception.ForbiddenError({
            'status': false,
            'message': ['Think you\'re doing something wrong']
        });
    if (request.get('id') < 20)
        throw new Http.Exception.UnauthorizedError("Please you must login");
    if (request.get('id') < 25)
        throw new Http.Exception.BadRequestError('DAMN');
        
    throw new Error('Bad Idea');
});
microService.registerController(new SiteController());


exports.app = new App();
exports.app.registerMicroService(microService);
