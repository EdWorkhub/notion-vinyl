import "dotenv/config";
import { Client } from "@notionhq/client";
import fetch from "node-fetch";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;
const discogsToken = process.env.DISCOGS_TOKEN;

/**
 * Fetch album info from Discogs
 */
export async function fetchAlbum(albumName) {
  if (!albumName) throw new Error("Album name required");

  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(albumName)}&type=release&token=${discogsToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Discogs API error: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error(`No album found for "${albumName}"`);

  const album = data.results[0];

  const title = album.title || "Unknown Title";
  const artist =
    album.artist ||
    (album.artists && album.artists.length ? album.artists.map(a => a.name).join(", ") : "Unknown Artist");
  const year = album.year ? Number(album.year) : null;
  const genre = Array.isArray(album.genre) ? album.genre : [];
  const cover = album.cover_image || null;

  return { title, artist, year, genre, cover };
}

/**
 * Insert album into Notion
 */
export async function insertAlbum(album) {
  if (!album || !album.title) throw new Error("Invalid album object");

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: album.title } }] },
      Artist: { rich_text: [{ text: { content: album.artist } }] },
      Year: { number: album.year },
      Genre: { multi_select: album.genre.map(g => ({ name: g })) },
    },
    cover: album.cover
      ? { type: "external", external: { url: album.cover } }
      : undefined,
  });
}
