#!/usr/bin/env node
import pg from "pg";

const SRC = process.env.SRC_DATABASE_URL;
const DST = process.env.DST_DATABASE_URL;
if (!SRC || !DST) {
  console.error("Set SRC_DATABASE_URL and DST_DATABASE_URL");
  process.exit(1);
}

const TABLE_ORDER = [
  "users",
  "profiles",
  "followers",
  "music_history",
  "posts",
  "post_likes",
  "post_comments",
  "post_reports",
  "profile_likes",
  "profile_links",
  "profile_views",
  "profile_reports",
  "support_tickets",
];

function quoteIdent(s) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

async function getColumns(client, table) {
  const r = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1
     ORDER BY ordinal_position`,
    [table]
  );
  return r.rows.map((r) => r.column_name);
}

async function getSequences(client) {
  const r = await client.query(
    `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public'`
  );
  return r.rows.map((r) => r.sequence_name);
}

async function migrate() {
  const src = new pg.Client({ connectionString: SRC, ssl: { rejectUnauthorized: false } });
  const dst = new pg.Client({ connectionString: DST, ssl: { rejectUnauthorized: false } });
  await src.connect();
  await dst.connect();

  console.log("[src] ping:", (await src.query("SELECT version()")).rows[0].version.slice(0, 30));
  console.log("[dst] ping:", (await dst.query("SELECT version()")).rows[0].version.slice(0, 30));

  await dst.query("BEGIN");

  let totalCopied = 0;
  for (const table of TABLE_ORDER) {
    const cols = await getColumns(src, table);
    if (cols.length === 0) {
      console.log(`[skip] ${table}: no columns`);
      continue;
    }
    const colsList = cols.map(quoteIdent).join(", ");
    const { rows } = await src.query(`SELECT ${colsList} FROM ${quoteIdent(table)}`);
    if (rows.length === 0) {
      console.log(`[copy] ${table}: 0 rows`);
      continue;
    }

    await dst.query(`TRUNCATE ${quoteIdent(table)} CASCADE`);

    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const insertSql = `INSERT INTO ${quoteIdent(table)} (${colsList}) VALUES (${placeholders})`;

    for (const row of rows) {
      const vals = cols.map((c) => row[c]);
      try {
        await dst.query(insertSql, vals);
      } catch (e) {
        console.error(`[err] ${table} row failed:`, e.message);
        throw e;
      }
    }
    totalCopied += rows.length;
    console.log(`[copy] ${table}: ${rows.length} rows`);
  }

  await dst.query("COMMIT");

  console.log("\n=== Resetting sequences ===");
  const seqs = await getSequences(dst);
  for (const seq of seqs) {
    const tableGuess = seq.replace(/_id_seq$|_seq$/, "");
    try {
      const r = await dst.query(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next FROM ${quoteIdent(tableGuess)}`
      );
      const next = r.rows[0].next;
      await dst.query(`SELECT setval($1, $2, false)`, [seq, next]);
      console.log(`[seq] ${seq} -> ${next}`);
    } catch (e) {
      console.log(`[seq] ${seq}: skipped (${e.message.slice(0, 60)})`);
    }
  }

  console.log(`\n=== DONE. Total rows copied: ${totalCopied} ===`);

  console.log("\n=== Verification (src vs dst counts) ===");
  for (const table of TABLE_ORDER) {
    const [s, d] = await Promise.all([
      src.query(`SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`),
      dst.query(`SELECT COUNT(*)::int AS n FROM ${quoteIdent(table)}`),
    ]);
    const sn = s.rows[0].n;
    const dn = d.rows[0].n;
    const ok = sn === dn ? "OK" : "MISMATCH";
    console.log(`${ok.padEnd(10)} ${table.padEnd(20)} src=${sn}  dst=${dn}`);
  }

  await src.end();
  await dst.end();
}

migrate().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
