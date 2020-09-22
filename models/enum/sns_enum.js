const appName = require('../..//config/config.json').appName;

const verification_code_msg = '您的 '+ appName + ' 應用程式的驗證碼為：' ;

module.exports = {
    verification_code_msg: verification_code_msg
}