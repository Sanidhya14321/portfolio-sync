'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tech_stack: '',
    github_url: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `proj-${Date.now()}`,
          ...newProject,
          is_from_github: false,
        }),
      });

      if (res.ok) {
        setNewProject({ title: '', description: '', tech_stack: '', github_url: '' });
        await loadProjects();
      }
    } catch (error) {
      alert('Error adding project');
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadProjects();
      }
    } catch (error) {
      alert('Error deleting project');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Manage Projects</h1>

        {/* Add Project Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Project</h2>

          <form onSubmit={handleAddProject} className="space-y-4">
            <input
              type="text"
              placeholder="Project Title"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400"
              required
            />

            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400"
              rows={3}
            />

            <input
              type="text"
              placeholder="Tech Stack (comma-separated)"
              value={newProject.tech_stack}
              onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400"
            />

            <input
              type="url"
              placeholder="GitHub URL (optional)"
              value={newProject.github_url}
              onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 font-semibold transition"
            >
              Add Project
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Projects ({projects.length})</h2>

          {projects.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No projects yet.</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                    {project.tech_stack && (
                      <div className="flex gap-2 mt-2 flex-wrap">
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
                  </div>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-300 px-3 py-1 rounded text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
