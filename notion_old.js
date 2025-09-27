import "dotenv/config";
import { Client } from "@notionhq/client";
import fetch from "node-fetch";

// Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;
const discogsKey = process.env.DISCOGS_KEY;
const discogsSecret = process.env.DISCOGS_SECRET;
const discogsToken = process.env.DISCOGS_TOKEN;

async function fetchAlbum(albumName) {
  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(albumName)}&type=release&token=${discogsToken}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for album: ${albumName}`);
  }

  const album = data.results[0];

  const title = album.title || "Unknown Title";

  let artist = "Unknown Artist";
  if (album.artist) artist = album.artist;
  else if (album.artists && album.artists.length) artist = album.artists.map(a => a.name).join(", ");
  else if (album.label && album.label.length) artist = album.label[0];

  const year = album.year ? Number(album.year) : null;
  const genre = Array.isArray(album.genre) ? album.genre : [];

  // New: cover image
  const cover = album.cover_image || null;

  return { title, artist, year, genre, cover };
}


// Insert album into Notion
async function insertAlbum(album) {
  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: album.title } }]
        },
        Artist: {
          rich_text: [{ text: { content: album.artist } }]
        },
        Year: {
          number: album.year
        },
        Genre: {
          multi_select: album.genre.map(g => ({ name: g }))
        }
      },
      // ← cover goes here at the top level
      cover: album.cover
        ? {
            type: "external",
            external: { url: album.cover }
          }
        : undefined
    });

    console.log(`✅ Added album "${album.title}" to Notion`);
  } catch (err) {
    console.error("Error inserting into Notion:", err);
  }
} (async () => {
  try {
    const albumName = "A Fickle Sonance";
    const album = await fetchAlbum(albumName);
    console.log(album); // Check the cover URL is present
    await insertAlbum(album);
  } catch (err) {
    console.error(err);
  }
})();