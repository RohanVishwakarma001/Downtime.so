'use client';

import { motion, type Variants, type HTMLMotionProps } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Fade + rise in. Plays on mount, or on scroll-into-view when `inView`. */
export function FadeIn({
  children,
  delay = 0,
  y = 16,
  inView = false,
  className,
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  inView?: boolean;
  className?: string;
} & HTMLMotionProps<'div'>) {
  const animateProps = inView
    ? { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' } }
    : { animate: { opacity: 1, y: 0 } };

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...animateProps}
      transition={{ duration: 0.6, ease: easeOut, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

/** Wrap a list; children rendered via <Stagger.Item> animate in sequence. */
export function Stagger({
  children,
  className,
  inView = true,
}: {
  children: React.ReactNode;
  className?: string;
  inView?: boolean;
}) {
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      {...(inView
        ? { whileInView: 'show', viewport: { once: true, margin: '-60px' } }
        : { animate: 'show' })}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={staggerChild} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
