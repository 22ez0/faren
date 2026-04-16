import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable, profilesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();
const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? "keefaren";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Hungria2021@";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? process.env.SESSION_SECRET ?? "faren-admin-secret";

function signAdminToken() {
  return jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: "12h" });
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
      badges: profilesTable.badges,
    })
    .from(usersTable)
    .leftJoin(profilesTable, eq(profilesTable.userId, usersTable.id))
    .where(q ? or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.email, `%${q}%`), ilike(usersTable.displayName, `%${q}%`)) : undefined)
    .limit(30);
  res.json(rows);
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
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  const badges = new Set(profile.badges ?? []);
  if (enabled) badges.add("verified");
  else badges.delete("verified");
  await db.update(profilesTable).set({ badges: [...badges] }).where(eq(profilesTable.userId, userId));
  res.json({ success: true, verified: enabled });
});

export default router;