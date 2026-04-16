import { Router, type IRouter } from "express";
import { db, usersTable, profilesTable, profileLinksTable, profileViewsTable, profileLikesTable, followersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { UpdateProfileBody, ConnectDiscordBody, ConnectMusicBody, AddProfileLinkBody, UpdateProfileLinkBody, UpdateProfileLinkParams, DeleteProfileLinkParams } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function formatProfile(
  user: { id: number; username: string; displayName: string | null; avatarUrl: string | null },
  profile: any,
  links: Array<{ id: number; platform: string; label: string; url: string; iconUrl: string | null; sortOrder: number }>
) {
  return {
    id: profile.id,
    userId: profile.userId,
    username: user.username,
    displayName: user.displayName,
    bio: profile.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: profile.bannerUrl,
    backgroundUrl: profile.backgroundUrl,
    accentColor: profile.accentColor,
    backgroundOpacity: profile.backgroundOpacity,
    backgroundBlur: profile.backgroundBlur,
    backgroundType: profile.backgroundType,
    glowColor: profile.glowColor,
    cursorStyle: profile.cursorStyle,
    musicUrl: profile.musicUrl,
    musicTitle: profile.musicTitle,
    musicIconUrl: profile.musicIconUrl,
    musicPrivate: profile.musicPrivate,
    badges: profile.badges ?? [],
    particleEffect: profile.particleEffect,
    clickEffect: profile.clickEffect,
    fontFamily: profile.fontFamily,
    layoutStyle: profile.layoutStyle,
    typewriterTexts: profile.typewriterTexts ?? [],
    profileTitle: profile.profileTitle,
    showViews: profile.showViews,
    links: links.map(l => ({
      id: l.id,
      platform: l.platform,
      label: l.label,
      url: l.url,
      iconUrl: l.iconUrl,
      sortOrder: l.sortOrder,
    })),
    discordConnected: !!profile.discordUserId,
    discordUserId: profile.discordUserId,
    discordUsername: profile.discordUsername,
    discordAvatarUrl: profile.discordAvatarUrl,
    discordStatus: profile.discordStatus,
    discordActivity: profile.discordActivity,
    discordStatusEmoji: profile.discordStatusEmoji,
    discordNitro: profile.discordNitro,
    discordBoost: profile.discordBoost,
    showDiscordAvatar: profile.showDiscordAvatar !== false,
    showDiscordPresence: profile.showDiscordPresence !== false,
    musicConnected: profile.musicConnected === "true",
    musicService: profile.musicService,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    likesCount: profile.likesCount,
    viewsCount: profile.viewsCount,
    createdAt: profile.createdAt.toISOString(),
  };
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    [profile] = await db.insert(profilesTable).values({ userId, badges: [] }).returning();
  }

  const links = await db.select().from(profileLinksTable).where(eq(profileLinksTable.profileId, profile.id)).orderBy(profileLinksTable.sortOrder);

  res.json(formatProfile(user, profile, links));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    displayName, bio, avatarUrl, bannerUrl, backgroundUrl,
    accentColor, backgroundOpacity, backgroundBlur, backgroundType,
    glowColor, cursorStyle, musicUrl, musicTitle, musicIconUrl, musicPrivate, badges,
    particleEffect, clickEffect, fontFamily, layoutStyle,
    typewriterTexts, profileTitle, showViews, showDiscordAvatar, showDiscordPresence,
  } = parsed.data;

  await db.update(usersTable).set({
    ...(displayName !== undefined ? { displayName } : {}),
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  }).where(eq(usersTable.id, userId));

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const [updated] = await db.update(profilesTable).set({
    ...(bio !== undefined ? { bio } : {}),
    ...(bannerUrl !== undefined ? { bannerUrl } : {}),
    ...(backgroundUrl !== undefined ? { backgroundUrl } : {}),
    ...(accentColor !== undefined ? { accentColor } : {}),
    ...(backgroundOpacity !== undefined ? { backgroundOpacity } : {}),
    ...(backgroundBlur !== undefined ? { backgroundBlur } : {}),
    ...(backgroundType !== undefined ? { backgroundType } : {}),
    ...(glowColor !== undefined ? { glowColor } : {}),
    ...(cursorStyle !== undefined ? { cursorStyle } : {}),
    ...(musicUrl !== undefined ? { musicUrl } : {}),
    ...(musicTitle !== undefined ? { musicTitle } : {}),
    ...(musicIconUrl !== undefined ? { musicIconUrl } : {}),
    ...(musicPrivate !== undefined ? { musicPrivate } : {}),
    ...(badges !== undefined ? { badges } : {}),
    ...(particleEffect !== undefined ? { particleEffect } : {}),
    ...(clickEffect !== undefined ? { clickEffect } : {}),
    ...(fontFamily !== undefined ? { fontFamily } : {}),
    ...(layoutStyle !== undefined ? { layoutStyle } : {}),
    ...(typewriterTexts !== undefined ? { typewriterTexts } : {}),
    ...(profileTitle !== undefined ? { profileTitle } : {}),
    ...(showViews !== undefined ? { showViews } : {}),
    ...(showDiscordAvatar !== undefined ? { showDiscordAvatar } : {}),
    ...(showDiscordPresence !== undefined ? { showDiscordPresence } : {}),
  }).where(eq(profilesTable.userId, userId)).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const links = await db.select().from(profileLinksTable).where(eq(profileLinksTable.profileId, profile.id)).orderBy(profileLinksTable.sortOrder);

  res.json(formatProfile(user, updated, links));
});

