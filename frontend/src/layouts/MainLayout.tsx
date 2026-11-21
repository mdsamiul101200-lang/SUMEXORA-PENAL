import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Globe, Rocket, Link2, FolderOpen,
  Code2, Eye, BarChart3, Shield, Settings, Crown, LogOut, Bell,
  Sparkles, HardDrive, Database, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  user: any;
  onLogout: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/ai', icon: Sparkles, label: 'AI Command Center', badge: 'NEW' },
  { to: '/hosting', icon: HardDrive, label: 'Hosting' },
  { to: '/deployments', icon: Rocket, label: 'Deployments' },
  { to: '/connect', icon: Link2, label: 'Connect Project' },
  { to: '/files', icon: FolderOpen, label: 'File Manager' },
  { to: '/editor', icon: Code2, label: 'Code Editor' },
  { to: '/preview', icon: Eye, label: 'Live Preview' },
  { to: '/domains', icon: Globe, label: 'Domains' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/backups', icon: Database, label: 'Backups' },
  { to: '/security', icon: Shield, label: 'Security' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function MainLayout({ children, user, onLogout }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-obsidian-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col bg-obsidian-900/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-glow">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm tracking-wider text-white">SUMEXORA</h1>
              <p className="text-[10px] text-violet-400 tracking-widest">PENAL</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold">
              {user?.fullName?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Administrator
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group',
                  isActive
                    ? 'nav-item-active text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 font-medium">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="glass rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Crown className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-display tracking-wider text-violet-300">SUMEXORA PENAL</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2">Ultimate Enterprise SaaS</p>
            <button className="w-full py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-[11px] font-medium">
              Upgrade Plan →
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All Systems Online
            </div>
            <span>99.99%</span>
          </div>

          <button
            onClick={() => { onLogout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-red-400 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-obsidian-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search anything... (Ctrl + K)"
                className="w-full bg-obsidian-800/80 border border-white/5 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder:text-gray-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                {user?.fullName?.[0] || 'S'}
              </div>
              <span className="text-xs">{user?.fullName || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
