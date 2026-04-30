import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, mediaGalleryTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const MAX_ITEMS_PER_USER = 60;

// GET gallery for a username (public)
router.get("/users/:username/gallery", async (req, res): Promise<void> => {
  const username = String(req.params.username || "").toLowerCase();
  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }
  const rows = await db
    .select({
      id: mediaGalleryTable.id,
      mediaUrl: mediaGalleryTable.mediaUrl,
      mediaType: mediaGalleryTable.mediaType,
      caption: mediaGalleryTable.caption,
      sortOrder: mediaGalleryTable.sortOrder,
      createdAt: mediaGalleryTable.createdAt,
    })
    .from(mediaGalleryTable)
    .innerJoin(usersTable, eq(usersTable.id, mediaGalleryTable.userId))
    .where(sql`lower(${usersTable.username}) = ${username}`)
    .orderBy(mediaGalleryTable.sortOrder, mediaGalleryTable.id);
  res.json({ items: rows });
});

// GET own gallery (auth) — for dashboard
router.get("/me/gallery", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(mediaGalleryTable)
    .where(eq(mediaGalleryTable.userId, userId))
    .orderBy(mediaGalleryTable.sortOrder, mediaGalleryTable.id);
  res.json({ items: rows });
});

// POST add item (auth) — body: { mediaUrl, mediaType, caption? }
router.post("/profile/gallery", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const mediaUrl = String((req.body as any)?.mediaUrl || "").trim();
  const mediaType = String((req.body as any)?.mediaType || "image").trim();
  const caption = (req.body as any)?.caption ? String((req.body as any).caption).trim().slice(0, 200) : null;

  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  if (!["image", "video", "gif"].includes(mediaType)) {
    res.status(400).json({ error: "invalid mediaType" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaGalleryTable)
    .where(eq(mediaGalleryTable.userId, userId));

  if ((count ?? 0) >= MAX_ITEMS_PER_USER) {
    res.status(400).json({ error: `max ${MAX_ITEMS_PER_USER} items` });
    return;
  }

  const sortOrder = (count ?? 0);
  const [item] = await db
    .insert(mediaGalleryTable)
    .values({ userId, mediaUrl, mediaType, caption, sortOrder })
    .returning();

  res.status(201).json({ item });
});

// DELETE item (auth, owner)
router.delete("/profile/gallery/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const [existing] = await db.select().from(mediaGalleryTable).where(eq(mediaGalleryTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  await db.delete(mediaGalleryTable).where(eq(mediaGalleryTable.id, id));
  res.json({ ok: true });
});

// PATCH item — update sortOrder or caption (auth, owner)
router.patch("/profile/gallery/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const [existing] = await db.select().from(mediaGalleryTable).where(eq(mediaGalleryTable.id, id)).limit(1);
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const updates: Partial<typeof mediaGalleryTable.$inferInsert> = {};
  const body: any = req.body || {};
  if (body.sortOrder != null && Number.isFinite(Number(body.sortOrder))) {
    updates.sortOrder = Number(body.sortOrder);
  }
  if (typeof body.caption === "string") {
    updates.caption = body.caption.trim().slice(0, 200);
  }
  if (Object.keys(updates).length === 0) {
    res.json({ item: existing });
    return;
  }
  const [item] = await db
    .update(mediaGalleryTable)
    .set(updates)
    .where(and(eq(mediaGalleryTable.id, id), eq(mediaGalleryTable.userId, userId)))
    .returning();
  res.json({ item });
});

// POST reorder — body: { ids: number[] } (auth, owner) — sets sortOrder by array position
router.post("/profile/gallery/reorder", requireAuth, async (req, res): Promise<void> => {
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
        .update(mediaGalleryTable)
        .set({ sortOrder: i })
        .where(and(eq(mediaGalleryTable.id, numericIds[i]!), eq(mediaGalleryTable.userId, userId)));
    }
  });
  res.json({ ok: true });
});

export default router;
