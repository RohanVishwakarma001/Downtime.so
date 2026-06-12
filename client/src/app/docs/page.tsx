'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Zap, Copy, Check, Menu, X, ChevronRight,
  Globe, Bell, Code2, Webhook, AlertTriangle,
  Server, Users, Settings, Key, BookOpen,
} from 'lucide-react';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Section {
  id: string;
  title: string;
  parent?: string;
}

// ---------------------------------------------------------------------------
// Sidebar structure
// ---------------------------------------------------------------------------
const SECTIONS: Section[] = [
  { id: 'introduction',        title: 'Introduction' },
  { id: 'getting-started',     title: 'Getting Started' },
  { id: 'services',            title: 'Services' },
  { id: 'incidents',           title: 'Incidents' },
  { id: 'subscribers',         title: 'Subscribers & Notifications' },
  { id: 'status-page',         title: 'Public Status Page' },
  { id: 'api-reference',       title: 'API Reference' },
  { id: 'api-auth',            title: 'Authentication',     parent: 'api-reference' },
  { id: 'api-services',        title: 'Services',           parent: 'api-reference' },
  { id: 'api-incidents',       title: 'Incidents',          parent: 'api-reference' },
  { id: 'api-subscribers',     title: 'Subscribers',        parent: 'api-reference' },
  { id: 'webhooks',            title: 'Webhook Integrations' },
  { id: 'react-embed',         title: 'React Embed' },
];

// ---------------------------------------------------------------------------
// Inline Code + Code Block components
// ---------------------------------------------------------------------------
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-surface-2 border border-border text-primary rounded px-1.5 py-0.5 text-xs font-mono">
      {children}
    </code>
  );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-border">
        <span className="text-xs text-muted font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#0d0d0f] px-5 py-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info:    'bg-blue-950/30 border-blue-900/40 text-blue-300',
    warning: 'bg-yellow-950/30 border-yellow-900/40 text-yellow-300',
    tip:     'bg-green-950/30 border-green-900/40 text-green-300',
  };
  const labels = { info: 'Note', warning: 'Warning', tip: 'Tip' };
  return (
    <div className={`border rounded-lg px-4 py-3 my-4 text-sm ${styles[type]}`}>
      <span className="font-semibold">{labels[type]}: </span>{children}
    </div>
  );
}

