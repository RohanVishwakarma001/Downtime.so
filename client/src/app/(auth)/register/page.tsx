'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { setToken, setRefreshToken, setUser, isAuthenticated } from '@/lib/auth';
import { AuroraBackground, GlassCard, GradientText, FadeIn } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    orgName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in? Don't show the register form (e.g. via the Back button) —
  // bounce to the dashboard.
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.orgName || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      toast.success('Account created! Welcome aboard 🎉');
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <AuroraBackground />
      <FadeIn className="w-full max-w-sm">
        <GlassCard strong className="p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center shadow-glow">
              <Zap className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold">Downtime.so</span>
          </Link>
          <h1 className="text-2xl font-bold">
            Create your <GradientText>account</GradientText>
          </h1>
          <p className="text-muted text-sm mt-1">Get your status page in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Your name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Smith"
              autoComplete="name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Organization name</label>
            <input
              type="text"
              name="orgName"
              value={form.orgName}
              onChange={handleChange}
              placeholder="Acme Corp"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
            />
            {form.orgName && (
              <p className="text-xs text-muted mt-1">
                Status page: <span className="text-primary">status.downtime.so/{form.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.07] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
            className="w-full bg-gradient-to-r from-primary to-[#8b5cf6] hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium text-sm transition-shadow"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </motion.button>

          <p className="text-center text-xs text-muted">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
