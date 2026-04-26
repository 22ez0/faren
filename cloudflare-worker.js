// Faren — Cloudflare Worker on route faren.com.br/*
// Last sync from production: 2026-04-26
// Three responsibilities:
//   1. Proxy /api/* to Render with edge cache (90s trending, 20s profile)
//   2. SSR Open Graph previews for social-bot UAs on profile paths
//   3. Scheduled keep-alive ping every 14 min to dodge Render free cold start

const SOCIAL_BOTS = /facebookexternalhit|facebookbot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterestbot|applebot|googlebot|bingbot|duckduckbot|ia_archiver|embedly|outbrain|vkshare|viber|line\/|snapchat|iframely/i;
const API_ORIGIN = "https://faren-api-wn1z.onrender.com";
const RESERVED = new Set(["api","health","og","favicon.ico","favicon.png","robots.txt","sitemap.xml","opengraph.jpg","CNAME","404.html"]);

// Cache TTLs (seconds)
const CACHE_TTL = {
  trending: 90,
  profile: 20,
  default: 0,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const ua = request.headers.get("user-agent") || "";

    // 1. Proxy /api/* to Render (with Cloudflare edge caching for GETs)
    if (pathname.startsWith("/api/")) {
      const apiUrl = API_ORIGIN + pathname + url.search;
      const isGet = request.method === "GET";

      // Determine cache TTL based on path
      let ttl = CACHE_TTL.default;
      if (isGet && pathname.includes("/discover/trending")) ttl = CACHE_TTL.trending;
      else if (isGet && pathname.match(/^\/api\/users\/[^/]+$/)) ttl = CACHE_TTL.profile;

      const apiRequest = new Request(apiUrl, {
        method: request.method,
        headers: (() => {
          const h = new Headers(request.headers);
          h.set("host", "faren-api-wn1z.onrender.com");
          const origin = request.headers.get("origin");
          if (origin) h.set("origin", origin);
          return h;
        })(),
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      const cacheKey = new Request(apiUrl, { method: "GET" });
      const cache = caches.default;

      if (isGet && ttl > 0) {
        const cached = await cache.match(cacheKey);
        if (cached) {
          const r = new Response(cached.body, cached);
          r.headers.set("X-Edge-Cache", "HIT");
          return r;
        }
      }

      const apiRes = await fetch(apiRequest);
      const response = new Response(apiRes.body, apiRes);

      // Fix CORS for faren.com.br origin
      const reqOrigin = request.headers.get("origin") || "";
      if (reqOrigin.includes("faren.com.br")) {
        response.headers.set("Access-Control-Allow-Origin", reqOrigin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Vary", "Origin");
      }

      if (isGet && ttl > 0 && apiRes.ok) {
        response.headers.set("Cache-Control", `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`);
        response.headers.set("X-Edge-Cache", "MISS");
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    }

    // 2. OG preview for social bots on profile paths
    const pathParts = pathname.split("/").filter(Boolean);
    const isProfilePath = pathParts.length === 1 && /^[a-zA-Z0-9_.]{2,30}$/.test(pathParts[0]) && !RESERVED.has(pathParts[0]);
    const isBot = SOCIAL_BOTS.test(ua);

    if (isBot && isProfilePath) {
      const username = pathParts[0];
      try {
        const ogRes = await fetch(`${API_ORIGIN}/${username}`, {
          headers: { "user-agent": ua },
        });
        if (ogRes.ok) {
          const html = await ogRes.text();
          return new Response(html, {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "public, max-age=60, stale-while-revalidate=300",
            },
          });
        }
      } catch (_) {}
    }

    // 3. Pass through to GitHub Pages (origin)
    return fetch(request);
  },

  async scheduled(event, env, ctx) {
    // Keep Render warm every 14 minutes
    try {
      await fetch(`${API_ORIGIN}/api/discover/trending?limit=1`, {
        headers: { "user-agent": "CloudflareWorker/keepalive" },
      });
    } catch (_) {}
  },
};
