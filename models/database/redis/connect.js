
const config = require('../../.././config/config.json');
const redis = require('redis');

const redisClient = redis.createClient(config.database.redis.url, config.database.redis.option);
redisClient.on('ready', function () {
    console.log('redisDB ready');
});

redisClient.on('connect', function () {
    console.log('redisDB connect');
});

redisClient.on('reconnecting', function (delay, attempt) {
    console.log('redisDB reconnecting');
});

redisClient.on('error', function (err) {
    console.error('redisDB err ', err);
});

redisClient.get("name",(err,reply)=>{
    if (err) console.log(err);
    else console.log(reply);
})

module.exports = redisClient;