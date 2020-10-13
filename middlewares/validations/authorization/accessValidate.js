const jwt = require('jsonwebtoken');

function JwtToBody(req, res, next){
    const authorization = req.header('Authorization');
    const token = authorization ? authorization.replace('Bearer ', '') : null;
    const body = token && jwt.decode(token).body
    req.body = body || req.body
    next()
}

module.exports = {
    JwtToBody
}