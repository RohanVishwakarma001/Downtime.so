import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redisSubscriber } from '../lib/redis';

const router = Router();

// Track active SSE connections per org slug
const connections = new Map<string, Set<Response>>();

// Set up Redis subscriber for status updates
redisSubscriber.on('message', (channel: string, message: string) => {
  const orgSlug = channel.replace('status:', '');
  const clients = connections.get(orgSlug);

  if (clients && clients.size > 0) {
    const data = `data: ${message}\n\n`;
    const deadClients = new Set<Response>();

    clients.forEach((client) => {
      try {
        client.write(data);
      } catch {
        deadClients.add(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach((dead) => clients.delete(dead));
  }
});

// GET /api/sse/:orgSlug - SSE endpoint
router.get('/:orgSlug', async (req: Request, res: Response) => {
  const { orgSlug } = req.params;

  try {
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    // Subscribe to Redis channel if not already
    const channel = `status:${orgSlug}`;
    const isSubscribed = connections.has(orgSlug) && connections.get(orgSlug)!.size > 0;

    if (!isSubscribed) {
      await redisSubscriber.subscribe(channel);
    }

    // Add this client to the connections map
    if (!connections.has(orgSlug)) {
      connections.set(orgSlug, new Set());
    }
    connections.get(orgSlug)!.add(res);

    // Send initial status data
    const services = await prisma.service.findMany({
      where: { orgId: org.id },
      include: {
        incidents: {
          where: { status: { not: 'RESOLVED' } },
          include: { updates: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const initialData = {
      type: 'initial',
      org: { id: org.id, name: org.name, slug: org.slug },
      services,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', async () => {
      clearInterval(heartbeat);
      const clients = connections.get(orgSlug);
      if (clients) {
        clients.delete(res);

        // Unsubscribe from Redis if no more clients for this org
        if (clients.size === 0) {
          connections.delete(orgSlug);
          try {
            await redisSubscriber.unsubscribe(channel);
          } catch (err) {
            console.error('[SSE] Failed to unsubscribe:', err);
          }
        }
      }
    });
  } catch (err) {
    console.error('[SSE] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
