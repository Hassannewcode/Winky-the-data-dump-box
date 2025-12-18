
import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, BookOpen, Ghost, Zap, Monitor, EyeOff, Radio } from 'lucide-react';

const LANGUAGES = [
  { id: 'SILENT', label: 'Silent Beacon', color: 'text-emerald-400' },
  { id: 'FETCH', label: 'Background Fetch', color: 'text-winky-blue' },
  { id: 'JS', label: 'Vanilla JS', color: 'text-yellow-400' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'CURL', label: 'cURL / Shell', color: 'text-slate-200' },
];

export const IntegrationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('SILENT');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const origin = window.location.origin;
    
    switch (activeTab) {
      case 'SILENT':
        return `// 100% Background Delivery (No Popup, No Redirect)
// Uses the standard Winky Background Proxy
const payload = { event: "ping", user: "anonymous" };
navigator.sendBeacon(
  '${origin}/ingest', 
  JSON.stringify(payload)
);`;

      case 'FETCH':
        return `// Background Fetch - Instantly updates active Winky tabs
fetch('${origin}/ingest', {
  method: 'POST',
  body: 'Raw Background Signal',
  mode: 'no-cors' // Allows cross-origin firing
});`;

      case 'JS':
        return `// Direct URL Parameter Ingest
const data = "Hello_World";
const url = \`${origin}/?payload=\${encodeURIComponent(data)}\`;
// Note: This navigates. Use SILENT or FETCH tab for no-redirect.
window.location.href = url;`;
      
      case 'NODE':
        return `// Send data from any Node backend
const https = require('https');
const data = JSON.stringify({ server: "production", status: "ok" });

const req = https.request({
  hostname: '${new URL(origin).hostname}',
  path: '/ingest',
  method: 'POST'
});
req.write(data);
req.end();`;

      case 'PYTHON':
        return `import requests
requests.post('${origin}/ingest', data='Python Background Signal')`;
      
      case 'CURL':
        return `# Fire and forget from shell
curl -X POST -d "Shell Signal" ${origin}/ingest`;

      default:
        return '// Select a vector.';
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2rem] p-0 overflow-hidden shadow-soft border border-winky-border transition-all">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                 <h4 className="font-black text-slate-200 text-xs uppercase tracking-[0.2em]">Universal_Protocols</h4>
                 <p className="text-[9px] font-bold text-slate-500">Pick your background injection vector</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
             {LANGUAGES.map(lang => (
               <button
                 key={lang.id}
                 onClick={() => setActiveTab(lang.id)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap border uppercase tracking-widest ${
                   activeTab === lang.id 
                     ? 'bg-slate-800 border-slate-600 text-white shadow-lg' 
                     : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                 }`}
               >
                 <span className={activeTab === lang.id ? lang.color : ''}>{lang.label}</span>
               </button>
             ))}
          </div>
        </div>
        
        <div className="relative group bg-slate-900 p-2">
           <pre className="p-6 text-[10px] md:text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed bg-slate-950/50 rounded-2xl custom-scrollbar max-h-96">
             {getIntegrationCode()}
           </pre>
           <button 
             onClick={() => copyCode(getIntegrationCode())}
             className="absolute top-6 right-6 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-slate-700 shadow-2xl"
           >
             {copied ? <Wifi className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
           </button>
        </div>
        <div className="bg-slate-950/50 px-6 py-3 text-[9px] font-bold text-slate-500 border-t border-slate-800 flex items-center gap-2 uppercase tracking-widest">
           <Terminal className="w-3.5 h-3.5" />
           {activeTab === 'SILENT' || activeTab === 'FETCH' ? '100% background delivery. No page reload required.' : 'Standard delivery method.'}
        </div>
      </div>
  );
};

