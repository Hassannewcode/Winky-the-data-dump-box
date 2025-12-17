import React, { useEffect, useCallback, useState, useRef } from 'react';
import { PacketSource } from '../types';
import { Radio, MessageSquare, Activity, Globe, Code2, ArrowRight, Zap, RefreshCw } from 'lucide-react';

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

    // We use a signature of Key+Value to avoid duplicate ingestions in the polling loop
    let newSignalsCaptured = 0;

    if (autoScanUrlParams) {
      urlParams.forEach((value, key) => {
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
          
          // DEEP LOGGING: Log every single parameter individually
          onLog(`Captured Signal: ${key}`, "SUCCESS", alias ? `Alias: ${alias} | Data: ${value.slice(0, 30)}...` : `Data: ${value.slice(0, 30)}...`);
          
          onDataReceived(PacketSource.URL_PARAM, value, displayLabel);
          processedParamsRef.current.add(signature);
          newSignalsCaptured++;
        } else { 
          onLog(`Signal Blocked: ${key}`, "WARNING", "System Rule Violation");
          processedParamsRef.current.add(signature); // Mark as processed so we don't log the warning every second
        }
      });
    } else {
      const priorityKeys = ['payload', 'data', 'q'];
      priorityKeys.forEach(key => {
        const val = urlParams.get(key);
        if (val) {
          const signature = `${key}:${val}`;
          if (processedParamsRef.current.has(signature)) return;

          const alias = parameterAliases[key];
          onLog(`Priority Payload: ${key}`, "TRAFFIC", alias ? `Alias: ${alias}` : "Direct Vector");
          onDataReceived(PacketSource.URL_PARAM, val, alias ? `${alias} (${key})` : `Payload (${key})`);
          processedParamsRef.current.add(signature);
          newSignalsCaptured++;
        }
      });
    }

    if (newSignalsCaptured > 0) {
        onLog(`Batch Ingestion Complete`, "INFO", `${newSignalsCaptured} new signals added to database`);
    }
  }, [autoScanUrlParams, urlFilters, parameterAliases, onDataReceived, onLog]);

  useEffect(() => {
    onLog("Universal Receiver: LISTENING", "INFO", "All frequencies active");

    // Capture everything - No faking
    const handleMessage = (event: MessageEvent) => {
      // Filter internal dev noise
      if (typeof event.data === 'string' && (event.data.includes('react-devtools') || event.data.includes('webpack'))) return;
      
      onLog("postMessage Detected", "TRAFFIC", `Origin: ${event.origin}`);
      try {
        let d = typeof event.data === 'object' ? JSON.stringify(event.data, null, 2) : String(event.data);
        if (d && d !== '{}') onDataReceived(PacketSource.WINDOW_MESSAGE, d, `Origin: ${event.origin}`);
      } catch (e) { onLog("Signal Corrupted", "ERROR", "Demodulation failed"); }
    };
    window.addEventListener('message', handleMessage);
    
    const channel = new BroadcastChannel('winky_channel');
    channel.onmessage = (event) => {
      onLog("Broadcast Packet Intercepted", "TRAFFIC");
      const content = typeof event.data === 'object' ? JSON.stringify(event.data) : String(event.data);
      onDataReceived(PacketSource.BROADCAST, content, 'Broadcast Pulse');
    };

    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text');
      if (text) {
        onLog("Clipboard Infiltration", "TRAFFIC", `${text.length} bytes captured`);
        onDataReceived(PacketSource.CLIPBOARD, text, 'Clipboard Injection');
      }
    };
    window.addEventListener('paste', handlePaste);

    // Immediate initial scan on launch
    performUrlScan();

    // AGGRESSIVE POLLING: Every 1 second to catch real-time redirects/system integrations
    const pollInterval = setInterval(performUrlScan, 1000); 

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
    onLog("Direct Disk Dump Injected", "TRAFFIC");
    Array.from(e.dataTransfer.files).forEach((file: File) => {
      const r = new FileReader();
      r.onload = (ev) => {
        const res = ev.target?.result;
        if (res instanceof ArrayBuffer) {
           try {
             const d = new TextDecoder('utf-8', { fatal: true }).decode(res);
             onDataReceived(PacketSource.FILE_DROP, d, `File: ${file.name}`);
             onLog(`Text Record Ingested: ${file.name}`, "SUCCESS");
           } catch {
             onDataReceived(PacketSource.FILE_DROP, res, `Blob: ${file.name}`);
             onLog(`Binary Stream Ingested: ${file.name}`, "SUCCESS");
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
            <h3 className="text-2xl font-bold text-winky-text tracking-tight">Data Singularity</h3>
            <p className="text-[10px] text-winky-text-soft mt-2 uppercase tracking-[0.3em] font-black">Scanning: <span className="text-emerald-500 animate-pulse">ALL FREQUENCIES</span></p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 w-full max-w-xs">
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-pink transition-colors cursor-default"><Globe className="w-3 h-3 text-winky-pink" /><span>HTTP_GET</span></div>
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-winky-text-soft bg-winky-bg px-3 py-2 rounded-xl border border-winky-border hover:border-winky-blue transition-colors cursor-default"><MessageSquare className="w-3 h-3 text-winky-blue" /><span>POST_MSG</span></div>
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
              <h4 className="text-sm font-bold text-winky-text">Ingestion Protocols</h4>
              <p className="text-[10px] text-winky-text-soft uppercase font-bold tracking-wider">Connect Any Source</p>
            </div>
          </div>
          <button onClick={onOpenDocs} className="px-5 py-2.5 bg-winky-bg border border-winky-border rounded-2xl text-[10px] font-black text-winky-text hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm">View Manual <ArrowRight className="w-3 h-3" /></button>
      </div>
    </div>
  );
};