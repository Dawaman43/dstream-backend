import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tmdbId: { type: Number, required: true, unique: true },
  type: { type: String, enum: ["movie", "tv", "anime"], required: true }, // NEW: Media type
  year: Number,
  overview: String,
  poster: String,
  backdrop: String,
  genres: [String],
  runtime: Number, // For TV/anime: episode runtime
  rating: Number,
  seasons: Number, // NEW: For TV/anime
  episodes: [
    {
      // NEW: For TV/anime
      season: Number,
      episode: Number,
      title: String,
      overview: String,
      still: String,
    },
  ],
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
mediaSchema.index({ title: "text", type: 1, "torrents.quality": 1 });

export default mongoose.model("Media", mediaSchema);
