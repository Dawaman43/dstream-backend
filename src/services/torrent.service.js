import WebTorrent from "webtorrent";
import TorrentSearchApi from "torrent-search-api";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure providers
TorrentSearchApi.enablePublicProviders();
TorrentSearchApi.enableProvider("Yts");
TorrentSearchApi.enableProvider("ThePirateBay");
TorrentSearchApi.enableProvider("Torrent9");
TorrentSearchApi.enableProvider("1337x");
TorrentSearchApi.enableProvider("Rarbg");
TorrentSearchApi.enableProvider("Torrentz2");

class TorrentService {
  constructor() {
    this.client = new WebTorrent();
    this.downloadsDir = path.join(__dirname, "../../downloads");

    // Ensure downloads directory exists
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }

    // Cache for search results
    this.searchCache = new Map();
    this.cacheTTL = 60 * 60 * 1000; // 1 hour cache
  }

  // Enhanced quality detection
  detectQuality(title) {
    const qualityMap = [
      { quality: "8K", regex: /8k|4320p|7680x4320/i },
      { quality: "4K", regex: /2160p|4k|uhd|3840x2160/i },
      { quality: "1080p", regex: /1080p|1920x1080|full.?hd|fhd/i },
      { quality: "720p", regex: /720p|1280x720|hd.?ready/i },
      { quality: "576p", regex: /576p/i },
      { quality: "480p", regex: /480p|dvd|sd/i },
      { quality: "360p", regex: /360p/i },
    ];

    for (const { quality, regex } of qualityMap) {
      if (regex.test(title)) return quality;
    }
    return "Unknown";
  }

  detectResolution(title) {
    const resMap = [
      { res: "4320p", regex: /4320p|7680x4320|8k/i },
      { res: "2160p", regex: /2160p|3840x2160|4k|uhd/i },
      { res: "1080p", regex: /1080p|1920x1080/i },
      { res: "720p", regex: /720p|1280x720/i },
      { res: "576p", regex: /576p/i },
      { res: "480p", regex: /480p/i },
    ];

    for (const { res, regex } of resMap) {
      if (regex.test(title)) return res;
    }
    return null;
  }

  detectCodec(title) {
    const codecs = [
      { name: "H.265", regex: /h\.?265|hevc|x265/i },
      { name: "H.264", regex: /h\.?264|x264|avc/i },
      { name: "AV1", regex: /av1/i },
      { name: "VP9", regex: /vp9/i },
    ];

    for (const { name, regex } of codecs) {
      if (regex.test(title)) return name;
    }
    return "Unknown";
  }

  detectSource(title) {
    const sources = [
      { name: "Blu-ray", regex: /blu.?ray|bdrip|brrip/i },
      { name: "WEB-DL", regex: /web.?dl|webrip/i },
      { name: "HDTV", regex: /hdtv/i },
      { name: "DVD", regex: /dvdrip/i },
      { name: "CAM", regex: /cam|hdcam|ts|telesync/i },
    ];

    for (const { name, regex } of sources) {
      if (regex.test(title)) return name;
    }
    return "Unknown";
  }

  async downloadTorrent(magnet, sessionId) {
    return new Promise((resolve, reject) => {
      const userDir = path.join(this.downloadsDir, sessionId);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const torrent = this.client.add(magnet, { path: userDir }, (t) => {
        const videoFile = t.files.find((f) =>
          /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(f.name)
        );

        if (!videoFile) {
          return reject(new Error("No supported video file found in torrent"));
        }

        const result = {
          infoHash: t.infoHash,
          path: path.join(userDir, videoFile.name),
          name: videoFile.name,
          size: videoFile.length,
          progress: 0,
          downloadSpeed: 0,
          peers: 0,
        };

        // Progress tracking
        const updateStats = () => {
          result.progress = Math.floor(t.progress * 100);
          result.downloadSpeed = t.downloadSpeed;
          result.uploadSpeed = t.uploadSpeed;
          result.peers = t.numPeers;
          result.ratio = t.ratio;
        };

        const interval = setInterval(updateStats, 1000);

        t.on("download", updateStats);

        t.on("done", () => {
          clearInterval(interval);
          result.progress = 100;
          result.downloadSpeed = 0;
          resolve(result);
        });

        t.on("error", (err) => {
          clearInterval(interval);
          reject(err);
        });
      });
    });
  }

  // Cleanup old torrents
  async cleanup() {
    this.client.torrents.forEach((torrent) => {
      if (torrent.progress === 1) {
        torrent.destroy();
      }
    });
  }

  // In torrent.service.js - add this new method
  async searchAllProviders(query, category, limit = 30) {
    const providers = TorrentSearchApi.getProviders();
    let allResults = [];

    // Search all providers in parallel
    await Promise.all(
      providers.map(async (provider) => {
        try {
          const results = await TorrentSearchApi.search(
            query,
            category,
            limit,
            provider
          );
          allResults = [...allResults, ...results];
        } catch (err) {
          console.warn(`Search failed on ${provider}: ${err.message}`);
        }
      })
    );

    // Deduplicate results
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((t) => t.magnet === result.magnet)
    );

    return uniqueResults;
  }

  // Then modify the searchMedia method to use this:
  async searchMedia(query, category = "Movies", limit = 30) {
    try {
      // Try the original query first
      let torrents = await this.searchAllProviders(query, category, limit);

      // If no results, try alternative query formulations
      if (!torrents.length) {
        const alternatives = [
          query.replace(/TV series/i, "").trim(), // Remove "TV series"
          query.replace(/\d{4}/, "").trim(), // Remove year
          query.split(" TV")[0], // Just title
          `${query} S01`, // Add season
        ];

        for (const altQuery of alternatives) {
          torrents = await this.searchAllProviders(altQuery, category, limit);
          if (torrents.length) break;
        }
      }

      // Process results...
      return this.processResults(torrents);
    } catch (err) {
      console.error("Torrent search error:", err);
      return [];
    }
  }
}

// Initialize and export singleton instance
const torrentService = new TorrentService();

// Regular cleanup
setInterval(() => torrentService.cleanup(), 3600000); // Every hour

export default torrentService;
