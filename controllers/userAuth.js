const User = require('../models/database/mongo/DataBase/user');
const login_message = require('../models/enum/msg_enum').login_message;

module.exports = {
    login_by_password: (userInfo, callback)=>{
        const { phone, email, password } = userInfo;
        let condition = {};
        if ( !phone && !email ){
            return callback(null, false, login_message.content_not_complete)
        }
        condition = phone ? {"user.phone": phone} : {"user.email":email}
        User.findOne(condition, (err,user)=>{
            if (err)
                return callback(err);
            if (!user)
                return callback(null, false, login_message.no_user_founded);
            if (!user.validPassword(password))
                return callback(null, false, login_message.wrong_password);
            return callback(null, user, {
                //headers: { Authorization: results.token }
                body:login_message.authentication_succeeded
            })
        })
    },
    login_by_verifiction_code: (userInfo, callback) => {
        const {phone, user_verification_code} = userInfo;
        if(!phone){
            return callback(null, false, login_message.content_not_complete)
        }
        const compare_result = check_verification_code(phone, user_verification_code);
        if(!compare_result){
            return callback(null, false, login_message.invalid_verification_code)
        }else{
            User.findOne({"user.phone": phone}, (err, user) => {
                if(err) 
                    return callback(err);
                if(!user) 
                    return callback(null, user, login_message.no_user_founded)
                return callback(null, user, {
                    //headers: { Authorization: results.token }
                    body: login_message.authentication_succeeded
                })
            })
        } 
    },
    send_verification_code: (phone) => {

    },
    check_verification_code: check_verification_code(phone, user_verification_code)
};

function check_verification_code(phone, user_verification_code) {
        /*  redis get server-side verification code
         *  compare verification codes    
         */
}

function get_api_key(phone){ 

}