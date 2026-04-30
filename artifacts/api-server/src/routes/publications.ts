import { Router, type IRouter } from "express";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import {
  db,
  profilePublicationsTable,
  publicationMediaTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const MAX_PUBLICATIONS_PER_USER = 3;
const MAX_MEDIA_PER_PUBLICATION = 3;
const VALID_MEDIA_TYPES = ["image", "video", "gif"] as const;
const SPOTIFY_URL_RE = /^https?:\/\/open\.spotify\.com\/(track|album|playlist|episode)\/[A-Za-z0-9]+/i;

function normalizeSpotify(input: unknown): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (!SPOTIFY_URL_RE.test(s)) return null;
  return s.split("?")[0].split("#")[0];
}

type MediaInput = { url: string; type: string };

function parseMedia(raw: unknown): { ok: true; media: MediaInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "media[] required (1-3 items)" };
  }
  if (raw.length > MAX_MEDIA_PER_PUBLICATION) {
    return { ok: false, error: `max ${MAX_MEDIA_PER_PUBLICATION} media items per publication` };
  }
  const out: MediaInput[] = [];
  for (const item of raw) {
    const url = String((item as any)?.url || (item as any)?.mediaUrl || "").trim();
    const type = String((item as any)?.type || (item as any)?.mediaType || "image").trim();
    if (!url) return { ok: false, error: "every media item needs a url" };
    if (!VALID_MEDIA_TYPES.includes(type as any)) {
      return { ok: false, error: `invalid mediaType '${type}'` };
    }
    out.push({ url, type });
  }
  return { ok: true, media: out };
}

async function loadPublicationsForUser(userId: number) {
  const pubs = await db
    .select({
      id: profilePublicationsTable.id,
      caption: profilePublicationsTable.caption,
      musicSpotifyUrl: profilePublicationsTable.musicSpotifyUrl,
      sortOrder: profilePublicationsTable.sortOrder,
      createdAt: profilePublicationsTable.createdAt,
    })
    .from(profilePublicationsTable)
    .where(eq(profilePublicationsTable.userId, userId))
    .orderBy(asc(profilePublicationsTable.sortOrder), asc(profilePublicationsTable.id));

  if (pubs.length === 0) return [];

  const ids = pubs.map((p) => p.id);
  const media = await db
    .select({
      id: publicationMediaTable.id,
      publicationId: publicationMediaTable.publicationId,
      mediaUrl: publicationMediaTable.mediaUrl,
      mediaType: publicationMediaTable.mediaType,
      sortOrder: publicationMediaTable.sortOrder,
    })
    .from(publicationMediaTable)
    .where(inArray(publicationMediaTable.publicationId, ids))
    .orderBy(asc(publicationMediaTable.sortOrder), asc(publicationMediaTable.id));

  const byPub = new Map<number, typeof media>();
  for (const m of media) {
    const arr = byPub.get(m.publicationId) ?? [];
    arr.push(m);
    byPub.set(m.publicationId, arr);
  }

  return pubs.map((p) => ({ ...p, media: byPub.get(p.id) ?? [] }));
}

// GET publications for a username (public)
router.get("/users/:username/publications", async (req, res): Promise<void> => {
  const username = String(req.params.username || "").toLowerCase();
  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = ${username}`)
    .limit(1);
  if (!user) {
    res.json({ publications: [] });
    return;
  }
  const publications = await loadPublicationsForUser(user.id);
  res.json({ publications });
});

// GET own publications (auth)
router.get("/me/publications", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const publications = await loadPublicationsForUser(userId);
  res.json({ publications });
});

// POST create publication (auth)
// body: { caption?, musicSpotifyUrl?, media: [{ url, type }] (1-3 items) }
router.post("/profile/publications", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const body: any = req.body || {};
  const caption = body.caption ? String(body.caption).trim().slice(0, 300) : null;
  const musicSpotifyUrl = normalizeSpotify(body.musicSpotifyUrl);
  if (body.musicSpotifyUrl && !musicSpotifyUrl) {
    res.status(400).json({ error: "musicSpotifyUrl must be a valid Spotify URL" });
    return;
  }

  const parsed = parseMedia(body.media);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profilePublicationsTable)
    .where(eq(profilePublicationsTable.userId, userId));

  if ((count ?? 0) >= MAX_PUBLICATIONS_PER_USER) {
    res.status(400).json({ error: `max ${MAX_PUBLICATIONS_PER_USER} publications` });
    return;
  }

  const sortOrder = count ?? 0;

  const result = await db.transaction(async (tx) => {
    const [pub] = await tx
      .insert(profilePublicationsTable)
      .values({ userId, caption, musicSpotifyUrl, sortOrder })
      .returning();
    if (!pub) throw new Error("failed to insert publication");

    const mediaRows = parsed.media.map((m, i) => ({
      publicationId: pub.id,
      mediaUrl: m.url,
      mediaType: m.type,
      sortOrder: i,
    }));
    const insertedMedia = await tx
      .insert(publicationMediaTable)
      .values(mediaRows)
      .returning();
    return { pub, media: insertedMedia };
  });

  res.status(201).json({
    publication: { ...result.pub, media: result.media },
  });
});

// DELETE publication (auth, owner)
router.delete("/profile/publications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const [existing] = await db
    .select()
    .from(profilePublicationsTable)
    .where(eq(profilePublicationsTable.id, id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  await db.delete(profilePublicationsTable).where(eq(profilePublicationsTable.id, id));
  res.json({ ok: true });
});

// PATCH reorder publications — body: { ids: number[] } (auth, owner)
router.post("/profile/publications/reorder", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const ids: unknown = (req.body as any)?.ids;
  if (!Array.isArray(ids) || !ids.every((x) => Number.isFinite(Number(x)))) {
    res.status(400).json({ error: "ids[] required" });
    return;
  }
  const numericIds = ids.map((x) => Number(x));
  await db.transaction(async (tx) => {
    for (let i = 0; i < numericIds.length; i++) {
      await tx
        .update(profilePublicationsTable)
        .set({ sortOrder: i })
        .where(
          and(
            eq(profilePublicationsTable.id, numericIds[i]!),
            eq(profilePublicationsTable.userId, userId),
          ),
        );
    }
  });
  res.json({ ok: true });
});

export default router;
