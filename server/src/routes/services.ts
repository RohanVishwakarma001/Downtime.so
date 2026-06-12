import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { publishStatusUpdate } from '../services/notifications';

const router = Router();

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE']).optional(),
});

// GET /api/v1/services - List org's services
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { orgId: req.user!.orgId },
      include: {
        incidents: {
          where: { status: { not: 'RESOLVED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { subscribers: true, incidents: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ services });
  } catch (err) {
    console.error('[services GET /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/services - Create service
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const service = await prisma.service.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        orgId: req.user!.orgId,
      },
    });

    return res.status(201).json({ service });
  } catch (err) {
    console.error('[services POST /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/services/:id - Get service with incidents
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const service = await prisma.service.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
      include: {
        incidents: {
          include: { updates: { orderBy: { createdAt: 'desc' } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { subscribers: true } },
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({ service });
  } catch (err) {
    console.error('[services GET /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/services/:id - Update service
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
      include: { org: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    // Publish SSE update if status changed
    if (parsed.data.status && parsed.data.status !== existing.status) {
      await publishStatusUpdate(existing.org.slug, {
        type: 'service_status_changed',
        serviceId: service.id,
        serviceName: service.name,
        status: service.status,
      });
    }

    return res.json({ service });
  } catch (err) {
    console.error('[services PATCH /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/services/:id - Delete service
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, orgId: req.user!.orgId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.service.delete({ where: { id: req.params.id } });

    return res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('[services DELETE /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
