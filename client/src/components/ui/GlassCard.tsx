'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

type GlassCardProps = {
  children: React.ReactNode;
  /** Heavier, more opaque variant for hero/modal surfaces. */
  strong?: boolean;
  /** Lift + glow on hover. */
  interactive?: boolean;
  className?: string;
} & HTMLMotionProps<'div'>;

/**
 * Frosted-glass container built on the `.glass` utility, with an optional
 * hover lift. Falls back gracefully when backdrop-filter is unsupported
 * (the translucent fill still reads as a panel).
 */
export function GlassCard({
  children,
  strong = false,
  interactive = false,
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`relative rounded-2xl ${strong ? 'glass-strong' : 'glass'} ${
        interactive ? 'transition-shadow duration-300 hover:shadow-glow' : ''
      } ${className}`}
      {...rest}
    >
      {/* top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </motion.div>
  );
}
