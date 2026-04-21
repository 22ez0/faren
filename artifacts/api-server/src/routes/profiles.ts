import { Router, type IRouter, type Request } from "express";
import { db, usersTable, profilesTable, profileLinksTable, profileViewsTable, profileLikesTable, followersTable, profileReportsTable } from "@workspace/db";
import { eq, and, sql, gt } from "drizzle-orm";
import { UpdateProfileBody, ConnectDiscordBody, ConnectMusicBody, AddProfileLinkBody, UpdateProfileLinkBody, UpdateProfileLinkParams, DeleteProfileLinkParams } from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth";
import { fetchLastfmNowPlaying } from "./music";

function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = "https://" + candidate.replace(/^\/+/, "");
  }
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number) {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string) {
    this.store.delete(key);
  }
}

const profileCache = new TtlCache<any>();
const nowPlayingCache = new TtlCache<any>();
const PROFILE_TTL_MS = 30_000;
const NOW_PLAYING_TTL_MS = 20_000;

const userIdToUsername = new Map<number, string>();

function invalidateProfileCacheByUserId(userId: number) {
  const username = userIdToUsername.get(userId);
  if (username) {
    profileCache.delete(`profile:${username}`);
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
}

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
    musicUsername: profile.musicUsername,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    likesCount: profile.likesCount,
    viewsCount: profile.viewsCount,
    dashboardBgColor: profile.dashboardBgColor ?? "#000000",
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

  const userUpdates = {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  };

  if (Object.keys(userUpdates).length > 0) {
    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, userId));
  }

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
    ...((req.body as any).dashboardBgColor !== undefined ? { dashboardBgColor: (req.body as any).dashboardBgColor } : {}),
  }).where(eq(profilesTable.userId, userId)).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const links = await db.select().from(profileLinksTable).where(eq(profileLinksTable.profileId, profile.id)).orderBy(profileLinksTable.sortOrder);

  profileCache.delete(`profile:${user.username}`);

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

  const normalizedUrl = normalizeLinkUrl(parsed.data.url);
  if (!normalizedUrl) {
    res.status(400).json({ error: "URL inválida" });
    return;
  }

  const [link] = await db.insert(profileLinksTable).values({
    profileId: profile.id,
    platform: parsed.data.platform,
    label: parsed.data.label,
    url: normalizedUrl,
    iconUrl: parsed.data.iconUrl ?? null,
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();

  invalidateProfileCacheByUserId(userId);

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

  let normalizedUrl: string | undefined;
  if (parsed.data.url !== undefined) {
    const n = normalizeLinkUrl(parsed.data.url);
    if (!n) {
      res.status(400).json({ error: "URL inválida" });
      return;
    }
    normalizedUrl = n;
  }

  const [link] = await db.update(profileLinksTable).set({
    ...(parsed.data.platform !== undefined ? { platform: parsed.data.platform } : {}),
    ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
    ...(normalizedUrl !== undefined ? { url: normalizedUrl } : {}),
    ...(parsed.data.iconUrl !== undefined ? { iconUrl: parsed.data.iconUrl } : {}),
    ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
  }).where(and(eq(profileLinksTable.id, params.data.linkId), eq(profileLinksTable.profileId, profile.id))).returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  invalidateProfileCacheByUserId(userId);

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

  invalidateProfileCacheByUserId(userId);

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

  invalidateProfileCacheByUserId(userId);

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

  invalidateProfileCacheByUserId(userId);

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
  const currentUserId = req.user?.userId;
  const cacheKey = `profile:${rawUsername}`;

  const cachedBase = profileCache.get(cacheKey);

  let baseData: any;
  if (cachedBase) {
    baseData = cachedBase;
  } else {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
    if (!user || user.banned) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id)).limit(1);

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const links = await db.select().from(profileLinksTable).where(eq(profileLinksTable.profileId, profile.id)).orderBy(profileLinksTable.sortOrder);

    baseData = formatProfile(user, profile, links);
    baseData._musicConfig = {
      musicPrivate: profile.musicPrivate,
      musicConnected: profile.musicConnected,
      musicService: profile.musicService,
      musicUsername: profile.musicUsername,
    };

    profileCache.set(cacheKey, baseData, PROFILE_TTL_MS);
    userIdToUsername.set(user.id, user.username);
  }

  const [isFollowing, hasLiked, nowPlaying] = await Promise.all([
    currentUserId
      ? db.select({ id: followersTable.followerId }).from(followersTable)
          .where(and(eq(followersTable.followerId, currentUserId), eq(followersTable.followingId, baseData.userId)))
          .limit(1)
          .then(r => r.length > 0)
      : Promise.resolve(false),

    currentUserId
      ? db.select({ id: profileLikesTable.userId }).from(profileLikesTable)
          .where(and(eq(profileLikesTable.userId, currentUserId), eq(profileLikesTable.profileUserId, baseData.userId)))
          .limit(1)
          .then(r => r.length > 0)
      : Promise.resolve(false),

    ((): Promise<any> => {
      const mc = baseData._musicConfig;
      if (!mc?.musicPrivate && mc?.musicConnected === "true" && mc?.musicService === "lastfm" && mc?.musicUsername) {
        const npKey = `np:${mc.musicUsername}`;
        const cached = nowPlayingCache.get(npKey);
        if (cached) return Promise.resolve(cached);
        return Promise.race([
          fetchLastfmNowPlaying(mc.musicUsername).then(result => {
            nowPlayingCache.set(npKey, result, NOW_PLAYING_TTL_MS);
            return result;
          }),
          new Promise<any>(resolve => setTimeout(() => resolve({ isPlaying: false }), 1500)),
        ]);
      }
      return Promise.resolve({ isPlaying: false });
    })(),
  ]);

  const { _musicConfig: _, ...profileData } = baseData;

  if (currentUserId) {
    res.set("Cache-Control", "private, max-age=0, no-store");
  } else {
    res.set("Cache-Control", "public, max-age=0, s-maxage=20, stale-while-revalidate=30");
  }

  res.json({
    ...profileData,
    nowPlaying,
    isFollowing,
    hasLiked,
  });
});

