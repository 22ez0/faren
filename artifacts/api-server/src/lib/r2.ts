import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
export const R2_BUCKET = process.env.R2_BUCKET!;
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
  "video/x-m4v": "m4v",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "weba",
};

export const ALLOWED_UPLOAD_MIMES = new Set(Object.keys(MIME_EXT));

export function parseDataUri(dataUri: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri);
  if (!m) return null;
  const mime = m[1];
  const isB64 = !!m[2];
  const data = m[3];
  const buffer = isB64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));
  return { mime, buffer };
}

export async function uploadBuffer(opts: {
  buffer: Buffer;
  mime: string;
  prefix: string;
  filename?: string;
}): Promise<string> {
  const ext = MIME_EXT[opts.mime] || "bin";
  const hash = createHash("sha256").update(opts.buffer).digest("hex").slice(0, 16);
  const name = opts.filename || `${hash}.${ext}`;
  const key = `${opts.prefix.replace(/^\/+|\/+$/g, "")}/${name}`;

  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: opts.buffer,
      ContentType: opts.mime,
      CacheControl: "public, max-age=31536000, immutable",
    }));
  }

  return `${R2_PUBLIC_URL}/${key}`;
}
