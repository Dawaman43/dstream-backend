import express from "express";
import authMiddleware from "../middleware/auth.js";

import * as AuthController from "../controllers/auth.controller.js";
import * as UserController from "../controllers/user.controller.js";
import * as MovieController from "../controllers/movie.controller.js";

const router = express.Router();

// Auth routes
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/refresh", AuthController.refreshToken);

// Movie routes
router.get("/movies/popular", MovieController.popular);
router.get("/movies/search", MovieController.search);
router.get("/movies/:tmdbId", MovieController.getMovieDetails);
router.get("/stream", MovieController.stream);

// Protected routes
router.use();
router.post("/watchlist", UserController.addToWatchlist);
router.post("/download", UserController.startDownload);

export default router;
authMiddleware;
