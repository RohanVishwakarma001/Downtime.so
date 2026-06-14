"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Check,
  Key,
  Globe,
  Webhook,
  Code2,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { copyToClipboard } from "@/lib/utils";
import toast from "react-hot-toast";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg border border-border hover:border-border-2"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          {label || "Copied!"}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label || "Copy"}
        </>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative bg-surface-2 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-muted-foreground overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SettingsPage() {
  const user = getUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Resolve the public origin at runtime so the status-page URL always matches
  // the domain the dashboard is actually served from (never localhost in prod).
  const [APP_URL, setAppUrl] = useState(process.env.NEXT_PUBLIC_APP_URL || "");
  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  const { data: orgData } = useQuery({
    queryKey: ["org-settings"],
    queryFn: () => api.get("/api/v1/services/org").then((r) => r.data),
  });

  if (!user) return null;

  const statusPageUrl = `${APP_URL}/status/${user.orgSlug}`;
  const uptimeRobotWebhook = `${API_URL}/api/webhooks/uptimerobot`;
  const datadogWebhook = `${API_URL}/api/webhooks/datadog`;

  const embedCode = `import { DowntimeBanner } from '@downtime/react';

function App() {
  return (
    <div>
      <DowntimeBanner
        orgSlug="${user.orgSlug}"
        apiUrl="${API_URL}"
        statusPageUrl="${statusPageUrl}"
      />
      {/* rest of your app */}
    </div>
  );
}`;

  const npmInstall = `npm install @downtime/react`;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-1">
          Configure your status page and integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Organization</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">
                Organization Name
              </label>
              <div className="flex items-center gap-3">
                <input
                  value={user.orgName}
                  readOnly
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">
                Slug / URL identifier
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono">
                  {user.orgSlug}
                </code>
                <CopyButton text={user.orgSlug} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">
                Public Status Page
              </label>
              <div className="flex items-center gap-3">
                <a
                  href={statusPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5 min-w-0"
                >
                  <span className="truncate">{statusPageUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
                <CopyButton text={statusPageUrl} />
              </div>
            </div>
          </div>
        </section>

        {/* API Key */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">API Access</h2>
          </div>

          <div className="mb-5">
            <label className="text-xs text-muted block mb-1.5">
              Your API Key
            </label>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground truncate">
                {orgData?.org?.apiKey ?? "Loading..."}
              </code>
              {orgData?.org?.apiKey && (
                <CopyButton text={orgData.org.apiKey} label="Copy key" />
              )}
            </div>
            <p className="text-xs text-muted mt-1.5">
              Keep this secret — it provides full API access to your
              organization.
            </p>
          </div>

          <CodeBlock
            code={`# Create incident via API
curl -X POST ${API_URL}/api/v1/incidents/api \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"API issues","impact":"MAJOR","serviceId":"svc_id","initialMessage":"Investigating..."}'`}
            language="bash"
          />
        </section>

        {/* Webhooks */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Webhook className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Webhook Integrations</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Append{" "}
            <code className="text-primary bg-primary-muted px-1 py-0.5 rounded text-xs">
              ?serviceId=YOUR_SERVICE_ID&amp;secret=YOUR_WEBHOOK_SECRET
            </code>{" "}
            to each webhook URL (or send both in the request body). The{" "}
            <span className="text-foreground">webhook secret</span> is shown on
            each service&apos;s page and is required — requests without a valid
            secret are rejected.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-2">
                UptimeRobot Webhook URL
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground overflow-x-auto">
                  {uptimeRobotWebhook}?serviceId=YOUR_SERVICE_ID&secret=YOUR_WEBHOOK_SECRET
                </code>
                <CopyButton
                  text={`${uptimeRobotWebhook}?serviceId=YOUR_SERVICE_ID&secret=YOUR_WEBHOOK_SECRET`}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                In UptimeRobot: Monitors → Edit → Alert contacts → Webhook
              </p>
            </div>

            <div>
              <label className="text-xs text-muted block mb-2">
                Datadog Webhook URL
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground overflow-x-auto">
                  {datadogWebhook}?serviceId=YOUR_SERVICE_ID&secret=YOUR_WEBHOOK_SECRET
                </code>
                <CopyButton
                  text={`${datadogWebhook}?serviceId=YOUR_SERVICE_ID&secret=YOUR_WEBHOOK_SECRET`}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                In Datadog: Integrations → Webhooks → New Webhook
              </p>
            </div>
          </div>
        </section>

        {/* React Embed */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">React Embed</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Add the{" "}
            <code className="text-primary bg-primary-muted px-1 py-0.5 rounded text-xs">
              {"<DowntimeBanner />"}
            </code>{" "}
            component to your app. It renders nothing when all systems are
            operational.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted block mb-2">Install</label>
              <CodeBlock code={npmInstall} language="bash" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-2">Usage</label>
              <CodeBlock code={embedCode} language="tsx" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
