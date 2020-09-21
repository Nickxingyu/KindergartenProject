var AWS = require('aws-sdk');
const AWS_config = require("../../config/config.json").AWS

AWS.config = AWS_config;
var sns = new AWS.SNS();

module.exports = {
    sms_now: (user, msg, callback) => {
        const params = {
            phoneNumber : user.phone,
            message : msg
        };
        sns.publish(params,callback(err, data))
    }
}
