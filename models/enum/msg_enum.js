function msg_type_generator(type){
    return function(message, code){
        return {
            code,
            type,
            message
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
        content_not_complete: () => { 
            const code = {
                type: 0,
                message: 0
            }
            return login_message('Content not complete', code) 
        },
        no_user_founded: () => {
            const code = {
                type: 0,
                message: 1
            }
            return login_message('No user founded', code) 
        },
        wrong_password: () => { 
            const code = {
                type: 0,
                message: 2
            }
            return login_message('Wrong password') 
        },
        authentication_succeeded: () => { 
            const code = {
                type: 0,
                message: 3
            }
            return login_message('Authentication succeeded') 
        },
        invalid_verification_code: () => { 
            const code = {
                type: 0,
                message: 4
            }
            return login_message('Invalid verification code') 
        },
        invalid_publicKey: () => { 
            const code = {
                type: 0,
                message: 5
            }
            return login_message('Invalid client public key') 
        },
        invalid_jwt_signature: () => { 
            const code = {
                type: 0,
                message: 6
            }
            return login_message('Invalid jwt sigature') 
        },
        no_public_key: () => { 
            const code = {
                type: 0,
                message: 7
            }
            return login_message('No client public key') 
        }
    },
    verification_code_message:{
        no_user_founded: () => { 
            const code = {
                type: 1,
                message: 0
            }
            return verification_code_message('No user founded') 
        },
        expired_verification_code: () => {
            const code = {
                type: 1,
                message: 1
            } 
            return verification_code_message('Expired verification code') 
        },
        verification_code_is_not_expired: () => { 
            const code = {
                type: 1,
                message: 2
            }
            return verification_code_message("Verification code isn't expired") 
        },
        code_is_sended: () => { 
            const code = {
                type: 1,
                message: 3
            }
            return verification_code_message('Verification code is sended') 
        },
        no_verification_code_founded: () => { 
            const code = {
                type: 1,
                message: 4
            }
            return verification_code_message('No verification code founded') 
        }
    },
    decrypt_message:{
        invalid_publicKey: () => { 
            const code = {
                type: 2,
                message: 0
            }
            return decrypt_message('Invalid publicKey') 
        }
    },
    message:{
        succeed: () => { 
            const code = {
                type: 3,
                message: 0
            }
            return message('succeed') 
        }
    },
    api_message:{
        content_not_complete: () => { 
            const code = {
                type: 4,
                message: 0
            }
            return api_message('Content not complete') 
        },
        not_use_service: () => { 
            const code = {
                type: 4,
                message: 1
            }
            return api_message('Not use this service') 
        },
        child_uuid_error: () => { 
            const code = {
                type: 4,
                message: 2
            }
            return api_message('Child uuid is not founded') 
        },
        child_not_in_pickup_list: () => { 
            const code = {
                type: 4,
                message: 3
            }
            return api_message('Child is not in pickup list') 
        }
    },
    database_message:{
        database_fail: () => { 
            const code = {
                type: 5,
                message: 0
            }
            return database_message('Database Fail') 
        },
        no_user_founded: () => {
            const code = {
                type: 5,
                message: 1
            } 
            return database_message('No user founded') 
        },
        lost_information: () => {
            const code = {
                type: 5,
                message: 2
            }
            return database_message('Database lost some information') 
        },
        lost_pickupList: () => {
            const code = {
                type: 5,
                message: 3
            }
            return database_message('Database lost pickupList') 
        },
        lost_direction: () => {
            const code = {
                type: 5,
                message: 4
            }
            return database_message('Database lost direction') 
        }
    }
}