router.post("/profile/links", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = AddProfileLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const [link] = await db.insert(profileLinksTable).values({
    profileId: profile.id,
    platform: parsed.data.platform,
    label: parsed.data.label,
    url: parsed.data.url,
    iconUrl: parsed.data.iconUrl ?? null,
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();

  res.status(201).json({
    id: link.id,
    platform: link.platform,
    label: link.label,
    url: link.url,
    iconUrl: link.iconUrl,
    sortOrder: link.sortOrder,
  });
});

router.patch("/profile/links/:linkId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const rawId = Array.isArray(req.params.linkId) ? req.params.linkId[0] : req.params.linkId;
  const params = UpdateProfileLinkParams.safeParse({ linkId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProfileLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const [link] = await db.update(profileLinksTable).set({
    ...(parsed.data.platform !== undefined ? { platform: parsed.data.platform } : {}),
    ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
    ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
    ...(parsed.data.iconUrl !== undefined ? { iconUrl: parsed.data.iconUrl } : {}),
    ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
  }).where(and(eq(profileLinksTable.id, params.data.linkId), eq(profileLinksTable.profileId, profile.id))).returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json({
    id: link.id,
    platform: link.platform,
    label: link.label,
    url: link.url,
    iconUrl: link.iconUrl,
    sortOrder: link.sortOrder,
  });
});

router.delete("/profile/links/:linkId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const rawId = Array.isArray(req.params.linkId) ? req.params.linkId[0] : req.params.linkId;
  const params = DeleteProfileLinkParams.safeParse({ linkId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  await db.delete(profileLinksTable).where(and(eq(profileLinksTable.id, params.data.linkId), eq(profileLinksTable.profileId, profile.id)));

  res.sendStatus(204);
});

router.post("/profile/discord", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = ConnectDiscordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db.update(profilesTable).set({
    discordUserId: parsed.data.discordUserId,
    discordUsername: parsed.data.discordUsername,
    discordAvatarUrl: parsed.data.discordAvatarUrl ?? null,
    discordStatus: parsed.data.discordStatus ?? null,
    discordActivity: parsed.data.discordActivity ?? null,
    discordStatusEmoji: parsed.data.discordStatusEmoji ?? null,
    discordNitro: parsed.data.discordNitro ?? false,
    discordBoost: parsed.data.discordBoost ?? false,
  }).where(eq(profilesTable.userId, userId)).returning();

  res.json({
    connected: true,
    discordUserId: profile.discordUserId,
    discordUsername: profile.discordUsername,
    discordAvatarUrl: profile.discordAvatarUrl,
    discordStatus: profile.discordStatus,
    discordActivity: profile.discordActivity,
    discordStatusEmoji: profile.discordStatusEmoji,
    discordNitro: profile.discordNitro,
    discordBoost: profile.discordBoost,
  });
});

router.delete("/profile/discord", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  await db.update(profilesTable).set({
    discordUserId: null,
    discordUsername: null,
    discordAvatarUrl: null,
    discordStatus: null,
    discordActivity: null,
    discordStatusEmoji: null,
    discordNitro: false,
    discordBoost: false,
  }).where(eq(profilesTable.userId, userId));

  res.json({ success: true, message: "Discord disconnected" });
});

router.get("/profile/discord/status", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  if (!profile) {
    res.json({ connected: false });
    return;
  }

  res.json({
    connected: !!profile.discordUserId,
    discordUserId: profile.discordUserId,
    discordUsername: profile.discordUsername,
    discordAvatarUrl: profile.discordAvatarUrl,
    discordStatus: profile.discordStatus,
    discordActivity: profile.discordActivity,
    discordStatusEmoji: profile.discordStatusEmoji,
    discordNitro: profile.discordNitro,
    discordBoost: profile.discordBoost,
  });
});

router.get("/users/:username", optionalAuth, async (req, res): Promise<void> => {
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.banned) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const links = await db.select().from(profileLinksTable).where(eq(profileLinksTable.profileId, profile.id)).orderBy(profileLinksTable.sortOrder);

  let isFollowing = false;
  let hasLiked = false;
  if (req.user) {
    const [followRecord] = await db.select().from(followersTable).where(and(eq(followersTable.followerId, req.user.userId), eq(followersTable.followingId, user.id))).limit(1);
    isFollowing = !!followRecord;
    const [likeRecord] = await db.select().from(profileLikesTable).where(and(eq(profileLikesTable.userId, req.user.userId), eq(profileLikesTable.profileUserId, user.id))).limit(1);
    hasLiked = !!likeRecord;
  }

  res.json({
    ...formatProfile(user, profile, links),
    nowPlaying: profile.musicPrivate ? { isPlaying: false } : { isPlaying: false },
    isFollowing,
    hasLiked,
  });
});

export default router;
