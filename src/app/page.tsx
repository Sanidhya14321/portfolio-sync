'use client';

import { useEffect, useState } from 'react';
import { Project, SyncLog } from '@/types';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Never');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsRes, logsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/sync-logs'),
      ]);

      const projectsData = await projectsRes.json();
      const logsData = await logsRes.json();

      setProjects(projectsData || []);
      setSyncLogs(logsData || []);

      const lastLog = logsData?.[0];
      if (lastLog) {
        setLastSync(new Date(lastLog.timestamp).toLocaleString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync/run', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        await loadData();
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (error) {
      alert('Error running sync');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Portfolio Sync Agent
              </h1>
              <p className="text-slate-400 mt-2">AI-powered portfolio management</p>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-semibold transition"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Projects</div>
              <div className="text-2xl font-bold">{projects.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Synced Today</div>
              <div className="text-2xl font-bold">
                {syncLogs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Last Sync</div>
              <div className="text-sm font-bold">{lastSync}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Projects Column */}
          <div className="col-span-2">
            <h2 className="text-2xl font-bold mb-6">Your Projects</h2>

            {projects.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700">
                <p className="text-slate-400">No projects yet. Add one from your GitHub or create a custom project.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                      </div>
                      <div className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded">
                        {project.sync_status}
                      </div>
                    </div>

                    {project.tech_stack && (
                      <div className="flex gap-2 flex-wrap mb-4">
                        {project.tech_stack.split(',').map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 text-xs">
                      {project.last_synced_to_linkedin && (
                        <span className="text-green-400">✓ LinkedIn</span>
                      )}
                      {project.last_synced_to_twitter && (
                        <span className="text-green-400">✓ Twitter</span>
                      )}
                      {project.last_synced_to_portfolio && (
                        <span className="text-green-400">✓ Portfolio</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Activity Column */}
          <div>
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {syncLogs.length === 0 ? (
                <div className="text-slate-400 text-sm">No sync activity yet.</div>
              ) : (
                syncLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className={`bg-slate-800/50 border-l-4 ${
                      log.status === 'success'
                        ? 'border-green-500'
                        : log.status === 'failed'
                          ? 'border-red-500'
                          : 'border-yellow-500'
                    } p-3 rounded text-xs`}
                  >
                    <div className="font-semibold capitalize">{log.platform}</div>
                    <div className="text-slate-400">{log.message}</div>
                    <div className="text-slate-500 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
