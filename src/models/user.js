import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  offlineDownloads: [
    {
      movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
      magnet: String,
      filename: String,
      path: String,
      downloadedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["downloading", "completed", "error"],
        default: "downloading",
      },
      progress: Number,
      size: String,
    },
  ],
  preferences: {
    defaultQuality: { type: String, default: "1080p" },
    autoDownload: Boolean,
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
});

export default mongoose.model("User", userSchema);
