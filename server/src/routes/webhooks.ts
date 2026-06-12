import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { apiKeyMiddleware } from '../middleware/apiKey';
import { notificationQueue } from '../lib/queue';
import { publishStatusUpdate } from '../services/notifications';

const router = Router();

type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'MAINTENANCE';

async function updateServiceStatus(serviceId: string, status: ServiceStatus, orgSlug: string) {
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { status },
  });

  await publishStatusUpdate(orgSlug, {
    type: 'service_status_changed',
    serviceId: service.id,
    serviceName: service.name,
    status: service.status,
  });

  return service;
}

// POST /api/webhooks/uptimerobot - UptimeRobot webhook
router.post('/uptimerobot', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // UptimeRobot sends form-encoded data
    const alertTypeFriendlyName = body.alertTypeFriendlyName || body.alertType;
    const monitorURL = body.monitorURL || body.url;
    const serviceId = body.serviceId || req.query.serviceId;

    if (!serviceId) {
      console.warn('[webhooks/uptimerobot] Missing serviceId');
      return res.status(200).json({ received: true }); // Always 200 to UptimeRobot
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId as string },
      include: { org: true },
    });

    if (!service) {
      return res.status(200).json({ received: true });
    }

    let newStatus: ServiceStatus = 'OPERATIONAL';
    let incidentTitle = '';

    if (alertTypeFriendlyName === 'Down' || alertTypeFriendlyName === '2') {
      newStatus = 'MAJOR_OUTAGE';
      incidentTitle = `${service.name} is down`;
    } else if (alertTypeFriendlyName === 'Up' || alertTypeFriendlyName === '1') {
      newStatus = 'OPERATIONAL';
    } else {
      return res.status(200).json({ received: true });
    }

    await updateServiceStatus(service.id, newStatus, service.org.slug);

    // Auto-create incident if going down
    if (newStatus === 'MAJOR_OUTAGE') {
      const incident = await prisma.incident.create({
        data: {
          title: incidentTitle,
          impact: 'MAJOR',
          serviceId: service.id,
          status: 'INVESTIGATING',
        },
      });

      await prisma.incidentUpdate.create({
        data: {
          message: `UptimeRobot detected that ${service.name} is down. We are investigating the issue.`,
          status: 'INVESTIGATING',
          incidentId: incident.id,
        },
      });

      await notificationQueue.add('notify', { incidentId: incident.id, type: 'incident_created' });
    } else if (newStatus === 'OPERATIONAL') {
      // Auto-resolve open incidents
      const openIncidents = await prisma.incident.findMany({
        where: { serviceId: service.id, status: { not: 'RESOLVED' } },
      });

      for (const inc of openIncidents) {
        await prisma.incident.update({
          where: { id: inc.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });

        await prisma.incidentUpdate.create({
          data: {
            message: `Service has recovered. UptimeRobot confirmed the monitor is back up.`,
            status: 'RESOLVED',
            incidentId: inc.id,
          },
        });

        await notificationQueue.add('notify', { incidentId: inc.id, type: 'incident_updated' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks/uptimerobot]', err);
    return res.status(200).json({ received: true }); // Always 200 to monitoring services
  }
});

// POST /api/webhooks/datadog - Datadog webhook
router.post('/datadog', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const serviceId = body.serviceId || req.query.serviceId;

    if (!serviceId) {
      return res.status(200).json({ received: true });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId as string },
      include: { org: true },
    });

    if (!service) {
      return res.status(200).json({ received: true });
    }

    const alertStatus = body.alert_status || body.event?.alert_status;

    let newStatus: ServiceStatus = 'OPERATIONAL';
    if (alertStatus === 'Alert' || alertStatus === 'alert') {
      newStatus = 'MAJOR_OUTAGE';
    } else if (alertStatus === 'Warn' || alertStatus === 'warn') {
      newStatus = 'DEGRADED';
    } else if (alertStatus === 'Resolved' || alertStatus === 'resolved' || alertStatus === 'Recovery') {
      newStatus = 'OPERATIONAL';
    } else {
      return res.status(200).json({ received: true });
    }

    await updateServiceStatus(service.id, newStatus, service.org.slug);

    if (newStatus === 'MAJOR_OUTAGE' || newStatus === 'DEGRADED') {
      const title = body.title || body.event?.title || `${service.name} alert from Datadog`;
      const incident = await prisma.incident.create({
        data: {
          title,
          impact: newStatus === 'MAJOR_OUTAGE' ? 'MAJOR' : 'MINOR',
          serviceId: service.id,
          status: 'INVESTIGATING',
        },
      });

      await prisma.incidentUpdate.create({
        data: {
          message: body.body || `Datadog alert triggered: ${title}`,
          status: 'INVESTIGATING',
          incidentId: incident.id,
        },
      });

      await notificationQueue.add('notify', { incidentId: incident.id, type: 'incident_created' });
    } else if (newStatus === 'OPERATIONAL') {
      const openIncidents = await prisma.incident.findMany({
        where: { serviceId: service.id, status: { not: 'RESOLVED' } },
      });

      for (const inc of openIncidents) {
        await prisma.incident.update({
          where: { id: inc.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });

        await prisma.incidentUpdate.create({
          data: {
            message: `Alert resolved by Datadog. Service has recovered.`,
            status: 'RESOLVED',
            incidentId: inc.id,
          },
        });

        await notificationQueue.add('notify', { incidentId: inc.id, type: 'incident_updated' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks/datadog]', err);
    return res.status(200).json({ received: true });
  }
});

const genericWebhookSchema = z.object({
  serviceId: z.string().cuid(),
  status: z.enum(['OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE']),
  message: z.string().max(2000).optional(),
  incidentTitle: z.string().max(200).optional(),
});

// POST /api/webhooks/generic - Generic webhook with API key auth
router.post('/generic', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = genericWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { serviceId, status, message, incidentTitle } = parsed.data;

    // Verify service belongs to the org of the API key
    const service = await prisma.service.findFirst({
      where: { id: serviceId, orgId: req.org!.id },
      include: { org: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await updateServiceStatus(service.id, status, service.org.slug);

    if ((status === 'MAJOR_OUTAGE' || status === 'DEGRADED' || status === 'PARTIAL_OUTAGE') && message) {
      const incident = await prisma.incident.create({
        data: {
          title: incidentTitle || `${service.name} incident`,
          impact: status === 'MAJOR_OUTAGE' ? 'MAJOR' : 'MINOR',
          serviceId: service.id,
          status: 'INVESTIGATING',
        },
      });

      await prisma.incidentUpdate.create({
        data: {
          message,
          status: 'INVESTIGATING',
          incidentId: incident.id,
        },
      });

      await notificationQueue.add('notify', { incidentId: incident.id, type: 'incident_created' });
    }

    return res.json({ success: true, service: { id: service.id, status } });
  } catch (err) {
    console.error('[webhooks/generic]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
