import express from "express";
import webtorrent from "webtorrent";
const router = express.Router();
const client = new webtorrent();

router.get("/stream", (req, res) => {
  const { magnet } = req.body;
  if (!magnet) return res.status(400).send("Magnet link required");

  client.add(magnet, { path: "./downloads" }, (torrent) => {
    const file = torrent.files.find((f) => f.name.endsWith(".mp4"));
    if (!file) return res.status(404).send("No mp4 found");

    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : file.length - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${file.length}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      file.createReadStream({ start, end }).pipe(res);
    } else {
      res.setHeader("Content-Type", "video/mp4");
      file.createReadStream().pipe(res);
    }
  });
});

module.exports = router;
