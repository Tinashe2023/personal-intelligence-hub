import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
  title: String,
  source: String,
  url: String,
  category: {
    type: String,
    enum: ["quantum", "blockchain", "geopolitics", "ai", "other"],
  },
  publishedAt: Date,
  fetchedAt: { type: Date, default: Date.now },
});

// TTL index to automatically delete documents older than 48 hours (172800 seconds)
NewsSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 172800 });

export default mongoose.models.NewsItem ||
  mongoose.model("NewsItem", NewsSchema);
