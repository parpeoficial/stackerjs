const { expect } = require("chai");
const { app } = require("./../DataProvider/App");
const { Http } = require("./../../lib");


describe('AppTest', function() 
{

    this.timeout(3000)
    before(function () { this.server = app.run(3000) });
    
    describe('Testing HttpExceptions', () => 
    {
        it('Should return 404 when throwing NotFoundException', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .delete('http://localhost:3000/person/9?some=1')
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_NOT_FOUND);
                })
                    .then(() => done());
        });

        it('Should return 403 when throwing ForbiddenException', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .delete('/person/14')
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_FORBIDDEN);
                })
                    .then(() => done());
        });

        it('Should return 401 when throwing UnauthorizedException', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)    
                .delete('/person/19')
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_UNAUTHORIZED);
                })
                    .then(() => done());
        });

        it('Should return 400 when throwing BadRequestException', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .delete('/person/24')
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_BAD_REQUEST);
                })
                    .then(() => done());
        });

        it('Should return 500 when throwing AnyException', done => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .delete('/person/100')
                .then((httpResponse) => {
                    let content = httpResponse.getContent();
                    expect(content.status).to.be.false;
                    expect(content.data).to.have.property('detailed');
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_INTERNAL_SERVER_ERROR);
                })
                    .then(() => done());
        });

        it('Should return 500 with html explanation', done => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .setHeader('Content-Type', 'plain/text')
                .delete('/person/100')
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_INTERNAL_SERVER_ERROR);
                })
                    .then(() => done());
        });
    });

    describe('Making GET requests', () => 
    {
        it('Should make a GET request without trouble', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .get('/', { 'active': 1 })
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode()).to.be.equal(Http.Response.HTTP_OK);
                    expect(httpResponse.getContent()).to.be.equal('Hello world');
                })
                    .then(() => done());
        });

        it('Should make a GET request and receive a promise without trouble', (done) => {
            new Http.MakeRequest()
                .setPort(3000)
                .get('/hi-promise', { 'active': 1 })
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode()).to.be.equal(Http.Response.HTTP_OK);
                    expect(httpResponse.getContent()).to.be.equal('In Promise');
                })
                .then(() => done());
        });
    });
    
    describe('Making POST requests', () => 
    {
        it('Should make a POST request without trouble', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .post('/person', {
                    'active': true,
                    'what': [ 'should', 'I', 'do' ]
                }, {
                    'person': { 'name': 'Person name', 'is_active': 1 }
                })
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode()).to.be.equal(Http.Response.HTTP_OK);
                    let content = httpResponse.getContent();
                    expect(content.status).to.be.true;
                    expect(content.data.person).to.have.property('id');

                    expect(content).to.have.property('queries');
                    expect(content.queries).to.have.property('what');
                    expect(content.queries.what).to.be.instanceOf(Array);
                })
                    .then(() => done());
        });
    });
    
    describe('Making PUT requests', () => 
    {
        it('Should make a PUT request without trouble', (done) => 
        {
            new Http.MakeRequest()
                .setHost('http://localhost').setPort(3000)
                .setTimeout(4000).setHeader('Auth', 'Basic 123kn21lk3m12')
                .put('/person/4', {}, {
                'client': {
                    'name': 'Client Name',
                    'is_active': true
                }
            })
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode()).to.be.equal(Http.Response.HTTP_OK);
                    let content = httpResponse.getContent();
                    expect(content.status).to.be.true;
                    expect(content.url.parameter).to.be.equal('4');
                })
                    .then(() => done());
        });

        it('Should make a PUT request without trouble too', (done) => 
        {
            new Http.MakeRequest()
                .setHost('localhost').setPort(3000)
                .setTimeout(4000).setHeader('Auth', 'Basic 123kn21lk3m12')
                .put('/person/100', {}, {
                'client': {
                    'name': 'Client Name',
                    'is_active': true
                }
            })
                .then((httpResponse) => {
                    expect(httpResponse.getStatusCode())
                        .to.be.equal(Http.Response.HTTP_OK);
                })
                    .then(() => done());
        });
    });

    describe('Making DELETE requests', () => 
    {
        it('Should make a DELETE request without trouble', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .delete('/person/1')
                .then((httpResponse) => {
                    expect(httpResponse.getContent()).to.be.null;
                    expect(httpResponse.getStatusCode()).to.be.equal(Http.Response.HTTP_OK);
                })
                    .then(() => done());
        });
    });

    describe('Making request to Controllers', () => 
    {
        it('Should GET SiteController@indexAction', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .get('/home')
                .then((httpResponse) => {
                    expect(httpResponse.getContent())
                        .to.be.equal('Welcome to Homepage');
                })
                    .then(() => done());
        });

        it('Should work okay with multiple actions', (done) => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .get('/multiple')
                .then((httpResponse) => {
                    expect(httpResponse.getContent()).to.be.equal('Executed multiple')
                })
                    .then(() => done());
        });
    });

    describe('Testing Middlewares', () => 
    {
        it('Should run through a middleware without trouble', done => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .get('/auth/route')
                .then((httpResponse) => expect(httpResponse.getContent()).to.be.equal('/auth/route'))
                .then(() => done());
        });

        it('Should present problem from middleware and make a response', done => 
        {
            new Http.MakeRequest()
                .setPort(3000)
                .post('/auth/route', {}, { 'crash': true })
                .then((httpResponse) => expect(httpResponse.getContent()).to.be.equal('Error'))
                .then(() => done());   
        });
    });

    after(function () { this.server.close() });
});
