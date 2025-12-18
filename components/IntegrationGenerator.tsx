
import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, Ghost, Server } from 'lucide-react';

const LANGUAGES = [
  { id: 'SHADOW', label: 'Shadow (Headless)', color: 'text-purple-400' },
  { id: 'JS', label: 'JS (Web)', color: 'text-yellow-400' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'CURL', label: 'Bash/cURL', color: 'text-slate-200' },
  { id: 'GO', label: 'Go', color: 'text-cyan-400' },
  { id: 'RUST', label: 'Rust', color: 'text-orange-600' },
  { id: 'RUBY', label: 'Ruby', color: 'text-red-400' },
  { id: 'PHP', label: 'PHP', color: 'text-purple-400' },
];

export const IntegrationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('SHADOW');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const origin = window.location.origin;
    
    switch (activeTab) {
      case 'SHADOW':
        return `// THE SHADOW PROTOCOL (HEADLESS)
// No windows, no redirects. Just background ingestion.
// Works from ANY system with internet access.

// Method 1: Background Fetch (GET)
fetch('${origin}/ingest-signal?payload=' + encodeURIComponent(data), { mode: 'no-cors' });

// Method 2: Background Fetch (POST)
fetch('${origin}/ingest-signal', {
  method: 'POST',
  body: JSON.stringify({ event: 'system_boot', hardware: 'RPi_4' }),
  mode: 'cors'
}).then(r => console.log('Signal Dispatched'));`;

      case 'JS':
        return `// 1. Deep Link (URL Redirect)
window.open('${origin}/?payload=' + encodeURIComponent(data));

// 2. Global API (Direct - Console/Script)
if (window.Winky) {
  window.Winky.ingest({ source: 'MyScript', value: 42 });
}

// 3. Broadcast Channel (Background Tabs)
new BroadcastChannel('winky_channel').postMessage('System Ready');`;
      
      case 'NODE':
        return `// Node.js (Headless Background Signal)
const https = require('https');
const data = JSON.stringify({ log: "Server Critical", code: 500 });

const req = https.request({
  hostname: '${origin.replace('https://', '')}',
  path: '/ingest-signal',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('Ingested: ' + res.statusCode);
});

req.write(data);
req.end();`;

      case 'PYTHON':
        return `# Python 3 (Headless Ingest)
import requests, json

data = {"source": "ML_Worker_01", "status": "processing"}
response = requests.post(
    "${origin}/ingest-signal", 
    data=json.dumps(data)
)
print(f"Status: {response.status_code}")`;
      
      case 'CURL':
        return `# Bash / cURL (Silent Background Send)
curl -X POST "${origin}/ingest-signal" \\
     -d '{"msg": "Ping from terminal", "user": "'$USER'"}' \\
     -H "Content-Type: application/json"`;

      default:
        return '// Select a vector to see the integration snippet.';
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-0 overflow-hidden shadow-soft border border-winky-border">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-winky-pink" />
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">System Integrations</h4>
            </div>
            {activeTab === 'SHADOW' && (
              <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-400 animate-pulse uppercase tracking-widest">
                <Ghost className="w-3 h-3" /> Headless_Active
              </div>
            )}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
             {LANGUAGES.map(lang => (
               <button
                 key={lang.id}
                 onClick={() => setActiveTab(lang.id)}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                   activeTab === lang.id 
                     ? 'bg-slate-800 border-slate-600 text-white shadow-sm' 
                     : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                 }`}
               >
                 <span className={activeTab === lang.id ? lang.color : ''}>{lang.label}</span>
               </button>
             ))}
          </div>
        </div>
        
        <div className="relative group bg-slate-900">
           <pre className="p-4 text-[10px] md:text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
             {getIntegrationCode()}
           </pre>
           <button 
             onClick={() => copyCode(getIntegrationCode())}
             className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-slate-700"
           >
             {copied ? <Wifi className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
           </button>
        </div>
        <div className="bg-slate-950/50 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800 flex items-center gap-2">
           <Server className="w-3 h-3" />
           {activeTab === 'SHADOW' ? 'True system-to-system headless ingestion via HTTP fetch.' : 'Standard browser-based ingestion vectors.'}
        </div>
      </div>
  );
};
