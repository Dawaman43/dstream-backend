import Media from "../models/media.js";
import TorrentService from "../services/torrent.service.js";
import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const tmdbEndpoints = {
  movie: {
    search: "/search/movie",
    details: "/movie",
    popular: "/movie/popular",
    top_rated: "/movie/top_rated",
    upcoming: "/movie/upcoming",
  },
  tv: {
    search: "/search/tv",
    details: "/tv",
    popular: "/tv/popular",
    top_rated: "/tv/top_rated",
    upcoming: "/tv/on_the_air",
  },
  anime: {
    search: "/search/tv",
    details: "/tv",
    popular: "/discover/tv",
    top_rated: "/tv/top_rated",
  }, // Anime via genre 16
};

// Shared search function
export const searchMedia = (type) => async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query is required" });

    // Check DB first
    let dbResults = await Media.find({ $text: { $search: query }, type })
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    if (dbResults.length > 0) return res.json(dbResults);

    // Fallback to TMDB
    const params = { api_key: TMDB_API_KEY, language: "en-US", query };
    if (type === "anime") params["with_genres"] = 16; // Animation genre
    const tmdbRes = await axios.get(
      `${TMDB_BASE_URL}${tmdbEndpoints[type].search}`,
      { params }
    );
    const tmdbMedia = tmdbRes.data.results;

    // Search torrents
    const torrents = await TorrentService.searchMedia(
      query,
      type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
    );

    // Merge results
    const merged = tmdbMedia.map((item) => ({
      tmdbId: item.id,
      title: item.title || item.name,
      overview: item.overview,
      poster: item.poster_path,
      backdrop: item.backdrop_path,
      release_date: item.release_date || item.first_air_date,
      type,
      torrents: torrents.filter((t) =>
        t.title
          .toLowerCase()
          .includes(item.title?.toLowerCase() || item.name.toLowerCase())
      ),
    }));

    res.json(merged);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Shared details function
export const getMediaDetails = (type) => async (req, res) => {
  try {
    const { tmdbId } = req.params;
    let media = await Media.findOne({ tmdbId, type });

    if (!media) {
      const tmdbRes = await axios.get(
        `${TMDB_BASE_URL}${tmdbEndpoints[type].details}/${tmdbId}`,
        {
          params: { api_key: TMDB_API_KEY, language: "en-US" },
        }
      );
      const tmdbMedia = tmdbRes.data;
      const torrents = await TorrentService.searchMedia(
        tmdbMedia.title || tmdbMedia.name,
        type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
      );

      media = {
        tmdbId: tmdbMedia.id,
        title: tmdbMedia.title || tmdbMedia.name,
        overview: tmdbMedia.overview,
        poster: tmdbMedia.poster_path,
        backdrop: tmdbMedia.backdrop_path,
        release_date: tmdbMedia.release_date || tmdbMedia.first_air_date,
        type,
        genres: tmdbMedia.genres.map((g) => g.name),
        runtime: tmdbMedia.runtime || tmdbMedia.episode_run_time?.[0],
        seasons: tmdbMedia.number_of_seasons,
        episodes: tmdbMedia.seasons?.flatMap((s) =>
          s.episodes?.map((e) => ({
            season: s.season_number,
            episode: e.episode_number,
            title: e.name,
            overview: e.overview,
            still: e.still_path,
          }))
        ),
        torrents,
      };
      // Optionally save to DB
      await new Media(media).save();
    }

    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Shared popular, top-rated, upcoming
export const getPopular = (type) => async (req, res) => {
  try {
    const tmdbRes = await axios.get(
      `${TMDB_BASE_URL}${tmdbEndpoints[type].popular}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          ...(type === "anime" ? { with_genres: 16 } : {}),
        },
      }
    );
    const tmdbMedia = tmdbRes.data.results;

    const results = await Promise.all(
      tmdbMedia.map(async (item) => {
        const torrents = await TorrentService.searchMedia(
          item.title || item.name,
          type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
        );
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path,
          backdrop: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          type,
          torrents,
        };
      })
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getTopRated = (type) => async (req, res) => {
  try {
    const tmdbRes = await axios.get(
      `${TMDB_BASE_URL}${tmdbEndpoints[type].top_rated}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          ...(type === "anime" ? { with_genres: 16 } : {}),
        },
      }
    );
    const tmdbMedia = tmdbRes.data.results;

    const results = await Promise.all(
      tmdbMedia.map(async (item) => {
        const torrents = await TorrentService.searchMedia(
          item.title || item.name,
          type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
        );
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path,
          backdrop: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          type,
          torrents,
        };
      })
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getUpcoming = (type) => async (req, res) => {
  try {
    const tmdbRes = await axios.get(
      `${TMDB_BASE_URL}${tmdbEndpoints[type].upcoming}`,
      {
        params: { api_key: TMDB_API_KEY, language: "en-US" },
      }
    );
    const tmdbMedia = tmdbRes.data.results;

    const results = await Promise.all(
      tmdbMedia.map(async (item) => {
        const torrents = await TorrentService.searchMedia(
          item.title || item.name,
          type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
        );
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path,
          backdrop: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          type,
          torrents,
        };
      })
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Stream
export const stream = async (req, res) => {
  try {
    const { magnet } = req.query;
    if (!magnet)
      return res.status(400).json({ error: "Magnet link is required" });
    const streamResult = await TorrentService.streamTorrent(magnet);
    res.json(streamResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getByGenre = (type) => async (req, res) => {
  try {
    const { genreId } = req.params;
    const tmdbRes = await axios.get(
      `${TMDB_BASE_URL}/discover/${type === "movie" ? "movie" : "tv"}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          with_genres: type === "anime" ? "16," + genreId : genreId,
        },
      }
    );
    const tmdbMedia = tmdbRes.data.results;
    const results = await Promise.all(
      tmdbMedia.map(async (item) => {
        const torrents = await TorrentService.searchMedia(
          item.title || item.name,
          type === "tv" ? "TV" : type === "anime" ? "Anime" : "Movies"
        );
        return {
          tmdbId: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path,
          backdrop: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          type,
          torrents,
        };
      })
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
