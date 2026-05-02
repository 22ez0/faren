export async function uploadToCatbox(imageUrl: string): Promise<string> {
  const imageRes = await fetch(imageUrl);
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

  const fileSizeMb = buffer.byteLength / (1024 * 1024);
  if (ext === "gif" && fileSizeMb > 5) {
    throw new Error(`gif muito grande (${fileSizeMb.toFixed(1)}mb). limite: 5mb`);
  }

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("userhash", "");
  form.append(
    "fileToUpload",
    new Blob([buffer], { type: contentType }),
    `icon.${ext}`
  );

  const res = await fetch("https://catbox.moe/user.php", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`catbox retornou ${res.status}`);

  const url = await res.text();
  if (!url.startsWith("https://")) throw new Error(`resposta inválida do catbox: ${url}`);

  return url.trim();
}
