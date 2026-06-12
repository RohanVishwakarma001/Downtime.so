import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header' });
    return;
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { apiKey },
      select: { id: true, slug: true, apiKey: true, name: true },
    });

    if (!org) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    // Sliding window rate limiting: 50 req/min per API key
    const key = `rate:apikey:${apiKey}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = 50;

    const pipeline = redis.pipeline();
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zcard(key);
    pipeline.expire(key, 60);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    if (count > limit) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `API key limited to ${limit} requests per minute`,
        retryAfter: 60,
      });
      return;
    }

    req.org = org;
    next();
  } catch (err) {
    console.error('[apiKeyMiddleware] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
