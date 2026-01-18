import "server-only";

import { getRedisClient } from "@/lib/redis";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 60;

export async function rateLimit(identifier: string): Promise<boolean> {
  const windowId = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `rate:${identifier}:${windowId}`;
  const redis = getRedisClient();
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
  return current <= RATE_LIMIT_MAX;
}

