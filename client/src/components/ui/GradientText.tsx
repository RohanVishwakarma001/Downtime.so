import { type ElementType, type ReactNode } from 'react';

/** Inline gradient ink for headlines and emphasized words. */
export function GradientText({
  children,
  as: Tag = 'span',
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={`text-gradient ${className}`}>{children}</Tag>;
}
