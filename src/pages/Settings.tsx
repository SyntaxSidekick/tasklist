import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { usersApi } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await usersApi.updateProfile({ name, theme });
      if (response.success && response.data) {
        setUser(response.data.user);
        setMessage('Settings saved successfully');
      }
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={28} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-app-lg p-6 border border-border dark:border-gray-800 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              value={user?.email}
              disabled
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <Select
            label="Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>

        {message && (
          <div className="p-3 rounded-app bg-success/10 text-success text-sm">
            {message}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
