import express from "express";
import "dotenv/config";
import { fetchAlbum, insertAlbum } from "./notion.js";
import cors from "cors";

process.on("uncaughtException", (err) =>
  console.error("UNCAUGHT EXCEPTION:", err)
);
process.on("unhandledRejection", (err) =>
  console.error("UNHANDLED REJECTION:", err)
);

console.log("Starting Node process...");

console.log("Starting server...");

["NOTION_TOKEN", "NOTION_DATABASE_ID", "DISCOGS_TOKEN"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`⚠️ Missing environment variable: ${key}`);
  } else {
    console.log(`✅ ${key} is set`);
  }
});

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve frontend HTML
app.use(cors({ origin: "*" }));


app.get("/health", (req, res) => res.send("OK"));

// Endpoint to add album
app.post("/add-album", async (req, res) => {
  try {
    const { albumName } = req.body;
    if (!albumName)
      return res
        .status(400)
        .json({ success: false, error: "Album name is required" });

    const album = await fetchAlbum(albumName);
    await insertAlbum(album);

    res.json({ success: true, album });
  } catch (err) {
    console.error("Error in /add-album:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
try {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server listening on port ${PORT}`)
  );
} catch (err) {
  console.error("Failed to start server:", err);
}
