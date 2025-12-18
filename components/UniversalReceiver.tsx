
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { PacketSource } from '../types';
import { Radio, MessageSquare, Activity, Globe, Code2, ArrowRight, Zap, RefreshCw, Ghost, ShieldCheck } from 'lucide-react';

interface UniversalReceiverProps {
  onDataReceived: (source: PacketSource, data: string | ArrayBuffer, label?: string) => void;
  onLog: (message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TRAFFIC', detail?: string) => void;
  onOpenDocs: () => void;
  urlFilters: { allowedKeys: string[]; deniedKeys: string[]; enabled: boolean };
  autoScanUrlParams: boolean;
  parameterAliases: Record<string, string>;
}

export const UniversalReceiver: React.FC<UniversalReceiverProps> = ({ 
  onDataReceived, 
  onLog, 
  onOpenDocs, 
  urlFilters,
  autoScanUrlParams,
  parameterAliases
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const processedParamsRef = useRef<Set<string>>(new Set());

  const performUrlScan = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size === 0) return;

    const isHeadless = urlParams.get('headless') === 'true';
    let newSignalsCaptured = 0;

    if (autoScanUrlParams || isHeadless) {
      urlParams.forEach((value, key) => {
        if (key === 'headless') return;
        const signature = `${key}:${value}`;
        if (processedParamsRef.current.has(signature)) return;

        let skip = false;
        if (urlFilters.enabled) {
          if (urlFilters.deniedKeys.includes(key)) skip = true;
          if (urlFilters.allowedKeys.length > 0 && !urlFilters.allowedKeys.includes(key)) skip = true;
        }
        
        if (!skip) {
          const alias = parameterAliases[key];
          const displayLabel = alias ? `${alias} (${key})` : key;
          
          if (isHeadless) {
            onLog(`[HEADLESS_VECT] Capture: ${displayLabel}`, "SUCCESS", `Secure Ingest: ${value.slice(0, 50)}...`);
          } else {
            onLog(`Signal Captured: ${displayLabel}`, "SUCCESS", `Data: ${value.slice(0, 30)}...`);
          }
          
          onDataReceived(PacketSource.URL_PARAM, value, isHeadless ? `Stealth (${displayLabel})` : displayLabel);
          processedParamsRef.current.add(signature);
          newSignalsCaptured++;
        }
      });
    }

    // Robust Headless Termination
    if (isHeadless && newSignalsCaptured > 0) {
        onLog("Headless Protocol Finalizing...", "INFO", "Committing to persistence...");
        // Ensure state commits before destruction
        setTimeout(() => {
          onLog("Terminating Session", "TRAFFIC", "Window close triggered");
          if (window.opener || window.name === 'winky_stealth_frame' || window.parent !== window) {
            window.close();
          } else {
             // If it's a direct tab but marked headless, we still try to close but provide a UI feedback
             onLog("Termination Failed: Tab Locked", "WARNING", "System cannot close primary tab via script");
          }
        }, 1500);
    }
  }, [autoScanUrlParams, urlFilters, parameterAliases, onDataReceived, onLog]);

  useEffect(() => {
    onLog("System Boot: LISTENING", "INFO", "All spectral frequencies active");

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && (event.data.includes('react-devtools') || event.data.includes('webpack'))) return;
      onLog("postMessage Intercepted", "TRAFFIC", `Origin: ${event.origin}`);
      try {
        let d = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : String(event.data);
        if (d && d !== '{}') onDataReceived(PacketSource.WINDOW_MESSAGE, d, `Origin: ${event.origin}`);
      } catch (e) { onLog("Message Corrupted", "ERROR", "Decoding failure"); }
    };
    window.addEventListener('message', handleMessage);
    
    const channel = new BroadcastChannel('winky_channel');
    channel.onmessage = (event) => {
      onLog("Inter-Process Pulse Intercepted", "TRAFFIC", "BroadcastChannel activity detected");
      const content = typeof event.data === 'object' ? JSON.stringify(event.data) : String(event.data);
      onDataReceived(PacketSource.BROADCAST, content, 'Local Cluster Sync');
    };

    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text');
      if (text) {
        onLog("Clipboard Infiltration", "TRAFFIC", `${text.length} bytes captured`);
        onDataReceived(PacketSource.CLIPBOARD, text, 'Clipboard Pulse');
      }
    };
    window.addEventListener('paste', handlePaste);

    performUrlScan();
    // High-frequency scan for state changes in URL
    const pollInterval = setInterval(performUrlScan, 500); 

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('paste', handlePaste);
      channel.close();
      clearInterval(pollInterval);
    };
  }, [performUrlScan, onLog, onDataReceived]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onLog("External Disk Source Detected", "TRAFFIC", "Processing binary stream...");
    Array.from(e.dataTransfer.files).forEach((file: File) => {
      const r = new FileReader();
      r.onload = (ev) => {
        const res = ev.target?.result;
        if (res instanceof ArrayBuffer) {
           try {
             const d = new TextDecoder('utf-8', { fatal: true }).decode(res);
             onDataReceived(PacketSource.FILE_DROP, d, `File: ${file.name}`);
             onLog(`Ingested File (Text): ${file.name}`, "SUCCESS");
           } catch {
             onDataReceived(PacketSource.FILE_DROP, res, `Blob: ${file.name}`);
             onLog(`Ingested File (Binary): ${file.name}`, "SUCCESS");
           }
        }
      };
      r.readAsArrayBuffer(file);
    });
  }, [onDataReceived, onLog]);

  return (
    <div className="space-y-6">
      <div 
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} 
        onDragLeave={() => setIsDragOver(false)} 
        onDrop={handleDrop} 
        className={`relative w-full p-8 rounded-[2.5rem] transition-all border-2 overflow-hidden ${isDragOver ? 'border-winky-pink bg-winky-pink-light dark:bg-winky-pink/20 scale-105 shadow-2xl border-dashed' : 'border-winky-card bg-gradient-to-br from-winky-card to-winky-bg shadow-soft'}`}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-4 relative z-10">
          <div className="relative group cursor-pointer" onClick={performUrlScan}>
            <div className="absolute inset-0 bg-winky-blue/20 blur-3xl rounded-full animate-pulse group-hover:bg-winky-pink/30 transition-colors"></div>
            <div className="w-24 h-24 bg-winky-card rounded-full flex items-center justify-center shadow-glow border border-winky-border relative z-10 group-active:scale-95 transition-transform">
               <Radio className={`w-12 h-12 text-winky-blue ${isDragOver ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-winky-text tracking-tight">Signal Singularity</h3>
            <p className="text-[10px] text-winky-text-soft mt-2 uppercase tracking-[0.3em] font-black">Frequency: <span className="text-emerald-500 animate-pulse">INFINITE_SCAN</span></p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 w-full max-w-xs">
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-pink transition-colors cursor-default"><Globe className="w-3 h-3 text-winky-pink" /><span>ADDR_BAR</span></div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-blue transition-colors cursor-default"><ShieldCheck className="w-3 h-3 text-winky-blue" /><span>POST_MSG</span></div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-amber-500 transition-colors cursor-default"><Activity className="w-3 h-3 text-amber-500" /><span>BRDCAST</span></div>
          </div>
        </div>
      </div>
      <div className="bg-winky-card rounded-3xl p-5 shadow-soft border border-winky-border flex items-center justify-between transition-all hover:border-winky-blue/40 hover:shadow-lg group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-winky-blue/10 rounded-2xl group-hover:scale-110 group-hover:bg-winky-blue/20 transition-all">
              <Zap className="w-6 h-6 text-winky-blue" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-winky-text">Ingestion Vector Docs</h4>
              <p className="text-[10px] text-winky-text-soft uppercase font-bold tracking-wider">Expand Connection Range</p>
            </div>
          </div>
          <button onClick={onOpenDocs} className="px-5 py-2.5 bg-winky-bg border border-winky-border rounded-2xl text-[10px] font-black text-winky-text hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm">Protocol Manual <ArrowRight className="w-3 h-3" /></button>
      </div>
    </div>
  );
};
