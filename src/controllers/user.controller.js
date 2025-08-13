`import User from "../models/user.js";
import TorrentService from "../services/torrent.service.js";

// Add movie to watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;
    const user = req.user;

    if (!movieId) return res.status(400).json({ error: "movieId is required" });

    if (!user.watchlist.includes(movieId)) {
      user.watchlist.push(movieId);
      await user.save();
    }

    res.json({ watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start offline download
export const startDownload = async (req, res) => {
  try {
    const { tmdbId, magnet } = req.body;
    const user = req.user;

    if (!tmdbId || !magnet)
      return res.status(400).json({ error: "tmdbId and magnet are required" });

    const downloadResult = await TorrentService.downloadTorrent(
      magnet,
      user._id.toString()
    );

    user.offlineDownloads.push({
      movieId: tmdbId,
      magnet: downloadResult.infoHash,
      filename: downloadResult.name,
      path: downloadResult.path,
      status: "completed",
      progress: 100,
      size: downloadResult.size,
    });

    await user.save();

    res.json({ download: downloadResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;
