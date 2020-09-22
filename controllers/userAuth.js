const User = require('../models/database/mongo/DataBase/user');
const verification_service = require('../helpers/verification_service');
const login_message = require('../models/enum/msg_enum').login_message;

module.exports = {
    login_by_password: (userInfo, callback) => {
        const {phone, password} = userInfo;
        if (!phone) return callback(null, false, login_message.content_not_complete)
        User.findOne({"user.phone": phone}, (err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded);
            if (!user.validPassword(password))
                return callback(null, false, login_message.wrong_password);
            const token = build_token(phone);
            return callback(null, user, {
                headers: { Authorization: token},
                body:login_message.authentication_succeeded
            })
        })
    },
    login_by_verification_code: (userInfo, callback) => {
        const {phone, token} = userInfo;
        if(!phone) return callback(null, false, login_message.content_not_complete)
        if(!token) return verification_service.send_verifiaction_code(phone, callback)
        return verification_service.check_verification_code_for_JWT(phone, token,callback)
    }
};