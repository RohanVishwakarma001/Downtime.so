'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Server, Trash2, Pencil, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils';

const STATUS_OPTIONS = [
  'OPERATIONAL',
  'DEGRADED',
  'PARTIAL_OUTAGE',
  'MAJOR_OUTAGE',
  'MAINTENANCE',
] as const;

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/api/v1/services').then((r) => r.data),
  });

  const services = data?.services || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newService.name) return;
    setCreating(true);
    try {
      await api.post('/api/v1/services', newService);
      toast.success('Service created');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setNewService({ name: '', description: '' });
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create service');
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusUpdate(serviceId: string) {
    try {
      await api.patch(`/api/v1/services/${serviceId}`, { status: editStatus });
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleDelete(serviceId: string, serviceName: string) {
    if (!confirm(`Delete "${serviceName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/v1/services/${serviceId}`);
      toast.success('Service deleted');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete service');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted text-sm mt-1">Manage the services you monitor</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-surface border border-primary/30 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4 text-sm">New Service</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Name *</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. API"
                  required
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Description</label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? 'Creating...' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="border border-border hover:border-border-2 px-4 py-2 rounded-lg text-sm transition-colors text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-xl">
          <Server className="w-10 h-10 text-muted mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No services yet</h3>
          <p className="text-sm text-muted">Add your first service to start monitoring</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service: any) => (
            <div
              key={service.id}
              className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{service.name}</p>
                  {service.incidents?.length > 0 && (
                    <span className="text-xs bg-red-950/50 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded-full">
                      Active incident
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-xs text-muted truncate">{service.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted">{service._count?.subscribers || 0} subscribers</span>
                  <span className="text-muted text-xs">·</span>
                  <span className="text-xs text-muted">Updated {formatRelativeTime(service.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {editingId === service.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleStatusUpdate(service.id)}
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-muted hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <StatusBadge status={service.status} size="sm" />
                    <button
                      onClick={() => {
                        setEditingId(service.id);
                        setEditStatus(service.status);
                      }}
                      className="text-muted hover:text-foreground transition-colors"
                      title="Edit status"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(service.id, service.name)}
                  className="text-muted hover:text-red-400 transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
