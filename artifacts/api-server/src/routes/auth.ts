import { Router, type IRouter, type Request } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, usersTable, profilesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../lib/auth";

const router: IRouter = Router();

const registerAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const ip = getClientIp(req);
  const now = Date.now();
  const attempt = registerAttempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    res.status(429).json({ error: "Muitas contas criadas nesse IP. Tente novamente mais tarde." });
    return;
  }
  if (!attempt || attempt.resetAt <= now) {
    registerAttempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    attempt.count += 1;
  }

  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, username, password, displayName } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const [existingUsername] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existingUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = newToken();

  const [user] = await db.insert(usersTable).values({
    email,
    username,
    passwordHash,
    displayName: displayName ?? null,
    registrationIp: ip,
    lastLoginIp: ip,
    verificationTokenHash: hashToken(verificationToken),
    verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }).returning();

  await db.insert(profilesTable).values({
    userId: user.id,
    badges: [],
  });

  const token = signToken({ userId: user.id, username: user.username });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
    emailVerificationRequired: true,
    devVerificationLink: `/api/auth/verify-email?token=${verificationToken}`,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || user.banned) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, username: user.username });
  await db.update(usersTable).set({ lastLoginIp: getClientIp(req) }).where(eq(usersTable.id, user.id));

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).json({ error: "Token obrigatório" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(and(eq(usersTable.verificationTokenHash, hashToken(token)), gt(usersTable.verificationTokenExpiresAt, new Date()))).limit(1);
  if (!user) {
    res.status(400).json({ error: "Token inválido ou expirado" });
    return;
  }
  await db.update(usersTable).set({ emailVerified: true, verificationTokenHash: null, verificationTokenExpiresAt: null }).where(eq(usersTable.id, user.id));
  res.json({ success: true, message: "E-mail verificado" });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user) {
    const token = newToken();
    await db.update(usersTable).set({
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }).where(eq(usersTable.id, user.id));
    res.json({ success: true, message: "Se existir uma conta, enviaremos instruções para redefinir a senha.", devResetLink: `/reset-password?token=${token}` });
    return;
  }
  res.json({ success: true, message: "Se existir uma conta, enviaremos instruções para redefinir a senha." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!token || password.length < 6) {
    res.status(400).json({ error: "Token e senha válida são obrigatórios" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(and(eq(usersTable.resetTokenHash, hashToken(token)), gt(usersTable.resetTokenExpiresAt, new Date()))).limit(1);
  if (!user) {
    res.status(400).json({ error: "Token inválido ou expirado" });
    return;
  }
  await db.update(usersTable).set({
    passwordHash: await bcrypt.hash(password, 10),
    resetTokenHash: null,
    resetTokenExpiresAt: null,
  }).where(eq(usersTable.id, user.id));
  res.json({ success: true, message: "Senha redefinida" });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
