var mongoose = require('mongoose');

var child_info = mongoose.Schema({
    uuid: String,
    remaining_time: String,
    address: String
})

var schema = mongoose.Schema({
    uuid:String,
    driver:{
        phone: String,
        location: {
            lat: String,
            lng: String
        }
    },
    teacher:{
        phone: String
    },
    children: [child_info],
    done: Boolean
}, {
    timestamps: true,
    versionKey: false
});

schema.index({
    "driver.phone": 1,
    "teacher.phone": 1
});

module.exports = mongoose.model('PickUpList', schema);