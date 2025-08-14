import fetch from "node-fetch";
const API_KEY = "6773cc360bb39023feb460ea5ae28fe2";
const res = await fetch(
  `https://api.themoviedb.org/3/tv/119051?api_key=${API_KEY}&language=en-US&append_to_response=external_ids`
);
console.log(res.status, await res.json());
