import "server-only";

import { createClient } from "redis";

declare global {
  // eslint-disable-next-line no-var
  var redisClient: ReturnType<typeof createClient> | undefined;
}

export function getRedisClient() {
  if (!globalThis.redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("Missing REDIS_URL env var.");
    }
    globalThis.redisClient = createClient({ url });
    globalThis.redisClient.on("error", (error) => {
      console.error("Redis client error", error);
    });
    globalThis.redisClient.connect();
  }
  return globalThis.redisClient;
}

