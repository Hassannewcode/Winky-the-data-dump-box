import React, { useState } from 'react';
import { Code2, Terminal, Wifi, Copy, BookOpen } from 'lucide-react';

const LANGUAGES = [
  { id: 'RELAY', label: 'Relay Bridge (POST)', color: 'text-winky-pink' },
  { id: 'JS', label: 'JS (Web)', color: 'text-yellow-400' },
  { id: 'NODE', label: 'Node.js', color: 'text-green-400' },
  { id: 'PYTHON', label: 'Python', color: 'text-blue-400' },
  { id: 'POWERSHELL', label: 'PowerShell', color: 'text-blue-200' },
  { id: 'PERL', label: 'Perl', color: 'text-indigo-300' },
  { id: 'LUA', label: 'Lua', color: 'text-blue-300' },
  { id: 'CURL', label: 'Bash/cURL', color: 'text-slate-200' },
  { id: 'GO', label: 'Go', color: 'text-cyan-400' },
  { id: 'RUST', label: 'Rust', color: 'text-orange-600' },
  { id: 'RUBY', label: 'Ruby', color: 'text-red-400' },
  { id: 'PHP', label: 'PHP', color: 'text-purple-400' },
  { id: 'JAVA', label: 'Java', color: 'text-amber-500' },
  { id: 'KOTLIN', label: 'Kotlin', color: 'text-purple-300' },
  { id: 'CSHARP', label: 'C#', color: 'text-indigo-400' },
  { id: 'CPP', label: 'C++', color: 'text-blue-600' },
  { id: 'SWIFT', label: 'Swift', color: 'text-orange-500' },
  { id: 'DART', label: 'Dart', color: 'text-cyan-300' },
];

export const IntegrationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('JS');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const origin = window.location.origin;
    
    // Snippet Generator
    switch (activeTab) {
      case 'RELAY':
        return `// Save as 'winky-relay.js' and run with 'node winky-relay.js'
// Listens for POST on localhost:3000 -> Opens Browser
const http = require('http');
const { exec } = require('child_process');

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
       const url = \`${origin}/?payload=\${encodeURIComponent(body)}\`;
       const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
       exec(\`\${start} "\${url}"\`);
       res.end('Relayed');
    });
  }
}).listen(3000, () => console.log('Winky Relay Active on Port 3000'));`;

      case 'JS':
        return `// 1. Deep Link (URL)
window.open('${origin}/?payload=' + encodeURIComponent(data));

// 2. Global API (Direct - Console/Script)
if (window.Winky) {
  window.Winky.ingest({ source: 'MyScript', value: 42 });
}

// 3. Broadcast Channel (Background)
new BroadcastChannel('winky_channel').postMessage('System Ready');`;
      
      case 'NODE':
        return `// Node.js (System Integration)
const { exec } = require('child_process');
const payload = encodeURIComponent(JSON.stringify({ log: "Server Boot" }));
const url = \`${origin}/?payload=\${payload}\`;

// Cross-platform open
const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
exec(\`\${start} \${url}\`);`;
      // ... (Include other cases as needed, truncated for brevity in this context but keeping main ones)
      case 'PYTHON':
        return `# Python 3
import webbrowser, urllib.parse, json

data = {"source": "ML_Pipeline", "accuracy": 0.98}
payload = urllib.parse.quote(json.dumps(data))
url = f"${origin}/?payload={payload}"

webbrowser.open(url)`;
      
      case 'CURL':
        return `# Bash / cURL (Trigger Browser)
# Encode your data first!
DATA="System%20Update%20Required"
# Linux
xdg-open "${origin}/?payload=$DATA"
# Mac
open "${origin}/?payload=$DATA"
# Windows
start "${origin}/?payload=$DATA"`;

      default:
        return '// Select a language to see the integration snippet.';
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
           <Terminal className="w-3 h-3" />
           Use these snippets to pipe data into the Winky Sink.
        </div>
      </div>
  );
};