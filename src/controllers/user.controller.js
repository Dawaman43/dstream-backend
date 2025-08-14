import Media from "../models/media.js";
import TorrentService from "../services/torrent.service.js";

// Add to watchlist (session-based)
export const addToWatchlist = async (req, res) => {
  try {
    const { mediaId } = req.body;
    if (!mediaId) return res.status(400).json({ error: "mediaId is required" });

    // Initialize session watchlist if not exists
    req.session.watchlist = req.session.watchlist || [];
    if (!req.session.watchlist.includes(mediaId)) {
      req.session.watchlist.push(mediaId);
    }

    res.json({ watchlist: req.session.watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get watchlist
export const getWatchlist = async (req, res) => {
  try {
    const watchlist = req.session.watchlist || [];
    const media = await Media.find({ tmdbId: { $in: watchlist } });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start download (session-based)
export const startDownload = async (req, res) => {
  try {
    const { tmdbId, magnet } = req.body;
    if (!tmdbId || !magnet)
      return res.status(400).json({ error: "tmdbId and magnet are required" });

    // Use session ID as download directory
    const sessionId = req.sessionID;
    const downloadResult = await TorrentService.downloadTorrent(
      magnet,
      sessionId
    );

    // Store download in session
    req.session.downloads = req.session.downloads || [];
    req.session.downloads.push({
      mediaId: tmdbId,
      magnet: downloadResult.infoHash,
      filename: downloadResult.name,
      path: downloadResult.path,
      status: "completed",
      progress: 100,
      size: downloadResult.size,
    });

    res.json({ download: downloadResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get download list
export const getDownloadList = async (req, res) => {
  try {
    const downloads = req.session.downloads || [];
    res.json(downloads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
