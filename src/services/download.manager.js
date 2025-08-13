import User from "../models/user.js";
import TorrentService from "../services/torrent.service.js";
import path from "path";
import fs from "fs";

class DownloadController {
  async getDownloadList(req, res) {
    try {
      const user = await User.findById(req.user.id).populate(
        "offlineDownloads.movieId"
      );

      res.json(user.offlineDownloads);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async startDownload(req, res) {
    try {
      const { tmdbId, quality } = req.body;
      const user = await User.findById(req.user.id);

      // Find movie and torrent
      const movie = await Movie.findOne({ tmdbId });
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }

      const torrent = movie.torrents.find(
        (t) => t.quality.includes(quality) && t.seeds > 0
      );

      if (!torrent) {
        return res
          .status(404)
          .json({ error: "Torrent not available for selected quality" });
      }

      // Create user download directory
      const downloadDir = path.join(__dirname, `../../downloads/${user._id}`);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Add to user's downloads
      const download = {
        movieId: movie._id,
        magnet: torrent.magnet,
        status: "downloading",
        progress: 0,
        quality: torrent.quality,
        size: torrent.size,
        startedAt: new Date(),
      };

      user.offlineDownloads.push(download);
      await user.save();

      // Start download in background
      TorrentService.downloadTorrent(torrent.magnet, downloadDir)
        .then((result) => {
          // Update when complete
          User.updateOne(
            { _id: user._id, "offlineDownloads._id": download._id },
            {
              $set: {
                "offlineDownloads.$.status": "completed",
                "offlineDownloads.$.path": result.path,
                "offlineDownloads.$.progress": 100,
                "offlineDownloads.$.completedAt": new Date(),
              },
            }
          ).exec();
        })
        .catch((error) => {
          User.updateOne(
            { _id: user._id, "offlineDownloads._id": download._id },
            {
              $set: {
                "offlineDownloads.$.status": "error",
                "offlineDownloads.$.error": error.message,
              },
            }
          ).exec();
        });

      res.json(download);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DownloadController();
