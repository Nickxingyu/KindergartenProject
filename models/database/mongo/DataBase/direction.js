var mongoose = require('mongoose');

var schema = mongoose.Schema({
    pickupList: String,  //uuid of pickupList
    waypoint_order: [Number],
    place_ids: [String]
})

module.exports = mongoose.model('Direction', schema);