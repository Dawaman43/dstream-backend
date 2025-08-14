import TorrentService from "../services/torrent.service.js";
import ExternalAPIService from "../services/external-apis.service.js";
import fetch from "node-fetch";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// Proper tmdbFetch handles '?' in endpoint to avoid 401
const tmdbFetch = async (endpoint) => {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
  return res.json();
};

class DownloadController {
  async startDownload(req, res) {
    try {
      const {
        tmdbId,
        type = "movie",
        quality = "720p",
        fallbackToAnyQuality = false,
      } = req.body;

      // 1️⃣ Fetch TMDB data including IMDB ID
      const endpoint = `/${type}/${tmdbId}?append_to_response=external_ids`;
      const media = await tmdbFetch(endpoint);

      const title = media.title || media.name;
      const year = (media.release_date || media.first_air_date || "").split(
        "-"
      )[0];
      const imdbId = media.external_ids?.imdb_id;

      // 2️⃣ Build search queries
      const queries = [
        type === "tv" ? `${title} ${year} TV series` : `${title} ${year}`,
        type === "tv" ? `${title} S01` : title,
        title,
      ];

      // 3️⃣ Try searching torrents via TorrentService
      let torrents = [];
      for (const query of queries) {
        torrents = await TorrentService.searchMedia(
          query,
          type === "movie" ? "Movies" : "TV"
        );
        if (torrents.length) break;
      }

      // 4️⃣ Fallback to external APIs using IMDB ID
      if (!torrents.length && imdbId) {
        torrents = await ExternalAPIService.search(imdbId, type);
      }

      // 5️⃣ Handle no results
      if (!torrents.length) {
        return res.status(404).json({
          success: false,
          error: "No torrents found",
          details: { queriesAttempted: queries, type, imdbId },
        });
      }

      // 6️⃣ Filter by quality
      let filtered =
        quality === "any"
          ? torrents
          : torrents.filter((t) => t.quality === quality);

      if (!filtered.length && fallbackToAnyQuality) {
        filtered = torrents; // fallback to any quality if requested
      }

      // 7️⃣ Sort by seeds descending
      const sorted = filtered.sort((a, b) => b.seeds - a.seeds);

      // 8️⃣ Return best result + a couple alternatives
      return res.json({
        success: true,
        media: { title, year, type, imdbId },
        torrent: {
          title: sorted[0].title,
          magnet: sorted[0].magnet,
          quality: sorted[0].quality,
          seeds: sorted[0].seeds,
          size: sorted[0].size,
          provider: sorted[0].provider,
        },
        alternatives: sorted.slice(1, 3).map((t) => ({
          title: t.title,
          quality: t.quality,
          seeds: t.seeds,
          size: t.size,
          provider: t.provider,
        })),
      });
    } catch (err) {
      console.error("Download error:", err);
      res.status(500).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  async getDownloadList(req, res) {
    try {
      res.json({
        success: true,
        data: req.session?.downloads || [],
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default new DownloadController();
