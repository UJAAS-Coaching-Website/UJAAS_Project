import redis from '../src/config/redis.js';

const testRedisConnection = async () => {
  try {
    console.log("Connecting to Upstash Redis...");

    // 1. Write a test key
    const testKey = "system:test:connection";
    const testValue = `Success! Connected at ${new Date().toISOString()}`;
    
    console.log(`Setting key '${testKey}'...`);
    // 'ex: 60' means this test key will automatically delete itself after 60 seconds
    await redis.set(testKey, testValue, { ex: 60 });
    
    // 2. Read the test key back
    console.log(`Reading key '${testKey}'...`);
    const retrievedValue = await redis.get(testKey);

    if (retrievedValue === testValue) {
      console.log("\n✅ Redis connection is working perfectly!");
      console.log("➡️  Retrieved Value:", retrievedValue);
    } else {
      console.log("\n❌ Redis connected, but retrieved value didn't match.");
    }
  } catch (error) {
    console.error("\n❌ Error connecting to Redis:");
    console.error(error);
  }
};

testRedisConnection();
