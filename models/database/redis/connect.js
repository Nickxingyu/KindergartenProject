
const config = require('../../.././config/config.json');
const redis = require('redis');

const redisClient = redis.createClient(config.database.redis.url, config.database.redis.option);
redisClient.on('ready', function () {
});

redisClient.on('connect', function () {
});

redisClient.on('reconnecting', function (delay, attempt) {
});

redisClient.on('error', function (err) {
});

redisClient.get("name",(err,reply)=>{
})

module.exports = redisClient;