import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, FolderKanban, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getProjects, sendAICommand } from '../services/api';

export default function AICommand() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getProjects().then(res => setProjects(res.data.projects)).catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!projectId || !instruction.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await sendAICommand(projectId, instruction.trim());
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'AI request failed');
      if (err.response?.data?.operationId) {
        setResult({ operationId: err.response.data.operationId, status: 'failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    'Change homepage design to dark theme',
    'Make the site fully responsive',
    'Update the logo and brand colors',
    'Add a contact form page',
    'Fix any JavaScript errors',
    'Improve SEO meta tags'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" /> AI Command Center
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Control and edit projects with natural language • Powered by Gemini</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-xl p-5">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Select Project</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full mt-1.5 bg-obsidian-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="">Choose a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
              ))}
            </select>
          </div>

          <div className="glass rounded-xl p-5">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 block">Instruction</label>
            <textarea
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              rows={4}
              placeholder='Example: "Change the homepage background to dark gradient and update the hero title to Welcome to My Portfolio"'
              className="w-full bg-obsidian-800 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 resize-none placeholder:text-gray-600"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {quickCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => setInstruction(cmd)}
                  className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-violet-500/20 hover:border-violet-500/40 transition"
                >
                  {cmd}
                </button>
              ))}
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !projectId || !instruction.trim()}
              className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Processing...' : 'Execute Command'}
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                {result.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-400 inter" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-sm font-medium">Operation: {result.operationId?.slice(0, 8)}...</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">{result.status}</span>
              </div>
              <p className="text-xs text-gray-400">{result.message}</p>
              {result.requiresApproval && (
                <p className="text-xs text-yellow-400 mt-2">Changes require your approval before applying.</p>
              )}
            </motion.div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-violet-400" /> How it works
          </h3>
          <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
            <li>Select a project that has uploaded files</li>
            <li>Write a clear natural language instruction</li>
            <li>AI analyzes relevant source files</li>
            <li>Proposed changes are shown for approval</li>
            <li>You approve → files are updated + new version created</li>
          </ol>
          <div className="mt-6 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-[11px] text-violet-300">
              Set <code className="text-violet-200">GEMINI_API_KEY</code> in backend .env to enable full AI analysis and code modification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
