import { Router, type IRouter } from "express";
import { db, profilesTable, profileViewsTable, profileLikesTable, followersTable } from "@workspace/db";
import { eq, and, gte, sql, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/analytics/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [viewsToday] = await db.select({ count: count() }).from(profileViewsTable).where(and(eq(profileViewsTable.profileUserId, userId), gte(profileViewsTable.viewedAt, startOfDay)));
  const [viewsThisWeek] = await db.select({ count: count() }).from(profileViewsTable).where(and(eq(profileViewsTable.profileUserId, userId), gte(profileViewsTable.viewedAt, startOfWeek)));
  const [viewsThisMonth] = await db.select({ count: count() }).from(profileViewsTable).where(and(eq(profileViewsTable.profileUserId, userId), gte(profileViewsTable.viewedAt, startOfMonth)));

  const countryStats = await db.select({
    country: profileViewsTable.country,
    count: count(),
  }).from(profileViewsTable).where(and(eq(profileViewsTable.profileUserId, userId), gte(profileViewsTable.viewedAt, thirtyDaysAgo))).groupBy(profileViewsTable.country).orderBy(desc(count())).limit(10);

  const dayStats: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayStats.push({
      date: dayStart.toISOString().split("T")[0],
      count: 0,
    });
  }

  const [followers] = await db.select({ count: count() }).from(followersTable).where(eq(followersTable.followingId, userId));
  const [likes] = await db.select({ count: count() }).from(profileLikesTable).where(eq(profileLikesTable.profileUserId, userId));

  res.json({
    totalViews: profile.viewsCount,
    viewsToday: viewsToday.count,
    viewsThisWeek: viewsThisWeek.count,
    viewsThisMonth: viewsThisMonth.count,
    linkClicks: 0,
    followers: followers.count,
    likes: likes.count,
    topCountries: countryStats.map(c => ({
      country: c.country ?? "Unknown",
      count: c.count,
    })),
    viewsByDay: dayStats,
  });
});

export default router;
