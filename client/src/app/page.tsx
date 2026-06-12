import Link from 'next/link';
import { ArrowRight, Zap, Bell, Code2, Globe, Shield, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Downtime.so</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted">
            <Link href="/status/demo" className="hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-muted border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Open source & self-hostable
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
          Your Status Page
          <br />
          <span className="text-primary">in Minutes</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Developer-first incident communication for indie hackers and small teams. Like Statuspage.io
          but actually affordable. Post real-time updates, notify subscribers, and update status via
          REST API.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/status/demo"
            className="inline-flex items-center gap-2 border border-border hover:border-border-2 text-muted-foreground hover:text-foreground px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            View Demo Page
          </Link>
        </div>

        {/* Status preview pill */}
        <div className="mt-16 inline-flex items-center gap-3 bg-surface border border-border rounded-2xl px-6 py-4 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-status-operational animate-pulse-slow" />
          <span className="text-muted-foreground">All Systems Operational</span>
          <span className="text-border">|</span>
          <span className="text-muted">status.yourapp.com</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-muted text-center mb-12">No bloat, no enterprise pricing, just the essentials done right.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Globe,
              title: 'Public Status Page',
              desc: 'Beautiful status page at status.yourapp.com with real-time updates via Server-Sent Events.',
            },
            {
              icon: Bell,
              title: 'Email & SMS Alerts',
              desc: 'Subscribers get instant notifications via email and SMS when incidents are created or updated.',
            },
            {
              icon: Code2,
              title: 'REST API',
              desc: 'Update service status programmatically via API key. Integrate with any monitoring tool.',
            },
            {
              icon: Zap,
              title: 'Webhook Ingestion',
              desc: 'Connect UptimeRobot, Datadog, or any webhook source to auto-create incidents.',
            },
            {
              icon: Clock,
              title: 'Incident Timeline',
              desc: 'Post real-time updates as you investigate and resolve incidents. Full audit trail.',
            },
            {
              icon: Shield,
              title: 'React Embed',
              desc: 'Drop a <DowntimeBanner /> into your app. Shows when there\'s an active incident, hides otherwise.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-surface border border-border rounded-xl p-6 hover:border-border-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code snippet */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface-2 border border-border rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">API-first incident management</h3>
          </div>
          <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
            <code>{`# Create an incident via REST API
curl -X POST https://api.downtime.so/api/v1/incidents \\
  -H "x-api-key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "API latency spike",
    "impact": "MAJOR",
    "serviceId": "svc_xyz",
    "initialMessage": "We are investigating elevated API response times."
  }'

# Add update to timeline
curl -X POST https://api.downtime.so/api/v1/incidents/inc_abc/updates \\
  -H "Authorization: Bearer your_jwt" \\
  -d '{"message": "Root cause identified. Deploying fix.", "status": "IDENTIFIED"}'`}</code>
          </pre>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-muted text-center mb-12">No per-seat nonsense. One flat price.</p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-8">
            <h3 className="font-bold text-xl mb-1">Free</h3>
            <p className="text-3xl font-extrabold mb-4">$0<span className="text-muted text-base font-normal">/mo</span></p>
            <ul className="space-y-3 text-sm text-muted mb-8">
              {['3 services', '100 subscribers', 'Email notifications', 'API access', 'SSE real-time'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-status-operational">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block text-center border border-border hover:border-primary text-sm py-2.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>

          <div className="bg-surface border border-primary/40 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-semibold">Popular</div>
            <h3 className="font-bold text-xl mb-1">Pro</h3>
            <p className="text-3xl font-extrabold mb-4">$9<span className="text-muted text-base font-normal">/mo</span></p>
            <ul className="space-y-3 text-sm text-muted mb-8">
              {['Unlimited services', 'Unlimited subscribers', 'Email + SMS', 'Webhook ingestion', 'Custom domain', 'React embed'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-status-operational">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block text-center bg-primary hover:bg-primary-hover text-white text-sm py-2.5 rounded-lg transition-colors font-medium">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
          <Link href="/status/demo" className="hover:text-foreground transition-colors">Demo</Link>
          <Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link>
        </div>
        <p>© 2025 Downtime.so — Built for developers, by developers.</p>
      </footer>
    </div>
  );
}
