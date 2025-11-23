/**
 * Rate limiting utility to prevent abuse
 */

import { RateLimitError } from "./errors.js";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if a request is allowed
   * @param key - Unique identifier for the rate limit (e.g., IP, service name)
   * @returns true if allowed, throws RateLimitError if exceeded
   */
  check(key: string): void {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return;
    }

    if (entry.count >= this.maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs / 1000} seconds`
      );
    }

    entry.count++;
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiter instance
// 100 requests per minute per service
export const rateLimiter = new RateLimiter(60000, 100);

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

