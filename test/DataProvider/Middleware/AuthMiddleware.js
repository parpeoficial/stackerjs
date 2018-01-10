const { Http } = require('./../../../lib');


class AuthMiddleware
{

    do(request)
    {
        if (request.getBody().crash)
            throw new Http.Exception.BadRequestError('Error');

        if (request.getUrl() === '/auth/route')
            return request.getUrl();
    }

}
exports.AuthMiddleware = AuthMiddleware;