/**
 * Performance utilities for DocuFold extension
 */

/**
 * Simple debounce function to limit how often a function can be called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cache with TTL (Time To Live) support
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.ttl = ttlMs;
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   */
  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   * @param key - Cache key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns Number of cached items
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  /**
   * Start the timer
   */
  start(): void {
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and return elapsed time
   * @returns Elapsed time in milliseconds
   */
  stop(): number {
    this.endTime = performance.now();
    return this.getElapsed();
  }

  /**
   * Get elapsed time without stopping the timer
   * @returns Elapsed time in milliseconds
   */
  getElapsed(): number {
    const end = this.endTime || performance.now();
    return end - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
  }
}

/**
 * Batch processor for handling large datasets efficiently
 */
export class BatchProcessor<T> {
  private readonly batchSize: number;
  private readonly processingDelay: number;

  constructor(batchSize: number = 100, processingDelay: number = 10) {
    this.batchSize = batchSize;
    this.processingDelay = processingDelay;
  }

  /**
   * Process items in batches with delays to prevent blocking
   * @param items - Items to process
   * @param processor - Function to process each batch
   * @returns Promise that resolves when all batches are processed
   */
  async process<R>(items: T[], processor: (batch: T[]) => R[] | Promise<R[]>): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      // Add delay between batches to prevent blocking
      if (i + this.batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, this.processingDelay));
      }
    }

    return results;
  }
}
