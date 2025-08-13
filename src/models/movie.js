import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tmdbId: { type: Number, required: true, unique: true },
  year: Number,
  overview: String,
  poster: String,
  backdrop: String,
  genres: [String],
  runtime: Number,
  rating: Number,
  torrents: [
    {
      magnet: { type: String, required: true },
      quality: { type: String, required: true },
      size: String,
      seeds: Number,
      peers: Number,
      provider: String,
      resolution: String,
      codec: String,
    },
  ],
  cachedAt: { type: Date, default: Date.now },
  lastUpdated: Date,
});

// Index for faster searches
movieSchema.index({ title: "text", "torrents.quality": 1 });

export default mongoose.model("Movie", movieSchema);
