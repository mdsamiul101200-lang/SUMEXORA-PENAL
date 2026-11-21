import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sumexora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sumexora_token');
      localStorage.removeItem('sumexora_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboard = () => api.get('/dashboard/overview');

// Projects
export const getProjects = (params?: { status?: string; search?: string }) =>
  api.get('/projects', { params });

export const createProject = (data: { name: string; description?: string; projectType?: string }) =>
  api.post('/projects', data);

export const getProject = (id: string) => api.get(`/projects/${id}`);

export const updateProject = (id: string, data: any) => api.patch(`/projects/${id}`, data);

export const deleteProject = (id: string) => api.delete(`/projects/${id}`);

// Domains
export const getDomains = () => api.get('/domains');
export const generateDomain = (projectId: string, preferredName: string) =>
  api.post('/domains/generate', { projectId, preferredName });
export const activateDomain = (id: string) => api.post(`/domains/${id}/activate`);

// Upload
export const uploadProjectFiles = (projectId: string, files: File[]) => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  return api.post(`/upload/project/${projectId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// AI
export const sendAICommand = (projectId: string, instruction: string) =>
  api.post('/ai/command', { projectId, instruction });

// Deployments
export const getDeployments = (projectId: string) =>
  api.get(`/deployments/project/${projectId}`);
export const createDeployment = (projectId: string) =>
  api.post(`/deployments/project/${projectId}`);

// Settings
export const getSettings = () => api.get('/settings');
