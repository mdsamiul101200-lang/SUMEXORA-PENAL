import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, File, ChevronRight, Save, Trash2, FolderPlus, ArrowLeft } from 'lucide-react';
import { getProjects } from '../services/api';
import api from '../services/api';

export default function FileManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProjects().then(res => setProjects(res.data.projects)).catch(console.error);
  }, []);

  const loadDir = async (pid: string, path = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/files/${pid}`, { params: { path } });
      setItems(res.data.items || []);
      setCurrentPath(path);
      setSelectedFile(null);
      setContent('');
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (id: string) => {
    setProjectId(id);
    loadDir(id, '');
  };

  const openItem = (item: any) => {
    if (item.type === 'folder') {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      loadDir(projectId, newPath);
    } else {
      setSelectedFile(item.name);
      const filePath = currentPath ? `${currentPath}/${item.name}` : item.name;
      api.get(`/files/${projectId}/content`, { params: { path: filePath } })
        .then(res => setContent(res.data.content))
        .catch(() => setContent('// Failed to load file'));
    }
  };

  const goUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadDir(projectId, parts.join('/'));
  };

  const saveFile = async () => {
    if (!selectedFile || !projectId) return;
    setSaving(true);
    const filePath = currentPath ? `${currentPath}/${selectedFile}` : selectedFile;
    try {
      await api.put(`/files/${projectId}/content`, { path: filePath, content });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-400" /> File Manager
          </h1>
        </div>
        <select
          value={projectId}
          onChange={e => openProject(e.target.value)}
          className="bg-obsidian-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">Select project...</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!projectId ? (
        <div className="glass rounded-xl flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Select a project to browse files</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* File tree */}
          <div className="glass rounded-xl p-4 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
              {currentPath && (
                <button onClick={goUp} className="p-1 rounded hover:bg-white/10">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="truncate">/{currentPath || ''}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-8">Empty folder</p>
              ) : (
                items.map(item => (
                  <button
                    key={item.name}
                    onClick={() => openItem(item)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left hover:bg-white/5 transition ${
                      selectedFile === item.name ? 'bg-violet-500/20 text-violet-300' : 'text-gray-300'
                    }`}
                  >
                    {item.type === 'folder' ? (
                      <FolderOpen className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    ) : (
                      <File className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{item.name}</span>
                    {item.type === 'folder' && <ChevronRight className="w-3 h-3 text-gray-600" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2 glass rounded-xl p-4 flex flex-col min-h-0">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium truncate">{selectedFile}</span>
                  <button
                    onClick={saveFile}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-xs font-medium hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 w-full bg-obsidian-950 border border-white/5 rounded-lg p-4 text-sm font-mono text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
                  spellCheck={false}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-600">
                Select a file to edit
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
