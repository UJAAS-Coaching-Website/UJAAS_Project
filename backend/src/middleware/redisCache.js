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
      
      // Override res.json to cache the response before sending
      const originalJson = res.json.bind(res);
      
      res.json = (body) => {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Asynchronously cache it so we don't block the response
          // 'EX' signifies expire time in seconds
          redis.set(key, JSON.stringify(body), { ex: ttlSeconds }).catch(err => {
            console.error(`Failed to cache key ${key}:`, err);
          });
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

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resolvedPatterns = typeof patterns === 'function' ? patterns(req) : patterns;
        
        import('../utils/cacheInvalidator.js').then(({ flushPattern, invalidateKey }) => {
          const exactKeys = resolvedPatterns.filter(p => !p.includes('*'));
          const wildcards = resolvedPatterns.filter(p => p.includes('*'));

          if (exactKeys.length > 0) {
            invalidateKey(...exactKeys);
          }
          
          wildcards.forEach(p => flushPattern(p));
        }).catch(err => console.error('Error importing cacheInvalidator:', err));
      }
    });

    next();
  };
};
