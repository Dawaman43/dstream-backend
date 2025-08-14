import express from "express";
import {
  searchMedia,
  getMediaDetails,
  getPopular,
  getTopRated,
  getUpcoming,
  getByGenre,
  stream,
} from "../controllers/media.controller.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Stream endpoint
router.get("/stream", stream);

// Media Type Routes
const setupMediaRoutes = () => {
  const types = [
    { path: "movies", type: "movie" },
    { path: "series", type: "tv" },
    { path: "anime", type: "anime" },
  ];

  types.forEach(({ path, type }) => {
    // Search
    router.get(`/${path}/search`, searchMedia(type));

    // Popular, Top Rated, Upcoming
    router.get(`/${path}/popular`, getPopular(type));
    router.get(`/${path}/top-rated`, getTopRated(type));
    if (type !== "anime") router.get(`/${path}/upcoming`, getUpcoming(type));

    // By Genre
    router.get(`/${path}/genres/:genreId`, getByGenre(type));

    // TMDB Details (must be LAST, after specific routes!)
    router.get(`/${path}/:tmdbId`, getMediaDetails(type));
  });
};

// Setup all media routes
setupMediaRoutes();

export default router;
