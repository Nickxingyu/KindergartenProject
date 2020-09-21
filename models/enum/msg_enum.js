function msg_type_generator(type){
    return function(message){
        return {
            type: type,
            message: message
        }
    }
}

const login_message = msg_type_generator('login_message');

module.exports = {
    login_message:{
        content_not_complete: login_message('Content not complete'),
        no_user_founded: login_message('No user founded'),
        wrong_password: login_message('Wrong password'),
        authentication_succeeded: login_message('Authentication succeeded'),
        invalid_verification_code: login_message('Invalid verification code')
    }
}

