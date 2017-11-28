

class AuthMiddleware
{

    do(request)
    {
        if (request.getUrl() === '/auth/route')
            return request.getUrl();
    }

}
exports.AuthMiddleware = AuthMiddleware;