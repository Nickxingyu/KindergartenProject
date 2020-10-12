const { sms_now } = require('./AWS/SNS');
const {create_verification_code, build_apiKey_token}= require('../config/key');
const redis = require('../models/database/redis/connect');
const { verification_code_message, login_message } = require('../models/enum/msg_enum');
const jwt = require('jsonwebtoken');
const verification_code_msg = require('../models/enum/sns_enum').verification_code_msg;

module.exports = {
    send_verifiaction_code: (phone, callback) => {
        is_verification_code_expired(phone, (err, isExpired, info) => {
            if(err) return callback(err)
            if(!isExpired) return callback(null, false, info)
            const code = create_verification_code();
            set_verification_code(phone, code, (err, done, info)=>{
                if(err) return callback(err)
                if(!done) return callback(null, false, info)
                sms_now(phone, verification_code_msg + code,(err)=>{
                    if(err) return callback(null, false, err)
                    return callback(null, true, verification_code_message.code_is_sended())
                })
            })

        })
    },
    check_verification_code_for_JWT: (phone, token, callback) => {
        return is_verification_code_expired(phone, (err, isExpired, info, verification_code) => {
            if(err) return callback(err)
            if(isExpired) return callback(null, false, info)
            try{
                var decode = jwt.verify(token, verification_code)
                info.decode = decode;
            }catch(err){
                return callback(null, false, login_message.invalid_jwt_signature())
            }
            return del_verification_code(phone, (err)=>{
                if(err) return callback(err)
                return callback(null, true, info)
            })
        })
    },
    check_verification_code: (phone, user_verification_code, callback) => {
        return is_verification_code_expired(phone, (err, isExpired, info, verification_code)=>{
            if(err) return callback(err)
            if(isExpired) return callback(null, false, info)
            if(!verification_code.localeCompare(user_verification_code))
                return callback(null, false, login_message.invalid_verification_code())
            return del_verification_code(phone, callback)
        })
    }
}

function is_verification_code_expired(phone, callback) {
    redis.hgetall(phone,(err, reply)=>{
        if(!reply) return callback(null, true, verification_code_message.no_verification_code_founded())
        const {code_expired_time, verification_code} = reply;
        if(err) return callback(err)
        if(!code_expired_time) return callback(null, true, verification_code_message.no_verification_code_founded())
        if(new Date().valueOf() < new Date(code_expired_time).valueOf())
            return callback(null, false, verification_code_message.verification_code_is_not_expired(), verification_code)
        else
            return callback(null, true, verification_code_message.expired_verification_code())
    })
}

function set_verification_code(phone, code, callback) {
    const expired_time = new Date();
    expired_time.setSeconds(expired_time.getSeconds() + 60 * 3000);
    redis.hmset(phone,['verification_code', code, 'code_expired_time', expired_time],(err,OK) => {
        if(err) return callback(err)
        return callback(null, true)
    })
}

function del_verification_code(phone, callback){
    const expired_time = new Date();
    redis.hmset(phone,['code_expired_time', expired_time],(err,OK) => {
        if(err) return callback(err)
        return callback(null, true)
    })
}