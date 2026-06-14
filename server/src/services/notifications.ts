import { Resend } from 'resend';
import twilio from 'twilio';
import { redis } from '../lib/redis';
import { generateUnsubscribeToken } from '../lib/tokens';

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export interface IncidentData {
  id: string;
  title: string;
  status: string;
  impact: string;
  service: { name: string };
}

export interface UpdateData {
  message: string;
  status: string;
  createdAt: Date;
}

export async function sendIncidentEmail(
  to: string,
  incident: IncidentData,
  update: UpdateData,
  unsubscribeId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusColors: Record<string, string> = {
      INVESTIGATING: '#f97316',
      IDENTIFIED: '#eab308',
      MONITORING: '#3b82f6',
      RESOLVED: '#22c55e',
    };

    const impactLabels: Record<string, string> = {
      MINOR: 'Minor',
      MAJOR: 'Major',
      CRITICAL: 'Critical',
    };

    const color = statusColors[update.status] || '#6b7280';
    const impactLabel = impactLabels[incident.impact] || incident.impact;
    const baseUrl = process.env.CLIENT_URL || 'https://downtime.so';
    const unsubscribeUrl = unsubscribeId
      ? `${baseUrl}/unsubscribe?id=${unsubscribeId}&token=${generateUnsubscribeToken(unsubscribeId)}`
      : null;

    const subject =
      update.status === 'RESOLVED'
        ? `[Resolved] ${incident.title} - ${incident.service.name}`
        : `[${update.status}] ${incident.title} - ${incident.service.name}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222; }
    .header { padding: 24px; border-bottom: 1px solid #222; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${color}22; color: ${color}; border: 1px solid ${color}44; }
    .content { padding: 24px; }
    .title { font-size: 20px; font-weight: 700; margin: 12px 0; color: #fff; }
    .message { background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 3px solid ${color}; color: #d4d4d4; line-height: 1.6; }
    .meta { color: #6b7280; font-size: 13px; margin-top: 8px; }
    .footer { padding: 16px 24px; border-top: 1px solid #222; text-align: center; }
    .footer a { color: #6b7280; font-size: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">${update.status.replace('_', ' ')}</span>
      <div class="title">${incident.title}</div>
      <div class="meta">${incident.service.name} &bull; Impact: ${impactLabel}</div>
    </div>
    <div class="content">
      <div class="message">${update.message}</div>
      <div class="meta">Posted at ${new Date(update.createdAt).toUTCString()}</div>
    </div>
    <div class="footer">
      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe from status updates</a>` : ''}
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: 'status@downtime.so',
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[notifications] Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendIncidentSMS(
  to: string,
  incident: IncidentData,
  update: UpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusLabel = update.status === 'RESOLVED' ? 'RESOLVED' : update.status;
    const message = `[${statusLabel}] ${incident.service.name}: ${incident.title}\n${update.message.slice(0, 100)}${update.message.length > 100 ? '...' : ''}`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[notifications] SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function publishStatusUpdate(orgSlug: string, data: Record<string, any>): Promise<void> {
  try {
    const channel = `status:${orgSlug}`;
    const payload = JSON.stringify({ ...data, timestamp: new Date().toISOString() });
    await redis.publish(channel, payload);
  } catch (err) {
    console.error('[notifications] Redis publish failed:', err);
  }
}
