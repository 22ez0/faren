const API_BASE = "https://faren-api-wn1z.onrender.com";
const SITE_URL = "https://faren.com.br";

const SOCIAL_BOTS = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|pinterestbot|applebot|googlebot|bingbot|duckduckbot|ia_archiver|embedly|quora|outbrain|vkshare|viber|line\//i;

const STATIC_PATHS = /^\/(api|auth|dashboard|keefaren|404\.html|favicon\.png|opengraph\.jpg|hero-bg\.mp4|CNAME|robots\.txt|sitemap\.xml|_next|assets|static)\/?/;

const USERNAME_RE = /^\/([a-zA-Z0-9_.]{2,30})\/?$/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const isSocialBot = SOCIAL_BOTS.test(ua);
    const match = url.pathname.match(USERNAME_RE);

    if (isSocialBot && match && !STATIC_PATHS.test(url.pathname)) {
      const username = match[1];
      try {
        const ogRes = await fetch(`${API_BASE}/${username}`, {
          headers: { "User-Agent": ua, "Accept": "text/html" },
        });
        if (ogRes.ok) {
          const html = await ogRes.text();
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=60",
            },
          });
        }
      } catch {
        // fall through to normal request
      }
    }

    return fetch(request);
  },
};
