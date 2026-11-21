import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FolderKanban, MoreVertical, Rocket } from 'lucide-react';
import { getProjects, createProject } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getProjects({ search: search || undefined })
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createProject({ name: name.trim() });
      setName('');
      setShowCreate(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Projects</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage all your hosted projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-medium shadow-glow hover:from-violet-500 hover:to-purple-500 transition"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-obsidian-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500"
        />
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 max-w-md"
        >
          <h3 className="text-sm font-semibold mb-3">Create Project</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full bg-obsidian-800 border border-white/10 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:border-violet-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-white/5 text-sm">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FolderKanban className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">No projects yet</p>
          <p className="text-xs text-gray-600 mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 hover:border-violet-500/30 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-violet-400" />
                </div>
                <button className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <h3 className="font-medium text-sm truncate">{p.name}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{p.slug}</p>
              <div className="flex items-center justify-between mt-4">
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  p.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' :
                  p.status === 'deploying' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {p.status}
                </span>
                <button className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300">
                  <Rocket className="w-3 h-3" /> Deploy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