router.post("/users/:username/report", optionalAuth, async (req, res): Promise<void> => {
  const rawUsername = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const { reason, details } = req.body as { reason?: string; details?: string };

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    res.status(400).json({ error: "Motivo da denúncia é obrigatório." });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.username, rawUsername)).limit(1);
  if (!targetUser) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  const ip = getClientIp(req);
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentReport] = await db
    .select({ id: profileReportsTable.id })
    .from(profileReportsTable)
    .where(
      and(
        eq(profileReportsTable.reportedUserId, targetUser.id),
        eq(profileReportsTable.reporterIp, ip),
        gt(profileReportsTable.createdAt, windowStart)
      )
    )
    .limit(1);

  if (recentReport) {
    res.status(429).json({ error: "Você já denunciou este perfil recentemente." });
    return;
  }

  await db.insert(profileReportsTable).values({
    reporterUserId: req.user?.userId ?? null,
    reportedUserId: targetUser.id,
    reason: reason.trim().slice(0, 200),
    details: details?.trim().slice(0, 1000) ?? null,
    reporterIp: ip,
    status: "pending",
  });

  res.json({ success: true, message: "Denúncia recebida. Nossa equipe irá analisar." });
});

router.post("/profile/discord/lanyard", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { discordUserId } = req.body as { discordUserId?: string };

  if (!discordUserId || typeof discordUserId !== "string" || !/^\d{17,20}$/.test(discordUserId.trim())) {
    res.status(400).json({ error: "Discord User ID inválido. Deve ser um número com 17–20 dígitos." });
    return;
  }

  const uid = discordUserId.trim();

  try {
    const lanyardRes = await fetch(`https://api.lanyard.rest/v1/users/${uid}`, {
      headers: { "User-Agent": "faren.com.br/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!lanyardRes.ok) {
      if (lanyardRes.status === 404) {
        res.status(404).json({ error: "Usuário não encontrado no Lanyard. Entre no servidor discord.gg/lanyard primeiro." });
      } else {
        res.status(502).json({ error: "Lanyard indisponível. Tente novamente." });
      }
      return;
    }

    const lanyardData = await lanyardRes.json() as any;
    if (!lanyardData.success) {
      res.status(404).json({ error: "Usuário não encontrado no Lanyard." });
      return;
    }

    const data = lanyardData.data;
    const discordUser = data.discord_user;
    const avatarHash = discordUser?.avatar;
    const discordAvatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${uid}/${avatarHash}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=128`
      : null;

    const activityName = data.activities?.[0]?.name || null;
    const statusEmoji = data.activities?.find((a: any) => a.type === 4)?.emoji?.name || null;

    await db.update(profilesTable).set({
      discordUserId: uid,
      discordUsername: discordUser?.global_name || discordUser?.username || null,
      discordAvatarUrl,
      discordStatus: data.discord_status || "offline",
      discordActivity: activityName,
      discordStatusEmoji: statusEmoji,
      discordNitro: !!discordUser?.premium_type,
      discordBoost: false,
    }).where(eq(profilesTable.userId, userId));

    invalidateProfileCacheByUserId(userId);

    res.json({
      connected: true,
      discordUsername: discordUser?.global_name || discordUser?.username,
      discordAvatarUrl,
      discordStatus: data.discord_status || "offline",
      discordUserId: uid,
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      res.status(504).json({ error: "Lanyard demorou demais para responder." });
    } else {
      res.status(500).json({ error: "Erro ao conectar com Lanyard." });
    }
  }
});

export default router;
