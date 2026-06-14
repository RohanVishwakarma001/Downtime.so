import Link from 'next/link';
import { ArrowRight, Zap, Bell, Code2, Globe, Shield, Clock } from 'lucide-react';
import { AuroraBackground, GradientText, FadeIn, Stagger, StaggerItem } from '@/components/ui';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-x-0 border-t-0 rounded-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center shadow-glow">
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
              className="text-sm bg-gradient-to-r from-primary to-[#8b5cf6] hover:shadow-glow text-white px-4 py-2 rounded-xl font-medium transition-shadow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-primary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Open source &amp; self-hostable
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Your Status Page
            <br />
            <GradientText>in Minutes</GradientText>
          </h1>
        </FadeIn>

        <FadeIn delay={0.16}>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Developer-first incident communication for indie hackers and small teams. Like
            Statuspage.io but actually affordable. Post real-time updates, notify subscribers, and
            update status via REST API.
          </p>
        </FadeIn>

        <FadeIn delay={0.24}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#8b5cf6] hover:shadow-glow text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-shadow"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/status/demo"
              className="inline-flex items-center gap-2 glass hover:bg-white/5 text-muted-foreground hover:text-foreground px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
            >
              View Demo Page
            </Link>
          </div>
        </FadeIn>

        {/* Status preview pill */}
        <FadeIn delay={0.32}>
          <div className="mt-16 inline-flex items-center gap-3 glass rounded-2xl px-6 py-4 text-sm animate-float">
            <div className="w-2.5 h-2.5 rounded-full bg-status-operational animate-pulse-slow" />
            <span className="text-muted-foreground">All Systems Operational</span>
            <span className="text-white/15">|</span>
            <span className="text-muted">status.yourapp.com</span>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn inView>
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-muted text-center mb-12">
            No bloat, no enterprise pricing, just the essentials done right.
          </p>
        </FadeIn>

        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              desc: "Drop a <DowntimeBanner /> into your app. Shows when there's an active incident, hides otherwise.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <StaggerItem
              key={title}
              whileHover={{ y: -4 }}
              className="group glass rounded-2xl p-6 transition-shadow duration-300 hover:shadow-glow"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-[#8b5cf6]/20 ring-1 ring-white/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Code snippet */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <FadeIn inView>
          <div className="glass-strong rounded-2xl p-8">
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
        </FadeIn>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn inView>
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-muted text-center mb-12">No per-seat nonsense. One flat price.</p>
        </FadeIn>

        <Stagger className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <StaggerItem className="glass rounded-2xl p-8">
            <h3 className="font-bold text-xl mb-1">Free</h3>
            <p className="text-3xl font-extrabold mb-4">
              $0<span className="text-muted text-base font-normal">/mo</span>
            </p>
            <ul className="space-y-3 text-sm text-muted mb-8">
              {['3 services', '100 subscribers', 'Email notifications', 'API access', 'SSE real-time'].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-status-operational">✓</span> {f}
                  </li>
                )
              )}
            </ul>
            <Link
              href="/register"
              className="block text-center border border-white/10 hover:border-primary hover:bg-white/5 text-sm py-2.5 rounded-xl transition-colors"
            >
              Get started
            </Link>
          </StaggerItem>

          <StaggerItem className="glass-strong rounded-2xl p-8 relative ring-1 ring-primary/30 shadow-glow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[#8b5cf6] text-white text-xs px-3 py-1 rounded-full font-semibold shadow-glow">
              Popular
            </div>
            <h3 className="font-bold text-xl mb-1">Pro</h3>
            <p className="text-3xl font-extrabold mb-4">
              $9<span className="text-muted text-base font-normal">/mo</span>
            </p>
            <ul className="space-y-3 text-sm text-muted mb-8">
              {['Unlimited services', 'Unlimited subscribers', 'Email + SMS', 'Webhook ingestion', 'Custom domain', 'React embed'].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-status-operational">✓</span> {f}
                  </li>
                )
              )}
            </ul>
            <Link
              href="/register"
              className="block text-center bg-gradient-to-r from-primary to-[#8b5cf6] hover:shadow-glow text-white text-sm py-2.5 rounded-xl transition-shadow font-medium"
            >
              Start free trial
            </Link>
          </StaggerItem>
        </Stagger>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link href="/status/demo" className="hover:text-foreground transition-colors">
            Demo
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Get Started
          </Link>
        </div>
        <p>© 2025 Downtime.so — Built for developers, by developers.</p>
      </footer>
    </div>
  );
}
