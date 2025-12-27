import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

interface AuditLog {
  _id: string;
  action: string;
  resource?: string;
  method?: string;
  user?: { _id?: string; username?: string } | null;
  createdAt: string;
  details?: any;
}

export const AdminAuditLogs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'admin') {
      toast.error('Access denied');
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/audit-logs');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const items: AuditLog[] = Array.isArray(data) ? data : data.data ?? data.logs ?? [];
        setLogs(items);
      } catch (err) {
        setLogs([]);
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const actionOptions = useMemo(() => {
    const set = new Set<string>(logs.map((l) => l.action || '').filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (!q) return true;
      const username = l.user?.username ?? '';
      return (
        username.toLowerCase().includes(q) ||
        (l.resource ?? '').toLowerCase().includes(q) ||
        (l.action ?? '').toLowerCase().includes(q) ||
        (l.method ?? '').toLowerCase().includes(q)
      );
    });
  }, [logs, query, actionFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Filter by user, action or resource..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0"
              />
              <Button onClick={() => { setQuery(''); setActionFilter('all'); }}>Clear</Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'all' ? 'All' : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-600">No audit entries found.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">User</th>
                    <th className="py-2 px-2">Action</th>
                    <th className="py-2 px-2">Resource</th>
                    <th className="py-2 px-2">Method</th>
                    <th className="py-2 px-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log._id} className="border-b last:border-b-0">
                      <td className="py-2 px-2">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-2">{log.user?.username ?? 'System'}</td>
                      <td className="py-2 px-2">{log.action}</td>
                      <td className="py-2 px-2">{log.resource ?? '-'}</td>
                      <td className="py-2 px-2">{log.method ?? '-'}</td>
                      <td className="py-2 px-2">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details ?? {}, null, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
