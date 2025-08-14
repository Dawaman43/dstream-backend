import fetch from "node-fetch";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

export const fetchTMDBDetails = async (type, tmdbId) => {
  const endpoint = type === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  url.searchParams.append("language", "en-US");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
  const data = await res.json();
  return data;
};
