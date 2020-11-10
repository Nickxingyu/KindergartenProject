var AWS = require('aws-sdk');
const AWS_config = require("../../config/config.json").AWS

AWS.config = AWS_config;
var sns = new AWS.SNS();
sns.setSMSAttributes({attributes:{DefaultSMSType: 'Transactional'}}, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    // successful response
  })

module.exports = {
    sms_now: (phone, msg, callback) => {
        phone = '+886' + phone.slice(1);
        const params = {
            PhoneNumber : phone,
            Message : msg
        };
        sns.publish(params,callback)
    }
}
