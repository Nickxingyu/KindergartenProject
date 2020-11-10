var mongoose = require('mongoose');

var child_info = mongoose.Schema({
    uuid: String,
    remaining_time: String,
    address: String,
    status: String,
    name:String,
    class_number:String
})

var schema = mongoose.Schema({
    uuid:String,
    driver:{
        phone: {
            type: String,
            default: null
        },
        location: {
            lat: {
                type: String,
                default: null
            },
            lng: {
                type: String,
                default: null
            }
        }
    },
    teacher:{
        phone: {
            type: String,
            default: null
        }
    },
    child_list: [child_info],
    status: String,
    number: Number
}, {
    timestamps: true,
    versionKey: false
});

schema.index({
    "driver.phone": 1,
    "teacher.phone": 1
});

module.exports = mongoose.model('PickUpList', schema);