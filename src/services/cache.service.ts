import NodeCache from "node-cache";
import { config } from "../config";

export type CacheType =
  | "leagueInfo"
  | "rosters"
  | "liveScores"
  | "players"
  | "standings"
  | "transactions";

class CacheService {
  private cache: NodeCache;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600, // Default 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance, be careful with mutations
    });

    // Log cache statistics periodically in development
    if (config.server.nodeEnv === "development") {
      setInterval(() => {
        this.logStats();
      }, 60000); // Every minute
    }
  }

  /**
   * Get TTL for specific cache type
   */
  private getTTL(type: CacheType): number {
    return config.cache.ttl[type];
  }

  /**
   * Generate cache key
   */
  private generateKey(type: CacheType, identifier: string): string {
    return `${type}:${identifier}`;
  }

  /**
   * Get data from cache
   */
  get<T>(type: CacheType, identifier: string): T | undefined {
    const key = this.generateKey(type, identifier);
    const data = this.cache.get<T>(key);

    if (data !== undefined) {
      this.stats.hits++;
      console.log(`Cache HIT: ${key}`);
      return data;
    }

    this.stats.misses++;
    console.log(`Cache MISS: ${key}`);
    return undefined;
  }

  /**
   * Set data in cache
   */
  set<T>(type: CacheType, identifier: string, data: T): boolean {
    const key = this.generateKey(type, identifier);
    const ttl = this.getTTL(type);

    const success = this.cache.set(key, data, ttl);

    if (success) {
      console.log(`Cache SET: ${key} (TTL: ${ttl}s)`);
    }

    return success;
  }

  /**
   * Delete specific cache entry
   */
  delete(type: CacheType, identifier: string): number {
    const key = this.generateKey(type, identifier);
    const deleted = this.cache.del(key);

    if (deleted > 0) {
      console.log(`Cache DELETE: ${key}`);
    }

    return deleted;
  }

  /**
   * Delete all cache entries of a specific type
   */
  deleteByType(type: CacheType): number {
    const keys = this.cache.keys();
    const prefix = `${type}:`;
    const keysToDelete = keys.filter((key) => key.startsWith(prefix));

    if (keysToDelete.length > 0) {
      const deleted = this.cache.del(keysToDelete);
      console.log(`Cache DELETE TYPE: ${type} (${deleted} entries)`);
      return deleted;
    }

    return 0;
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
    console.log("Cache FLUSH: All entries cleared");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : "0";

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      entries: keys.length,
      keys: keys,
    };
  }

  /**
   * Log cache statistics
   */
  private logStats(): void {
    const stats = this.getStats();
    console.log("=== Cache Statistics ===");
    console.log(`Hit Rate: ${stats.hitRate}`);
    console.log(`Hits: ${stats.hits} | Misses: ${stats.misses}`);
    console.log(`Total Entries: ${stats.entries}`);
    console.log("========================");
  }

  /**
   * Check if key exists
   */
  has(type: CacheType, identifier: string): boolean {
    const key = this.generateKey(type, identifier);
    return this.cache.has(key);
  }

  /**
   * Get remaining TTL for a key
   */
  getTTLRemaining(type: CacheType, identifier: string): number | undefined {
    const key = this.generateKey(type, identifier);
    return this.cache.getTtl(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
