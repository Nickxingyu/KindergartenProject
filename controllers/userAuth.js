const User = require('../models/database/mongo/DataBase/user');
const {build_apiKey_token} = require('../config/key');
const verification_service = require('../helpers/verification_service');
const login_message = require('../models/enum/msg_enum').login_message;

module.exports = {
    login_by_password: (userInfo, callback) => {
        const {phone, password, publicKey} = userInfo;
        if (!phone || !password || !publicKey) return callback(null, false, login_message.content_not_complete)
        User.findOne({"user.phone": phone}, (err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded);
            if (!user.validPassword(password))
                return callback(null, false, login_message.wrong_password);
            return build_apiKey_token({phone, publicKey}, callback);
        })
    },
    login_by_verification_code: (userInfo, callback) => {
        const {phone, token} = userInfo;
        if(!phone) return callback(null, false, login_message.content_not_complete)
        User.findOne({"user.phone": phone}, (err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded);
            if (!token) 
                return verification_service.send_verifiaction_code(phone, callback);
            else
                return verification_service.check_verification_code_for_JWT(phone, token,callback);
        })
    }
};