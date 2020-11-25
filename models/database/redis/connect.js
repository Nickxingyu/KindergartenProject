
const config = require('../../.././config/config.json');
const redis = require('redis');
const asyncRedis = require("async-redis");

const redisClient = redis.createClient(config.database.redis.url, config.database.redis.option);
const asyncRedisClient = asyncRedis.decorate(redisClient);
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

module.exports = asyncRedisClient;