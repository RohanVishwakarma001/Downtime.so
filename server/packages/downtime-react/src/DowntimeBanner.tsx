import React, { useEffect, useState, useCallback } from 'react';

export interface ServiceStatus {
  id: string;
  name: string;
  status: string;
  incidents: Array<{
    id: string;
    title: string;
    status: string;
    impact: string;
    updates: Array<{
      message: string;
      status: string;
      createdAt: string;
    }>;
  }>;
}

export interface DowntimeBannerProps {
  orgSlug: string;
  apiUrl?: string;
  className?: string;
  pollInterval?: number;
  statusPageUrl?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  MAJOR_OUTAGE: {
    bg: '#1a0505',
    border: '#7f1d1d',
    text: '#fca5a5',
    dot: '#ef4444',
  },
  PARTIAL_OUTAGE: {
    bg: '#1a0e05',
    border: '#78350f',
    text: '#fcd34d',
    dot: '#f97316',
  },
  DEGRADED: {
    bg: '#1a1505',
    border: '#713f12',
    text: '#fde68a',
    dot: '#eab308',
  },
  MAINTENANCE: {
    bg: '#05101a',
    border: '#1e3a5f',
    text: '#93c5fd',
    dot: '#3b82f6',
  },
};

export function DowntimeBanner({
  orgSlug,
  apiUrl = 'https://api.downtime.so',
  className = '',
  pollInterval = 60000,
  statusPageUrl,
}: DowntimeBannerProps) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/public/${orgSlug}/services`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setServices(data.services || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgSlug, apiUrl]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  if (loading || error) return null;

  // Find the worst active incident
  const activeIncidents = services.flatMap((s) =>
    s.incidents.map((inc) => ({ ...inc, serviceName: s.name }))
  );

  if (activeIncidents.length === 0) return null;

  // Determine overall worst status
  const hasOutage = services.some((s) => s.status === 'MAJOR_OUTAGE');
  const hasPartialOutage = services.some((s) => s.status === 'PARTIAL_OUTAGE');
  const hasDegraded = services.some((s) => s.status === 'DEGRADED');
  const hasMaintenance = services.some((s) => s.status === 'MAINTENANCE');

  let worstStatus = 'DEGRADED';
  if (hasOutage) worstStatus = 'MAJOR_OUTAGE';
  else if (hasPartialOutage) worstStatus = 'PARTIAL_OUTAGE';
  else if (hasDegraded) worstStatus = 'DEGRADED';
  else if (hasMaintenance) worstStatus = 'MAINTENANCE';

  const colors = STATUS_COLORS[worstStatus] || STATUS_COLORS['DEGRADED'];
  const latestIncident = activeIncidents[0];
  const latestUpdate = latestIncident.updates?.[0];

  const statusLabels: Record<string, string> = {
    MAJOR_OUTAGE: 'Major Outage',
    PARTIAL_OUTAGE: 'Partial Outage',
    DEGRADED: 'Degraded Performance',
    MAINTENANCE: 'Scheduled Maintenance',
  };

  const label = statusLabels[worstStatus] || worstStatus;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        padding: '12px 16px',
        backgroundColor: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors.dot,
            flexShrink: 0,
            boxShadow: `0 0 6px ${colors.dot}`,
          }}
        />
        <span style={{ color: colors.text, fontWeight: 600, flexShrink: 0 }}>{label}</span>
        <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {latestIncident.title}
          {latestUpdate && ` — ${latestUpdate.message.slice(0, 80)}${latestUpdate.message.length > 80 ? '...' : ''}`}
        </span>
      </div>

      {statusPageUrl && (
        <a
          href={statusPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: colors.text,
            textDecoration: 'none',
            fontSize: '13px',
            flexShrink: 0,
            opacity: 0.8,
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: '1px',
          }}
        >
          Status page →
        </a>
      )}
    </div>
  );
}

export default DowntimeBanner;
