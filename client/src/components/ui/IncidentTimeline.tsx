'use client';

import { motion } from 'framer-motion';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
}

interface IncidentTimelineProps {
  updates: IncidentUpdate[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  INVESTIGATING: {
    label: 'Investigating',
    color: 'text-orange-400',
    dot: 'bg-orange-500',
    bg: 'border-orange-900/30',
  },
  IDENTIFIED: {
    label: 'Identified',
    color: 'text-yellow-400',
    dot: 'bg-yellow-500',
    bg: 'border-yellow-900/30',
  },
  MONITORING: {
    label: 'Monitoring',
    color: 'text-blue-400',
    dot: 'bg-blue-500',
    bg: 'border-blue-900/30',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'text-green-400',
    dot: 'bg-green-500',
    bg: 'border-green-900/30',
  },
};

export function IncidentTimeline({ updates }: IncidentTimelineProps) {
  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-8 text-muted text-sm">
        No updates yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-4 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {updates.map((update, index) => {
          const config = STATUS_CONFIG[update.status] || STATUS_CONFIG['INVESTIGATING'];

          return (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.07,
                ease: 'easeOut',
              }}
              className="relative flex gap-4 pl-8"
            >
              {/* Status dot */}
              <div
                className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center bg-surface-2 border-2 ${config.bg}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <span className="text-muted text-xs">•</span>
                  <time
                    title={formatDateTime(update.createdAt)}
                    className="text-xs text-muted"
                  >
                    {formatRelativeTime(update.createdAt)}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {update.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
