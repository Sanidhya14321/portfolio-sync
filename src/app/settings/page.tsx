'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autonomyLevel: '1',
    syncSchedule: 'daily',
    autoPost: false,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      alert('Error saving settings');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
          {/* Autonomy Level */}
          <div>
            <label className="block text-sm font-semibold mb-3">Agent Autonomy Level</label>
            <div className="space-y-2">
              {[
                { value: '0', label: 'Manual - Require approval for everything' },
                { value: '1', label: 'Trusted - Auto-post with high confidence' },
                { value: '2', label: 'Full - Completely autonomous' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="autonomy"
                    value={option.value}
                    checked={settings.autonomyLevel === option.value}
                    onChange={(e) => setSettings({ ...settings, autonomyLevel: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sync Schedule */}
          <div>
            <label className="block text-sm font-semibold mb-3">Sync Schedule</label>
            <select
              value={settings.syncSchedule}
              onChange={(e) => setSettings({ ...settings, syncSchedule: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-2"
            >
              <option value="manual">Manual Only</option>
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily (9 AM)</option>
              <option value="weekly">Weekly (Monday)</option>
            </select>
          </div>

          {/* Auto-Post */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoPost}
              onChange={(e) => setSettings({ ...settings, autoPost: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-semibold">Auto-post to platforms (if enabled)</label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 font-semibold transition"
          >
            Save Settings
          </button>

          {saved && <div className="text-green-400 text-sm">✓ Settings saved!</div>}
        </div>

        {/* API Status */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Connected Services</h2>

          <div className="space-y-3">
            {[
              { name: 'GitHub', status: 'connected', icon: '✓' },
              { name: 'LinkedIn', status: 'mock', icon: '⚠' },
              { name: 'Twitter', status: 'mock', icon: '⚠' },
            ].map((service) => (
              <div key={service.name} className="bg-slate-800/50 border border-slate-700 rounded p-4 flex justify-between items-center">
                <span>{service.name}</span>
                <span className={service.status === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                  {service.icon} {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
