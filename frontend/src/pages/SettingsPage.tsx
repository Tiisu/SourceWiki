import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

type Settings = {
  siteName: string;
  verificationPoints: number;
  maxSubmissionsPerDay: number;
};

const DEFAULT_SETTINGS: Settings = {
  siteName: 'WikiSourceVerifier',
  verificationPoints: 10,
  maxSubmissionsPerDay: 5,
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'admin') {
      toast.error('Access denied');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            siteName: data.siteName ?? DEFAULT_SETTINGS.siteName,
            verificationPoints: Number(data.verificationPoints ?? DEFAULT_SETTINGS.verificationPoints),
            maxSubmissionsPerDay: Number(data.maxSubmissionsPerDay ?? DEFAULT_SETTINGS.maxSubmissionsPerDay),
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings({
          siteName: saved.siteName ?? settings.siteName,
          verificationPoints: Number(saved.verificationPoints ?? settings.verificationPoints),
          maxSubmissionsPerDay: Number(saved.maxSubmissionsPerDay ?? settings.maxSubmissionsPerDay),
        });
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings (server)');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Site Name</label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  placeholder="Site name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Verification Points (points awarded per verification)</label>
                <Input
                  type="number"
                  value={String(settings.verificationPoints)}
                  onChange={(e) =>
                    setSettings({ ...settings, verificationPoints: Number(e.target.value || 0) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Submissions Per Day</label>
                <Input
                  type="number"
                  value={String(settings.maxSubmissionsPerDay)}
                  onChange={(e) =>
                    setSettings({ ...settings, maxSubmissionsPerDay: Number(e.target.value || 0) })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;