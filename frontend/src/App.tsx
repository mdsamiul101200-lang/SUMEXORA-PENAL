import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Domains from './pages/Domains';
import Settings from './pages/Settings';
import AICommand from './pages/AICommand';
import FileManager from './pages/FileManager';
import Layout from './layouts/MainLayout';
import { getMe } from './services/api';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sumexora_token');
    if (token) {
      getMe()
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('sumexora_token');
          localStorage.removeItem('sumexora_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-violet-300 font-display tracking-widest text-sm">SUMEXORA</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
      <Route
        path="/*"
        element={
          user ? (
            <Layout user={user} onLogout={() => { setUser(null); localStorage.clear(); }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/domains" element={<Domains />} />
                <Route path="/ai" element={<AICommand />} />
                <Route path="/files" element={<FileManager />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;
