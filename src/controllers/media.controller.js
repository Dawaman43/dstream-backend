import fetch from "node-fetch";

// TMDB base
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// Helper to fetch from TMDB
const tmdbFetch = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  url.searchParams.append("language", "en-US");
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
};

// Helper to parse ID
const parseId = (id) => {
  const num = Number(id);
  return isNaN(num) ? null : num;
};

// Search Media
export const searchMedia = (type) => async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query || query.length < 2)
      return res
        .status(400)
        .json({ error: "Query must be at least 2 characters" });

    let data;
    if (type === "anime") {
      // Use TV search and filter by Animation genre
      data = await tmdbFetch("/search/tv", { query, page });
      const results = (data.results || []).filter((item) =>
        item.genre_ids?.includes(16)
      );
      return res.json(results);
    } else {
      const endpoint = type === "movie" ? "/search/movie" : "/search/tv";
      data = await tmdbFetch(endpoint, { query, page });
      return res.json(data.results || []);
    }
  } catch (error) {
    console.error(`[${type}] Search Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get Popular
export const getPopular = (type) => async (req, res) => {
  try {
    const { page = 1 } = req.query;

    if (type === "anime") {
      const data = await tmdbFetch("/tv/popular", { page });
      const results = (data.results || []).filter((item) =>
        item.genre_ids?.includes(16)
      );
      return res.json(results);
    } else {
      const endpoint = type === "movie" ? "/movie/popular" : "/tv/popular";
      const data = await tmdbFetch(endpoint, { page });
      return res.json(data.results || []);
    }
  } catch (error) {
    console.error(`[${type}] Popular Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get Top Rated
export const getTopRated = (type) => async (req, res) => {
  try {
    const { page = 1 } = req.query;

    if (type === "anime") {
      const data = await tmdbFetch("/tv/top_rated", { page });
      const results = (data.results || []).filter((item) =>
        item.genre_ids?.includes(16)
      );
      return res.json(results);
    } else {
      const endpoint = type === "movie" ? "/movie/top_rated" : "/tv/top_rated";
      const data = await tmdbFetch(endpoint, { page });
      return res.json(data.results || []);
    }
  } catch (error) {
    console.error(`[${type}] Top Rated Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get Upcoming
export const getUpcoming = (type) => async (req, res) => {
  try {
    const { page = 1 } = req.query;

    if (type === "anime") {
      // Use "on the air" for anime
      const data = await tmdbFetch("/tv/on_the_air", { page });
      const results = (data.results || []).filter((item) =>
        item.genre_ids?.includes(16)
      );
      return res.json(results);
    } else {
      const endpoint = type === "movie" ? "/movie/upcoming" : "/tv/on_the_air";
      const data = await tmdbFetch(endpoint, { page });
      return res.json(data.results || []);
    }
  } catch (error) {
    console.error(`[${type}] Upcoming Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get By Genre
export const getByGenre = (type) => async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;

    if (type === "anime") {
      // Combine animation genre (16) with requested genre
      const data = await tmdbFetch("/discover/tv", {
        with_genres: `16,${genreId}`,
        page,
      });
      const results = (data.results || []).filter((item) =>
        item.genre_ids?.includes(16)
      );
      return res.json(results);
    } else {
      const endpoint = type === "movie" ? "/discover/movie" : "/discover/tv";
      const data = await tmdbFetch(endpoint, { with_genres: genreId, page });
      return res.json(data.results || []);
    }
  } catch (error) {
    console.error(`[${type}] Genre Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get Media Details
export const getMediaDetails = (type) => async (req, res) => {
  try {
    const tmdbId = parseId(req.params.tmdbId);
    if (!tmdbId) return res.status(400).json({ error: "Invalid TMDB ID" });

    const endpoint = type === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const data = await tmdbFetch(endpoint);
    return res.json(data || {});
  } catch (error) {
    console.error(`[${type}] Details Error:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Stream (stub)
export const stream = async (req, res) => {
  try {
    const { tmdbId, type } = req.query;
    if (!tmdbId) return res.status(400).json({ error: "TMDB ID required" });

    const media = await Media.findOne({ tmdbId, type });
    if (!media?.torrents?.length)
      return res.status(404).json({ error: "Media not found" });

    // Get the best quality torrent (simplified)
    const torrent = media.torrents.reduce((prev, current) =>
      prev.seeds > current.seeds ? prev : current
    );

    // Return the magnet URI for client to handle
    res.json({
      magnet: torrent.magnet,
      infoHash: torrent.infoHash,
      quality: torrent.quality,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