function Badge({ children, color = 'primary' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    primary:  'bg-primary-muted text-primary border-primary/30',
    green:    'bg-green-950/50 text-green-400 border-green-900/40',
    yellow:   'bg-yellow-950/50 text-yellow-400 border-yellow-900/40',
    orange:   'bg-orange-950/50 text-orange-400 border-orange-900/40',
    red:      'bg-red-950/50 text-red-400 border-red-900/40',
    blue:     'bg-blue-950/50 text-blue-400 border-blue-900/40',
    gray:     'bg-surface-2 text-muted border-border',
  };
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color] || colors.primary}`}>
      {children}
    </span>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold mt-14 mb-5 scroll-mt-20 flex items-center gap-2 group">
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted">
        #
      </a>
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold mt-10 mb-3 scroll-mt-20 flex items-center gap-2 group">
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted">
        #
      </a>
    </h3>
  );
}

function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">{children}</h4>;
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-muted leading-7 mb-3">{children}</p>;
}

function StatusRow({ status, color, label, desc }: { status: string; color: string; label: string; desc: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4"><Badge color={color}>{status}</Badge></td>
      <td className="py-3 pr-4 text-sm font-medium">{label}</td>
      <td className="py-3 text-sm text-muted">{desc}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function DocsPage() {
  const [activeId, setActiveId] = useState('introduction');
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track which section is in view for sidebar highlighting
  useEffect(() => {
    const allIds = SECTIONS.map((s) => s.id);
    const entries = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (obs) => {
        obs.forEach((e) => entries.set(e.target.id, e.intersectionRatio));
        let best = '';
        let bestRatio = -1;
        allIds.forEach((id) => {
          const r = entries.get(id) ?? 0;
          if (r > bestRatio) { bestRatio = r; best = id; }
        });
        if (best) setActiveId(best);
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  function SidebarLink({ section }: { section: Section }) {
    const isActive = activeId === section.id;
    const isChild = !!section.parent;
    return (
      <a
        href={`#${section.id}`}
        onClick={() => setMobileOpen(false)}
        className={`block py-1.5 text-sm transition-colors ${
          isChild ? 'pl-4' : 'pl-0'
        } ${isActive ? 'text-primary font-medium' : 'text-muted hover:text-foreground'}`}
      >
        {section.title}
      </a>
    );
  }

  const sidebarContent = (
    <nav className="space-y-0.5">
      {SECTIONS.map((s) => (
        <SidebarLink key={s.id} section={s} />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-sm">Downtime.so</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm">
              <ChevronRight className="w-3.5 h-3.5 text-muted" />
              <span className="flex items-center gap-1.5 text-muted font-medium">
                <BookOpen className="w-3.5 h-3.5" /> Documentation
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-muted hover:text-foreground transition-colors">Log in</Link>
            <Link href="/register" className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
              Get Started
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-muted hover:text-foreground transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-64 bg-surface border-r border-border overflow-y-auto p-6">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-12 py-10">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-24">{sidebarContent}</div>
        </aside>

        {/* Main content */}
        <article className="flex-1 min-w-0 max-w-3xl">

          {/* ----------------------------------------------------------------
              INTRODUCTION
          ---------------------------------------------------------------- */}
          <div id="introduction">
            <div className="inline-flex items-center gap-2 bg-primary-muted border border-primary/20 rounded-full px-3 py-1 text-xs text-primary mb-4 font-medium">
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </div>
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Downtime.so</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Developer-first incident communication and status page infrastructure for indie hackers and small teams.
              Get a public status page, real-time incident timeline, and subscriber notifications up and running in minutes.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Globe,         label: 'Public Status Page',     desc: 'Live status page at your URL' },
                { icon: AlertTriangle, label: 'Incident Management',    desc: 'Timeline-driven incident updates' },
                { icon: Bell,          label: 'Email & SMS Alerts',     desc: 'Subscriber notifications on events' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-surface border border-border rounded-xl p-4">
                  <Icon className="w-5 h-5 text-primary mb-3" />
                  <p className="text-sm font-semibold mb-1">{label}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              ))}
            </div>

            <H4>Core concepts</H4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-6 text-xs font-semibold text-muted uppercase tracking-wide">Concept</th>
                    <th className="pb-2 text-xs font-semibold text-muted uppercase tracking-wide">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Organization', 'Your account and its configuration. Every registered user belongs to one organization.'],
                    ['Service',      'A system or component you monitor (e.g. "API", "Web App", "Database"). Services have a status and can have incidents.'],
                    ['Incident',     'A service disruption event. Has a title, impact level, and a chronological timeline of updates.'],
                    ['Update',       'A timestamped message posted to an incident timeline as you investigate and resolve the issue.'],
                    ['Subscriber',   'A person who opted in to receive email or SMS notifications when incidents occur on a service.'],
                    ['Status Page',  'The public-facing page at /status/{orgSlug} showing all services and active incidents.'],
                  ].map(([term, def]) => (
                    <tr key={term as string} className="border-b border-border last:border-0">
                      <td className="py-3 pr-6 font-mono text-xs text-primary align-top">{term}</td>
                      <td className="py-3 text-muted leading-6">{def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ----------------------------------------------------------------
              GETTING STARTED
          ---------------------------------------------------------------- */}
          <SectionHeading id="getting-started">Getting Started</SectionHeading>

          <Para>
            You can be fully operational — with a live status page and your first service — in under five minutes.
          </Para>

          <H4>1. Create an account</H4>
          <Para>
            Navigate to <InlineCode>/register</InlineCode> and fill in your name, organization name,
            email address, and a password of at least 8 characters. Your organization name becomes your
            URL slug (e.g. <InlineCode>acme-corp</InlineCode> → <InlineCode>/status/acme-corp</InlineCode>).
          </Para>

          <H4>2. Add a service</H4>
          <Para>
            From the dashboard, go to <strong>Services</strong> → <strong>Add Service</strong>. Give it a name
            (e.g. "API", "Website", "Database") and an optional description. New services start as{' '}
            <Badge color="green">OPERATIONAL</Badge>.
          </Para>

          <H4>3. Share your status page</H4>
          <Para>
            Your status page is immediately live at <InlineCode>/status/{'{orgSlug}'}</InlineCode>.
            Find the full URL in <strong>Settings → Organization → Public Status Page</strong>.
            Share this link with your users so they can see live status and subscribe to notifications.
          </Para>

          <H4>4. Create your first incident</H4>
          <Para>
            When a service has an issue, go to <strong>Incidents → Create Incident</strong>. Select the
            affected service, set the impact level, and write an initial message describing what is happening.
            The service status updates automatically and all subscribers receive a notification.
          </Para>

          <Callout type="tip">
            You can also create incidents programmatically via the REST API or have them created automatically
            by webhook integrations (UptimeRobot, Datadog).
          </Callout>

          {/* ----------------------------------------------------------------
              SERVICES
          ---------------------------------------------------------------- */}
          <SectionHeading id="services">
            <Server className="w-6 h-6 text-primary" /> Services
          </SectionHeading>

          <Para>
            Services represent the components of your infrastructure that you want to surface on your status page.
            Each service has an independent status that you can update manually, through the API, or automatically
            via webhooks and incident lifecycle events.
          </Para>

          <H4>Service statuses</H4>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse border border-border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-surface-2 border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Label</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="green">OPERATIONAL</Badge></td><td className="px-4 py-3 text-sm font-medium">Operational</td><td className="px-4 py-3 text-sm text-muted">Service is fully functioning normally</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="yellow">DEGRADED</Badge></td><td className="px-4 py-3 text-sm font-medium">Degraded</td><td className="px-4 py-3 text-sm text-muted">Reduced performance but service is available</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="orange">PARTIAL_OUTAGE</Badge></td><td className="px-4 py-3 text-sm font-medium">Partial Outage</td><td className="px-4 py-3 text-sm text-muted">Some users or features are affected</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="red">MAJOR_OUTAGE</Badge></td><td className="px-4 py-3 text-sm font-medium">Major Outage</td><td className="px-4 py-3 text-sm text-muted">Service is down or completely unavailable</td></tr>
                <tr><td className="px-4 py-3"><Badge color="blue">MAINTENANCE</Badge></td><td className="px-4 py-3 text-sm font-medium">Maintenance</td><td className="px-4 py-3 text-sm text-muted">Planned maintenance window is in progress</td></tr>
              </tbody>
            </table>
          </div>

          <H4>Automatic status transitions</H4>
          <Para>
            When you create an incident, the affected service status is automatically set based on impact:
          </Para>
          <ul className="list-disc list-inside text-muted text-sm space-y-1 mb-4 ml-2">
            <li><Badge color="yellow">MINOR</Badge> impact → service becomes <Badge color="yellow">DEGRADED</Badge></li>
            <li><Badge color="orange">MAJOR</Badge> impact → service becomes <Badge color="orange">PARTIAL_OUTAGE</Badge></li>
            <li><Badge color="red">CRITICAL</Badge> impact → service becomes <Badge color="red">MAJOR_OUTAGE</Badge></li>
          </ul>
          <Para>
            When the incident is resolved, the service automatically reverts to <Badge color="green">OPERATIONAL</Badge>{' '}
            (provided no other active incidents remain on that service).
          </Para>

          <Callout type="info">
            Deleting a service also removes all its incidents, incident updates, and subscribers.
          </Callout>

          {/* ----------------------------------------------------------------
              INCIDENTS
          ---------------------------------------------------------------- */}
          <SectionHeading id="incidents">
            <AlertTriangle className="w-6 h-6 text-primary" /> Incidents
          </SectionHeading>

          <Para>
            An incident is the primary communication unit in Downtime.so. Every incident has a title, impact level,
            an affected service, and a timeline of updates that are visible on the public status page in real time.
          </Para>

          <H4>Impact levels</H4>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse border border-border rounded-xl overflow-hidden">
              <thead><tr className="bg-surface-2 border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Impact</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Severity</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Typical use</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="yellow">MINOR</Badge></td><td className="px-4 py-3 text-sm font-medium">Minor</td><td className="px-4 py-3 text-sm text-muted">Slowness or minor degradation, most users unaffected</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-3"><Badge color="orange">MAJOR</Badge></td><td className="px-4 py-3 text-sm font-medium">Major</td><td className="px-4 py-3 text-sm text-muted">Significant impact, large portion of users affected</td></tr>
                <tr><td className="px-4 py-3"><Badge color="red">CRITICAL</Badge></td><td className="px-4 py-3 text-sm font-medium">Critical</td><td className="px-4 py-3 text-sm text-muted">Complete outage or major data integrity issue</td></tr>
              </tbody>
            </table>
          </div>

          <H4>Incident lifecycle</H4>
          <Para>
            Incidents progress through four statuses as your team investigates and resolves the issue:
          </Para>
          <div className="flex items-center gap-2 flex-wrap my-4">
            {[
              { s: 'INVESTIGATING', c: 'orange', desc: 'Initial state when created' },
              { s: 'IDENTIFIED',    c: 'yellow', desc: 'Root cause found' },
              { s: 'MONITORING',    c: 'blue',   desc: 'Fix deployed, watching' },
              { s: 'RESOLVED',      c: 'green',  desc: 'Fully resolved' },
            ].map(({ s, c, desc }, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-muted" />}
                <div className="flex flex-col items-center gap-1">
                  <Badge color={c}>{s}</Badge>
                  <span className="text-xs text-muted">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <H4>Posting updates</H4>
          <Para>
            From the incident detail page, use the <strong>Post Update</strong> form to add a new timeline entry.
            Each update includes a status (to advance the incident through its lifecycle) and a message for subscribers
            and the public status page. Every update triggers a notification to all subscribers of the affected service.
          </Para>

          <H4>Resolving an incident</H4>
          <Para>
            Click <strong>Resolve Incident</strong> on the incident detail page. This posts a final update with
            status <Badge color="green">RESOLVED</Badge>, sets <InlineCode>resolvedAt</InlineCode> on the incident,
            and — if no other active incidents remain — restores the service to <Badge color="green">OPERATIONAL</Badge>.
            Resolved incidents are moved to a separate "Resolved" section in the incidents list.
          </Para>

          {/* ----------------------------------------------------------------
              SUBSCRIBERS
          ---------------------------------------------------------------- */}
          <SectionHeading id="subscribers">
            <Users className="w-6 h-6 text-primary" /> Subscribers & Notifications
          </SectionHeading>

          <Para>
            Subscribers are people who have opted in to receive incident notifications for one or more of your services.
            They can provide an email address, a phone number (for SMS), or both.
          </Para>

          <H4>How subscribers sign up</H4>
          <Para>
            The public status page (<InlineCode>/status/{'{orgSlug}'}</InlineCode>) has a{' '}
            <strong>Get Notified</strong> form at the bottom. Visitors enter their email or phone number and
            select a service. Subscriptions are per-service — a subscriber who monitors "API" will only receive
            notifications about incidents on that service.
          </Para>

          <H4>Notification triggers</H4>
          <Para>
            Notifications are sent to all subscribers of a service when:
          </Para>
          <ul className="list-disc list-inside text-muted text-sm space-y-1.5 mb-4 ml-2">
            <li>A new incident is created on the service</li>
            <li>A new update is posted to an active incident on the service</li>
          </ul>

          <H4>Email notifications</H4>
          <Para>
            Emails are sent via <strong>Resend</strong> from <InlineCode>status@downtime.so</InlineCode>.
            Each email contains the incident title, current status, the latest update message, and an
            unsubscribe link.
          </Para>

          <H4>SMS notifications</H4>
          <Para>
            SMS messages are sent via <strong>Twilio</strong>. Messages include the service name, incident title,
            and a truncated version of the latest update (up to 100 characters). Phone numbers must be in
            E.164 format (e.g. <InlineCode>+14155550123</InlineCode>).
          </Para>

          <H4>Managing subscribers</H4>
          <Para>
            The <strong>Subscribers</strong> page in the dashboard shows all subscribers across all services.
            You can filter by service and export the full list as a CSV file.
          </Para>

          {/* ----------------------------------------------------------------
              STATUS PAGE
          ---------------------------------------------------------------- */}
          <SectionHeading id="status-page">
            <Globe className="w-6 h-6 text-primary" /> Public Status Page
          </SectionHeading>

          <Para>
            Every organization gets a public status page at:
          </Para>
          <CodeBlock code="https://downtime.so/status/{orgSlug}" language="url" />

          <Para>
            The page is publicly accessible — no login required. It shows:
          </Para>
          <ul className="list-disc list-inside text-muted text-sm space-y-1.5 mb-4 ml-2">
            <li>An overall status banner (derived from the worst service status)</li>
            <li>Individual status badges for every service</li>
            <li>Active incidents with their full update timelines</li>
            <li>A subscribe form for email and SMS notifications</li>
          </ul>

          <H4>Real-time updates</H4>
          <Para>
            The status page uses <strong>Server-Sent Events (SSE)</strong> to push updates instantly.
            When a service status changes or a new incident update is posted, visitors see the change
            without refreshing. A live indicator in the top-right corner of the page shows the connection state.
          </Para>

          <H4>Overall status calculation</H4>
          <Para>
            The top-level banner shows the worst status across all services, evaluated in this priority order:
          </Para>
          <ol className="list-decimal list-inside text-muted text-sm space-y-1 mb-4 ml-2">
            <li><Badge color="red">MAJOR_OUTAGE</Badge> — if any service is in major outage</li>
            <li><Badge color="orange">PARTIAL_OUTAGE</Badge> — if any service has a partial outage</li>
            <li><Badge color="yellow">DEGRADED</Badge> — if any service is degraded</li>
            <li><Badge color="blue">MAINTENANCE</Badge> — if any service is in maintenance</li>
            <li><Badge color="green">OPERATIONAL</Badge> — all systems are working normally</li>
          </ol>

          <Callout type="tip">
            Find your full status page URL in the dashboard under <strong>Settings → Organization → Public Status Page</strong>.
            Copy it and add it to your app's footer, error pages, or support documentation.
          </Callout>

          {/* ----------------------------------------------------------------
              API REFERENCE
          ---------------------------------------------------------------- */}
          <SectionHeading id="api-reference">
            <Code2 className="w-6 h-6 text-primary" /> API Reference
          </SectionHeading>

          <Para>
            Downtime.so exposes a REST API for programmatic access to all resources. All endpoints accept and
            return JSON. The base URL for all API calls is your server URL (set as{' '}
            <InlineCode>NEXT_PUBLIC_API_URL</InlineCode> in the frontend).
          </Para>

          <SubHeading id="api-auth">Authentication</SubHeading>
          <Para>
            Two authentication methods are supported depending on the endpoint:
          </Para>

          <H4>JWT Bearer token (dashboard endpoints)</H4>
          <Para>
            Obtained by calling <InlineCode>POST /api/auth/login</InlineCode> or{' '}
            <InlineCode>POST /api/auth/register</InlineCode>. Access tokens expire after 15 minutes;
            use the refresh token to obtain a new one via <InlineCode>POST /api/auth/refresh</InlineCode>.
          </Para>
          <CodeBlock code={`Authorization: Bearer <access_token>`} language="http" />

          <H4>API Key (machine-to-machine)</H4>
          <Para>
            Your organization's API key is shown in <strong>Settings → API Access</strong>. Pass it as
            a request header. API keys are rate-limited to 50 requests per minute using a sliding window.
          </Para>
          <CodeBlock code={`x-api-key: <your_api_key>`} language="http" />

          <SubHeading id="api-services">Services</SubHeading>

          <div className="space-y-4">
            {[
              { method: 'GET',    path: '/api/v1/services',      auth: 'JWT', desc: 'List all services for your organization' },
              { method: 'POST',   path: '/api/v1/services',      auth: 'JWT', desc: 'Create a new service' },
              { method: 'GET',    path: '/api/v1/services/:id',  auth: 'JWT', desc: 'Get a service with its recent incidents' },
              { method: 'PATCH',  path: '/api/v1/services/:id',  auth: 'JWT', desc: 'Update service name, description, or status' },
              { method: 'DELETE', path: '/api/v1/services/:id',  auth: 'JWT', desc: 'Delete a service and all related data' },
            ].map(({ method, path, auth, desc }) => (
              <div key={path + method} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <Badge color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : method === 'PATCH' ? 'yellow' : 'red'}>
                  {method}
                </Badge>
                <div>
                  <code className="text-xs font-mono text-foreground">{path}</code>
                  <p className="text-sm text-muted mt-0.5">{desc} <span className="text-xs text-muted-foreground">({auth})</span></p>
                </div>
              </div>
            ))}
          </div>

          <CodeBlock language="bash" code={`# Create a service
curl -X POST https://your-api.com/api/v1/services \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "API", "description": "Main REST API"}'

# Update service status
curl -X PATCH https://your-api.com/api/v1/services/<id> \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "DEGRADED"}'`} />

          <SubHeading id="api-incidents">Incidents</SubHeading>

          <div className="space-y-4">
            {[
              { method: 'GET',  path: '/api/v1/incidents',              auth: 'JWT',     desc: 'List incidents for your org (paginated, filterable by status)' },
              { method: 'POST', path: '/api/v1/incidents',              auth: 'JWT',     desc: 'Create incident from the dashboard' },
              { method: 'POST', path: '/api/v1/incidents/api',          auth: 'API Key', desc: 'Create incident programmatically (machine-to-machine)' },
              { method: 'GET',  path: '/api/v1/incidents/:id',          auth: 'JWT',     desc: 'Get incident with full update timeline' },
              { method: 'PATCH',path: '/api/v1/incidents/:id',          auth: 'JWT',     desc: 'Update incident title, status, or impact' },
              { method: 'POST', path: '/api/v1/incidents/:id/updates',  auth: 'JWT',     desc: 'Post a new update to the incident timeline' },
            ].map(({ method, path, auth, desc }) => (
              <div key={path + method} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <Badge color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : method === 'PATCH' ? 'yellow' : 'red'}>
                  {method}
                </Badge>
                <div>
                  <code className="text-xs font-mono text-foreground">{path}</code>
                  <p className="text-sm text-muted mt-0.5">{desc} <span className="text-xs text-muted-foreground">({auth})</span></p>
                </div>
              </div>
            ))}
          </div>

          <CodeBlock language="bash" code={`# Create an incident via API key
curl -X POST https://your-api.com/api/v1/incidents/api \\
  -H "x-api-key: <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Elevated API error rates",
    "impact": "MAJOR",
    "serviceId": "<service_id>",
    "initialMessage": "We are investigating elevated error rates on the API."
  }'

# Post a timeline update
curl -X POST https://your-api.com/api/v1/incidents/<id>/updates \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Root cause identified. Deploying a fix now.",
    "status": "IDENTIFIED"
  }'`} />

          <SubHeading id="api-subscribers">Subscribers</SubHeading>

          <div className="space-y-4 mb-4">
            {[
              { method: 'GET',    path: '/api/v1/subscribers',                  auth: 'JWT',    desc: 'List subscribers (filter by serviceId, paginated)' },
              { method: 'POST',   path: '/api/v1/subscribers',                  auth: 'Public', desc: 'Subscribe to a service (used by the status page)' },
              { method: 'DELETE', path: '/api/v1/subscribers/:id?token=<token>','auth': 'Token', desc: 'Unsubscribe via one-click link in notification emails' },
            ].map(({ method, path, auth, desc }) => (
              <div key={path + method} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <Badge color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : 'red'}>
                  {method}
                </Badge>
                <div>
                  <code className="text-xs font-mono text-foreground">{path}</code>
                  <p className="text-sm text-muted mt-0.5">{desc} <span className="text-xs text-muted-foreground">({auth})</span></p>
                </div>
              </div>
            ))}
          </div>

          <CodeBlock language="bash" code={`# Subscribe to a service (public endpoint, no auth needed)
curl -X POST https://your-api.com/api/v1/subscribers \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "serviceId": "<service_id>"
  }'

# Subscribe via SMS
curl -X POST https://your-api.com/api/v1/subscribers \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+14155550123",
    "serviceId": "<service_id>"
  }'`} />

          {/* ----------------------------------------------------------------
              WEBHOOKS
          ---------------------------------------------------------------- */}
          <SectionHeading id="webhooks">
            <Webhook className="w-6 h-6 text-primary" /> Webhook Integrations
          </SectionHeading>

          <Para>
            Webhooks let external monitoring tools automatically update your service status and create incidents
            without manual intervention. Downtime.so supports three webhook endpoints.
          </Para>

          <H4>UptimeRobot</H4>
          <Para>
            Configure a webhook alert contact in UptimeRobot. When a monitor goes down, an incident is automatically
            created. When it recovers, the incident is auto-resolved and the service returns to operational.
          </Para>
          <CodeBlock language="url" code={`POST /api/webhooks/uptimerobot?serviceId=<service_id>`} />
          <Para>
            In UptimeRobot: <strong>My Settings → Alert Contacts → Add Alert Contact → Webhook</strong>.
            Set the URL to the endpoint above and include your service ID as a query parameter.
          </Para>

          <H4>Datadog</H4>
          <Para>
            Connect Datadog alerts to auto-create and resolve incidents based on alert state changes
            (<InlineCode>Alert</InlineCode>, <InlineCode>Warn</InlineCode>, <InlineCode>Resolved</InlineCode>).
          </Para>
          <CodeBlock language="url" code={`POST /api/webhooks/datadog?serviceId=<service_id>`} />
          <Para>
            In Datadog: <strong>Integrations → Webhooks → New Webhook</strong>. Set the URL and optionally
            include a <InlineCode>serviceId</InlineCode> in the payload body.
          </Para>

          <H4>Generic webhook</H4>
          <Para>
            Use the generic webhook endpoint to update service status from any tool that can send an HTTP request.
            This endpoint requires API key authentication.
          </Para>
          <CodeBlock language="bash" code={`curl -X POST https://your-api.com/api/webhooks/generic \\
  -H "x-api-key: <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "serviceId": "<service_id>",
    "status": "MAJOR_OUTAGE",
    "incidentTitle": "Database connection failures",
    "message": "Primary database is unreachable."
  }'`} />

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse border border-border rounded-xl overflow-hidden">
              <thead><tr className="bg-surface-2 border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Field</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Required</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Description</th>
              </tr></thead>
              <tbody>
                {[
                  ['serviceId',     'string',  'Yes', 'The ID of the service to update'],
                  ['status',        'enum',    'Yes', 'One of the five service status values'],
                  ['message',       'string',  'No',  'Initial incident message (creates an incident if provided with a non-operational status)'],
                  ['incidentTitle', 'string',  'No',  'Title for the auto-created incident (defaults to "{service} incident")'],
                ].map(([f, t, r, d]) => (
                  <tr key={f as string} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{f}</td>
                    <td className="px-4 py-3 text-sm text-muted">{t}</td>
                    <td className="px-4 py-3 text-sm">{r === 'Yes' ? <Badge color="red">Required</Badge> : <Badge color="gray">Optional</Badge>}</td>
                    <td className="px-4 py-3 text-sm text-muted">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ----------------------------------------------------------------
              REACT EMBED
          ---------------------------------------------------------------- */}
          <SectionHeading id="react-embed">
            <Code2 className="w-6 h-6 text-primary" /> React Embed
          </SectionHeading>

          <Para>
            The <InlineCode>{'<DowntimeBanner />'}</InlineCode> component lets you surface active incidents
            directly inside your application. It renders nothing when all systems are operational and shows
            a banner when there is an active incident.
          </Para>

          <H4>Installation</H4>
          <CodeBlock language="bash" code={`npm install @downtime/react`} />

          <H4>Usage</H4>
          <CodeBlock language="tsx" code={`import { DowntimeBanner } from '@downtime/react';

export default function App() {
  return (
    <div>
      <DowntimeBanner
        orgSlug="your-org-slug"
        apiUrl="https://your-api.downtime.so"
        statusPageUrl="https://downtime.so/status/your-org-slug"
      />
      {/* rest of your application */}
    </div>
  );
}`} />

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse border border-border rounded-xl overflow-hidden">
              <thead><tr className="bg-surface-2 border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Prop</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase">Description</th>
              </tr></thead>
              <tbody>
                {[
                  ['orgSlug',        'string', 'Your organization slug (from Settings)'],
                  ['apiUrl',         'string', 'Base URL of your Downtime.so API server'],
                  ['statusPageUrl',  'string', 'Link shown in the banner pointing to your full status page'],
                ].map(([prop, type, desc]) => (
                  <tr key={prop as string} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{prop}</td>
                    <td className="px-4 py-3 text-sm text-muted font-mono">{type}</td>
                    <td className="px-4 py-3 text-sm text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="info">
            The embed component connects to the SSE endpoint and updates in real-time without polling.
            It will show an incident banner as soon as a new incident is created, even if the user has
            not refreshed the page.
          </Callout>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-sm text-muted">
            <span>© 2025 Downtime.so</span>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
