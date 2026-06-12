import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis';
import { prisma } from './lib/prisma';
import { sendIncidentEmail, sendIncidentSMS } from './services/notifications';
import type { NotificationJobData } from './lib/queue';

const BATCH_SIZE_EMAIL = 50;
const BATCH_SIZE_SMS = 10;

async function processNotification(job: Job<NotificationJobData>): Promise<void> {
  const { incidentId, type } = job.data;

  console.log(`[Worker] Processing job ${job.id}: ${type} for incident ${incidentId}`);

  // Fetch incident with all related data
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      service: {
        include: {
          subscribers: true,
          org: true,
        },
      },
      updates: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!incident) {
    console.warn(`[Worker] Incident ${incidentId} not found, skipping`);
    return;
  }

  const latestUpdate = incident.updates[0];
  if (!latestUpdate) {
    console.warn(`[Worker] No updates for incident ${incidentId}, skipping`);
    return;
  }

  const subscribers = incident.service.subscribers;
  const emailSubscribers = subscribers.filter((s) => s.email);
  const smsSubscribers = subscribers.filter((s) => s.phone);

  console.log(
    `[Worker] Notifying ${emailSubscribers.length} email and ${smsSubscribers.length} SMS subscribers`
  );

  const incidentData = {
    id: incident.id,
    title: incident.title,
    status: incident.status,
    impact: incident.impact,
    service: { name: incident.service.name },
  };

  const updateData = {
    message: latestUpdate.message,
    status: latestUpdate.status,
    createdAt: latestUpdate.createdAt,
  };

  // Process emails in batches
  for (let i = 0; i < emailSubscribers.length; i += BATCH_SIZE_EMAIL) {
    const batch = emailSubscribers.slice(i, i + BATCH_SIZE_EMAIL);

    await Promise.allSettled(
      batch.map(async (subscriber) => {
        const result = await sendIncidentEmail(
          subscriber.email!,
          incidentData,
          updateData,
          subscriber.id
        );

        await prisma.notificationLog.create({
          data: {
            subscriberId: subscriber.id,
            channel: 'email',
            status: result.success ? 'sent' : 'failed',
            incidentId,
          },
        });

        if (!result.success) {
          console.error(`[Worker] Email failed for ${subscriber.email}: ${result.error}`);
        }
      })
    );
  }

  // Process SMS in batches
  for (let i = 0; i < smsSubscribers.length; i += BATCH_SIZE_SMS) {
    const batch = smsSubscribers.slice(i, i + BATCH_SIZE_SMS);

    await Promise.allSettled(
      batch.map(async (subscriber) => {
        const result = await sendIncidentSMS(subscriber.phone!, incidentData, updateData);

        await prisma.notificationLog.create({
          data: {
            subscriberId: subscriber.id,
            channel: 'sms',
            status: result.success ? 'sent' : 'failed',
            incidentId,
          },
        });

        if (!result.success) {
          console.error(`[Worker] SMS failed for ${subscriber.phone}: ${result.error}`);
        }
      })
    );
  }

  console.log(`[Worker] Job ${job.id} completed`);
}

// Create BullMQ worker
const worker = new Worker<NotificationJobData>('notifications', processNotification, {
  connection: redis,
  concurrency: 5,
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});

console.log('[Worker] Notification worker started, waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, shutting down gracefully');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
