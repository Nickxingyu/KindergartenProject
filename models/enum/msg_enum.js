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
const api_message = msg_type_generator('api_message');
const database_message = msg_type_generator('database_message');

module.exports = {
    login_message:{
        content_not_complete: () => { return login_message('Content not complete') },
        no_user_founded: () => { return login_message('No user founded') },
        wrong_password: () => { return login_message('Wrong password') },
        authentication_succeeded: () => { return login_message('Authentication succeeded') },
        invalid_verification_code: () => { return login_message('Invalid verification code') },
        invalid_publicKey: () => { return login_message('Invalid client public key') },
        invalid_jwt_signature: () => { return login_message('Invalid jwt sigature') },
        no_public_key: () => { return login_message('No client public key') }
    },
    verification_code_message:{
        no_user_founded: () => { return verification_code_message('No user founded') },
        expired_verification_code: () => { return verification_code_message('Expired verification code') },
        verification_code_is_not_expired: () => { return verification_code_message("Verification code isn't expired") },
        code_is_sended: () => { return verification_code_message('Verification code is sended') },
        no_verification_code_founded: () => { return verification_code_message('No verification code founded') }
    },
    decrypt_message:{
        invalid_publicKey: () => { return decrypt_message('Invalid publicKey') }
    },
    message:{
        succeed: () => { return message('succeed') }
    },
    api_message:{
        content_not_complete: () => { return api_message('Content not complete') },
        not_use_service: () => { return api_message('Not use this service') },
        child_uuid_error: () => { return api_message('Child uuid is not founded') },
        child_not_in_pickup_list: () => { return api_message('Child is not in pickup list') }
    },
    database_message:{
        database_fail: () => { return database_message('Database Fail') },
        no_user_founded: () => { return database_message('No user founded') },
        lost_information: () => {return database_message('Database lost some information') },
        lost_pickupList: () => {return database_message('Database lost pickupList') },
        lost_direction: () => {return database_message('Database lost direction') }
    }
}

