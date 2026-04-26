import { db, usersTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { parseDataUri, uploadBuffer } from "../lib/r2.js";

async function migrateUsers() {
  console.log("[users] fetching base64 avatars…");
  const rows = await db.select({ id: usersTable.id, username: usersTable.username, avatarUrl: usersTable.avatarUrl }).from(usersTable);
  const targets = rows.filter(r => r.avatarUrl?.startsWith("data:"));
  console.log(`[users] ${targets.length}/${rows.length} need migration`);

  let ok = 0, fail = 0;
  for (const u of targets) {
    try {
      const parsed = parseDataUri(u.avatarUrl!);
      if (!parsed) { fail++; continue; }
      const url = await uploadBuffer({ buffer: parsed.buffer, mime: parsed.mime, prefix: `avatars/${u.id}` });
      await db.update(usersTable).set({ avatarUrl: url }).where(eq(usersTable.id, u.id));
      ok++;
      if (ok % 10 === 0) console.log(`  [users] ${ok}/${targets.length}`);
    } catch (e: any) {
      console.error(`  [users] FAIL ${u.username}:`, e?.message || e);
      fail++;
    }
  }
  console.log(`[users] done: ok=${ok} fail=${fail}`);
}

async function migrateProfiles() {
  console.log("[profiles] fetching base64 backgrounds…");
  const rows = await db.select({ id: profilesTable.id, userId: profilesTable.userId, backgroundUrl: profilesTable.backgroundUrl }).from(profilesTable);
  const targets = rows.filter(r => r.backgroundUrl?.startsWith("data:"));
  console.log(`[profiles] ${targets.length}/${rows.length} need migration`);

  let ok = 0, fail = 0;
  for (const p of targets) {
    try {
      const parsed = parseDataUri(p.backgroundUrl!);
      if (!parsed) { fail++; continue; }
      const url = await uploadBuffer({ buffer: parsed.buffer, mime: parsed.mime, prefix: `backgrounds/${p.userId}` });
      await db.update(profilesTable).set({ backgroundUrl: url }).where(eq(profilesTable.id, p.id));
      ok++;
      if (ok % 10 === 0) console.log(`  [profiles] ${ok}/${targets.length}`);
    } catch (e: any) {
      console.error(`  [profiles] FAIL ${p.id}:`, e?.message || e);
      fail++;
    }
  }
  console.log(`[profiles] done: ok=${ok} fail=${fail}`);
}

async function main() {
  const arg = process.argv[2] || "all";
  console.log(`migration mode: ${arg}`);
  console.log(`R2 bucket: ${process.env.R2_BUCKET}`);
  console.log(`R2 public: ${process.env.R2_PUBLIC_URL}`);
  console.log(`DB: ${(process.env.DATABASE_URL || "").replace(/:[^:@]+@/, ":****@")}`);

  if (arg === "users" || arg === "all") await migrateUsers();
  if (arg === "profiles" || arg === "all") await migrateProfiles();

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
