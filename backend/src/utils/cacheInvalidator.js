import redis from './redisClient.js';

/**
 * Flush all keys matching a specific pattern.
 * Uses SCAN to find all matches and pipeline to batch delete them.
 * Example pattern: 'student:*:enrollments'
 */
export const flushPattern = async (pattern) => {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;

  try {
    let cursor = '0';
    let keysToDelete = [];
    
    do {
      // Upstash Redis client returns [cursor, [keys]]
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        keysToDelete.push(...keys);
      }
    } while (cursor !== '0' && cursor !== 0);

    if (keysToDelete.length > 0) {
      const pipeline = redis.pipeline();
      keysToDelete.forEach(key => pipeline.del(key));
      await pipeline.exec();
      console.log(`[Cache Invalidation] Flushed pattern '${pattern}': ${keysToDelete.length} keys deleted.`);
    }
  } catch (error) {
    console.error(`[Cache Invalidation] Error flushing pattern '${pattern}':`, error);
  }
};

/**
 * Delete exactly specified keys.
 */
export const invalidateKey = async (...keys) => {
  if (!process.env.UPSTASH_REDIS_REST_URL || keys.length === 0) return;

  try {
    await redis.del(...keys);
    console.log(`[Cache Invalidation] Flushed exact keys: ${keys.join(', ')}`);
  } catch (error) {
    console.error(`[Cache Invalidation] Error invalidating keys:`, error);
  }
};
