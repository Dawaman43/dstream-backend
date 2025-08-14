import express from "express";
import downloadController from "../controllers/download.controller.js";
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

// -----------------------
// Health Check
// -----------------------
router.get("/health", (req, res) =>
  res.json({ status: "healthy", timestamp: new Date() })
);

// -----------------------
// Download Routes
// -----------------------
router.post("/download", downloadController.startDownload);
router.get("/downloads", downloadController.getDownloadList);

// -----------------------
// Streaming Routes
// -----------------------
router.get("/stream", stream);

// -----------------------
// Dynamic Media Routes
// -----------------------
const mediaTypes = [
  { path: "movies", type: "movie" },
  { path: "series", type: "tv" },
  { path: "anime", type: "anime" },
];

mediaTypes.forEach(({ path, type }) => {
  router.get(`/${path}/search`, searchMedia(type));
  router.get(`/${path}/popular`, getPopular(type));
  router.get(`/${path}/top-rated`, getTopRated(type));

  if (type !== "anime") {
    router.get(`/${path}/upcoming`, getUpcoming(type));
  }

  router.get(`/${path}/genres/:genreId`, getByGenre(type));
  router.get(`/${path}/:tmdbId`, getMediaDetails(type));
});

export default router;
