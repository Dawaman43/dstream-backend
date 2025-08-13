import Movie from "../models/movie.js";
import TorrentService from "../services/torrent.service.js";
import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Search movies in DB, TMDB, or Torrent providers
export const search = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query is required" });

    // 1️⃣ Check DB first
    let dbResults = await Movie.find({ $text: { $search: query } })
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    if (dbResults.length > 0) return res.json(dbResults);

    // 2️⃣ Fallback to TMDB
    const tmdbRes = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query, language: "en-US" },
    });

    const tmdbMovies = tmdbRes.data.results;

    // 3️⃣ Fallback to Torrent
    const torrents = await TorrentService.searchMovies(query);

    // Merge TMDB movies with torrent info if available
    const merged = tmdbMovies.map((movie) => {
      const torrentMatch = torrents.filter((t) =>
        t.title.toLowerCase().includes(movie.title.toLowerCase())
      );
      return {
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: movie.poster_path,
        backdrop: movie.backdrop_path,
        release_date: movie.release_date,
        torrents: torrentMatch,
      };
    });

    res.json(merged);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get movie details by TMDB id
export const getMovieDetails = async (req, res) => {
  try {
    const { tmdbId } = req.params;

    let movie = await Movie.findOne({ tmdbId });

    if (!movie) {
      // Fetch from TMDB
      const tmdbRes = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: { api_key: TMDB_API_KEY, language: "en-US" },
      });

      const tmdbMovie = tmdbRes.data;

      // Optional: Search torrents for the title
      const torrents = await TorrentService.searchMovies(tmdbMovie.title);

      movie = {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview,
        poster: tmdbMovie.poster_path,
        backdrop: tmdbMovie.backdrop_path,
        release_date: tmdbMovie.release_date,
        torrents,
      };
    }

    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Stream via magnet link
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

export const popular = async (req, res) => {
  try {
    const tmdbRes = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, language: "en-US" },
    });

    const tmdbMovies = tmdbRes.data.results;

    // Merge torrents
    const results = await Promise.all(
      tmdbMovies.map(async (movie) => {
        const torrents = await TorrentService.searchMovies(movie.title);
        return {
          tmdbId: movie.id,
          title: movie.title,
          overview: movie.overview,
          poster: movie.poster_path,
          backdrop: movie.backdrop_path,
          release_date: movie.release_date,
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
