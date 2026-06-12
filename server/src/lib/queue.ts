import { Queue } from 'bullmq';
import { redis } from './redis';

export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export type NotificationJobData = {
  incidentId: string;
  type: 'incident_created' | 'incident_updated';
};
