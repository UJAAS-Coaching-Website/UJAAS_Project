import 'dotenv/config'; // Ensures environment variables are loaded
import { Redis } from '@upstash/redis';

// Initialize the Redis client. 
// It will automatically pick up UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from your .env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;
