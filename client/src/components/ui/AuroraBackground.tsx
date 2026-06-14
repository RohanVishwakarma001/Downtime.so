'use client';

/**
 * Fixed, animated aurora gradient that sits behind page content.
 * Pure CSS animation (no JS per-frame work) so it's cheap to run.
 * Drop it once near the top of a page/layout; it's pointer-events-none.
 */
export function AuroraBackground({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* Aurora blobs */}
      <div className="absolute -top-1/3 -left-1/4 h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_60%)] blur-3xl animate-aurora" />
      <div className="absolute top-1/4 -right-1/4 h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),transparent_60%)] blur-3xl animate-aurora [animation-delay:-6s]" />
      <div className="absolute -bottom-1/3 left-1/4 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_60%)] blur-3xl animate-aurora [animation-delay:-12s]" />

      {/* Subtle grid + vignette for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(9,9,11,0.85))]" />
    </div>
  );
}
