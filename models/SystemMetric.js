import mongoose from "mongoose";

const SystemMetricSchema = new mongoose.Schema({
  cpu: {
    usage: Number,
    cores: Number,
  },
  ram: {
    used: Number,
    total: Number,
    percentage: Number,
  },
  disk: {
    used: Number,
    total: Number,
    percentage: Number,
  },
  timestamp: { type: Date, default: Date.now },
});

// TTL index to automatically delete documents older than 48 hours (172800 seconds)
SystemMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 172800 });

export default mongoose.models.SystemMetric ||
  mongoose.model("SystemMetric", SystemMetricSchema);
