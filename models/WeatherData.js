import mongoose from "mongoose";

const WeatherSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  weatherCode: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  fetchedAt: { type: Date, default: Date.now },
});

// TTL index to automatically delete documents older than 48 hours (172800 seconds)
WeatherSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 172800 });

export default mongoose.models.WeatherData ||
  mongoose.model("WeatherData", WeatherSchema);
