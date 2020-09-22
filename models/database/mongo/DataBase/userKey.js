var mongoose = require('mongoose');

var schema = mongoose.Schema({
    email: String,
    phone: String,
    apiKey: String,
    secretKey: String,
    publicKey: String,
    userAgent: String,
}, {
    timestamps: true,
    versionKey: false
});

schema.index({
    "phone": 1, "email":1, "apiKey": 1
});

module.exports = mongoose.model('UserKey', schema);
