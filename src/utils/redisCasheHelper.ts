import redis from "../db/redis.js";

export async function setCache(key: string, value: any, ttlSeconds = 60) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function delCache(key: string) {
  await redis.del(key);
}
