import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Shield } from 'lucide-react';
import { getDomains, generateDomain, getProjects } from '../services/api';

export default function Domains() {
  const [domains, setDomains] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getDomains(), getProjects()])
      .then(([d, p]) => {
        setDomains(d.data.domains);
        setProjects(p.data.projects);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    if (!projectId || !preferredName.trim()) return;
    setGenerating(true);
    setError('');
    try {
      await generateDomain(projectId, preferredName.trim().toLowerCase());
      setShowGen(false);
      setPreferredName('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate domain');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Domain Center</h1>
          <p className="text-xs text-gray-400 mt-0.5">Branded subdomains & custom domains</p>
        </div>
        <button
          onClick={() => setShowGen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-medium shadow-glow"
        >
          <Plus className="w-4 h-4" /> Generate Domain
        </button>
      </div>

      {showGen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 max-w-lg">
          <h3 className="text-sm font-semibold mb-3">Generate Branded Domain</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full mt-1 bg-obsidian-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">Select project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Preferred Name</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={preferredName}
                  onChange={e => setPreferredName(e.target.value.replace(/[^a-z0-9-]/gi, ''))}
                  placeholder="myportfolio"
                  className="flex-1 bg-obsidian-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-gray-500">.sumexora.com</span>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium disabled:opacity-50">
                {generating ? 'Generating...' : 'Create Domain'}
              </button>
              <button onClick={() => setShowGen(false)} className="px-4 py-2 rounded-lg bg-white/5 text-sm">Cancel</button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Globe className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">No domains yet</p>
          <p className="text-xs text-gray-600 mt-1">Generate a branded subdomain for a project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{d.hostname}</p>
                  <p className="text-[11px] text-gray-500">{d.project_name} · {d.domain_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  d.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>{d.status}</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Shield className="w-3 h-3" /> {d.ssl_status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
