import mongoose from "mongoose";

const AICacheSchema = new mongoose.Schema({
  inputHash: {
    type: String,
    required: true,
    index: true,
  },
  taskType: {
    type: String,
    required: true,
    enum: ["news", "research", "email", "analytics", "alert"],
    index: true,
  },
  input: {
    type: String,
    maxlength: 500, // Truncated for reference only
  },
  output: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ["groq", "gemini", "openrouter", "cache"],
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
});

// Compound index for fast cache lookups
AICacheSchema.index({ inputHash: 1, taskType: 1 }, { unique: true });

// TTL index — MongoDB will automatically delete expired documents
AICacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AICache ||
  mongoose.model("AICache", AICacheSchema);
