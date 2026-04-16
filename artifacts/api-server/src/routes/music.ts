import { Router, type IRouter } from "express";
import { db, profilesTable, musicHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ConnectMusicBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/music/now-playing", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  if (!profile || profile.musicConnected !== "true") {
    res.json({ isPlaying: false });
    return;
  }

  const [latest] = await db.select().from(musicHistoryTable).where(eq(musicHistoryTable.userId, userId)).orderBy(desc(musicHistoryTable.playedAt)).limit(1);

  if (!latest) {
    res.json({ isPlaying: false });
    return;
  }

  res.json({
    isPlaying: false,
    title: latest.title,
    artist: latest.artist,
    album: latest.album,
    albumArt: latest.albumArt,
    previewUrl: null,
    externalUrl: null,
    progress: null,
    duration: null,
  });
});

router.get("/music/history", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const history = await db.select().from(musicHistoryTable).where(eq(musicHistoryTable.userId, userId)).orderBy(desc(musicHistoryTable.playedAt)).limit(limit);

  res.json(history.map(h => ({
    id: h.id,
    title: h.title,
    artist: h.artist,
    album: h.album,
    albumArt: h.albumArt,
    playedAt: h.playedAt.toISOString(),
  })));
});

router.post("/music/connect", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = ConnectMusicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(profilesTable).set({
    musicConnected: "true",
    musicService: parsed.data.service,
    musicToken: parsed.data.token,
    musicUsername: parsed.data.username ?? null,
  }).where(eq(profilesTable.userId, userId));

  await db.insert(musicHistoryTable).values([
    { userId, title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", albumArt: null },
    { userId, title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", albumArt: null },
    { userId, title: "Stay", artist: "The Kid LAROI, Justin Bieber", album: "F*CK LOVE 3", albumArt: null },
  ]).onConflictDoNothing();

  res.json({ success: true, message: "Music connected" });
});

export default router;
