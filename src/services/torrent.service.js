import WebTorrent from "webtorrent";
import TorrentSearchApi from "torrent-search-api";
import Movie from "../models/movie.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure torrent providers
TorrentSearchApi.enableProvider("Yts");
TorrentSearchApi.enableProvider("ThePirateBay");
TorrentSearchApi.enableProvider("Torrent9");

class TorrentService {
  constructor() {
    this.client = new WebTorrent();
    this.downloadsDir = path.join(__dirname, "../../downloads");

    // Ensure downloads directory exists
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  async searchMovies(query, limit = 20) {
    try {
      // Search in database first
      const dbResults = await Movie.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);

      if (dbResults.length > 0) {
        return dbResults;
      }

      // Fallback to torrent search API
      const torrentResults = await TorrentSearchApi.search(
        query,
        "Movies",
        limit
      );
      return torrentResults.map((result) => ({
        title: result.title,
        size: result.size,
        seeds: result.seeds,
        peers: result.peers,
        provider: result.provider,
        magnet: result.magnet,
        quality: this.detectQuality(result.title),
      }));
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  detectQuality(title) {
    if (/1080p|1920x1080/i.test(title)) return "1080p";
    if (/720p|1280x720/i.test(title)) return "720p";
    if (/2160p|4k|3840x2160/i.test(title)) return "4K";
    if (/480p|dvd/i.test(title)) return "480p";
    return "Unknown";
  }

  async streamTorrent(magnet) {
    return new Promise((resolve, reject) => {
      const torrent = this.client.add(magnet, (torrent) => {
        const file = torrent.files.find((f) =>
          /\.(mp4|mkv|avi|mov)$/i.test(f.name)
        );

        if (!file) return reject(new Error("No playable video file found"));

        resolve({
          infoHash: torrent.infoHash,
          file,
          name: file.name,
          length: file.length,
          progress: torrent.progress,
        });
      });

      torrent.on("error", reject);
    });
  }

  async downloadTorrent(magnet, userId) {
    return new Promise((resolve, reject) => {
      const userDir = path.join(this.downloadsDir, userId);
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

      const torrent = this.client.add(magnet, { path: userDir }, (torrent) => {
        const videoFile = torrent.files.find((f) =>
          /\.(mp4|mkv|avi|mov)$/i.test(f.name)
        );

        if (!videoFile)
          return reject(new Error("No video file found in torrent"));

        const result = {
          infoHash: torrent.infoHash,
          path: path.join(userDir, videoFile.name),
          name: videoFile.name,
          size: videoFile.length,
          progress: 0,
        };

        torrent.on("download", () => {
          result.progress = Math.floor(torrent.progress * 100);
        });

        torrent.on("done", () => {
          result.progress = 100;
          resolve(result);
        });

        torrent.on("error", reject);
      });
    });
  }
}

export default new TorrentService();
