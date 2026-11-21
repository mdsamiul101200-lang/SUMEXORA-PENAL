import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Rocket, Cloud, Link2, Activity, CheckCircle2,
  Github, HardDrive, Sparkles, Upload, Settings, BarChart3,
  Shield, Globe, Zap
} from 'lucide-react';
import { getDashboard } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const health = data?.systemHealth || {};

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects ?? 0, change: '+12%', icon: FolderKanban, color: 'stat-purple', iconColor: 'text-violet-400' },
    { label: 'Active Projects', value: stats.activeProjects ?? 0, change: '+8%', icon: Rocket, color: 'stat-blue', iconColor: 'text-cyan-400' },
    { label: 'Live Deployments', value: stats.liveProjects ?? 0, change: '+14%', icon: Cloud, color: 'stat-green', iconColor: 'text-emerald-400' },
    { label: 'Connected Projects', value: stats.connectedProjects ?? 0, change: '+11%', icon: Link2, color: 'stat-orange', iconColor: 'text-orange-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl glass-strong p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-blue-600/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-300 mb-1">
              <span>👋</span> Welcome Back, Sumon i!
            </div>
            <h1 className="text-3xl font-display font-bold tracking-wide">
              <span className="text-white">SUMEXORA</span>{' '}
              <span className="text-neon-purple">ADMIN PANEL</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">Ultimate Enterprise SaaS Platform</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-400" /> Create</span>
              <span className="flex items-center gap-1"><Settings className="w-3 h-3 text-violet-400" /> Manage</span>
              <span className="flex items-center gap-1"><Rocket className="w-3 h-3 text-violet-400" /> Deploy</span>
              <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-violet-400" /> Grow</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-40 h-28 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/20 border border-white/10 flex items-center justify-center">
              <div className="text-4xl opacity-60">🏙️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl p-4 ${card.color} border border-white/5`}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              <span className="text-[11px] text-emerald-400 font-medium">{card.change}</span>
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* System Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" /> System Overview
            </h2>
            <select className="text-xs bg-obsidian-800 border border-white/10 rounded px-2 py-1">
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#healthGrad)" strokeWidth="8"
                  strokeDasharray={`${(health.backend || 99.9) * 2.64} 264`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#00d4ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-display">{health.backend || 99.9}%</span>
                <span className="text-[10px] text-gray-400">System Health</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Hosting', value: health.backend || 100 },
                { label: 'Deployments', value: health.performance || 98 },
                { label: 'Storage', value: health.storage || 95 },
                { label: 'Security', value: health.security || 100 },
                { label: 'Performance', value: health.performance || 99 }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 w-20">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium w-8 text-right">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Excellent
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Recent Activity
            </h2>
            <button className="text-[11px] text-violet-400 hover:text-violet-300">View All →</button>
          </div>
          <div className="space-y-3">
            {(data?.recentActivity?.length ? data.recentActivity : [
              { action: 'project.created', projectName: 'My Awesome Project', createdAt: new Date().toISOString() },
              { action: 'domain.generated', projectName: 'Portfolio', createdAt: new Date().toISOString() }
            ]).slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.action?.replace('.', ' ') || 'Activity'}</p>
                  <p className="text-[11px] text-gray-500 truncate">{item.projectName || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Command Center + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold">AI Command Center</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Powered by Gemini</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Control and edit your projects with simple commands</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder='Try: "Change my homepage design to dark theme..."'
                className="flex-1 bg-obsidian-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 placeholder:text-gray-600"
              />
              <button className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition shadow-glow">
                <Rocket className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Improve Design', 'Add New Page', 'Fix Bug', 'Update Logo', 'Make Responsive'].map(cmd => (
                <button key={cmd} className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-violet-500/20 hover:border-violet-500/30 transition">
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Live Preview</h2>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          </div>
          <div className="aspect-video rounded-lg bg-obsidian-800 border border-white/10 flex items-center justify-center mb-3">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <span className="text-lg font-bold">S</span>
              </div>
              <p className="text-[10px] text-gray-500">SUMEXORA</p>
            </div>
          </div>
          <button className="w-full py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-xs text-violet-300 hover:bg-violet-600/30 transition">
            Open Preview →
          </button>
        </div>
      </div>

      {/* Bottom row: Projects, Deployments, Hosting, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold">Projects Overview</h3>
            <button className="text-[10px] text-violet-400">View All →</button>
          </div>
          <div className="space-y-2">
            {['My Awesome Project', 'E-Commerce Pro', 'Portfolio Website', 'AI Dashboard'].map((name, i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="truncate">{name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${i === 2 ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {i === 2 ? 'Deploying' : 'Live'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold">Deployment Activity</h3>
            <button className="text-[10px] text-violet-400">View All →</button>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <p>No recent deployments. Upload a project and deploy.</p>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-3">Hosting Usage</h3>
          <div className="flex items-center justify-center mb-2">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="10"
                  strokeDasharray="180 251" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">72%</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-500">Used 72 GB / 100 GB</p>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Upload, label: 'Upload' },
              { icon: Rocket, label: 'Deploy' },
              { icon: Link2, label: 'Connect' },
              { icon: HardDrive, label: 'Backup' },
              { icon: BarChart3, label: 'Analytics' },
              { icon: Settings, label: 'Settings' }
            ].map(a => (
              <button key={a.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 transition text-[10px] text-gray-400 hover:text-white">
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" /> Global Analytics
          </h3>
          <p className="text-lg font-bold text-emerald-400">+24.8%</p>
          <p className="text-[10px] text-gray-500">This Month</p>
        </div>
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Security Center
          </h3>
          <p className="text-sm text-emerald-400">Your system is secure</p>
          <p className="text-[10px] text-gray-500">Last scan: just now</p>
        </div>
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" /> Integrations
          </h3>
          <div className="flex gap-2 mt-1">
            {['GitHub', 'Render', 'Cloudflare', 'Google'].map(n => (
              <span key={n} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
