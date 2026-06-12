'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function SubscribersPage() {
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/api/v1/services').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', selectedServiceId],
    queryFn: () =>
      api.get('/api/v1/subscribers', {
        params: selectedServiceId ? { serviceId: selectedServiceId } : {},
      }).then((r) => r.data),
  });

  const services = servicesData?.services || [];
  const subscribers = data?.subscribers || [];
  const total = data?.total || 0;

  function exportCSV() {
    if (subscribers.length === 0) return;
    const headers = ['ID', 'Email', 'Phone', 'Service', 'Subscribed At'];
    const rows = subscribers.map((s: any) => [
      s.id,
      s.email || '',
      s.phone || '',
      s.service?.name || '',
      new Date(s.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Stats
  const emailCount = subscribers.filter((s: any) => s.email).length;
  const smsCount = subscribers.filter((s: any) => s.phone).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted text-sm mt-1">People receiving status notifications</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 border border-border hover:border-border-2 disabled:opacity-40 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-xs text-muted">Total</span>
          </div>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted">Email</span>
          </div>
          <p className="text-2xl font-bold">{emailCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted">SMS</span>
          </div>
          <p className="text-2xl font-bold">{smsCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm text-muted">Filter by service:</label>
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">All services</option>
          {services.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border bg-surface-2 text-xs font-medium text-muted">
          <span>Contact</span>
          <span>Type</span>
          <span>Service</span>
          <span>Subscribed</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-48" />
              </div>
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">No subscribers yet</p>
            <p className="text-xs text-muted mt-1">
              Share your status page to start collecting subscribers
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {subscribers.map((sub: any) => (
              <div key={sub.id} className="grid grid-cols-4 gap-4 px-5 py-3.5 text-sm hover:bg-surface-2 transition-colors">
                <span className="truncate font-mono text-xs">{sub.email || sub.phone}</span>
                <div className="flex items-center gap-1.5">
                  {sub.email ? (
                    <>
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-muted">Email</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-muted">SMS</span>
                    </>
                  )}
                </div>
                <span className="text-muted text-xs">{sub.service?.name}</span>
                <span className="text-muted text-xs">{formatRelativeTime(sub.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
