import { Router, type IRouter } from "express";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { db, storiesTable, usersTable, profilesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const STORY_TTL_HOURS = 24;
const SPOTIFY_URL_RE = /^https?:\/\/open\.spotify\.com\/(track|album|playlist|episode)\/[A-Za-z0-9]+/i;

function normalizeSpotify(input: unknown): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (!SPOTIFY_URL_RE.test(s)) return null;
  // strip query/fragment
  return s.split("?")[0].split("#")[0];
}

// GET active stories for a username (public)
router.get("/users/:username/stories", async (req, res): Promise<void> => {
  const username = String(req.params.username || "").toLowerCase();
  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }
  const rows = await db
    .select({
      id: storiesTable.id,
      mediaUrl: storiesTable.mediaUrl,
      mediaType: storiesTable.mediaType,
      caption: storiesTable.caption,
      musicSpotifyUrl: storiesTable.musicSpotifyUrl,
      viewsCount: storiesTable.viewsCount,
      expiresAt: storiesTable.expiresAt,
      createdAt: storiesTable.createdAt,
    })
    .from(storiesTable)
    .innerJoin(usersTable, eq(usersTable.id, storiesTable.userId))
    .where(
      and(
        sql`lower(${usersTable.username}) = ${username}`,
        gt(storiesTable.expiresAt, new Date()),
      ),
    )
    .orderBy(storiesTable.createdAt);
  res.json({ stories: rows });
});

// POST create story (auth) — body: { mediaUrl, mediaType, caption?, musicSpotifyUrl? }
router.post("/stories", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const body: any = req.body || {};
  const mediaUrl = String(body.mediaUrl || "").trim();
  const mediaType = String(body.mediaType || "image").trim();
  const caption = body.caption ? String(body.caption).trim().slice(0, 200) : null;
  const musicSpotifyUrl = normalizeSpotify(body.musicSpotifyUrl);

  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  if (!["image", "video", "gif"].includes(mediaType)) {
    res.status(400).json({ error: "invalid mediaType" });
    return;
  }
  if (body.musicSpotifyUrl && !musicSpotifyUrl) {
    res.status(400).json({ error: "musicSpotifyUrl must be a valid Spotify track/album/playlist URL" });
    return;
  }

  const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

  const [story] = await db
    .insert(storiesTable)
    .values({ userId, mediaUrl, mediaType, caption, musicSpotifyUrl, expiresAt })
    .returning();

  res.status(201).json({ story });
});

// POST register a view on a story (public, every open counts) — returns new viewsCount
router.post("/stories/:id/view", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const [updated] = await db
    .update(storiesTable)
    .set({ viewsCount: sql`${storiesTable.viewsCount} + 1` })
    .where(and(eq(storiesTable.id, id), gt(storiesTable.expiresAt, new Date())))
    .returning({ id: storiesTable.id, viewsCount: storiesTable.viewsCount });
  if (!updated) {
    res.status(404).json({ error: "story not found or expired" });
    return;
  }
  res.json({ id: updated.id, viewsCount: updated.viewsCount });
});

// DELETE story by id (auth, owner only)
router.delete("/stories/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const [existing] = await db.select().from(storiesTable).where(eq(storiesTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  await db.delete(storiesTable).where(eq(storiesTable.id, id));
  res.json({ ok: true });
});

// GET own active stories (auth) — for dashboard
router.get("/me/stories", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(storiesTable)
    .where(and(eq(storiesTable.userId, userId), gt(storiesTable.expiresAt, new Date())))
    .orderBy(desc(storiesTable.createdAt));
  res.json({ stories: rows });
});

// Touch profilesTable import so unused-vars rule is happy if linter strict.
void profilesTable;

export default router;
