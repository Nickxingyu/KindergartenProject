function msg_type_generator(type){
    return function(message){
        return {
            type: type,
            message: message
        }
    }
}

const login_message = msg_type_generator('Login_message');
const verification_code_message = msg_type_generator('Verification_code_message');
const decrypt_message = msg_type_generator('Decrypt message');
const message = msg_type_generator('message');
module.exports = {
    login_message:{
        content_not_complete: login_message('Content not complete'),
        no_user_founded: login_message('No user founded'),
        wrong_password: login_message('Wrong password'),
        authentication_succeeded: login_message('Authentication succeeded'),
        invalid_verification_code: login_message('Invalid verification code'),
        invalid_publicKey: login_message('Invalid client public key'),
        invalid_jwt_signature: login_message('Invalid jwt sigature')
    },
    verification_code_message:{
        no_user_founded: verification_code_message('No user founded'),
        expired_verification_code: verification_code_message('Expired verification code'),
        verification_code_is_not_expired: verification_code_message("Verification code isn't expired"),
        code_is_sended: verification_code_message('Verification code is sended'),
        no_verification_code_founded: verification_code_message('No verification code founded')
    },
    decrypt_message:{
        invalid_publicKey: decrypt_message('Invalid publicKey')
    },
    message:{
        succeed: message('succeed')
    }
}

