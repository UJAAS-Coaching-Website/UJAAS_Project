import redis from '../utils/redisClient.js';

/**
 * Middleware to check Redis cache. If miss, intercept res.json to cache the outgoing data.
 * @param {Function|string} keyGenerator - Function receiving (req) and returning a string key, or a static string key.
 * @param {number} ttlSeconds - Time to live in seconds.
 */
export const checkCache = (keyGenerator, ttlSeconds = 3600) => {
  return async (req, res, next) => {
    // Make sure Redis client was configured properly (URL exists)
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('Redis cache skipped: UPSTASH_REDIS_REST_URL not configured in environment.');
      return next();
    }

    // Determine the exact cache key
    const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
    
    if (!key) {
      return next();
    }

    try {
      const cachedData = await redis.get(key);
      
      if (cachedData !== null && cachedData !== undefined) {
        // Return cached data immediately
        // Upstash redis.get automatically parses JSON if it was saved as JSON
        return res.json(cachedData);
      }
      
      // Override res.json to cache the response before sending.
      // This closes a stale-write race where older reads could overwrite newer state.
      const originalJson = res.json.bind(res);
      
      res.json = async (body) => {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // 'EX' signifies expire time in seconds
            await redis.set(key, JSON.stringify(body), { ex: ttlSeconds });
          } catch (err) {
            console.error(`Failed to cache key ${key}:`, err);
          }
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Redis Cache Error:', error);
      // Fallback to controller if Redis errors out
      next();
    }
  };
};

/**
 * Middleware to strategically invalidate cache keys when a mutation (POST/PUT/DELETE) is successful.
 * @param {Array<string>|Function} patterns - Array of patterns or function returning an array of patterns
 */
export const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return next();
    }

    let invalidated = false;

    const performInvalidation = async () => {
      if (invalidated || !(res.statusCode >= 200 && res.statusCode < 300)) {
        return;
      }

      invalidated = true;
      const resolvedPatterns = typeof patterns === 'function' ? patterns(req) : patterns;

      try {
        const { flushPattern, invalidateKey } = await import('../utils/cacheInvalidator.js');
        const exactKeys = resolvedPatterns.filter((p) => !p.includes('*'));
        const wildcards = resolvedPatterns.filter((p) => p.includes('*'));

        const tasks = [];
        if (exactKeys.length > 0) {
          tasks.push(invalidateKey(...exactKeys));
        }

        wildcards.forEach((p) => tasks.push(flushPattern(p)));
        await Promise.all(tasks);
      } catch (err) {
        console.error('Error running cache invalidation:', err);
      }
    };

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = async (body) => {
      await performInvalidation();
      return originalJson(body);
    };

    res.send = async (body) => {
      await performInvalidation();
      return originalSend(body);
    };

    next();
  };
};
