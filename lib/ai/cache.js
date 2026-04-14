import crypto from "crypto";
import { connectDB } from "../mongodb.js";
import AICache from "../../models/AICache.js";

// TTL durations in milliseconds per task type
const TTL_MS = {
  news: 6 * 60 * 60 * 1000,       // 6 hours
  research: 24 * 60 * 60 * 1000,   // 24 hours
  email: 12 * 60 * 60 * 1000,      // 12 hours
  analytics: 3 * 60 * 60 * 1000,   // 3 hours
  alert: 6 * 60 * 60 * 1000,       // 6 hours
};

/**
 * Generate a SHA-256 hash of the input string for cache key.
 */
export function hashInput(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Look up a cached AI result by input hash and task type.
 * Returns null if not found or expired.
 */
export async function getCached(inputHash, taskType) {
  try {
    await connectDB();
    const cached = await AICache.findOne({
      inputHash,
      taskType,
      expiresAt: { $gt: new Date() },
    }).lean();

    return cached || null;
  } catch (error) {
    console.error("[AI_CACHE] Read error:", error.message);
    return null;
  }
}

/**
 * Store an AI result in the cache.
 */
export async function setCache({ inputHash, taskType, input, output, provider, tokensUsed }) {
  try {
    await connectDB();
    const ttl = TTL_MS[taskType] || TTL_MS.news;
    const now = new Date();

    await AICache.findOneAndUpdate(
      { inputHash, taskType },
      {
        inputHash,
        taskType,
        input: input.slice(0, 500), // Truncate for reference
        output,
        provider,
        tokensUsed: tokensUsed || 0,
        createdAt: now,
        expiresAt: new Date(now.getTime() + ttl),
      },
      { upsert: true, new: true },
    );
  } catch (error) {
    console.error("[AI_CACHE] Write error:", error.message);
  }
}

/**
 * Retrieve all cached results for a given task type (latest first).
 */
export async function getAllCachedByType(taskType, limit = 20) {
  try {
    await connectDB();
    return await AICache.find({
      taskType,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("[AI_CACHE] Query error:", error.message);
    return [];
  }
}

/**
 * Clean up expired cache entries.
 */
export async function cleanExpiredCache() {
  try {
    await connectDB();
    const result = await AICache.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      console.log(`[AI_CACHE] Cleaned ${result.deletedCount} expired entries`);
    }
  } catch (error) {
    console.error("[AI_CACHE] Cleanup error:", error.message);
  }
}
