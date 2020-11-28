const jwt = require('jsonwebtoken');
const url = require('url');
const Api_Role_Table = require('./Api_Role_Table')
const UserKey = require('../../../models/database/mongo/DataBase/userKey');
const User = require('../../../models/database/mongo/DataBase/user');
const message = require('../../../models/enum/msg_enum');

async function API_ACCESS_RIGHT_CHECK(req, res, next){
    const authorization = req.header('Authorization');
    const token = authorization ? authorization.replace('Bearer ', '') : null;
    const phone = token && jwt.decode(token).phone
    const method = req.method
    const api_pathname = url.parse(req.url).pathname
    const Allow_roles = Api_Role_Table[method][api_pathname]
    if(Api_Role_Table[method].All.includes(api_pathname) || !Allow_roles){
        next()
    }else{
        if(method == 'GET'){
            req.body = jwt.decode(token)
        }else{
            req.body.phone = phone
        }
        if(Allow_roles.length == 4){
            next()
        }else{
            let key, user
            try{
                key = await UserKey.findOne({phone})
                user = await User.findOne({'user.phone':phone})
            }catch(e){
                next(message.Database_fail(e))
            }
            if(!key || !user){
                next(message.Access_deny())
            }else{
                const {apiKey} = key
                try{
                    jwt.verify(token, apiKey)
                }catch(e){
                    next(message.Access_deny(e))
                }
                const {roles} = user.user
                if(!roles){
                    next(message.Access_deny())
                }else{
                    let allow = false
                    roles.forEach(role => {
                        if(Allow_roles.includes(role)){
                            allow = true
                        }
                    });
                    if(allow){
                        next()
                    }else{
                        next(message.Access_deny())
                    }
                }
            }
        }
    }
}

module.exports = {
    API_ACCESS_RIGHT_CHECK
}