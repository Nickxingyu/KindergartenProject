var mongoose = require('mongoose');

var schema = mongoose.Schema({
    phone: String,
    apiKey: {
        type: String,
        default: null
    },
    userAgent: String,
}, {
    timestamps: true,
    versionKey: false
});

schema.index({
    "phone": 1, "apiKey": 1
});

module.exports = mongoose.model('UserKey', schema);
