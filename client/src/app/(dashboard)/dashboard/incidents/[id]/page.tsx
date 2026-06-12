'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { IncidentTimeline } from '@/components/ui/IncidentTimeline';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'] as const;
type IncidentStatus = (typeof STATUS_STEPS)[number];

const STATUS_COLORS: Record<IncidentStatus, string> = {
  INVESTIGATING: 'bg-orange-500',
  IDENTIFIED: 'bg-yellow-500',
  MONITORING: 'bg-blue-500',
  RESOLVED: 'bg-green-500',
};

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>('INVESTIGATING');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.get(`/api/v1/incidents/${id}`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const incident = data?.incident;

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateMessage.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/v1/incidents/${id}/updates`, {
        message: updateMessage,
        status: updateStatus,
      });

      toast.success('Update posted');
      setUpdateMessage('');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post update');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve() {
    if (!confirm('Mark this incident as resolved?')) return;

    try {
      await api.post(`/api/v1/incidents/${id}/updates`, {
        message: 'This incident has been resolved. All systems are now operating normally.',
        status: 'RESOLVED',
      });

      toast.success('Incident resolved');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resolve incident');
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface rounded w-32" />
          <div className="h-10 bg-surface rounded" />
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center pt-20">
        <p className="text-muted">Incident not found</p>
        <Link href="/dashboard/incidents" className="text-primary text-sm mt-2 inline-block">
          ← Back to incidents
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(incident.status as IncidentStatus);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All incidents
      </Link>

      {/* Incident header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-muted">{incident.service?.name}</span>
              <span className="text-muted text-xs">·</span>
              <span className="text-xs text-muted">{formatRelativeTime(incident.createdAt)}</span>
            </div>
            <h1 className="text-xl font-bold">{incident.title}</h1>
          </div>
          <StatusBadge status={incident.status} />
        </div>

        {/* Status progression */}
        <div className="mt-5">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? `${STATUS_COLORS[step]} border-transparent`
                          : 'border-border bg-surface-2'
                      } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-surface ring-opacity-50 ring-current' : ''}`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${isCompleted ? 'text-foreground' : 'text-muted'}`}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 -mt-5 ${index < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {incident.resolvedAt && (
          <p className="text-xs text-muted mt-4">
            Resolved {formatDateTime(incident.resolvedAt)}
          </p>
        )}
      </motion.div>

      {/* Timeline */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-sm mb-5">Timeline</h2>
        <IncidentTimeline updates={incident.updates || []} />
      </div>

      {/* Add update form — only if not resolved */}
      {incident.status !== 'RESOLVED' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-6"
        >
          <h2 className="font-semibold text-sm mb-4">Post Update</h2>
          <form onSubmit={handleAddUpdate} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Status</label>
              <div className="grid grid-cols-4 gap-2">
                {STATUS_STEPS.filter((s) => s !== 'RESOLVED').map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUpdateStatus(s)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      updateStatus === s
                        ? 'bg-primary-muted border-primary text-primary'
                        : 'border-border text-muted hover:border-border-2'
                    }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5">Update message</label>
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Describe what's happening and what actions are being taken..."
                rows={4}
                required
                className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Update'}
              </button>

              <button
                type="button"
                onClick={handleResolve}
                className="flex items-center gap-2 border border-green-900/50 hover:bg-green-950/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Resolve Incident
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
