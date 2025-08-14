import fetch from "node-fetch";

class ExternalAPIService {
  constructor() {
    this.apis = [
      {
        name: "Torrents-API",
        url: (query) =>
          `https://torrents-api.xyz/api/search?query=${encodeURIComponent(
            query
          )}`,
        parser: (data) =>
          (data.torrents || []).map((t) => ({
            title: t.title,
            magnet: t.magnet,
            seeds: t.seeds,
            size: t.size,
            quality: t.quality || null,
            provider: "Torrents-API",
          })),
      },
      {
        name: "EZTV",
        url: (query) => {
          // Ensure query is a string IMDB ID
          const imdbId = typeof query === "string" ? query : query.imdbId || "";
          return `https://eztv.re/api/get-torrents?imdb_id=${imdbId}&limit=50`;
        },
        parser: (data) =>
          (data.torrents || []).map((t) => ({
            title: t.title,
            magnet: t.magnet_url,
            seeds: t.seeds,
            size: t.size_bytes,
            quality: this.detectQuality(t.title),
            provider: "EZTV",
          })),
      },
    ];
  }

  // Optional: simple quality detection for EZTV
  detectQuality(title) {
    const map = [
      { q: "1080p", regex: /1080p/i },
      { q: "720p", regex: /720p/i },
      { q: "480p", regex: /480p/i },
    ];
    for (const { q, regex } of map) if (regex.test(title)) return q;
    return "Unknown";
  }

  async search(query, type) {
    const results = [];

    for (const api of this.apis) {
      try {
        // EZTV requires imdbId string, others use query text
        const param =
          api.name === "EZTV" && typeof query !== "string"
            ? query.imdbId
            : query;
        const url = api.url(param);

        const response = await fetch(url);
        const data = await response.json();
        results.push(...api.parser(data));
      } catch (err) {
        console.warn(`Failed to search ${api.name}:`, err.message);
      }
    }

    return results;
  }
}

export default new ExternalAPIService();
