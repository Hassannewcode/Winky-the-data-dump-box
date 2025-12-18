
import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, BookOpen, Ghost, Zap, Monitor, EyeOff } from 'lucide-react';

const LANGUAGES = [
  { id: 'STEALTH', label: 'Beacon Function', color: 'text-emerald-400' },
  { id: 'RELAY', label: 'Server Relay', color: 'text-winky-pink' },
  { id: 'JS', label: 'Vanilla JS', color: 'text-yellow-400' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'CURL', label: 'cURL / Shell', color: 'text-slate-200' },
];

export const IntegrationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('STEALTH');
  const [mode, setMode] = useState<'STANDARD' | 'STEALTH'>('STEALTH');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const origin = window.location.origin;
    const headlessFlag = mode === 'STEALTH' ? '&headless=true' : '';
    
    switch (activeTab) {
      case 'STEALTH':
        return `// --- Universal Ingestion Beacon ---
function winkyBeacon(data) {
  const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const url = \`\${origin}/?payload=\${encodeURIComponent(payload)}${headlessFlag}\`;
  
  // High-fidelity delivery attempts:
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    const img = new Image();
    img.src = url;
  }
}

winkyBeacon({ event: "system_heartbeat", status: "ok" });`;

      case 'RELAY':
        return `// Save as 'winky-relay.js'
const http = require('http');
const { exec } = require('child_process');

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
       const url = \`${origin}/?payload=\${encodeURIComponent(body)}${headlessFlag}\`;
       const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
       exec(\`\${start} "\${url}"\`);
       res.end('Ingest Triggered');
    });
  }
}).listen(3000);`;

      case 'JS':
        return `// Native Window Method
const data = { msg: "Hello from JS" };
const url = \`${origin}/?payload=\${encodeURIComponent(JSON.stringify(data))}${headlessFlag}\`;
window.open(url, ${mode === 'STEALTH' ? "'winky_frame'" : "'_blank'"});`;
      
      case 'NODE':
        return `const { exec } = require('child_process');
const payload = encodeURIComponent("Server_Log_Entry");
const url = \`${origin}/?payload=\${payload}${headlessFlag}\`;

exec(\`\${process.platform == 'darwin'? 'open': 'start'} \${url}\`);`;

      case 'PYTHON':
        return `import webbrowser, urllib.parse
data = "Python_Signal"
url = f"${origin}/?payload={urllib.parse.quote(data)}${headlessFlag}"
webbrowser.open(url)`;
      
      case 'CURL':
        return `# cURL Trigger
xdg-open "${origin}/?payload=Shell_Command${headlessFlag}"`;

      default:
        return '// Select a vector.';
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2rem] p-0 overflow-hidden shadow-soft border border-winky-border transition-all">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Ghost className="w-5 h-5 text-emerald-400" />
              <div>
                 <h4 className="font-black text-slate-200 text-xs uppercase tracking-[0.2em]">Universal_Protocols</h4>
                 <p className="text-[9px] font-bold text-slate-500">Pick your integration vector</p>
              </div>
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
               <button 
                onClick={() => setMode('STANDARD')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${mode === 'STANDARD' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500'}`}
               >
                 <Monitor className="w-3 h-3" /> Standard
               </button>
               <button 
                onClick={() => setMode('STEALTH')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${mode === 'STEALTH' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500'}`}
               >
                 <EyeOff className="w-3 h-3" /> Stealth
               </button>
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
           {mode === 'STEALTH' ? 'Stealth mode triggers self-closing background sessions.' : 'Standard mode opens a visible browser instance.'}
        </div>
      </div>
  );
};
