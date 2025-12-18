import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, BookOpen, Ghost, Zap, Image as ImageIcon, Cpu } from 'lucide-react';

const LANGUAGES = [
  { id: 'STEALTH', label: 'JS Beacon', color: 'text-emerald-400' },
  { id: 'PIXEL', label: 'Hidden Pixel', color: 'text-winky-pink' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'GO', label: 'Go (Headless)', color: 'text-cyan-400' },
  { id: 'PHP', label: 'PHP (Server)', color: 'text-purple-400' },
  { id: 'RUBY', label: 'Ruby', color: 'text-red-400' },
  { id: 'POWERSHELL', label: 'PowerShell', color: 'text-blue-500' },
  { id: 'CURL', label: 'cURL / Bash', color: 'text-slate-200' },
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
    const sampleData = "Signal_Capture_Payload";
    
    switch (activeTab) {
      case 'STEALTH':
        return `// --- WINKY STEALTH BEACON (FRONTEND) ---
// Invisible background ingestion. No redirects. No UI impact.
function winky(data) {
  const p = encodeURIComponent(typeof data === 'object' ? JSON.stringify(data) : data);
  const url = \`\${origin}/ingest?payload=\${p}\`;

  if (navigator.sendBeacon) navigator.sendBeacon(url); // Vector 1: Beacon
  fetch(url, { mode: 'no-cors' }); // Vector 2: Stealth Fetch
  new Image().src = \`\${origin}/ping.gif?payload=\${p}\`; // Vector 3: Tracking Pixel
}

winky({ event: "user_exit", data: "secret_dump" });`;

      case 'PIXEL':
        return `<!-- UNIVERSAL TRACKING PIXEL -->
<!-- Paste into any HTML. 100% Invisible 1x1 GIF. -->
<img src="${origin}/ping.gif?payload=HTML_PAGE_LOADED" 
     style="display:none; width:1px; height:1px;" 
     referrerpolicy="no-referrer">`;

      case 'NODE':
        return `// Node.js Headless Ingest
const https = require('https');
const payload = encodeURIComponent("Node_System_Log");
https.get(\`${origin}/ingest?payload=\${payload}\`);`;

      case 'PYTHON':
        return `# Python Headless Signal
import requests
requests.get("${origin}/ingest", params={"payload": "Python_Server_Burst"})`;

      case 'GO':
        return `// Go Headless Vector
package main
import "net/http"
import "net/url"

func main() {
    p := url.QueryEscape("Go_Headless_Payload")
    http.Get("${origin}/ingest?payload=" + p)
}`;

      case 'PHP':
        return `<?php
// PHP Server-to-Sink Ingest
$data = urlencode("PHP_Internal_Secret");
file_get_contents("${origin}/ingest?payload=$data");
?>`;

      case 'RUBY':
        return `# Ruby Stealth Ingest
require 'net/http'
require 'uri'
Net::HTTP.get(URI.parse("${origin}/ingest?payload=Ruby_Data_Stream"))`;

      case 'POWERSHELL':
        return `# PowerShell Invisible Trigger
Invoke-WebRequest -Uri "${origin}/ingest?payload=WinSystemSignal" -UseBasicParsing -Method Get`;

      case 'CURL':
        return `# Bash/cURL Silent Payload
curl -s -G "${origin}/ingest" --data-urlencode "payload=Terminal_Signal" > /dev/null`;

      default:
        return '// Signal Ingestion Matrix Active.';
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border border-winky-border">
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                 <Ghost className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                 <h4 className="font-black text-slate-100 text-xs uppercase tracking-[0.2em]">Stealth_Network_Protocols</h4>
                 <p className="text-[9px] font-bold text-slate-500">Universal Background Ingestion Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
               <Cpu className="w-3 h-3 text-winky-blue" />
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active_Uplink</span>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar no-scrollbar scroll-smooth">
             {LANGUAGES.map(lang => (
               <button
                 key={lang.id}
                 onClick={() => setActiveTab(lang.id)}
                 className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap border uppercase tracking-widest flex items-center gap-2 ${
                   activeTab === lang.id 
                     ? 'bg-slate-800 border-slate-600 text-white shadow-lg' 
                     : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {lang.id === 'PIXEL' && <ImageIcon className="w-3 h-3" />}
                 {lang.id === 'STEALTH' && <Zap className="w-3 h-3" />}
                 <span className={activeTab === lang.id ? lang.color : ''}>{lang.label}</span>
               </button>
             ))}
          </div>
        </div>
        
        <div className="relative group bg-slate-900 p-3">
           <pre className="p-8 text-[11px] md:text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed bg-slate-950/70 rounded-[1.5rem] custom-scrollbar max-h-96 border border-slate-800 shadow-inner">
             {getIntegrationCode()}
           </pre>
           <button 
             onClick={() => copyCode(getIntegrationCode())}
             className="absolute top-8 right-8 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-slate-600 shadow-2xl flex items-center gap-2"
           >
             {copied ? <span className="text-[10px] font-bold">COPIED</span> : <Copy className="w-4 h-4" />}
             {copied ? <Wifi className="w-4 h-4 text-emerald-500" /> : null}
           </button>
        </div>
        <div className="bg-slate-950/80 px-8 py-4 text-[9px] font-black text-slate-500 border-t border-slate-800 flex items-center gap-3 uppercase tracking-widest">
           <Terminal className="w-4 h-4 text-emerald-500" />
           <span>Headless signals are intercepted by the Service Worker /ingest mount. No UI required.</span>
        </div>
      </div>
  );
};
