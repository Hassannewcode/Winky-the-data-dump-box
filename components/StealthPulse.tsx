
import React, { useEffect, useState } from 'react';
import { Radio, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';

interface StealthPulseProps {
  onComplete: () => void;
  status: 'INGESTING' | 'SUCCESS' | 'ERROR';
}

export const StealthPulse: React.FC<StealthPulseProps> = ({ onComplete, status }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-winky-blue/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-winky-pink/5 rounded-full blur-[80px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 space-y-8 max-w-sm w-full">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-winky-blue/20 blur-2xl rounded-full animate-ping"></div>
          <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
            {status === 'INGESTING' ? (
              <Radio className="w-12 h-12 text-winky-blue animate-pulse" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-emerald-500 animate-bounce" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
            {status === 'INGESTING' ? 'Intercepting Signal' : 'Signal Captured'}
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
            Frequency: <span className="text-winky-blue">Headless_Redirect_V1</span>
          </p>
        </div>

        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-winky-blue to-winky-pink transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-center gap-4 text-slate-400">
           <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
             <Zap className="w-3 h-3 text-emerald-500" /> Secure
           </div>
           <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
           <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
             <ArrowLeft className="w-3 h-3 text-winky-blue" /> Auto_Return
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
        Winky Ingest Protocol • Headless Active
      </div>
    </div>
  );
};
