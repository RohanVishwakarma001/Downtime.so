'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { IncidentTimeline } from '@/components/ui/IncidentTimeline';
import { formatRelativeTime } from '@/lib/utils';
import { publicApi } from '@/lib/api';
import { CheckCircle2, AlertTriangle, Bell, Loader2, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuroraBackground, GradientText } from '@/components/ui';

interface Subscriber {
  email?: string;
  phone?: string;
  id: string;
}

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  updates: IncidentUpdate[];
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  status: string;
  incidents: Incident[];
}

interface Org {
  id: string;
  name: string;
  slug: string;
}

interface StatusClientProps {
  initialOrg: Org;
  initialServices: Service[];
  initialOverallStatus: string;
  orgSlug: string;
}

const OVERALL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  OPERATIONAL: {
    label: 'All Systems Operational',
    color: 'text-status-operational',
    bg: 'bg-green-950/50 border-green-900/40',
    icon: CheckCircle2,
  },
  DEGRADED: {
    label: 'Degraded Performance',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/50 border-yellow-900/40',
    icon: AlertTriangle,
  },
  PARTIAL_OUTAGE: {
    label: 'Partial System Outage',
    color: 'text-orange-400',
    bg: 'bg-orange-950/50 border-orange-900/40',
    icon: AlertTriangle,
  },
  MAJOR_OUTAGE: {
    label: 'Major System Outage',
    color: 'text-red-400',
    bg: 'bg-red-950/50 border-red-900/40',
    icon: AlertTriangle,
  },
  MAINTENANCE: {
    label: 'Scheduled Maintenance',
    color: 'text-blue-400',
    bg: 'bg-blue-950/50 border-blue-900/40',
    icon: AlertTriangle,
  },
};

export function StatusClient({ initialOrg, initialServices, initialOverallStatus, orgSlug }: StatusClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [overallStatus, setOverallStatus] = useState(initialOverallStatus);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribePhone, setSubscribePhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(initialServices[0]?.id || '');
  const [subscribing, setSubscribing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // SSE connection
  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/api/sse/${orgSlug}`);

    eventSource.onopen = () => setSseConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'initial') {
          setServices(data.services || []);
          return;
        }

        if (data.type === 'service_status_changed') {
          setServices((prev) =>
            prev.map((s) => (s.id === data.serviceId ? { ...s, status: data.status } : s))
          );
        }

        if (data.type === 'incident_created') {
          // Refetch to get full data
          publicApi
            .get(`/api/v1/public/${orgSlug}/services`)
            .then((r) => {
              setServices(r.data.services || []);
              setOverallStatus(r.data.overallStatus);
            })
            .catch(() => {});
        }

        if (data.type === 'incident_update_posted') {
          setServices((prev) =>
            prev.map((s) => ({
              ...s,
              incidents: s.incidents.map((inc) => {
                if (inc.id !== data.incidentId) return inc;
                return {
                  ...inc,
                  status: data.status,
                  updates: [
                    {
                      id: data.updateId,
                      message: data.message,
                      status: data.status,
                      createdAt: data.timestamp,
                    },
                    ...inc.updates,
                  ],
                };
              }),
            }))
          );
        }
      } catch {}
    };

    eventSource.onerror = () => setSseConnected(false);

    return () => eventSource.close();
  }, [orgSlug, API_URL]);

  // Recompute overall status
  useEffect(() => {
    const statuses = services.map((s) => s.status);
    let overall = 'OPERATIONAL';
    if (statuses.includes('MAJOR_OUTAGE')) overall = 'MAJOR_OUTAGE';
    else if (statuses.includes('PARTIAL_OUTAGE')) overall = 'PARTIAL_OUTAGE';
    else if (statuses.includes('DEGRADED')) overall = 'DEGRADED';
    else if (statuses.includes('MAINTENANCE')) overall = 'MAINTENANCE';
    setOverallStatus(overall);
  }, [services]);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!subscribeEmail && !subscribePhone) {
      toast.error('Enter email or phone number');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Select a service');
      return;
    }

    setSubscribing(true);
    try {
      await publicApi.post('/api/v1/subscribers', {
        email: subscribeEmail || undefined,
        phone: subscribePhone || undefined,
        serviceId: selectedServiceId,
      });
      toast.success('Subscribed! You\'ll receive incident notifications.');
      setSubscribeEmail('');
      setSubscribePhone('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  }

  const overallConfig = OVERALL_STATUS_CONFIG[overallStatus] || OVERALL_STATUS_CONFIG['OPERATIONAL'];
  const OverallIcon = overallConfig.icon;

  const activeIncidents = services.flatMap((s) =>
    s.incidents
      .filter((i) => i.status !== 'RESOLVED')
      .map((i) => ({ ...i, serviceName: s.name }))
  );

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold">
              <GradientText>{initialOrg.name}</GradientText>
            </h1>
            <p className="text-muted text-sm mt-0.5">Status Page</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted glass rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              {sseConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-operational opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  sseConnected ? 'bg-status-operational' : 'bg-muted'
                }`}
              />
            </span>
            {sseConnected ? 'Live' : 'Connecting...'}
          </div>
        </motion.div>

        {/* Overall status banner */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl border mb-8 overflow-hidden glass ${overallConfig.bg}`}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-40 ${overallConfig.color.replace('text-', 'bg-')}`}
          />
          <OverallIcon className={`w-5 h-5 ${overallConfig.color} flex-shrink-0`} />
          <span className={`font-semibold ${overallConfig.color}`}>{overallConfig.label}</span>
        </motion.div>

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wide">Services</h2>
          <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
            {services.length === 0 ? (
              <div className="py-10 text-center">
                <Server className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No services configured</p>
              </div>
            ) : (
              services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted mt-0.5">{service.description}</p>
                    )}
                  </div>
                  <StatusBadge status={service.status} size="sm" />
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Active incidents */}
        <AnimatePresence mode="popLayout">
          {activeIncidents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <h2 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wide">Active Incidents</h2>
              <div className="space-y-4">
                {activeIncidents.map((incident: any) => (
                  <div
                    key={incident.id}
                    className="glass rounded-2xl border-red-500/20 overflow-hidden shadow-glass"
                  >
                    <div className="px-5 py-4 border-b border-white/10 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{incident.title}</p>
                          <StatusBadge status={incident.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {incident.serviceName} · Started {formatRelativeTime(incident.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <IncidentTimeline updates={incident.updates || []} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Subscribe form */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Get Notified</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Subscribe to receive email or SMS notifications when incidents are created or updated.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1.5">Email</label>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Phone (SMS)</label>
                <input
                  type="tel"
                  value={subscribePhone}
                  onChange={(e) => setSubscribePhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {services.length > 1 && (
              <div>
                <label className="text-xs text-muted block mb-1.5">Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={subscribing}
              whileHover={{ scale: subscribing ? 1 : 1.015 }}
              whileTap={{ scale: subscribing ? 1 : 0.985 }}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#8b5cf6] hover:shadow-glow disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-shadow"
            >
              {subscribing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</>
              ) : (
                <><Bell className="w-4 h-4" /> Subscribe</>
              )}
            </motion.button>
          </form>
        </section>

        <p className="text-center text-xs text-muted mt-8">
          Powered by{' '}
          <a href="https://downtime.so" className="text-primary hover:underline">
            Downtime.so
          </a>
        </p>
      </div>
    </div>
  );
}
