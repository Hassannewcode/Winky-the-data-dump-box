import React, { useRef } from 'react';
import { Code, Server, Zap, Terminal, Globe, HardDrive, Search, Layers, Box, Cpu, ArrowRight, ShieldAlert, Key, Database, ChevronRight } from 'lucide-react';
import { IntegrationGenerator } from './IntegrationGenerator';

export const ApiDocs: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'intro', label: 'Winky Protocol' },
    { id: 'vector-a', label: 'Universal URL' },
    { id: 'vector-b', label: 'Window Messaging' },
    { id: 'secrets', label: 'Secret Ingestion' },
    { id: 'relay-bridge', label: 'Relay Bridge' },
    { id: 'iot', label: 'IoT Hardware' },
    { id: 'global-api', label: 'Global JS API' },
    { id: 'config', label: 'Parameter Mapping' }
  ];

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex-1 bg-winky-card overflow-hidden flex flex-col md:flex-row h-full w-full relative">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Protocol Vectors</div>
           <nav className="space-y-1">
              {sections.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => jumpTo(s.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-between group"
                >
                  {s.label}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
           </nav>
        </div>
        <div className="mt-auto p-6 bg-slate-950">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">System Ready</span>
           </div>
           <p className="text-[9px] text-slate-600 font-mono">v1.2.0 Universal_Sink_Engine</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="shrink-0 bg-slate-900 px-4 md:px-8 py-4 flex items-center justify-between border-b border-slate-700 z-20 shadow-xl lg:hidden">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-slate-800 text-white text-[10px] font-bold border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-winky-blue focus:outline-none cursor-pointer"
              onChange={(e) => jumpTo(e.target.value)}
              value=""
            >
              <option value="" disabled>JUMP TO SECTION...</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth w-full scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600 transition-colors bg-winky-bg dark:bg-slate-900/50">
          <section id="intro" className="bg-slate-900 text-white p-10 md:p-24 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none rotate-12">
                <Database className="w-96 h-96" />
             </div>
             <div className="max-w-4xl relative z-10">
                <div className="px-4 py-1.5 bg-winky-pink w-fit text-white text-[10px] font-black rounded-full uppercase mb-10 tracking-widest shadow-2xl shadow-winky-pink/30">Official Ingestion Manual</div>
                <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]">Universal Data <br/>Singularity</h1>
                <p className="text-slate-400 text-xl md:text-2xl max-w-3xl leading-relaxed font-semibold">The absolute terminus for every signal. Zero simulation, full high-fidelity capture of any byte stream.</p>
             </div>
          </section>

          <div className="max-w-4xl mx-auto p-8 md:p-20 space-y-40 pb-64">
             <section className="scroll-mt-24">
                <div className="flex items-center gap-5 mb-12 pb-8 border-b border-winky-border">
                  <Code className="w-12 h-12 text-winky-blue" />
                  <div>
                    <h2 className="text-4xl font-black text-winky-text tracking-tighter">Integration Matrix</h2>
                    <p className="text-sm font-bold text-winky-text-soft uppercase tracking-widest">Select your vector below</p>
                  </div>
                </div>
                <IntegrationGenerator />
             </section>

             <section id="vector-a" className="scroll-mt-24 space-y-10">
                <div className="flex items-center gap-5 mb-6 pb-8 border-b border-winky-border">
                  <Globe className="w-12 h-12 text-winky-pink" />
                  <div>
                    <h2 className="text-4xl font-black text-winky-text tracking-tighter">Universal URL Ingest</h2>
                    <p className="text-sm font-bold text-winky-text-soft uppercase tracking-widest">Protocol Vector Alpha</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-lg text-winky-text-soft leading-relaxed font-semibold">Winky aggressively scans every query parameter for meaningful signals. If it's in the URL, it's in the sink.</p>
                  <div className="bg-slate-50 dark:bg-slate-950 p-10 rounded-[2.5rem] border border-winky-border font-mono text-sm break-all text-winky-blue shadow-inner flex flex-col md:flex-row items-center gap-4">
                    <span className="flex-1">{window.location.origin}/?payload=[RAW_DATA]</span>
                    <div className="px-4 py-2 bg-winky-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Vector_Ready</div>
                  </div>
                </div>
             </section>

             <section id="relay-bridge" className="scroll-mt-24 space-y-10">
                <div className="flex items-center gap-5 mb-6 pb-8 border-b border-winky-border">
                  <Server className="w-12 h-12 text-purple-500" />
                  <div>
                    <h2 className="text-4xl font-black text-winky-text tracking-tighter">System Relay Bridge</h2>
                    <p className="text-sm font-bold text-winky-text-soft uppercase tracking-widest">Server-to-Sink Connector</p>
                  </div>
                </div>
                <p className="text-lg text-winky-text-soft leading-relaxed font-semibold">Perfect for Webhooks, Cron jobs, and AI integrations. Run this locally to pipe standard HTTP POST traffic directly into your Winky UI.</p>
                <div className="bg-slate-950 p-10 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-900 group">
                   <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">winky-relay.js</span>
                      <div className="flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      </div>
                   </div>
                   <pre className="text-xs md:text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto custom-scrollbar">
{`// Save as 'winky-relay.js' and run with 'node winky-relay.js'
// Listens for POST on localhost:3000 -> Opens Browser
const http = require('http');
const { exec } = require('child_process');

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
       // Deep pipe into your Winky Singularity instance
       const url = \`${window.location.origin}/?payload=\${encodeURIComponent(body)}\`;
       const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
       exec(\`\${start} "\${url}"\`);
       res.end('Ingested');
    });
  }
}).listen(3000, () => console.log('Winky Relay Active: localhost:3000'));`}
                   </pre>
                </div>
             </section>

             <section id="secrets" className="scroll-mt-24 space-y-10">
                <div className="flex items-center gap-5 mb-6 pb-8 border-b border-winky-border">
                  <Key className="w-12 h-12 text-emerald-500" />
                  <div>
                    <h2 className="text-4xl font-black text-winky-text tracking-tighter">Private Data Handling</h2>
                    <p className="text-sm font-bold text-winky-text-soft uppercase tracking-widest">Local-Only Security</p>
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-12 rounded-[3rem] border border-emerald-100 dark:border-emerald-900/30 flex gap-10">
                   <ShieldAlert className="w-20 h-20 text-emerald-500 shrink-0 hidden md:block" />
                   <div className="space-y-6">
                      <p className="text-xl text-emerald-900 dark:text-emerald-300 leading-relaxed font-bold tracking-tight">Winky is built for the raw truth. Whether it's production secrets or internal certificate dumps, our local-resident processing ensures your data never touches our cloud.</p>
                      <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-3 font-bold uppercase tracking-widest">
                         <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4" /> 100% Client-Side Demodulation</li>
                         <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4" /> Real-time PII Heuristics</li>
                         <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4" /> Zero Session Persistence</li>
                      </ul>
                   </div>
                </div>
             </section>

             <div className="text-center text-slate-400 font-mono text-[10px] py-40 border-t border-winky-border uppercase tracking-[0.5em] font-black">
                End of Specification • Winky v1.2.0 Ingestion Matrix
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};