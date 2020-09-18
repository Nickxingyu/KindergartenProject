const User = require('../models/database/mongo/DataBase/user');

module.exports = {
    loginByPassword: (userInfo, callback)=>{
        const { phone, email, password } = userInfo;
        let condition = {};
        if ( !phone && !email ){
            return callback(null, false, {
                type: "login_message",
                message: "Content not Complete"
            })
        }
        condition = phone ? {"user.phone": phone} : {"user.email":email}
        User.findOne(condition,(err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, {
                    type: 'loginMessage',
                    message: 'No user found'
                });
            if (!user.validPassword(password))
                return callback(null, false, {
                    type: 'loginMessage',
                    message: 'Wrong password'
                });
            return callback(null, user, {
                body:{
                    type: 'loginMessage',
                    message: 'Authentication succeeded'
                }
            })
        })
    }
};