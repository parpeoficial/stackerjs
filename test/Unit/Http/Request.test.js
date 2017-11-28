const { expect } = require("chai");
const { Http } = require("./../../../lib");


describe('RequestTest', () => 
{

    let simulateRequest = {
        'protocol': 'http',
        'hostname': 'localhost',
        'path': '/',
        'ip': '127.0.0.1',
        'method': 'POST',
        'socket': {
            'localPort': 3000
        },
        'params': { 'id': 100 },
        'query': { 'status': true },
        'headers': {
            'content-type': 'application/json',
            'authorization': 'Bearer lk1nn23lkn12'
        },
        'body': {
            'some': {
                'thing': 'anything'
            }
        }
    };

    it('Should get request url without problem', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.getCompleteUrl()).to.be.equal('http://localhost:3000/');
    });

    it('Should get request ip', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.getIPAddress()).to.be.equal('127.0.0.1');
    });
    
    it('Should get request method', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.getMethod()).to.be.equal('POST');
    });

    it('Should get request headers', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.getHeaders()).to.have.property('content-type');
        expect(httpRequest.getHeaders()).to.have.property('authorization');
    });

    it('Should get request parameters', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.get('id')).to.be.equal(100);
        expect(httpRequest.get('status')).to.be.true;
        expect(httpRequest.get('none')).to.be.null;
    });

    it('Should get request body without problem', () => 
    {
        let httpRequest = new Http.Request(simulateRequest);
        expect(httpRequest.getBody()).to.have.property('some');
    });
});
