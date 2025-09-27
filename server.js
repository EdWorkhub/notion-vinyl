import express from "express";
import "dotenv/config";
import { fetchAlbum, insertAlbum } from "./notion.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve frontend HTML
app.use(cors({ origin: "*" }));

// Endpoint to add album
app.post("/add-album", async (req, res) => {
  try {
    const { albumName } = req.body;
    if (!albumName) return res.status(400).json({ success: false, error: "Album name is required" });

    const album = await fetchAlbum(albumName);
    await insertAlbum(album);

    res.json({ success: true, album });
  } catch (err) {
    console.error("Error in /add-album:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
