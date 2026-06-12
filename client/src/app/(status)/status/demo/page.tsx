'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, Bell, Loader2,
  Zap, ArrowRight, Sparkles,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { IncidentTimeline } from '@/components/ui/IncidentTimeline';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Mock data — all timestamps derived from "now" so relative times are accurate
// ---------------------------------------------------------------------------
const now = Date.now();

const INITIAL_SERVICES = [
  { id: 'api',   name: 'API',                description: 'Core REST API & GraphQL',   status: 'OPERATIONAL'   },
  { id: 'web',   name: 'Web Application',    description: 'Main dashboard & app',      status: 'PARTIAL_OUTAGE' },
  { id: 'db',    name: 'Database',           description: 'Primary PostgreSQL cluster', status: 'OPERATIONAL'   },
  { id: 'cdn',   name: 'CDN / Edge Network', description: 'Global content delivery',   status: 'MAJOR_OUTAGE'  },
  { id: 'auth',  name: 'Authentication',     description: 'Login & session service',   status: 'DEGRADED'      },
  { id: 'jobs',  name: 'Background Jobs',    description: 'Async task processing',     status: 'OPERATIONAL'   },
];

const CDN_INCIDENT = {
  id: 'cdn-incident',
  title: 'CDN edge nodes experiencing packet loss in US-East region',
  status: 'MONITORING' as const,
  impact: 'CRITICAL',
  serviceName: 'CDN / Edge Network',
  serviceId: 'cdn',
  createdAt: new Date(now - 150 * 60 * 1000).toISOString(),
  updates: [
    {
      id: 'u3',
      status: 'MONITORING',
      message:
        'Fix deployed to all affected edge nodes. Packet loss has dropped to under 0.1%. We are monitoring traffic patterns closely over the next 30 minutes.',
      createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'u2',
      status: 'IDENTIFIED',
      message:
        'Root cause identified: a misconfigured routing rule was pushed to US-East PoPs at 14:22 UTC. Engineering is rolling back the change now.',
      createdAt: new Date(now - 80 * 60 * 1000).toISOString(),
    },
    {
      id: 'u1',
      status: 'INVESTIGATING',
      message:
        'We are investigating reports of elevated latency and packet loss from users in the US-East region. Approximately 18% of edge requests are affected. Other regions are unaffected.',
      createdAt: new Date(now - 150 * 60 * 1000).toISOString(),
    },
  ],
};

const AUTH_INCIDENT = {
  id: 'auth-incident',
  title: 'Elevated OAuth callback failure rate',
  status: 'INVESTIGATING' as const,
  impact: 'MINOR',
  serviceName: 'Authentication',
  serviceId: 'auth',
  createdAt: new Date(now - 28 * 60 * 1000).toISOString(),
  updates: [
    {
      id: 'u4',
      status: 'INVESTIGATING',
      message:
        'We are seeing a ~4% failure rate on OAuth 2.0 callback requests. Email/password login is unaffected. Our team is reviewing recent OAuth provider configuration changes.',
      createdAt: new Date(now - 28 * 60 * 1000).toISOString(),
    },
  ],
};

