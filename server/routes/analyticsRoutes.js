const express = require('express');
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ensureAnalyticsIndexes() {
  const sessions = mongoose.connection.collection('site_analytics_sessions');
  const pages = mongoose.connection.collection('site_analytics_pages');
  await Promise.all([
    sessions.createIndex({ sessionId: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    pages.createIndex({ sessionId: 1, path: 1 }, { unique: true }),
    pages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    pages.createIndex({ lastSeenAt: 1 }),
  ]);
}

router.post('/activity', async (req, res) => {
  const { sessionId, path: pagePath, pageView } = req.body || {};
  const activeSeconds = Number(req.body?.activeSeconds || 0);
  if (typeof sessionId !== 'string' || !sessionIdPattern.test(sessionId)
      || typeof pagePath !== 'string' || pagePath.length > 200
      || !pagePath.startsWith('/') || pagePath.startsWith('//') || /[?#]/.test(pagePath)
      || /^\/(?:admin|account|api)(?:\/|$)/.test(pagePath)
      || typeof pageView !== 'boolean'
      || !Number.isInteger(activeSeconds) || activeSeconds < 0 || activeSeconds > 30
      || (!pageView && activeSeconds === 0)) {
    return res.status(400).json({ error: 'Attività non valida.' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  try {
    await Promise.all([
      mongoose.connection.collection('site_analytics_sessions').updateOne(
        { sessionId },
        {
          $setOnInsert: { sessionId, startedAt: now },
          $set: { lastSeenAt: now, expiresAt },
          $inc: { pageViews: pageView ? 1 : 0, activeSeconds },
        },
        { upsert: true },
      ),
      mongoose.connection.collection('site_analytics_pages').updateOne(
        { sessionId, path: pagePath },
        {
          $setOnInsert: { sessionId, path: pagePath },
          $set: { lastSeenAt: now, expiresAt },
          $inc: { views: pageView ? 1 : 0, activeSeconds },
        },
        { upsert: true },
      ),
    ]);
    return res.status(204).end();
  } catch (error) {
    console.error('Could not record site analytics:', error);
    return res.status(500).json({ error: 'Non è stato possibile registrare la visita.' });
  }
});

router.get('/summary', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const requestedDays = Number.parseInt(req.query.days, 10);
  const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 1), 30) : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [totals, pageRows, trafficByDay] = await Promise.all([
      mongoose.connection.collection('site_analytics_sessions').aggregate([
        { $match: { lastSeenAt: { $gte: startDate } } },
        { $group: {
          _id: null,
          visits: { $sum: 1 },
          pageViews: { $sum: '$pageViews' },
          activeSeconds: { $sum: '$activeSeconds' },
        } },
      ]).toArray(),
      mongoose.connection.collection('site_analytics_pages').aggregate([
        { $match: { lastSeenAt: { $gte: startDate } } },
        { $group: {
          _id: '$path',
          views: { $sum: '$views' },
          activeSeconds: { $sum: '$activeSeconds' },
        } },
        { $project: {
          _id: 0,
          path: '$_id',
          views: 1,
          activeSeconds: 1,
          averageSeconds: { $cond: [{ $gt: ['$views', 0] }, { $divide: ['$activeSeconds', '$views'] }, 0] },
        } },
      ]).toArray(),
      mongoose.connection.collection('site_analytics_sessions').aggregate([
        { $match: { lastSeenAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastSeenAt' } },
          visits: { $sum: 1 },
          pageViews: { $sum: '$pageViews' },
          activeSeconds: { $sum: '$activeSeconds' },
        } },
        { $project: { _id: 0, day: '$_id', visits: 1, pageViews: 1, activeSeconds: 1 } },
        { $sort: { day: 1 } },
      ]).toArray(),
    ]);

    const summary = totals[0] || { visits: 0, pageViews: 0, activeSeconds: 0 };
    const topPagesByViews = [...pageRows].sort((a, b) => b.views - a.views).slice(0, 5);
    const topPagesByDuration = [...pageRows]
      .filter((page) => page.views > 0)
      .sort((a, b) => b.averageSeconds - a.averageSeconds)
      .slice(0, 5);
    const dayMap = new Map((trafficByDay || []).map((day) => [day.day, day]));
    const dailyTraffic = Array.from({ length: days }, (_, index) => {
      const date = new Date(Date.now() - (days - 1 - index) * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      const existing = dayMap.get(key) || { day: key, visits: 0, pageViews: 0, activeSeconds: 0 };
      return {
        day: key,
        visits: existing.visits || 0,
        pageViews: existing.pageViews || 0,
        activeSeconds: existing.activeSeconds || 0,
      };
    });
    return res.json({
      days,
      visits: summary.visits,
      pageViews: summary.pageViews,
      averageSessionSeconds: summary.visits ? Math.round(summary.activeSeconds / summary.visits) : 0,
      topPagesByViews,
      topPagesByDuration,
      dailyTraffic,
    });
  } catch (error) {
    console.error('Could not load site analytics:', error);
    return res.status(500).json({ error: 'Non è stato possibile caricare le analytics del sito.' });
  }
});

module.exports = { router, ensureAnalyticsIndexes };