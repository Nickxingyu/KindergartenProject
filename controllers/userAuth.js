const User = require('../models/database/mongo/DataBase/user');
const { build_apiKey_token, decrypt } = require('../config/key');
const verification_service = require('../helpers/verification_service');
const { login_message, decrypt_message, message } = require('../models/enum/msg_enum');


module.exports = {
    login_by_password: (userInfo, callback) => {
        const {phone, password, publicKey} = userInfo;
        if (!phone || !password || !publicKey) return callback(null, false, login_message.content_not_complete())
        User.findOne({"user.phone": phone}, (err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded());
            if (!user.validPassword(password))
                return callback(null, false, login_message.wrong_password());
            else
                return build_apiKey_token({phone, publicKey}, (err, done, info)=>{
                    if(err) return callback(err)
                    if(!done) return callback(null, false, info)
                    return callback(null, true, info)
                });
        })
    },
    login_by_verification_code: (userInfo, callback) => {
        const {phone, code} = userInfo;
        if(!phone) return callback(null, false, login_message.content_not_complete())
        User.findOne({"user.phone": phone}, async(err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded());
            if (!code) 
                return verification_service.send_verifiaction_code(phone, callback);
            else{
                let user_info = {}
                user_info.user = user.user
                if(user.user.roles.includes('principal')){
                    let users
                    let teacher = []
                    let driver = []
                    try{
                        users = await User.find({
                            '$or':[
                                {'user.roles':'teacher'},
                                {'user.roles':'driver'}
                            ]
                        })
                    }catch(e){
                        return callback(e)
                    }
                    users.forEach(user=>{
                        const {uuid, name, phone, roles} = user.user
                        if(roles.includes('teacher')){
                            teacher.push({
                                uuid,
                                name,
                                phone
                            })
                        }
                        if(roles.includes('driver')){
                            driver.push({
                                uuid,
                                name,
                                phone
                            })
                        }
                    })
                    user_info.teacher = teacher;
                    user_info.driver = driver;
                }
                user_info.user.password = null
                return verification_service.check_verification_code(phone, code,(err, result, info)=>{
                    if(err) return callback(err)
                    if(!result) return callback(null, false, info)
                    return build_apiKey_token({phone, user_info},(err, done, info)=>{
                        if(err) return callback(err)
                        if(!done) return callback(null, false, info)
                        return callback(null, true, info)
                    })
                });
            }
        })
    },
    modify_password: (userInfo, callback) => {
        const {phone, token} = userInfo;
        User.findOne({"user.phone": phone}, (err, user)=>{
            if(err) 
                return callback(err)
            if(!user) 
                return callback(null, false, login_message.no_user_founded())
            else
                if(!token) return verification_service.send_verifiaction_code(phone, callback);
                return verification_service.check_verification_code_for_JWT(phone, token,(err, result, info)=>{
                    if(err) return callback(err)
                    if(!result) return callback(null, false, info)
                    const encrypt_pwd = new Buffer.from(info.decode.password.data);
                    const password = decrypt(encrypt_pwd)
                    if(!password) return callback(null, false, decrypt_message.invalid_publicKey())
                    return set_password(phone, password, callback)
                })
        })
    }
};

function set_password(phone, password, callback) {
    const hash_password = User.generateHash(password);
    User.findOneAndUpdate({"user.phone": phone},{"user.password":hash_password},{new:true},(err, result)=>{
        if(err) return callback(err)
        return callback(null, true, message.succeed())
    })
}
