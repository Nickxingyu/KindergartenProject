const User = require('../models/database/mongo/DataBase/user');
const { build_apiKey_token } = require('../config/key');
const verification_service = require('../helpers/verification_service');
const message = require('../models/enum/msg_enum');


module.exports = {
    login_by_verification_code: async(userInfo) => {
        const {phone, code} = userInfo;
        if(!phone) return {error: message.Content_not_complete()}
        if(!code){
            const result = await verification_service.send_verifiaction_code(phone)
            if(result.error) return result
            return message.OK()
        }
        let user;
        try{
            user = await User.findOne({"user.phone": phone})
        }catch(e){
            return {error: message.Database_fail(err)}
        }
        if(!user) return {error: message.No_user_found()}
        let  result = await verification_service.check_verification_code(phone, code)
        if(result.error) return result
        result = await verification_service.del_verification_code(phone)
        if(result.error) return result
        let user_info = {};
        user_info.user = user.user;
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
                return {error: message.Database_fail(err)}
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
        return await build_apiKey_token({phone, user_info})
    }
}
