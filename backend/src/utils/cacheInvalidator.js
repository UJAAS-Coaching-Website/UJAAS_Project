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
    let guard = 0;
    
    do {
      const scanResult = await redis.scan(cursor, { match: pattern, count: 100 });

      // Support both array and object response shapes from Redis clients.
      let nextCursor = '0';
      let keys = [];

      if (Array.isArray(scanResult)) {
        nextCursor = String(scanResult[0] ?? '0');
        keys = Array.isArray(scanResult[1]) ? scanResult[1] : [];
      } else if (scanResult && typeof scanResult === 'object') {
        nextCursor = String(scanResult.cursor ?? scanResult.nextCursor ?? '0');
        const resultKeys = scanResult.keys ?? scanResult.results ?? [];
        keys = Array.isArray(resultKeys) ? resultKeys : [];
      }

      cursor = nextCursor;
      if (keys && keys.length > 0) {
        keysToDelete.push(...keys);
      }

      guard += 1;
      if (guard > 1000) {
        console.warn(`[Cache Invalidation] SCAN guard tripped while flushing '${pattern}'.`);
        break;
      }
    } while (String(cursor) !== '0');

    if (keysToDelete.length > 0) {
      // De-duplicate keys collected across scan pages.
      keysToDelete = [...new Set(keysToDelete)];
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
