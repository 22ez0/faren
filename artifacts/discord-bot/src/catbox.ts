export async function uploadToCatbox(imageUrl: string): Promise<string> {
  try {
    const form = new FormData();
    form.append("reqtype", "urlupload");
    form.append("userhash", "");
    form.append("url", imageUrl);

    const res = await fetch("https://catbox.moe/user.php", {
      method: "POST",
      body: form,
      headers: { "User-Agent": "faren-bot/1.0" },
    });

    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("https://")) return text.trim();
    }
  } catch {}

  const imageRes = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; faren-bot/1.0)" },
  });
  if (!imageRes.ok) throw new Error(`falha ao baixar imagem: ${imageRes.status}`);

  const buffer = await imageRes.arrayBuffer();
  const contentType = imageRes.headers.get("content-type") ?? "image/png";

  const ext = contentType.includes("gif")
    ? "gif"
    : contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
    ? "webp"
    : "jpg";

  if (ext === "gif" && buffer.byteLength / (1024 * 1024) > 5) {
    throw new Error("gif muito grande. limite: 5mb");
  }

  const form2 = new FormData();
  form2.append("reqtype", "fileupload");
  form2.append("userhash", "");
  form2.append("fileToUpload", new Blob([buffer], { type: contentType }), `icon.${ext}`);

  const res2 = await fetch("https://catbox.moe/user.php", {
    method: "POST",
    body: form2,
    headers: { "User-Agent": "faren-bot/1.0" },
  });

  if (!res2.ok) throw new Error(`catbox retornou ${res2.status}`);

  const url = await res2.text();
  if (!url.trim().startsWith("https://")) throw new Error(`resposta inválida do catbox: ${url}`);

  return url.trim();
}
