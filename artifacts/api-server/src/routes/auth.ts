import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "tai_xiu_salt_2024").digest("hex");
}

function generateToken(userId: number, username: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, username, ts: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET ?? "default_secret").update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = crypto.createHmac("sha256", process.env.SESSION_SECRET ?? "default_secret").update(payload).digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || username.length < 3 || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = generateToken(user.id, user.username);
  return res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, balance: user.balance, isAdmin: user.isAdmin } });
});

router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || username.length < 3 || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing) return res.status(409).json({ error: "Username already taken" });

  const { displayName } = req.body ?? {};

  const [user] = await db.insert(usersTable).values({
    username,
    displayName: typeof displayName === "string" && displayName.trim().length > 0 ? displayName.trim() : username,
    passwordHash: hashPassword(password),
    balance: 10000,
  }).returning();

  const token = generateToken(user.id, user.username);
  return res.status(201).json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, balance: user.balance, isAdmin: user.isAdmin } });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });

  return res.json({ id: user.id, username: user.username, displayName: user.displayName, balance: user.balance, isAdmin: user.isAdmin });
});

router.post("/auth/change-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });

  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
  if (!user || user.passwordHash !== hashPassword(oldPassword)) {
    return res.status(401).json({ error: "Mat khau cu khong dung" });
  }

  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) }).where(eq(usersTable.id, user.id));
  return res.json({ success: true });
});

export default router;
