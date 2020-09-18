/*
 * Practice mongoose
 */
const config = require('../../../config.json');

module.exports = function (mongoose, callback) {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useCreateIndex', true);
    mongoose.connect(config.database.mongoDB.url,{ useUnifiedTopology: true }, function (err) {
        if (err) throw err;
        callback();
    });
};

