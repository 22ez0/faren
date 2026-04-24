import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable, profilesTable, profileReportsTable, supportTicketsTable, postReportsTable, postsTable } from "@workspace/db";
import { eq, ilike, or, desc } from "drizzle-orm";

const router: IRouter = Router();
const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? "keefaren";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Hungria2021@";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? process.env.SESSION_SECRET ?? "faren-admin-secret";

function signAdminToken() {
  return jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: "7d" });
}

function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), ADMIN_SECRET) as any;
    if (!payload.admin) throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

router.post("/admin/login", (req, res): void => {
  if (req.body?.login !== ADMIN_LOGIN || req.body?.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Login inválido" });
    return;
  }
  res.json({ token: signAdminToken() });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
      displayName: usersTable.displayName,
      banned: usersTable.banned,
      emailVerified: usersTable.emailVerified,
      registrationIp: usersTable.registrationIp,
      lastLoginIp: usersTable.lastLoginIp,
      createdAt: usersTable.createdAt,
      badges: profilesTable.badges,
      followersCount: profilesTable.followersCount,
      viewsCount: profilesTable.viewsCount,
    })
    .from(usersTable)
    .leftJoin(profilesTable, eq(profilesTable.userId, usersTable.id))
    .where(q ? or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.email, `%${q}%`), ilike(usersTable.displayName, `%${q}%`)) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(200);
  res.json(rows);
});

const RESERVED_USERNAMES_ADMIN = new Set([
  'keefaren', 'admin', 'administrator', 'api', 'static', 'dashboard',
  'login', 'register', 'signup', 'profile', 'settings', 'help', 'support',
  'root', 'system', 'moderator', 'mod', 'staff', 'team', 'official',
  'faren', 'keef', 'null', 'undefined', 'test', 'demo', 'example',
  'comunidade', 'community', 'notifications', 'feed', 'explore', 'search',
]);

router.post("/admin/users/:userId/username", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  const newUsername = String(req.body?.username ?? "").trim().toLowerCase();
  if (!newUsername) { res.status(400).json({ error: "Username obrigatório" }); return; }
  if (newUsername.length < 3 || newUsername.length > 15) { res.status(400).json({ error: "Username deve ter 3 a 15 caracteres." }); return; }
  if (!/^[a-z0-9_]+$/.test(newUsername)) { res.status(400).json({ error: "Apenas letras minúsculas, números e _" }); return; }
  if (newUsername.startsWith("_") || newUsername.endsWith("_") || /__/.test(newUsername)) { res.status(400).json({ error: "Formato inválido (_ no início/fim ou duplo)" }); return; }
  if (RESERVED_USERNAMES_ADMIN.has(newUsername)) { res.status(400).json({ error: "Username reservado." }); return; }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, newUsername)).limit(1);
  if (existing && existing.id !== userId) { res.status(409).json({ error: "Username já em uso." }); return; }

  await db.update(usersTable).set({ username: newUsername }).where(eq(usersTable.id, userId));
  res.json({ success: true, username: newUsername });
});

router.post("/admin/users/:userId/ban", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  const banned = req.body?.banned !== false;
  await db.update(usersTable).set({ banned }).where(eq(usersTable.id, userId));
  res.json({ success: true, banned });
});

router.post("/admin/users/:userId/verified", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  const enabled = req.body?.verified !== false;
  const type: string = req.body?.type || "verified";
  const validTypes = ["verified", "verified_gold", "verified_white"];
  const badgeType = validTypes.includes(type) ? type : "verified";
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  const badges = new Set(profile.badges ?? []);
  if (enabled) {
    validTypes.forEach(t => badges.delete(t));
    badges.add(badgeType);
  } else {
    validTypes.forEach(t => badges.delete(t));
  }
  await db.update(profilesTable).set({ badges: [...badges] }).where(eq(profilesTable.userId, userId));
  res.json({ success: true, verified: enabled, type: badgeType });
});

router.get("/admin/reports", requireAdmin, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const rows = await db
    .select({
      id: profileReportsTable.id,
      reportedUserId: profileReportsTable.reportedUserId,
      reporterUserId: profileReportsTable.reporterUserId,
      reason: profileReportsTable.reason,
      details: profileReportsTable.details,
      reporterIp: profileReportsTable.reporterIp,
      status: profileReportsTable.status,
      createdAt: profileReportsTable.createdAt,
      reportedUsername: usersTable.username,
      reportedDisplayName: usersTable.displayName,
    })
    .from(profileReportsTable)
    .leftJoin(usersTable, eq(profileReportsTable.reportedUserId, usersTable.id))
    .where(status !== "all" ? eq(profileReportsTable.status, status) : undefined)
    .orderBy(desc(profileReportsTable.createdAt))
    .limit(100);
  res.json(rows);
});

router.post("/admin/reports/:reportId/resolve", requireAdmin, async (req, res): Promise<void> => {
  const reportId = Number(req.params.reportId);
  const action = req.body?.action as "dismiss" | "ban" | undefined;

  await db.update(profileReportsTable)
    .set({ status: action === "ban" ? "actioned" : "dismissed" })
    .where(eq(profileReportsTable.id, reportId));

  if (action === "ban") {
    const [report] = await db.select().from(profileReportsTable).where(eq(profileReportsTable.id, reportId)).limit(1);
    if (report) {
      await db.update(usersTable).set({ banned: true }).where(eq(usersTable.id, report.reportedUserId));
    }
  }

  res.json({ success: true });
});

router.get("/admin/support", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(supportTicketsTable)
    .orderBy(desc(supportTicketsTable.createdAt))
    .limit(200);
  res.json(rows);
});

router.post("/admin/support/:ticketId/resolve", requireAdmin, async (req, res): Promise<void> => {
  const ticketId = Number(req.params.ticketId);
  const status = req.body?.status || "resolved";
  await db.update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, ticketId));
  res.json({ success: true });
});

router.get("/admin/post-reports", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: postReportsTable.id,
      postId: postReportsTable.postId,
      reason: postReportsTable.reason,
      status: postReportsTable.status,
      reporterIp: postReportsTable.reporterIp,
      createdAt: postReportsTable.createdAt,
      postContent: postsTable.content,
      postUserId: postsTable.userId,
      reporterUserId: postReportsTable.reporterUserId,
    })
    .from(postReportsTable)
    .leftJoin(postsTable, eq(postReportsTable.postId, postsTable.id))
    .where(eq(postReportsTable.status, "pending"))
    .orderBy(desc(postReportsTable.createdAt))
    .limit(100);
  res.json(rows);
});

router.post("/admin/post-reports/:reportId/resolve", requireAdmin, async (req, res): Promise<void> => {
  const reportId = Number(req.params.reportId);
  const action = req.body?.action as "dismiss" | "remove" | undefined;

  if (action === "remove") {
    const [report] = await db.select().from(postReportsTable).where(eq(postReportsTable.id, reportId)).limit(1);
    if (report) {
      await db.update(postsTable).set({ status: "removed" }).where(eq(postsTable.id, report.postId));
    }
  }

  await db.update(postReportsTable)
    .set({ status: action === "remove" ? "actioned" : "dismissed" })
    .where(eq(postReportsTable.id, reportId));

  res.json({ success: true });
});

export default router;
