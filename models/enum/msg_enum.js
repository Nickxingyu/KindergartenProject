function msg_type_generator(type){
    return function(status, code, description, error){
        return {
            status,
            msg:{
                code,
                type,
                description
            },
            error
        }
    }
}

const Message = msg_type_generator('Message')
const Authentication = msg_type_generator('Authentication')
const Database = msg_type_generator('Database')
const GCP = msg_type_generator('GCP')
const AWS = msg_type_generator('AWS')

module.exports = {
    OK: (err)=> Message(200, 1, "OK", err),
    Access_deny: (err)=> Authentication(401, 2, "Access deny", err),
    Content_not_complete: (err)=> Authentication(401, 3, "Content not complete", err),
    Database_fail: (err)=>Database(500, 4, "Database fail", err),
    Invalid: (err)=>Authentication(401, 5, "Invalid verification code or password", err),
    No_user_found: (err)=>Message(200, 6, "No user found", err),
    Expired_verification_code: (err)=>Authentication(401, 7, "Verification code is expired", err),
    Verification_code_is_not_expired: (err)=>Authentication(401, 8, "Verification code isn't expired", err),
    Database_error: (err)=>Database(500, 9, "Database error", err),
    GCP_error: (err)=>GCP(500, 10, "GCP error",err),
    Wrong_password: (err)=> Authentication(401, 9, "Wrong password", err),
    Invalid_public_key: (err)=> Authentication(401, 10, "Invalid public key", err),
    SNS_error: (err)=> AWS(500, 11, "SNS error", err),
    Code_is_sended: (err)=> AWS(200, 12, "Code is sended", err)
}