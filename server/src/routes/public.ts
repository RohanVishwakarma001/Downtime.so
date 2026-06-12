import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/v1/public/:orgSlug/services - Public status page data
router.get('/:orgSlug/services', async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.orgSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const services = await prisma.service.findMany({
      where: { orgId: org.id },
      include: {
        incidents: {
          where: { status: { not: 'RESOLVED' } },
          include: {
            updates: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Compute overall status
    const statuses = services.map((s) => s.status);
    let overallStatus = 'OPERATIONAL';
    if (statuses.includes('MAJOR_OUTAGE')) overallStatus = 'MAJOR_OUTAGE';
    else if (statuses.includes('PARTIAL_OUTAGE')) overallStatus = 'PARTIAL_OUTAGE';
    else if (statuses.includes('DEGRADED')) overallStatus = 'DEGRADED';
    else if (statuses.includes('MAINTENANCE')) overallStatus = 'MAINTENANCE';

    return res.json({ org, services, overallStatus });
  } catch (err) {
    console.error('[public GET /:orgSlug/services]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
