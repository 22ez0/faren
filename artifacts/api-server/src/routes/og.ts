import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, profilesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";

const router: IRouter = Router();

const SITE_URL = "https://faren.com.br";
const API_URL = "https://api.faren.com.br";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;

const RESERVED = new Set([
  "api", "health", "og", "favicon.ico", "favicon.png", "robots.txt",
  "sitemap.xml", "opengraph.jpg", "CNAME", "404.html",
]);

function esc(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function serveOgPage(username: string, res: Response): Promise<void> {
  const rawUsername = username.toLowerCase().trim();

  if (!rawUsername || RESERVED.has(rawUsername)) {
    res.redirect(302, SITE_URL);
    return;
  }

  try {
    const [user] = await db
      .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName })
      .from(usersTable)
      .where(ilike(usersTable.username, rawUsername))
      .limit(1);

    if (!user) {
      res.redirect(302, SITE_URL);
      return;
    }

    const [profile] = await db
      .select({ avatarUrl: profilesTable.avatarUrl, backgroundUrl: profilesTable.backgroundUrl, bio: profilesTable.bio, accentColor: profilesTable.accentColor, badges: profilesTable.badges })
      .from(profilesTable)
      .where(eq(profilesTable.userId, user.id))
      .limit(1);

    const displayName = user.displayName || user.username;
    const bio = (profile?.bio || `Veja o perfil de @${user.username} na Faren`).slice(0, 200);
    const avatarUrl = profile?.avatarUrl && !profile.avatarUrl.startsWith("data:") ? profile.avatarUrl : DEFAULT_IMAGE;
    const backgroundUrl = profile?.backgroundUrl && !profile.backgroundUrl.startsWith("data:") ? profile.backgroundUrl : null;
    const profileUrl = `${SITE_URL}/${user.username}`;
    const accentColor = profile?.accentColor || "#ffffff";
    const ogImageUrl = backgroundUrl || avatarUrl || DEFAULT_IMAGE;

    const badges = profile?.badges ?? [];
    const isVerifiedGold = badges.includes("verified_gold");
    const isVerified = isVerifiedGold || badges.includes("verified_white") || badges.includes("verified");
    const verifiedSymbol = isVerifiedGold ? " ✦" : isVerified ? " ✓" : "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(displayName)}${verifiedSymbol} — Faren</title>
  <meta name="description" content="${esc(bio)}"/>

  <meta property="og:type" content="profile"/>
  <meta property="og:url" content="${esc(profileUrl)}"/>
  <meta property="og:title" content="${esc(displayName)}${verifiedSymbol} (@${esc(user.username)}) — Faren"/>
  <meta property="og:description" content="${esc(bio)}"/>
  <meta property="og:image" content="${esc(ogImageUrl)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:site_name" content="Faren"/>
  <meta property="og:locale" content="pt_BR"/>

  <meta property="profile:username" content="${esc(user.username)}"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:url" content="${esc(profileUrl)}"/>
  <meta name="twitter:title" content="${esc(displayName)}${verifiedSymbol} (@${esc(user.username)}) — Faren"/>
  <meta name="twitter:description" content="${esc(bio)}"/>
  <meta name="twitter:image" content="${esc(ogImageUrl)}"/>

  <link rel="canonical" href="${esc(profileUrl)}"/>
  <meta http-equiv="refresh" content="0; url=${esc(profileUrl)}"/>

  <style>
    body { margin: 0; background: #0a0a0a; color: #fff; font-family: Inter, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center; max-width: 400px; width: 90%; }
    img.avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid ${esc(accentColor)}; margin-bottom: 12px; }
    h1 { font-size: 1.4rem; margin: 0 0 4px; }
    p.username { color: ${esc(accentColor)}; font-size: 0.9rem; margin: 0 0 12px; }
    p.bio { font-size: 0.85rem; opacity: 0.7; margin: 0 0 20px; line-height: 1.5; }
    a.btn { display: inline-block; padding: 10px 24px; border: 1px solid ${esc(accentColor)}; border-radius: 999px; color: ${esc(accentColor)}; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    ${avatarUrl !== DEFAULT_IMAGE ? `<img class="avatar" src="${esc(avatarUrl)}" alt="${esc(displayName)}" onerror="this.style.display='none'"/>` : ''}
    <h1>${esc(displayName)}</h1>
    <p class="username">@${esc(user.username)}</p>
    ${bio ? `<p class="bio">${esc(bio)}</p>` : ''}
    <a class="btn" href="${esc(profileUrl)}">Ver perfil na Faren</a>
  </div>
</body>
</html>`);
  } catch {
    res.redirect(302, SITE_URL);
  }
}

router.get("/og/:username", async (req, res): Promise<void> => {
  await serveOgPage(req.params.username || "", res);
});

router.get("/:username", async (req, res): Promise<void> => {
  const username = req.params.username || "";
  if (!username || !/^[a-zA-Z0-9_.]{2,30}$/.test(username)) {
    res.redirect(302, SITE_URL);
    return;
  }
  const ua = req.get("user-agent") || "";
  const isSocialBot = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterestbot|applebot|googlebot|bingbot|duckduckbot|ia_archiver|embedly|quora|outbrain|vkshare|viber|line\//i.test(ua);
  if (!isSocialBot) {
    res.redirect(302, `${SITE_URL}/${username}`);
    return;
  }
  await serveOgPage(username, res);
});

export { serveOgPage };
export default router;
