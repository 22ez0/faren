import { Router, type IRouter, type Request } from "express";
import { db, usersTable, profilesTable, postsTable, postLikesTable, postCommentsTable, postReportsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
}

router.get("/posts", optionalAuth, async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const userId = req.user?.userId;

  const rows = await db
    .select({
      id: postsTable.id,
      content: postsTable.content,
      mediaUrl: postsTable.mediaUrl,
      mediaType: postsTable.mediaType,
      likesCount: postsTable.likesCount,
      commentsCount: postsTable.commentsCount,
      createdAt: postsTable.createdAt,
      userId: postsTable.userId,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      badges: profilesTable.badges,
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .leftJoin(profilesTable, eq(profilesTable.userId, postsTable.userId))
    .where(eq(postsTable.status, "active"))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  let likedPostIds = new Set<number>();
  if (userId) {
    const likes = await db
      .select({ postId: postLikesTable.postId })
      .from(postLikesTable)
      .where(eq(postLikesTable.userId, userId));
    likedPostIds = new Set(likes.map(l => l.postId));
  }

  res.json(rows.map(p => ({ ...p, hasLiked: likedPostIds.has(p.id) })));
});

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { content, mediaUrl, mediaType } = req.body;

  if (!content?.trim() && !mediaUrl) {
    res.status(400).json({ error: "Post precisa ter conteúdo ou mídia." });
    return;
  }
  if (content && content.length > 2000) {
    res.status(400).json({ error: "Conteúdo muito longo (máx 2000 caracteres)." });
    return;
  }

  const [post] = await db.insert(postsTable).values({
    userId,
    content: content?.trim() || null,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
  }).returning();

  const [user] = await db.select({ username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [profile] = await db.select({ badges: profilesTable.badges }).from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  res.json({ ...post, ...user, badges: profile?.badges ?? [], hasLiked: false });
});

router.delete("/posts/:postId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const postId = Number(req.params.postId);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  if (!post || post.userId !== userId) {
    res.status(403).json({ error: "Sem permissão." });
    return;
  }
  await db.delete(postsTable).where(eq(postsTable.id, postId));
  res.json({ success: true });
});

router.post("/posts/:postId/like", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const postId = Number(req.params.postId);

  const [existing] = await db.select().from(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId))).limit(1);

  if (existing) {
    await db.delete(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId)));
    await db.update(postsTable).set({ likesCount: sql`GREATEST(likes_count - 1, 0)` }).where(eq(postsTable.id, postId));
    res.json({ liked: false });
  } else {
    await db.insert(postLikesTable).values({ postId, userId });
    await db.update(postsTable).set({ likesCount: sql`likes_count + 1` }).where(eq(postsTable.id, postId));
    res.json({ liked: true });
  }
});

router.get("/posts/:postId/comments", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const rows = await db
    .select({
      id: postCommentsTable.id,
      content: postCommentsTable.content,
      createdAt: postCommentsTable.createdAt,
      userId: postCommentsTable.userId,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      badges: profilesTable.badges,
    })
    .from(postCommentsTable)
    .leftJoin(usersTable, eq(postCommentsTable.userId, usersTable.id))
    .leftJoin(profilesTable, eq(profilesTable.userId, postCommentsTable.userId))
    .where(eq(postCommentsTable.postId, postId))
    .orderBy(desc(postCommentsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.post("/posts/:postId/comments", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const postId = Number(req.params.postId);
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ error: "Comentário vazio." });
    return;
  }
  if (content.length > 500) {
    res.status(400).json({ error: "Comentário muito longo (máx 500 caracteres)." });
    return;
  }

  const [comment] = await db.insert(postCommentsTable).values({ postId, userId, content: content.trim() }).returning();
  await db.update(postsTable).set({ commentsCount: sql`comments_count + 1` }).where(eq(postsTable.id, postId));

  const [user] = await db.select({ username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [profile] = await db.select({ badges: profilesTable.badges }).from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  res.json({ ...comment, ...user, badges: profile?.badges ?? [] });
});

router.post("/posts/:postId/report", optionalAuth, async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const { reason } = req.body;
  const ip = getClientIp(req);

  if (!reason) {
    res.status(400).json({ error: "Informe o motivo." });
    return;
  }

  await db.insert(postReportsTable).values({
    postId,
    reporterUserId: req.user?.userId ?? null,
    reporterIp: ip,
    reason,
  });

  res.json({ success: true });
});

export default router;
