import { useEffect, useState } from 'react';
import { getSettings } from '../services/api';
import { CheckCircle2, XCircle, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getSettings().then(res => setSettings(res.data)).catch(console.error);
  }, []);

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = [
    { label: 'Root Domain', value: settings.rootDomain },
    { label: 'AI (Gemini)', configured: settings.aiConfigured },
    { label: 'Cloudflare DNS', configured: settings.cloudflareConfigured },
    { label: 'Render Hosting', configured: settings.renderConfigured },
    { label: 'Storage Path', value: settings.storagePath },
    { label: 'Max Upload', value: `${settings.maxUploadMb} MB` }
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-violet-400" /> Settings
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Platform configuration status</p>
      </div>

      <div className="glass rounded-xl divide-y divide-white/5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm">{item.label}</span>
            {'configured' in item ? (
              item.configured ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                  <XCircle className="w-3.5 h-3.5" /> Not configured
                </span>
              )
            ) : (
              <span className="text-xs text-gray-400 font-mono">{item.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-2">Configuration Notes</h3>
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Set <code className="text-violet-300">GEMINI_API_KEY</code> for AI Command Center</li>
          <li>Set <code className="text-violet-300">CLOUDFLARE_API_TOKEN</code> + <code className="text-violet-300">ZONE_ID</code> for real DNS</li>
          <li>Set <code className="text-violet-300">RENDER_API_KEY</code> for external hosting deployments</li>
          <li>Root domain must point wildcard DNS to your infrastructure</li>
        </ul>
      </div>
    </div>
  );
}
