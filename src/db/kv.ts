import "server-only";

import { getRedisClient } from "@/lib/redis";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export async function getJson<T>(
  key: string,
): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function setJson<T>(
  key: string,
  value: T,
  options?: { ex?: number },
): Promise<void> {
  const redis = getRedisClient();
  const payload = JSON.stringify(value);
  if (options?.ex) {
    await redis.set(key, payload, { EX: options.ex });
    return;
  }
  await redis.set(key, payload);
}

export async function delKey(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

