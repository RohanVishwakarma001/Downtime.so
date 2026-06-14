import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { verifyUnsubscribeToken } from '../lib/tokens';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  serviceId: z.string().cuid(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone must be provided',
});

// POST /api/v1/subscribers - Subscribe (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { email, phone, serviceId } = parsed.data;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check for existing subscription
    if (email) {
      const existing = await prisma.subscriber.findFirst({
        where: { email, serviceId },
      });
      if (existing) {
        return res.status(409).json({ error: 'Already subscribed with this email' });
      }
    }

    if (phone) {
      const existing = await prisma.subscriber.findFirst({
        where: { phone, serviceId },
      });
      if (existing) {
        return res.status(409).json({ error: 'Already subscribed with this phone number' });
      }
    }

    const subscriber = await prisma.subscriber.create({
      data: { email, phone, serviceId },
    });

    return res.status(201).json({
      subscriber: { id: subscriber.id, email: subscriber.email, phone: subscriber.phone },
      message: 'Successfully subscribed to status updates',
    });
  } catch (err) {
    console.error('[subscribers POST /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/subscribers/:id - Unsubscribe (with token or auth)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    const subscriber = await prisma.subscriber.findUnique({
      where: { id: req.params.id },
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Unsubscribe is authorized either by a signed (HMAC) token from the
    // email link, or by a logged-in dashboard user.
    if (token) {
      if (!verifyUnsubscribeToken(subscriber.id, token as string)) {
        return res.status(403).json({ error: 'Invalid unsubscribe token' });
      }
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
      }
    }

    await prisma.subscriber.delete({ where: { id: req.params.id } });

    return res.json({ message: 'Successfully unsubscribed' });
  } catch (err) {
    console.error('[subscribers DELETE /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/subscribers - List subscribers for a service (auth required)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { serviceId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 200);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { service: { orgId: req.user!.orgId } };
    if (serviceId) where.serviceId = serviceId;

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: {
          service: { select: { id: true, name: true } },
          _count: { select: { notificationLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.subscriber.count({ where }),
    ]);

    return res.json({ subscribers, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[subscribers GET /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
