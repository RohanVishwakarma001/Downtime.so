import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { apiKeyMiddleware } from '../middleware/apiKey';
import { notificationQueue } from '../lib/queue';
import { publishStatusUpdate } from '../services/notifications';

const router = Router();

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  impact: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MINOR'),
  serviceId: z.string().cuid(),
  initialMessage: z.string().min(1).max(2000),
});

const updateIncidentSchema = z.object({
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']).optional(),
  title: z.string().min(1).max(200).optional(),
  impact: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
});

const addUpdateSchema = z.object({
  message: z.string().min(1).max(2000),
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']),
});

async function createIncidentHandler(req: Request, res: Response, orgId: string) {
  const parsed = createIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const { title, impact, serviceId, initialMessage } = parsed.data;

  // Verify service belongs to org
  const service = await prisma.service.findFirst({
    where: { id: serviceId, orgId },
    include: { org: true },
  });

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const incident = await prisma.$transaction(async (tx) => {
    const inc = await tx.incident.create({
      data: {
        title,
        impact,
        serviceId,
        status: 'INVESTIGATING',
      },
    });

    await tx.incidentUpdate.create({
      data: {
        message: initialMessage,
        status: 'INVESTIGATING',
        incidentId: inc.id,
      },
    });

    // Update service status based on impact
    const serviceStatus =
      impact === 'CRITICAL' ? 'MAJOR_OUTAGE' : impact === 'MAJOR' ? 'PARTIAL_OUTAGE' : 'DEGRADED';

    await tx.service.update({
      where: { id: serviceId },
      data: { status: serviceStatus },
    });

    return inc;
  });

  // Enqueue notification job
  await notificationQueue.add('notify', { incidentId: incident.id, type: 'incident_created' });

  // Publish SSE update
  await publishStatusUpdate(service.org.slug, {
    type: 'incident_created',
    incidentId: incident.id,
    title: incident.title,
    serviceId,
    impact,
  });

  const incidentWithUpdates = await prisma.incident.findUnique({
    where: { id: incident.id },
    include: { updates: { orderBy: { createdAt: 'asc' } }, service: true },
  });

  return res.status(201).json({ incident: incidentWithUpdates });
}

// GET /api/v1/incidents - List incidents for org
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { service: { orgId: req.user!.orgId } };
    if (status) where.status = status;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          service: { select: { id: true, name: true } },
          updates: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { updates: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.incident.count({ where }),
    ]);

    return res.json({ incidents, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[incidents GET /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/incidents - Create incident (JWT auth)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    return await createIncidentHandler(req, res, req.user!.orgId);
  } catch (err) {
    console.error('[incidents POST /]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/incidents/api - Create incident via API key
router.post('/api', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    return await createIncidentHandler(req, res, req.org!.id);
  } catch (err) {
    console.error('[incidents POST /api]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/incidents/:id - Get incident with all updates
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id: req.params.id,
        service: { orgId: req.user!.orgId },
      },
      include: {
        service: { select: { id: true, name: true, orgId: true } },
        updates: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    return res.json({ incident });
  } catch (err) {
    console.error('[incidents GET /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/incidents/:id - Update incident status
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = updateIncidentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const existing = await prisma.incident.findFirst({
      where: { id: req.params.id, service: { orgId: req.user!.orgId } },
      include: { service: { include: { org: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const updateData: any = { ...parsed.data };
    if (parsed.data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const incident = await prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id: req.params.id },
        data: updateData,
        include: { updates: { orderBy: { createdAt: 'asc' } }, service: true },
      });

      // If resolved, set service back to operational
      if (parsed.data.status === 'RESOLVED') {
        const otherActiveIncidents = await tx.incident.count({
          where: {
            serviceId: existing.serviceId,
            status: { not: 'RESOLVED' },
            id: { not: req.params.id },
          },
        });

        if (otherActiveIncidents === 0) {
          await tx.service.update({
            where: { id: existing.serviceId },
            data: { status: 'OPERATIONAL' },
          });
        }
      }

      return updated;
    });

    // Enqueue notification job
    await notificationQueue.add('notify', { incidentId: incident.id, type: 'incident_updated' });

    // Publish SSE update
    await publishStatusUpdate(existing.service.org.slug, {
      type: 'incident_updated',
      incidentId: incident.id,
      status: incident.status,
      serviceId: existing.serviceId,
    });

    return res.json({ incident });
  } catch (err) {
    console.error('[incidents PATCH /:id]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/incidents/:id/updates - Add update to incident timeline
router.post('/:id/updates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = addUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const incident = await prisma.incident.findFirst({
      where: { id: req.params.id, service: { orgId: req.user!.orgId } },
      include: { service: { include: { org: true } } },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const update = await prisma.$transaction(async (tx) => {
      const incUpdate = await tx.incidentUpdate.create({
        data: {
          message: parsed.data.message,
          status: parsed.data.status,
          incidentId: req.params.id,
        },
      });

      // Update incident status to match update status
      await tx.incident.update({
        where: { id: req.params.id },
        data: {
          status: parsed.data.status,
          resolvedAt: parsed.data.status === 'RESOLVED' ? new Date() : undefined,
        },
      });

      if (parsed.data.status === 'RESOLVED') {
        const otherActive = await tx.incident.count({
          where: {
            serviceId: incident.serviceId,
            status: { not: 'RESOLVED' },
            id: { not: req.params.id },
          },
        });
        if (otherActive === 0) {
          await tx.service.update({
            where: { id: incident.serviceId },
            data: { status: 'OPERATIONAL' },
          });
        }
      }

      return incUpdate;
    });

    // Enqueue notification
    await notificationQueue.add('notify', { incidentId: req.params.id, type: 'incident_updated' });

    // Publish SSE
    await publishStatusUpdate(incident.service.org.slug, {
      type: 'incident_update_posted',
      incidentId: req.params.id,
      updateId: update.id,
      status: update.status,
      message: update.message,
    });

    return res.status(201).json({ update });
  } catch (err) {
    console.error('[incidents POST /:id/updates]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
