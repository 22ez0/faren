import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ConnectMusicBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function fetchLastfmNowPlaying(username: string): Promise<{
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  externalUrl?: string;
}> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return { isPlaying: false };

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return { isPlaying: false };
    const data = await res.json() as any;
    const tracks = data?.recenttracks?.track;
    if (!tracks || !tracks.length) return { isPlaying: false };

    const track = Array.isArray(tracks) ? tracks[0] : tracks;
    const isPlaying = track?.["@attr"]?.nowplaying === "true";

    const images = track?.image as Array<{ "#text": string; size: string }> | undefined;
    const albumArt = images?.find(i => i.size === "extralarge")?.["#text"] ||
      images?.find(i => i.size === "large")?.["#text"] || undefined;

    return {
      isPlaying,
      title: track?.name || undefined,
      artist: track?.artist?.["#text"] || undefined,
      album: track?.album?.["#text"] || undefined,
      albumArt: albumArt && albumArt !== "" ? albumArt : undefined,
      externalUrl: track?.url || undefined,
    };
  } catch {
    return { isPlaying: false };
  }
}

router.get("/music/now-playing", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  if (!profile || profile.musicConnected !== "true") {
    res.json({ isPlaying: false });
    return;
  }

  if (profile.musicService === "lastfm" && profile.musicUsername) {
    const nowPlaying = await fetchLastfmNowPlaying(profile.musicUsername);
    res.json(nowPlaying);
    return;
  }

  res.json({ isPlaying: false });
});

router.post("/music/connect", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = ConnectMusicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.service === "lastfm" && parsed.data.username) {
    const test = await fetchLastfmNowPlaying(parsed.data.username);
    if (!process.env.LASTFM_API_KEY) {
      res.status(503).json({ error: "Last.fm API key not configured on the server." });
      return;
    }
    void test;
  }

  await db.update(profilesTable).set({
    musicConnected: "true",
    musicService: parsed.data.service,
    musicToken: parsed.data.token || null,
    musicUsername: parsed.data.username ?? null,
  }).where(eq(profilesTable.userId, userId));

  res.json({ success: true, message: "Music connected" });
});

router.delete("/music/disconnect", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await db.update(profilesTable).set({
    musicConnected: "false",
    musicService: null,
    musicToken: null,
    musicUsername: null,
  }).where(eq(profilesTable.userId, userId));
  res.sendStatus(204);
});

export { fetchLastfmNowPlaying };
export default router;
