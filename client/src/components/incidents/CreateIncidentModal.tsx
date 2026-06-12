'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Service {
  id: string;
  name: string;
}

interface CreateIncidentModalProps {
  open: boolean;
  onClose: () => void;
  services: Service[];
}

const IMPACT_OPTIONS = [
  { value: 'MINOR', label: 'Minor', desc: 'Small impact, most users unaffected', color: 'text-yellow-400' },
  { value: 'MAJOR', label: 'Major', desc: 'Significant impact, many users affected', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Complete outage or major data issue', color: 'text-red-400' },
];

export function CreateIncidentModal({ open, onClose, services }: CreateIncidentModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    impact: 'MINOR',
    serviceId: services[0]?.id || '',
    initialMessage: '',
  });
  const [loading, setLoading] = useState(false);

  // Sync serviceId when services load (services may be empty on first render)
  useEffect(() => {
    if (services.length > 0 && !form.serviceId) {
      setForm((p) => ({ ...p, serviceId: services[0].id }));
    }
  }, [services]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title || !form.serviceId || !form.initialMessage) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/incidents', form);
      toast.success('Incident created successfully');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
      setForm({ title: '', impact: 'MINOR', serviceId: services[0]?.id || '', initialMessage: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <h2 className="text-base font-semibold">Create Incident</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Incident title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. API response times elevated"
                    required
                    className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Affected service <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.serviceId}
                    onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
                    required
                    className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-sm font-medium mb-2">Impact level</label>
                  <div className="space-y-2">
                    {IMPACT_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          form.impact === opt.value
                            ? 'border-primary bg-primary-muted'
                            : 'border-border hover:border-border-2'
                        }`}
                      >
                        <input
                          type="radio"
                          name="impact"
                          value={opt.value}
                          checked={form.impact === opt.value}
                          onChange={(e) => setForm((p) => ({ ...p, impact: e.target.value }))}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
                          <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Initial message */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Initial message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.initialMessage}
                    onChange={(e) => setForm((p) => ({ ...p, initialMessage: e.target.value }))}
                    placeholder="We are currently investigating reports of..."
                    required
                    rows={4}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-border hover:border-border-2 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Incident'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
