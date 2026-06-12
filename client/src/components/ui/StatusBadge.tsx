import { cn } from '@/lib/utils';

type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'MAINTENANCE';

interface StatusBadgeProps {
  status: ServiceStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  OPERATIONAL: {
    label: 'Operational',
    dot: 'bg-status-operational',
    bg: 'bg-green-950/50',
    text: 'text-green-400',
    border: 'border-green-900/50',
  },
  DEGRADED: {
    label: 'Degraded',
    dot: 'bg-status-degraded',
    bg: 'bg-yellow-950/50',
    text: 'text-yellow-400',
    border: 'border-yellow-900/50',
  },
  PARTIAL_OUTAGE: {
    label: 'Partial Outage',
    dot: 'bg-status-partial',
    bg: 'bg-orange-950/50',
    text: 'text-orange-400',
    border: 'border-orange-900/50',
  },
  MAJOR_OUTAGE: {
    label: 'Major Outage',
    dot: 'bg-status-major',
    bg: 'bg-red-950/50',
    text: 'text-red-400',
    border: 'border-red-900/50',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    dot: 'bg-status-maintenance',
    bg: 'bg-blue-950/50',
    text: 'text-blue-400',
    border: 'border-blue-900/50',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md', showDot = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['OPERATIONAL'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.bg,
        config.text,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full flex-shrink-0',
            config.dot,
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            status !== 'OPERATIONAL' && 'animate-pulse'
          )}
        />
      )}
      {config.label}
    </span>
  );
}