// The live update that gets injected after LIVE_DELAY ms
const LIVE_DELAY = 9000;
const LIVE_UPDATE = {
  id: 'u-live',
  status: 'RESOLVED',
  message:
    'All CDN edge nodes in US-East have been fully restored. Traffic is routing normally across all PoPs. We will publish a post-mortem within 48 hours.',
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Overall status helper
// ---------------------------------------------------------------------------
function computeOverallStatus(services: typeof INITIAL_SERVICES) {
  const statuses = services.map((s) => s.status);
  if (statuses.includes('MAJOR_OUTAGE'))   return 'MAJOR_OUTAGE';
  if (statuses.includes('PARTIAL_OUTAGE')) return 'PARTIAL_OUTAGE';
  if (statuses.includes('DEGRADED'))       return 'DEGRADED';
  if (statuses.includes('MAINTENANCE'))    return 'MAINTENANCE';
  return 'OPERATIONAL';
}

const OVERALL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  OPERATIONAL:   { label: 'All Systems Operational',  color: 'text-status-operational', bg: 'bg-green-950/50 border-green-900/40',   icon: CheckCircle2 },
  DEGRADED:      { label: 'Degraded Performance',     color: 'text-yellow-400',          bg: 'bg-yellow-950/50 border-yellow-900/40', icon: AlertTriangle },
  PARTIAL_OUTAGE:{ label: 'Partial System Outage',    color: 'text-orange-400',          bg: 'bg-orange-950/50 border-orange-900/40', icon: AlertTriangle },
  MAJOR_OUTAGE:  { label: 'Major System Outage',      color: 'text-red-400',             bg: 'bg-red-950/50 border-red-900/40',       icon: AlertTriangle },
  MAINTENANCE:   { label: 'Scheduled Maintenance',    color: 'text-blue-400',            bg: 'bg-blue-950/50 border-blue-900/40',     icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DemoPage() {
  const [services, setServices]           = useState(INITIAL_SERVICES);
  const [incidents, setIncidents]         = useState([CDN_INCIDENT, AUTH_INCIDENT]);
  const [sseConnected, setSseConnected]   = useState(false);
  const [liveUpdateIn, setLiveUpdateIn]   = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing]     = useState(false);
  const [subscribed, setSubscribed]       = useState(false);

  // Simulate SSE connecting after 1.2 s
  useEffect(() => {
    const t = setTimeout(() => setSseConnected(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Simulate a live incident update arriving via SSE
  useEffect(() => {
    // Warn toast at LIVE_DELAY - 3s
    const warn = setTimeout(() => {
      setLiveUpdateIn(true);
    }, LIVE_DELAY - 3000);

    // The actual update
    const update = setTimeout(() => {
      setLiveUpdateIn(false);

      toast.success('Live update received — CDN incident resolved', {
        icon: '⚡',
        duration: 5000,
        style: { background: '#111113', border: '1px solid #27272a', color: '#fafafa' },
      });

      // Inject the new update at the top of the CDN incident timeline
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== 'cdn-incident') return inc;
          return {
            ...inc,
            status: 'RESOLVED' as const,
            updates: [{ ...LIVE_UPDATE, createdAt: new Date().toISOString() }, ...inc.updates],
          };
        })
      );

      // Flip CDN service back to OPERATIONAL
      setServices((prev) =>
        prev.map((svc) => (svc.id === 'cdn' ? { ...svc, status: 'OPERATIONAL' } : svc))
      );
    }, LIVE_DELAY);

    return () => {
      clearTimeout(warn);
      clearTimeout(update);
    };
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!subscribeEmail) return;
    setSubscribing(true);
    // Simulate a network request
    await new Promise((r) => setTimeout(r, 900));
    setSubscribing(false);
    setSubscribed(true);
  }

  const overallStatus = computeOverallStatus(services);
  const overallConfig = OVERALL_CONFIG[overallStatus];
  const OverallIcon   = overallConfig.icon;

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  return (
    <div className="min-h-screen bg-background">
      {/* ── Demo banner ─────────────────────────────────────────────────── */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center">
        <p className="text-sm text-primary font-medium flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          This is a live demo status page. Watch a real-time incident update arrive in a few seconds.
          <Link
            href="/register"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-primary-hover transition-colors font-semibold ml-1"
          >
            Create yours free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>

      {/* ── Live update incoming toast ───────────────────────────────────── */}
      <AnimatePresence>
        {liveUpdateIn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-primary/40 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl"
          >
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span className="text-sm text-muted">Receiving live update from CDN incident…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold">Acme Corp</h1>
            </div>
            <p className="text-muted text-sm">Status Page</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-700 ${
                  sseConnected ? 'bg-status-operational animate-pulse' : 'bg-muted'
                }`}
              />
              {sseConnected ? 'Live' : 'Connecting…'}
            </div>
            <span className="text-xs text-muted hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Overall status banner */}
        <motion.div
          layout
          key={overallStatus}
          className={`flex items-center gap-3 px-5 py-4 rounded-xl border mb-8 transition-all duration-700 ${overallConfig.bg}`}
        >
          <OverallIcon className={`w-5 h-5 ${overallConfig.color} flex-shrink-0`} />
          <span className={`font-semibold ${overallConfig.color}`}>{overallConfig.label}</span>
        </motion.div>

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-muted mb-4 uppercase tracking-widest">Services</h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-muted mt-0.5">{service.description}</p>
                  )}
                </div>
                <StatusBadge status={service.status} size="sm" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Active incidents */}
        <AnimatePresence mode="popLayout">
          {activeIncidents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="mb-8"
            >
              <h2 className="text-xs font-semibold text-muted mb-4 uppercase tracking-widest">
                Active Incidents
                <span className="ml-2 bg-red-950/50 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full text-xs">
                  {activeIncidents.length}
                </span>
              </h2>
              <div className="space-y-4">
                {activeIncidents.map((incident) => (
                  <motion.div
                    key={incident.id}
                    layout
                    className="bg-surface border border-red-900/30 rounded-xl overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-border flex items-start gap-3">
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
                    <div className="px-5 py-5">
                      <IncidentTimeline updates={incident.updates} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Resolved incidents */}
        <AnimatePresence>
          {resolvedIncidents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-xs font-semibold text-muted mb-4 uppercase tracking-widest">
                Recently Resolved
              </h2>
              <div className="space-y-3 opacity-80">
                {resolvedIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-surface border border-border rounded-xl overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-border flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-status-operational flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{incident.title}</p>
                          <StatusBadge status={incident.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {incident.serviceName} · {formatRelativeTime(incident.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-5">
                      <IncidentTimeline updates={incident.updates} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Subscribe section */}
        <section className="bg-surface border border-border rounded-xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Get Notified</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Subscribe to receive email or SMS notifications when incidents are created or updated.
          </p>

          <AnimatePresence mode="wait">
            {subscribed ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-green-950/40 border border-green-900/40 rounded-lg px-4 py-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">You're subscribed!</p>
                  <p className="text-xs text-muted mt-0.5">
                    You'll receive notifications at <span className="text-foreground">{subscribeEmail}</span>.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubscribe}
                className="flex gap-3 flex-wrap"
              >
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 min-w-0 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  {subscribing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
                  ) : (
                    <><Bell className="w-4 h-4" /> Subscribe</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-muted to-surface border border-primary/20 rounded-2xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Build your status page in minutes</h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Everything you just saw — real-time updates, incident timelines, email &amp; SMS subscribers — yours
            for free.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 border border-border hover:border-border-2 text-muted hover:text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              Read the Docs
            </Link>
          </div>
        </div>

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
