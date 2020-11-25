const { sms_now } = require('./AWS/SNS');
const {create_verification_code}= require('../config/key');
const redis = require('../models/database/redis/connect');
const message = require('../models/enum/msg_enum');
const verification_code_msg = require('../models/enum/sns_enum').verification_code_msg;

module.exports = {
    send_verifiaction_code,
    check_verification_code,
    del_verification_code
}

async function send_verifiaction_code(phone){
    let result = await is_verification_code_expired(phone)
    if(result.error) return result.error
    if(!result.isExpired) return {error: message.Verification_code_is_not_expired()}
    const code = create_verification_code();
    result = await set_verification_code(phone, code)
    if(result.error) return result.error
    try{
        result = await sms_now(phone, verification_code_msg + code)
        return message.OK()
    }catch(e){
        return {error: message.SNS_error()}
    }
}

async function is_verification_code_expired(phone) {
    let reply
    try{
        reply = await redis.hgetall(phone)
    }catch(e){
        return {error: message.Database_fail(e)}
    }
    if(!reply) return {error: message.No_user_found()}
    const {code_expired_time, verification_code} = reply;
    if(!code_expired_time) return {isExpired: true}
    if(new Date().valueOf() < new Date(code_expired_time).valueOf())
        return {isExpired: false,  verification_code}
    else
    return {isExpired: true}
}

async function check_verification_code(phone, user_verification_code){
    let result = await is_verification_code_expired(phone)
    if(result.error) return result.error
    if(result.isExpired) return {error: message.Expired_verification_code()}
    if(!(result.verification_code === user_verification_code))
        return {error: message.Invalid()}
    return true
}

async function set_verification_code(phone, code) {
    const expired_time = new Date();
    expired_time.setSeconds(expired_time.getSeconds() + 60 * 3);
    try{
        await redis.hmset(phone,['verification_code', code, 'code_expired_time', expired_time])
        return true
    }catch(e){
        return {error: message.Database_fail(e)}
    }
}

async function del_verification_code(phone){
    const expired_time = new Date();
    try{
        redis.hmset(phone,['code_expired_time', expired_time])
        return true
    }catch(e){
        return {error: message.Database_fail(e)}
    }
}