import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // sessionID or user ID
    mediaId: { type: Number, required: true }, // tmdbId from Media
    quality: { type: String, required: true },
    magnet: { type: String, required: true },
    status: { type: String, default: "initiated" }, // initiated, completed, etc.
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Download = mongoose.model("Download", downloadSchema);
export default Download;
