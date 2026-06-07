import { Router } from "express";
import { db, usersTable, betsTable } from "@workspace/db";
import { eq, desc, sum, count, max } from "drizzle-orm";
import { verifyToken } from "./auth";

const router = Router();

function requireAuth(req: any, res: any): { userId: number; username: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  return decoded;
}

router.get("/game/balance", async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const [user] = await db.select({ balance: usersTable.balance })
    .from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ balance: user.balance });
});

router.post("/game/deposit", async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 1000) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newBalance = user.balance + amount;
  await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, auth.userId));

  return res.json({ balance: newBalance });
});

router.post("/game/bet", async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { choice, amount } = req.body ?? {};
  if (!choice || !["tai", "xiu"].includes(choice)) {
    return res.status(400).json({ error: "Choice must be 'tai' or 'xiu'" });
  }
  const betAmount = Number(amount);
  if (!Number.isFinite(betAmount) || betAmount < 1000) {
    return res.status(400).json({ error: "Minimum bet is 1000" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.balance < betAmount) return res.status(400).json({ error: "Insufficient balance" });

  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const dice3 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2 + dice3;
  const result = total >= 11 ? "tai" : "xiu";
  const won = choice === result;
  const payout = won ? betAmount * 2 : 0;
  const newBalance = user.balance - betAmount + payout;

  await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, auth.userId));
  await db.insert(betsTable).values({
    userId: auth.userId,
    choice,
    amount: betAmount,
    dice1, dice2, dice3,
    won,
    payout,
  });

  return res.json({ won, payout, dice1, dice2, dice3, balance: newBalance });
});

router.get("/game/history", async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const history = await db.select().from(betsTable)
    .where(eq(betsTable.userId, auth.userId))
    .orderBy(desc(betsTable.createdAt))
    .limit(50);

  return res.json(history.map(b => ({
    id: b.id,
    choice: b.choice,
    amount: b.amount,
    won: b.won,
    payout: b.payout,
    dice1: b.dice1,
    dice2: b.dice2,
    dice3: b.dice3,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.get("/game/leaderboard", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
  }).from(usersTable).limit(100);

  const results = await Promise.all(users.map(async (u) => {
    const [stats] = await db.select({
      totalBets: count(betsTable.id),
      totalWon: sum(betsTable.payout),
    }).from(betsTable).where(eq(betsTable.userId, u.id));

    const totalBets = Number(stats?.totalBets ?? 0);
    const totalWon = Number(stats?.totalWon ?? 0);

    const [wonRow] = await db.select({ cnt: count() }).from(betsTable)
      .where(eq(betsTable.userId, u.id));
    const wonCount = Number(wonRow?.cnt ?? 0);

    return {
      username: u.username,
      displayName: u.displayName,
      totalBets,
      totalWon,
      winRate: totalBets > 0 ? (wonCount / totalBets) * 100 : 0,
    };
  }));

  const sorted = results
    .filter(r => r.totalBets > 0)
    .sort((a, b) => b.totalWon - a.totalWon)
    .slice(0, 10);

  return res.json(sorted);
});

router.get("/game/stats", async (_req, res) => {
  const [totals] = await db.select({
    totalBets: count(betsTable.id),
    totalWon: sum(betsTable.payout),
    biggestWin: max(betsTable.payout),
  }).from(betsTable);

  const [wonRow] = await db.select({ cnt: count() }).from(betsTable).where(eq(betsTable.won, true));
  const totalBets = Number(totals?.totalBets ?? 0);
  const wonCount = Number(wonRow?.cnt ?? 0);

  return res.json({
    totalBets,
    totalWon: Number(totals?.totalWon ?? 0),
    winRate: totalBets > 0 ? (wonCount / totalBets) * 100 : 50,
    biggestWin: Number(totals?.biggestWin ?? 0),
  });
});

export default router;
