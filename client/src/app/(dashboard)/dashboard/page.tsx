'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, Server, Users, Plus, ArrowRight, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRelativeTime } from '@/lib/utils';
import { CreateIncidentModal } from '@/components/incidents/CreateIncidentModal';
import { getUser } from '@/lib/auth';

export default function DashboardPage() {
  const user = getUser();
  const [createIncidentOpen, setCreateIncidentOpen] = useState(false);

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/api/v1/services').then((r) => r.data),
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/api/v1/incidents').then((r) => r.data),
  });

  const { data: subscribersData } = useQuery({
    queryKey: ['subscribers'],
    queryFn: () => api.get('/api/v1/subscribers').then((r) => r.data),
  });

  const services = servicesData?.services || [];
  const incidents = incidentsData?.incidents || [];
  const activeIncidents = incidents.filter((i: any) => i.status !== 'RESOLVED');
  const recentIncidents = incidents.slice(0, 5);
  const totalSubscribers = subscribersData?.total || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            {user?.orgName} — overview of your status infrastructure
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/services"
            className="flex items-center gap-2 border border-border hover:border-border-2 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Link>
          <button
            onClick={() => setCreateIncidentOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Create Incident
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-950/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-muted font-medium">Active Incidents</span>
          </div>
          <p className="text-3xl font-bold">{activeIncidents.length}</p>
          <p className="text-xs text-muted mt-1">
            {activeIncidents.length === 0 ? 'All clear' : `${activeIncidents.length} ongoing`}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary-muted flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted font-medium">Services</span>
          </div>
          <p className="text-3xl font-bold">{services.length}</p>
          <p className="text-xs text-muted mt-1">
            {services.filter((s: any) => s.status === 'OPERATIONAL').length} operational
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-950/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-muted font-medium">Subscribers</span>
          </div>
          <p className="text-3xl font-bold">{totalSubscribers}</p>
          <p className="text-xs text-muted mt-1">Across all services</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Services</h2>
            <Link href="/dashboard/services" className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {services.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Server className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No services yet</p>
                <Link
                  href="/dashboard/services"
                  className="text-xs text-primary hover:text-primary-hover mt-2 inline-block"
                >
                  Add your first service →
                </Link>
              </div>
            ) : (
              services.slice(0, 6).map((service: any) => (
                <div key={service.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{service.name}</p>
                    {service.incidents?.length > 0 && (
                      <p className="text-xs text-muted truncate">{service.incidents[0].title}</p>
                    )}
                  </div>
                  <StatusBadge status={service.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Recent Incidents</h2>
            <Link href="/dashboard/incidents" className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentIncidents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Activity className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No incidents yet</p>
                <p className="text-xs text-muted mt-1">You're in great shape!</p>
              </div>
            ) : (
              recentIncidents.map((incident: any) => (
                <Link
                  key={incident.id}
                  href={`/dashboard/incidents/${incident.id}`}
                  className="block px-5 py-3 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1">{incident.title}</p>
                    <StatusBadge status={incident.status} size="sm" showDot={false} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted">{incident.service?.name}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-xs text-muted">{formatRelativeTime(incident.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateIncidentModal
        open={createIncidentOpen}
        onClose={() => setCreateIncidentOpen(false)}
        services={services}
      />
    </div>
  );
}
