'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRelativeTime } from '@/lib/utils';
import { CreateIncidentModal } from '@/components/incidents/CreateIncidentModal';

const IMPACT_COLORS: Record<string, string> = {
  MINOR: 'text-yellow-400',
  MAJOR: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

export default function IncidentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/api/v1/incidents').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/api/v1/services').then((r) => r.data),
  });

  const incidents = incidentsData?.incidents || [];
  const services = servicesData?.services || [];

  const activeIncidents = incidents.filter((i: any) => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((i: any) => i.status === 'RESOLVED');

  function IncidentCard({ incident }: { incident: any }) {
    return (
      <Link
        href={`/dashboard/incidents/${incident.id}`}
        className="block bg-surface border border-border hover:border-border-2 rounded-xl px-5 py-4 transition-colors group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-semibold ${IMPACT_COLORS[incident.impact] || 'text-muted'}`}>
                {incident.impact}
              </span>
              <StatusBadge status={incident.status} size="sm" showDot={false} />
            </div>
            <p className="font-medium text-sm truncate">{incident.title}</p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
              <span>{incident.service?.name}</span>
              <span>·</span>
              <span>{formatRelativeTime(incident.createdAt)}</span>
              <span>·</span>
              <span>{incident._count?.updates || 0} updates</span>
            </div>
            {incident.updates?.[0] && (
              <p className="text-xs text-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                Latest: {incident.updates[0].message}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 mt-1 group-hover:text-foreground transition-colors" />
        </div>
      </Link>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-muted text-sm mt-1">Track and communicate service disruptions</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Incident
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Active */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="font-semibold text-sm">Active</h2>
              {activeIncidents.length > 0 && (
                <span className="bg-red-950/50 text-red-400 border border-red-900/30 text-xs px-2 py-0.5 rounded-full font-medium">
                  {activeIncidents.length}
                </span>
              )}
            </div>

            {activeIncidents.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-xl py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-status-operational mx-auto mb-2" />
                <p className="text-sm font-medium">All systems operational</p>
                <p className="text-xs text-muted mt-1">No active incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeIncidents.map((incident: any) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </section>

          {/* Resolved */}
          {resolvedIncidents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-muted" />
                <h2 className="font-semibold text-sm text-muted">Resolved</h2>
                <span className="text-xs text-muted">({resolvedIncidents.length})</span>
              </div>
              <div className="space-y-3 opacity-70">
                {resolvedIncidents.map((incident: any) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        services={services}
      />
    </div>
  );
}
