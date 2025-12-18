import React, { useEffect, useRef } from 'react';
import { SignalLogEntry } from '../types';
import { Terminal, Cpu, Wifi, ShieldCheck, Activity } from 'lucide-react';

interface SignalLogProps {
  logs: SignalLogEntry[];
}

export const SignalLog: React.FC<SignalLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-2xl shadow-soft border border-slate-800 overflow-hidden flex flex-col h-64 md:h-auto">
      {/* Terminal Header */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono font-bold text-slate-400">SIGNAL_INTERCEPT_LOG.log</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-winky-blue animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono">CORE: ONLINE</span>
           </div>
           <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-slate-500 font-mono">NET: LISTENING</span>
           </div>
        </div>
      </div>

      {/* Log Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for incoming transmission...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded transition-colors">
            <span className="text-slate-500 shrink-0">
              [{new Date(log.timestamp).toISOString().split('T')[1].slice(0, -1)}]
            </span>
            <div className="break-all">
              {log.type === 'INFO' && <span className="text-blue-400 font-bold">INFO </span>}
              {log.type === 'SUCCESS' && <span className="text-emerald-400 font-bold">RECV </span>}
              {log.type === 'WARNING' && <span className="text-amber-400 font-bold">WARN </span>}
              {log.type === 'ERROR' && <span className="text-red-400 font-bold">ERR  </span>}
              {log.type === 'TRAFFIC' && <span className="text-purple-400 font-bold">DATA </span>}
              
              <span className="text-slate-300">{log.message}</span>
              {log.detail && (
                <span className="text-slate-500 ml-2 border-l border-slate-700 pl-2">
                  {log.detail}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};