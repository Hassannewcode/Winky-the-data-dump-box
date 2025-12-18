
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { PacketSource } from '../types';
import { Radio, MessageSquare, Activity, Globe, Code2, ArrowRight, Zap, RefreshCw, Ghost, ShieldCheck, Wifi, Cpu } from 'lucide-react';

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
  const [swStatus, setSwStatus] = useState<'IDLE' | 'ACTIVE' | 'ERROR'>('IDLE');
  const processedParamsRef = useRef<Set<string>>(new Set());

  const handleIncomingData = useCallback((source: PacketSource, data: string | ArrayBuffer, label?: string) => {
    // Deduplication check for background pulses (often sent via multiple channels for reliability)
    const signature = `${source}:${typeof data === 'string' ? data.slice(0, 100) : 'binary'}`;
    if (processedParamsRef.current.has(signature)) return;
    
    onDataReceived(source, data, label);
    processedParamsRef.current.add(signature);
    // Cleanup old signatures to prevent memory leaks
    if (processedParamsRef.current.size > 500) processedParamsRef.current.clear();
  }, [onDataReceived]);

  const performUrlScan = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size === 0) return;

    urlParams.forEach((value, key) => {
      if (key === 'headless' || key === 'payload' || key === 'data') return;
      const signature = `URL:${key}:${value}`;
      if (processedParamsRef.current.has(signature)) return;

      let skip = false;
      if (urlFilters.enabled) {
        if (urlFilters.deniedKeys.includes(key)) skip = true;
        if (urlFilters.allowedKeys.length > 0 && !urlFilters.allowedKeys.includes(key)) skip = true;
      }
      
      if (!skip) {
        const alias = parameterAliases[key];
        const displayLabel = alias ? `${alias} (${key})` : key;
        onLog(`Signal Captured: ${displayLabel}`, "SUCCESS", `Data: ${value.slice(0, 30)}...`);
        handleIncomingData(PacketSource.URL_PARAM, value, displayLabel);
      }
    });

    ['payload', 'data'].forEach(key => {
        const val = urlParams.get(key);
        if (val && !processedParamsRef.current.has(`URL:${key}:${val}`)) {
            handleIncomingData(PacketSource.URL_PARAM, val, "URL Injection");
            onLog("URL Parameter Ingest", "SUCCESS", `Source: ?${key}=`);
        }
    });
  }, [urlFilters, parameterAliases, handleIncomingData, onLog]);

  useEffect(() => {
    onLog("System Boot: LISTENING", "INFO", "Awaiting background transmissions...");

    // 1. Service Worker Listener (Handles direct postMessage from sw.js)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => setSwStatus('ACTIVE'));
        
        const handleSwMessage = (event: MessageEvent) => {
            if (event.data?.type === 'BACKGROUND_INGEST') {
                onLog("Background Pulse Received", "TRAFFIC", `Origin: ${event.data.origin}`);
                handleIncomingData(PacketSource.BACKGROUND_PROXY, event.data.data, `SW_VECTOR`);
            }
        };
        navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // 2. BroadcastChannel Listener (Handles data from other tabs or the Service Worker bridge)
    const channel = new BroadcastChannel('winky_channel');
    channel.onmessage = (event) => {
      if (event.data?.type === 'BACKGROUND_INGEST') {
          onLog("Broadcast Ingest Detected", "TRAFFIC", "Captured via Winky_Bridge");
          handleIncomingData(PacketSource.BACKGROUND_PROXY, event.data.data, `BC_VECTOR`);
      } else {
          const content = typeof event.data === 'object' ? JSON.stringify(event.data) : String(event.data);
          handleIncomingData(PacketSource.BROADCAST, content, 'Local Cluster Sync');
      }
    };

    // 3. postMessage Listener (Standard window communication)
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string' && (event.data.includes('react-devtools') || event.data.includes('webpack'))) return;
      try {
        let d = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : String(event.data);
        if (d && d !== '{}') {
          onLog("postMessage Intercepted", "TRAFFIC", `Origin: ${event.origin}`);
          handleIncomingData(PacketSource.WINDOW_MESSAGE, d, `Origin: ${event.origin}`);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleWindowMessage);

    // 4. Clipboard Listener
    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text');
      if (text) {
        onLog("Clipboard Capture", "TRAFFIC", `${text.length} bytes`);
        handleIncomingData(PacketSource.CLIPBOARD, text, 'Clipboard Pulse');
      }
    };
    window.addEventListener('paste', handlePaste);

    performUrlScan();
    const pollInterval = setInterval(performUrlScan, 1000); 

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('paste', handlePaste);
      channel.close();
      clearInterval(pollInterval);
    };
  }, [performUrlScan, onLog, handleIncomingData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onLog("Physical File Ingest", "TRAFFIC", "Analyzing binary stream...");
    Array.from(e.dataTransfer.files).forEach((file: File) => {
      const r = new FileReader();
      r.onload = (ev) => {
        const res = ev.target?.result;
        if (res instanceof ArrayBuffer) {
           try {
             const d = new TextDecoder('utf-8', { fatal: true }).decode(res);
             handleIncomingData(PacketSource.FILE_DROP, d, file.name);
           } catch {
             handleIncomingData(PacketSource.FILE_DROP, res, file.name);
           }
        }
      };
      r.readAsArrayBuffer(file);
    });
  }, [handleIncomingData, onLog]);

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
            <div className={`absolute inset-0 blur-3xl rounded-full animate-pulse transition-colors ${swStatus === 'ACTIVE' ? 'bg-emerald-500/20' : 'bg-winky-blue/20'}`}></div>
            <div className="w-24 h-24 bg-winky-card rounded-full flex items-center justify-center shadow-glow border border-winky-border relative z-10 group-active:scale-95 transition-transform">
               <Radio className={`w-12 h-12 ${isDragOver ? 'animate-bounce text-winky-pink' : 'animate-pulse text-winky-blue'}`} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-winky-text tracking-tight">Signal Singularity</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
                 <div className={`w-2 h-2 rounded-full ${swStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                 <p className="text-[10px] text-winky-text-soft uppercase tracking-[0.3em] font-black">
                   Background Receiver: <span className={swStatus === 'ACTIVE' ? 'text-emerald-500' : ''}>{swStatus === 'ACTIVE' ? 'READY' : 'BOOTING'}</span>
                 </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 w-full max-w-xs">
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-pink transition-colors cursor-default"><Globe className="w-3 h-3 text-winky-pink" /><span>FETCH_HOOK</span></div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-blue transition-colors cursor-default"><ShieldCheck className="w-3 h-3 text-winky-blue" /><span>PROXY_NET</span></div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-emerald-500 transition-colors cursor-default"><Wifi className="w-3 h-3 text-emerald-500" /><span>SILENT_BEACON</span></div>
          </div>
        </div>
      </div>
      <div className="bg-winky-card rounded-3xl p-5 shadow-soft border border-winky-border flex items-center justify-between transition-all hover:border-winky-blue/40 hover:shadow-lg group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <Cpu className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-winky-text">No-Redirect Protocols</h4>
              <p className="text-[10px] text-winky-text-soft uppercase font-bold tracking-wider">Active Background listener</p>
            </div>
          </div>
          <button onClick={onOpenDocs} className="px-5 py-2.5 bg-winky-bg border border-winky-border rounded-2xl text-[10px] font-black text-winky-text hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm">Protocol Manual <ArrowRight className="w-3 h-3" /></button>
      </div>
    </div>
  );
};

