const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

let redis;
console.log('Connecting to Radis..'); 

const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
    };

redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

module.exports = redis;
