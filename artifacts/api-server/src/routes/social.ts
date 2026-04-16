import { Router, type IRouter } from "express";
import { db, usersTable, profilesTable, followersTable, profileLikesTable, profileViewsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { RecordProfileViewBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/users/:username/follow", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (targetUser.id === userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  await db.insert(followersTable).values({
    followerId: userId,
    followingId: targetUser.id,
  }).onConflictDoNothing();

  await db.update(profilesTable)
    .set({ followersCount: sql`${profilesTable.followersCount} + 1` })
    .where(eq(profilesTable.userId, targetUser.id));

  await db.update(profilesTable)
    .set({ followingCount: sql`${profilesTable.followingCount} + 1` })
    .where(eq(profilesTable.userId, userId));

  res.json({ success: true, message: "Followed" });
});

router.delete("/users/:username/follow", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const result = await db.delete(followersTable).where(
    and(eq(followersTable.followerId, userId), eq(followersTable.followingId, targetUser.id))
  ).returning();

  if (result.length > 0) {
    await db.update(profilesTable)
      .set({ followersCount: sql`GREATEST(${profilesTable.followersCount} - 1, 0)` })
      .where(eq(profilesTable.userId, targetUser.id));

    await db.update(profilesTable)
      .set({ followingCount: sql`GREATEST(${profilesTable.followingCount} - 1, 0)` })
      .where(eq(profilesTable.userId, userId));
  }

  res.json({ success: true, message: "Unfollowed" });
});

router.post("/users/:username/like", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const inserted = await db.insert(profileLikesTable).values({
    userId,
    profileUserId: targetUser.id,
  }).onConflictDoNothing().returning();

  if (inserted.length > 0) {
    await db.update(profilesTable)
      .set({ likesCount: sql`${profilesTable.likesCount} + 1` })
      .where(eq(profilesTable.userId, targetUser.id));
  }

  res.json({ success: true, message: "Liked" });
});

router.post("/analytics/record-view", async (req, res): Promise<void> => {
  const parsed = RecordProfileViewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.username)).limit(1);
  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.insert(profileViewsTable).values({
    profileUserId: targetUser.id,
    country: parsed.data.country ?? null,
    device: parsed.data.device ?? null,
    ipAddress: ((req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] || req.socket.remoteAddress || "unknown").trim(),
    userAgent: req.headers["user-agent"] ?? null,
  });

  await db.update(profilesTable)
    .set({ viewsCount: sql`${profilesTable.viewsCount} + 1` })
    .where(eq(profilesTable.userId, targetUser.id));

  res.json({ success: true, message: "View recorded" });
});

router.get("/discover/trending", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const trending = await db
    .select({
      id: profilesTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      bio: profilesTable.bio,
      bannerUrl: profilesTable.bannerUrl,
      backgroundUrl: profilesTable.backgroundUrl,
      accentColor: profilesTable.accentColor,
      backgroundOpacity: profilesTable.backgroundOpacity,
      glowColor: profilesTable.glowColor,
      cursorStyle: profilesTable.cursorStyle,
      musicUrl: profilesTable.musicUrl,
      badges: profilesTable.badges,
      discordConnected: profilesTable.discordUserId,
      discordUsername: profilesTable.discordUsername,
      discordAvatarUrl: profilesTable.discordAvatarUrl,
      discordStatus: profilesTable.discordStatus,
      discordActivity: profilesTable.discordActivity,
      discordStatusEmoji: profilesTable.discordStatusEmoji,
      musicConnected: profilesTable.musicConnected,
      musicService: profilesTable.musicService,
      followersCount: profilesTable.followersCount,
      followingCount: profilesTable.followingCount,
      likesCount: profilesTable.likesCount,
      viewsCount: profilesTable.viewsCount,
      createdAt: profilesTable.createdAt,
    })
    .from(profilesTable)
    .innerJoin(usersTable, eq(profilesTable.userId, usersTable.id))
    .where(eq(usersTable.banned, false))
    .orderBy(desc(profilesTable.viewsCount))
    .limit(limit);

  res.json(trending.map(p => ({
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    bannerUrl: p.bannerUrl,
    backgroundUrl: p.backgroundUrl,
    accentColor: p.accentColor,
    backgroundOpacity: p.backgroundOpacity,
    glowColor: p.glowColor,
    cursorStyle: p.cursorStyle,
    musicUrl: p.musicUrl,
    badges: p.badges ?? [],
    links: [],
    discordConnected: !!p.discordConnected,
    discordUsername: p.discordUsername,
    discordAvatarUrl: p.discordAvatarUrl,
    discordStatus: p.discordStatus,
    discordActivity: p.discordActivity,
    discordStatusEmoji: p.discordStatusEmoji,
    musicConnected: p.musicConnected === "true",
    musicService: p.musicService,
    nowPlaying: { isPlaying: false },
    followersCount: p.followersCount,
    followingCount: p.followingCount,
    likesCount: p.likesCount,
    viewsCount: p.viewsCount,
    isFollowing: false,
    hasLiked: false,
    createdAt: p.createdAt.toISOString(),
  })));
});

export default router;
