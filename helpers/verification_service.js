const { sms_now } = require('../helpers/AWS/SNS');
const create_verification_code = require('../config/key').create_verification_code;
const redis = require('../models/database/redis/connect');
const { verification_code_message } = require('../models/enum/msg_enum');
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
                    return callback(null, true, verification_code_message.code_is_sended)
                })
            })

        })
    },
    check_verification_code_for_JWT: (phone, token, callback) => {

    },
    check_verification_code: (phone, user_verification_code, callback) => {

    }
}

function is_verification_code_expired(phone, callback) {
    redis.hget(phone, 'code_expired_time',(err, code_expired_time)=>{
        if(err) return callback(err)
        if(!code_expired_time) return callback(null, true)
        if(new Date().valueOf() < new Date(code_expired_time).valueOf())
            return callback(null, false, verification_code_message.verification_code_is_not_expired)
        else
            return callback(null, true)
    })
}

function set_verification_code(phone, code, callback) {
    const expired_time = new Date();
    expired_time.setSeconds(expired_time.getSeconds() + 60 * 3);
    redis.hmset(phone,['verification_code', code, 'code_expired_time', expired_time],(err,OK) => {
        if(err) return callback(err)
        return callback(null, true)
    })
}