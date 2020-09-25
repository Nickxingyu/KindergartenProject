const User = require('../models/database/mongo/DataBase/user');
const { build_apiKey_token, decrypt } = require('../config/key');
const verification_service = require('../helpers/verification_service');
const { login_message, decrypt_message, message } = require('../models/enum/msg_enum');


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
            else
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
                return verification_service.check_verification_code_for_JWT(phone, token,(err, result, info)=>{
                    if(err) return callback(err)
                    if(!result) return callback(null, false, info)
                    const {publicKey} = info.decode;
                    return build_apiKey_token({phone, publicKey},(err, done, info)=>{
                        if(err) return callback(err)
                        if(!done) return callback(null, false, info)
                        return callback(null, true, info)
                    })
                });
        })
    },
    modify_password: (userInfo, callback) => {
        const {phone, token} = userInfo;
        User.findOne({"user.phone": phone}, (err, user)=>{
            if(err) 
                return callback(err)
            if(!user) 
                return callback(null, false, login_message.no_user_founded)
            else
                if(!token) return verification_service.send_verifiaction_code(phone, callback);
                return verification_service.check_verification_code_for_JWT(phone, token,(err, result, info)=>{
                    if(err) return callback(err)
                    if(!result) return callback(null, false, info)
                    const encrypt_pwd = new Buffer.from(info.decode.password.data);
                    const password = decrypt(encrypt_pwd)
                    if(!password) return callback(null, false, decrypt_message.invalid_publicKey)
                    return set_password(phone, password, callback)
                })
        })
    }
};

function set_password(phone, password, callback) {
    console.log(password);
    const hash_password = User.generateHash(password);
    User.findOneAndUpdate({"user.phone": phone},{"user.password":hash_password},{new:true},(err, result)=>{
        if(err) return callback(err)
        return callback(null, true, message.succeed)
    })
}
