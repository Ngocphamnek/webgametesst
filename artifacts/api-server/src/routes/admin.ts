import { Router } from "express";
import { db, usersTable, betsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { verifyToken } from "./auth";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "tai_xiu_salt_2024").digest("hex");
}

async function requireAdmin(req: any, res: any): Promise<{ userId: number; username: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const decoded = verifyToken(authHeader.slice(7));
  if (!decoded) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const [user] = await db.select({ isAdmin: usersTable.isAdmin })
    .from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return decoded;
}

async function buildAdminUser(u: typeof usersTable.$inferSelect) {
  const [stats] = await db.select({ totalBets: count(betsTable.id) })
    .from(betsTable).where(eq(betsTable.userId, u.id));
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    balance: u.balance,
    isAdmin: u.isAdmin,
    totalBets: Number(stats?.totalBets ?? 0),
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/admin/users", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const result = await Promise.all(users.map(buildAdminUser));
  return res.json(result);
});

router.post("/admin/users/:id/adjust", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount)) return res.status(400).json({ error: "Invalid amount" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newBalance = Math.max(0, user.balance + amount);
  const [updated] = await db.update(usersTable)
    .set({ balance: newBalance })
    .where(eq(usersTable.id, id))
    .returning();

  return res.json(await buildAdminUser(updated));
});

router.post("/admin/users/:id/reset-password", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const { newPassword } = req.body ?? {};
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  await db.update(usersTable)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(usersTable.id, id));

  return res.json({ success: true });
});

router.delete("/admin/users/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  await db.delete(betsTable).where(eq(betsTable.userId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));

  return res.json({ success: true });
});

export default router;
