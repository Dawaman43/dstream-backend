import Media from "../models/media.js";
import TorrentService from "../services/torrent.service.js";
import path from "path";
import fs from "fs";

class DownloadController {
  async getDownloadList(req, res) {
    try {
      const downloads = req.session.downloads || [];
      const mediaIds = downloads.map((d) => d.mediaId);
      const media = await Media.find({ tmdbId: { $in: mediaIds } });
      res.json(
        downloads.map((d) => ({
          ...d,
          media: media.find((m) => m.tmdbId === d.mediaId),
        }))
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async startDownload(req, res) {
    try {
      const { tmdbId, quality } = req.body;
      const media = await Media.findOne({ tmdbId });
      if (!media) return res.status(404).json({ error: "Media not found" });

      const torrent = media.torrents.find(
        (t) => t.quality.includes(quality) && t.seeds > 0
      );
      if (!torrent)
        return res
          .status(404)
          .json({ error: "Torrent not available for selected quality" });

      const sessionId = req.sessionID;
      const downloadDir = path.join(__dirname, `../../downloads/${sessionId}`);
      if (!fs.existsSync(downloadDir))
        fs.mkdirSync(downloadDir, { recursive: true });

      const download = {
        mediaId: tmdbId,
        magnet: torrent.magnet,
        status: "downloading",
        progress: 0,
        quality: torrent.quality,
        size: torrent.size,
        startedAt: new Date(),
      };

      req.session.downloads = req.session.downloads || [];
      req.session.downloads.push(download);

      TorrentService.downloadTorrent(torrent.magnet, sessionId)
        .then((result) => {
          const index = req.session.downloads.findIndex(
            (d) => d.magnet === torrent.magnet
          );
          if (index !== -1) {
            req.session.downloads[index] = {
              ...req.session.downloads[index],
              status: "completed",
              path: result.path,
              progress: 100,
              completedAt: new Date(),
            };
          }
        })
        .catch((error) => {
          const index = req.session.downloads.findIndex(
            (d) => d.magnet === torrent.magnet
          );
          if (index !== -1) {
            req.session.downloads[index] = {
              ...req.session.downloads[index],
              status: "error",
              error: error.message,
            };
          }
        });

      res.json(download);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DownloadController();
