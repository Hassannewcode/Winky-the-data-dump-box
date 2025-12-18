import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, BookOpen, Ghost, Zap } from 'lucide-react';

const LANGUAGES = [
  { id: 'STEALTH', label: 'Stealth Beacon (Invisible)', color: 'text-emerald-400' },
  { id: 'RELAY', label: 'Relay Bridge (POST)', color: 'text-winky-pink' },
  { id: 'JS', label: 'JS (Web)', color: 'text-yellow-400' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'CURL', label: 'Bash/cURL', color: 'text-slate-200' },
];

export const IntegrationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('STEALTH');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const origin = window.location.origin;
    
    switch (activeTab) {
      case 'STEALTH':
        return `// --- Invisible Background Ingestion ---
// Sends data to Winky silently. No iframes, no windows, no redirects.
// Works via Service Worker Interception.
function winkyStealth(data) {
  const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const endpoint = \`\${origin}/ingest?payload=\${encodeURIComponent(payload)}\`;

  // Method 1: Modern Beacon (Best for exit events)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint);
  } else {
    // Method 2: Image Ping (Universal fallback)
    const img = new Image();
    img.src = endpoint;
  }
}

// Example usage:
winkyStealth({ event: "silent_capture", timestamp: Date.now() });`;

      case 'RELAY':
        return `// Save as 'winky-relay.js' and run with 'node winky-relay.js'
// Listens for POST on localhost:3000 -> Invisible Backend Ingest
const http = require('http');
const https = require('https');

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
       // Headless transmission via Service Worker route
       const target = \`\${origin}/ingest?payload=\${encodeURIComponent(body)}\`;
       
       // Triggering ingestion via headless request
       https.get(target, (ingestRes) => {
         res.end('Headless Signal Delivered');
       }).on('error', (e) => {
         res.end('Ingest Link Active: ' + target);
       });
    });
  }
}).listen(3000, () => console.log('Winky Relay Active: localhost:3000'));`;

      case 'JS':
        return `// 1. Stealth Beacon (Invisible Background)
if (window.Winky) {
  window.Winky.stealthBeacon({ secret: "hidden_data" });
}

// 2. Direct Ingestion (Live Session)
window.Winky.ingest("Live Data String");

// 3. Fallback Headerless Ping
fetch('${origin}/ingest?data=' + encodeURIComponent("My Signal"), { mode: 'no-cors' });`;
      
      case 'NODE':
        return `const https = require('https');
const payload = encodeURIComponent("Server_Signal_Data");
// Hits the SW receiver endpoint
https.get(\`${origin}/ingest?payload=\${payload}\`);`;

      case 'PYTHON':
        return `import requests
data = {"status": "headless_up"}
# Silent background request
requests.get(f"${origin}/ingest", params={"payload": data})`;
      
      case 'CURL':
        return `# Headless cURL trigger (Invisible)
curl -G "${origin}/ingest" --data-urlencode "payload=HelloWinky"`;

      default:
        return '// Select a vector.';
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2rem] p-0 overflow-hidden shadow-soft border border-winky-border transition-all">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Ghost className="w-5 h-5 text-emerald-400" />
              <div>
                 <h4 className="font-black text-slate-200 text-xs uppercase tracking-[0.2em]">Stealth_Protocols</h4>
                 <p className="text-[9px] font-bold text-slate-500">Universal Background Ingestion</p>
              </div>
            </div>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
               <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
             {LANGUAGES.map(lang => (
               <button key={lang.id} onClick={() => setActiveTab(lang.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap border uppercase tracking-widest ${activeTab === lang.id ? 'bg-slate-800 border-slate-600 text-white shadow-lg' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}><span className={activeTab === lang.id ? lang.color : ''}>{lang.label}</span></button>
             ))}
          </div>
        </div>
        <div className="relative group bg-slate-900 p-2">
           <pre className="p-6 text-[10px] md:text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed bg-slate-950/50 rounded-2xl custom-scrollbar max-h-96">{getIntegrationCode()}</pre>
           <button onClick={() => copyCode(getIntegrationCode())} className="absolute top-6 right-6 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-slate-700 shadow-2xl">{copied ? <Wifi className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
        </div>
        <div className="bg-slate-950/50 px-6 py-3 text-[9px] font-bold text-slate-500 border-t border-slate-800 flex items-center gap-2 uppercase tracking-widest"><Terminal className="w-3.5 h-3.5" /> Background ingestion works via Service Worker fetch interception. No UI interruption.</div>
      </div>
  );
};
