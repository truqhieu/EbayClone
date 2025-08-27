const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let redisClient;
let redisAdapter;

const initRedis = async () => {
  try {
    // Create Redis client
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return new Error('Redis retry attempts exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Handle Redis events
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
    });

    // Connect to Redis
    await redisClient.connect();

    // Create Socket.IO Redis adapter
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    
    await pubClient.connect();
    await subClient.connect();
    
    redisAdapter = createAdapter(pubClient, subClient);

    console.log('Redis initialized successfully');
    return { redisClient, redisAdapter };
    
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
};

const getRedisAdapter = () => {
  if (!redisAdapter) {
    throw new Error('Redis adapter not initialized. Call initRedis() first.');
  }
  return redisAdapter;
};

// Session store configuration
const getSessionStore = () => {
  const RedisStore = require('connect-redis').default;
  return new RedisStore({
    client: getRedisClient(),
    prefix: 'sess:',
    ttl: 86400, // 24 hours
  });
};

// Cache utilities
const cache = {
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Redis cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis cache exists error:', error);
      return false;
    }
  },

  async flush() {
    try {
      await redisClient.flushDb();
      return true;
    } catch (error) {
      console.error('Redis cache flush error:', error);
      return false;
    }
  }
};

// Rate limiting utilities
const rateLimit = {
  async isAllowed(key, limit = 100, window = 3600) {
    try {
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      
      return current <= limit;
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return true; // Allow on error to prevent blocking
    }
  },

  async getRemainingRequests(key, limit = 100) {
    try {
      const current = await redisClient.get(key);
      const remaining = Math.max(0, limit - (parseInt(current) || 0));
      return remaining;
    } catch (error) {
      console.error('Redis rate limit remaining error:', error);
      return limit;
    }
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  getRedisAdapter,
  getSessionStore,
  cache,
  rateLimit
};