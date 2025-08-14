import express from "express";
import * as UserController from "../controllers/user.controller.js";
import {
  searchMedia,
  getMediaDetails,
  getPopular,
  getTopRated,
  getUpcoming,
  stream,
} from "../controllers/media.controller.js";

const router = express.Router();

// Movie routes
router.get("/movies/search", searchMedia("movie"));
router.get("/movies/:tmdbId", getMediaDetails("movie"));
router.get("/movies/popular", getPopular("movie"));
router.get("/movies/top-rated", getTopRated("movie"));
router.get("/movies/upcoming", getUpcoming("movie"));

// Series routes
router.get("/series/search", searchMedia("tv"));
router.get("/series/:tmdbId", getMediaDetails("tv"));
router.get("/series/popular", getPopular("tv"));
router.get("/series/top-rated", getTopRated("tv"));
router.get("/series/upcoming", getUpcoming("tv"));

// Anime routes
router.get("/anime/search", searchMedia("anime"));
router.get("/anime/:tmdbId", getMediaDetails("anime"));
router.get("/anime/popular", getPopular("anime"));
router.get("/anime/top-rated", getTopRated("anime"));

// Stream route (all types)
router.get("/stream", stream);

// User routes (session-based, no auth)
router.post("/watchlist", UserController.addToWatchlist);
router.get("/watchlist", UserController.getWatchlist);
router.post("/download", UserController.startDownload);
router.get("/downloads", UserController.getDownloadList);

router.get("/movies/genres/:genreId", getByGenre("movie"));
router.get("/series/genres/:genreId", getByGenre("tv"));
router.get("/anime/genres/:genreId", getByGenre("anime"));
export default router;
