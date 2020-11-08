var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var schema = mongoose.Schema({
    user:{
        uuid: String,
        address: String,
        email: String,
        phone: String,
        password: {
            type: String,
            default: null
        },
        name: {
            type: String,
            default: null
        },
        roles: [String],
        pickupDay:[Boolean],
        pickupList: String,
        class_number: String,
        car_number:String,
        children: [String]
    },
    active: {
        type: Boolean,
        default: true
    },registerTime: {
        type: Date,
        default: Date.now
    },
    registerMethod: {
        type: String,
        default: "default"
    }
},{
    versionKey: false
})

schema.index({
    "user.phone": 1, "user.email": 1
});

schema.statics.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

schema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.user.password);
};

module.exports = mongoose.model('User', schema);