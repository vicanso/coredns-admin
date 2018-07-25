import LRUCache from 'lru-cache';

// 创建一个session的store(memory)
export function createSessionStore(max = 1000) {
  const cache = LRUCache({
    max,
  });
  return {
    async get(key) {
      return cache.get(key);
    },
    async set(key, value) {
      cache.set(key, value);
    },
    async destroy(key) {
      cache.del(key);
    },
  };
}

// 创建一个lru缓存
export function createCache(options) {
  return LRUCache(options);
}
