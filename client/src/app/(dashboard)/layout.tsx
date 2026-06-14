'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { isAuthenticated, getUser, clearToken } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Zap,
  LayoutDashboard,
  Server,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/services', label: 'Services', icon: Server },
  { href: '/dashboard/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/dashboard/subscribers', label: 'Subscribers', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem('downtime_refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch {}
    clearToken();
    toast.success('Logged out');
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className="relative flex h-screen bg-background overflow-hidden">
      {/* Ambient backdrop — restrained inside the dashboard */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60vmax_60vmax_at_80%_-10%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(50vmax_50vmax_at_-10%_110%,rgba(139,92,246,0.1),transparent_60%)]"
      />

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 glass border-y-0 border-l-0 rounded-none flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center flex-shrink-0 shadow-glow">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Downtime.so</span>
          </Link>
        </div>

        {/* Org info */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-muted mb-0.5">Organization</p>
          <p className="text-sm font-medium truncate">{user.orgName}</p>
          <Link
            href={`/status/${user.orgSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            View status page
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary font-medium ring-1 ring-primary/25'
                    : 'text-muted hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Docs link */}
        <div className="px-2 pb-2">
          <Link
            href="/docs"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            Documentation
          </Link>
        </div>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">{user.name[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
