import mongoose from "mongoose";

const ResearchPaperSchema = new mongoose.Schema({
  title: String,
  authors: [String],
  year: Number,
  citationCount: Number,
  topic: {
    type: String,
    enum: ["quantum computing", "blockchain", "federated learning", "LLM"],
  },
  paperId: String,
  url: String,
  fetchedAt: { type: Date, default: Date.now },
});

// TTL index to automatically delete documents older than 48 hours (172800 seconds)
ResearchPaperSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 172800 });

export default mongoose.models.ResearchPaper ||
  mongoose.model("ResearchPaper", ResearchPaperSchema);
