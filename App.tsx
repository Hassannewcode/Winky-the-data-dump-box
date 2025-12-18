import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UniversalReceiver } from './components/UniversalReceiver';
import { PacketView } from './components/PacketView';
import { SignalLog } from './components/SignalLog';
import { ApiDocs } from './components/ApiDocs';
import { DataVisualizer } from './components/DataVisualizer';
import { ClipboardHistory } from './components/ClipboardHistory';
import { UrlInspector } from './components/UrlInspector';
import { DataPacket, PacketSource, PacketStatus, FilterType, SignalLogEntry, SystemConfig } from './types';
import { analyzeDataPacket } from './services/geminiService';
import { Search, Database, Globe2, Inbox, Activity, BookOpen, Settings, X, Save, LayoutDashboard, Server, Moon, Sun, Monitor, Plus, Trash2, Link2, Tag, ArrowRight, Download, Trash, Ghost, Zap } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15);

const STORAGE_KEYS = {
  PACKETS: 'winky_database_packets',
  LOGS: 'winky_database_logs',
  CONFIG: 'winky_system_config',
  CLIPBOARD: 'winky_clipboard_history'
};

const App: React.FC = () => {
  const [packets, setPackets] = useState<DataPacket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACKETS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<SignalLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  const [clipboardHistory, setClipboardHistory] = useState<{id: string, content: string, timestamp: number}[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIPBOARD);
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : {
      autoAnalyze: true,
      maxRetention: 1000,
      notifications: true,
      theme: 'LIGHT', // Defaulting to LIGHT theme as requested
      autoScanUrlParams: true,
      parameterAliases: {},
      urlFilters: { enabled: false, allowedKeys: [], deniedKeys: [] }
    };
  });

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'DOCS'>('DASHBOARD');
  const [showConfig, setShowConfig] = useState(false);
  const [showUrlInspector, setShowUrlInspector] = useState(false);

  // Persistence logic
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(packets)); }, [packets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CLIPBOARD, JSON.stringify(clipboardHistory)); }, [clipboardHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config)); }, [config]);

  const addLog = useCallback((message: string, type: SignalLogEntry['type'], detail?: string) => {
    setLogs(prev => [...prev, { id: generateId(), timestamp: Date.now(), type, message, detail }].slice(-500)); 
  }, []);

  const handleDataReceived = useCallback(async (source: PacketSource, data: string | ArrayBuffer, label?: string) => {
    if (!data) return;
    if (source === PacketSource.CLIPBOARD && typeof data === 'string') {
        setClipboardHistory(prev => [{ id: generateId(), content: data, timestamp: Date.now() }, ...prev].slice(0, 100));
    }
    const size = typeof data === 'string' ? new Blob([data]).size : (data instanceof ArrayBuffer ? data.byteLength : 0);
    const newPacket: DataPacket = { id: generateId(), timestamp: Date.now(), source, rawContent: data, mimeType: typeof data === 'string' ? 'text/plain' : 'application/octet-stream', size, label, status: PacketStatus.RAW };
    
    setPackets(prev => {
      const updated = [newPacket, ...prev];
      return config.maxRetention === -1 ? updated : updated.slice(0, config.maxRetention);
    });
    
    if (config.autoAnalyze) {
      setTimeout(() => processAnalysis(newPacket, data, source), 50);
    }
  }, [config.maxRetention, config.autoAnalyze]);

  const processAnalysis = async (packet: DataPacket, data: string | ArrayBuffer, source: string) => {
    try {
      const analysis = await analyzeDataPacket(data, source);
      setPackets(prev => prev.map(p => p.id === packet.id ? { ...p, status: PacketStatus.ANALYZED, analysis } : p));
    } catch (error) {
      setPackets(prev => prev.map(p => p.id === packet.id ? { ...p, status: PacketStatus.ERROR } : p));
    }
  };

  const deletePacket = useCallback((id: string) => {
    setPackets(prev => prev.filter(p => p.id !== id));
    addLog(`Signal Purged`, "WARNING", `Record ${id.slice(0,4)} removed from database.`);
  }, [addLog]);

  // SYNC ENGINE: Bridges Background Service Worker captures to the Main Database
  const syncStealthQueue = useCallback(async () => {
    try {
      const DB_NAME = 'winky_headless_db';
      const STORE_NAME = 'stealth_queue';
      const request = indexedDB.open(DB_NAME, 2);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) return;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.getAll();
        getReq.onsuccess = () => {
          const results = getReq.result;
          if (results.length === 0) return;
          results.forEach(record => {
            handleDataReceived(PacketSource.GLOBAL_API, record.data, `Headless_${record.source}`);
            store.delete(record.id);
          });
          addLog("Stealth Queue Synced", "SUCCESS", `${results.length} headless captures recovered.`);
        };
      };
    } catch (e) { console.warn("Headless Sync Refused", e); }
  }, [handleDataReceived, addLog]);

  useEffect(() => {
    syncStealthQueue();
    const pollInterval = setInterval(syncStealthQueue, 2000); 
    const bc = new BroadcastChannel('winky_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'HEADLESS_INGEST') {
        const record = event.data.payload;
        addLog("Headless Capture Detected", "TRAFFIC", `Vector: ${record.source}`);
        handleDataReceived(PacketSource.GLOBAL_API, record.data, `Stealth_${record.source}`);
        // Clean up live sync to prevent double ingestion on poll
        const request = indexedDB.open('winky_headless_db', 2);
        request.onsuccess = () => request.result.transaction('stealth_queue', 'readwrite').objectStore('stealth_queue').delete(record.id);
      }
      if (event.data?.type === 'LOG') {
          addLog(event.data.message, event.data.level || 'INFO');
      }
    };
    return () => { clearInterval(pollInterval); bc.close(); };
  }, [syncStealthQueue, handleDataReceived, addLog]);

  // WINKY GLOBAL API: Expands control to any integrated script
  useEffect(() => {
    const origin = window.location.origin;
    (window as any).Winky = {
      ingest: (data: any, label?: string) => {
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        handleDataReceived(PacketSource.GLOBAL_API, payload, label || 'Manual_Injection');
        addLog("API Ingestion Initiated", "SUCCESS", label);
        return { status: 'recorded', timestamp: Date.now() };
      },
      stealthBeacon: (data: any) => {
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        const endpoint = `${origin}/ingest?payload=${encodeURIComponent(payload)}`;
        const pixel = `${origin}/ping.gif?payload=${encodeURIComponent(payload)}`;
        
        // Triple-Vector Delivery for 100% Ingestion Probability
        if ('sendBeacon' in navigator) navigator.sendBeacon(endpoint);
        fetch(endpoint, { mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = pixel;
        
        addLog("Stealth Beacon Fired", "TRAFFIC", "Multi-vector burst deployed.");
        return { status: 'headless_burst_deployed', timestamp: Date.now() };
      },
      getStatus: () => ({ listening: true, packets: packets.length, version: '1.2.6' }),
      config: config
    };
  }, [packets.length, config, handleDataReceived, addLog]);

  const stats = useMemo(() => {
    const totalVolume = packets.reduce((acc, p) => acc + p.size, 0);
    const k = 1024;
    // Expanded units up to Yottabytes (10^24 bytes)
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = totalVolume === 0 ? 0 : Math.floor(Math.log(totalVolume) / Math.log(k));
    const volumeStr = `${(totalVolume / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    return { totalVolume: volumeStr, count: packets.length };
  }, [packets]);

  return (
    <div className={`h-screen w-full bg-winky-bg text-winky-text font-sans flex flex-col overflow-hidden transition-colors duration-300 ${config.theme === 'DARK' ? 'dark' : ''}`}>
      <nav className="shrink-0 bg-winky-card/80 backdrop-blur-md border-b border-winky-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-winky-pink rounded-xl flex items-center justify-center shadow-lg shadow-winky-pink/20 animate-pulse">
               <Inbox className="text-white w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-winky-text tracking-tight">Winky</h1>
               <p className="text-[10px] font-bold text-winky-pink uppercase tracking-widest">Universal Database v1.2.6</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-winky-bg p-1 rounded-lg border border-winky-border">
                <button onClick={() => setCurrentView('DASHBOARD')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${currentView === 'DASHBOARD' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft'}`}>Dashboard</button>
                <button onClick={() => setCurrentView('DOCS')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${currentView === 'DOCS' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft'}`}>Docs</button>
             </div>
             <button onClick={() => setShowUrlInspector(true)} className="p-2 text-winky-text-soft hover:text-winky-blue transition-colors rounded-full"><Link2 className="w-5 h-5" /></button>
             <button onClick={() => setShowConfig(true)} className="p-2 text-winky-text-soft hover:text-winky-blue transition-colors rounded-full"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {currentView === 'DOCS' ? <ApiDocs /> : (
        <main className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-winky-border">
          <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 space-y-6">
               <UniversalReceiver onDataReceived={handleDataReceived} onLog={addLog} onOpenDocs={() => setCurrentView('DOCS')} urlFilters={config.urlFilters} autoScanUrlParams={config.autoScanUrlParams} parameterAliases={config.parameterAliases} />
               <ClipboardHistory history={clipboardHistory} onReIngest={(content) => handleDataReceived(PacketSource.CLIPBOARD, content, 'Database_Recall')} onClear={() => setClipboardHistory([])} />
               <SignalLog logs={logs} />
            </section>
            <section className="lg:col-span-8 flex flex-col min-w-0">
              <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Signals</div><div className="text-2xl font-bold">{stats.count}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Capacity</div><div className="text-2xl font-bold text-winky-blue">{stats.totalVolume}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border flex items-center justify-center"><Ghost className="w-8 h-8 text-winky-pink opacity-50 animate-bounce" /></div>
              </div>
              <DataVisualizer packets={packets} />
              <div className="relative mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-winky-text-soft" /><input type="text" placeholder="Search the database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-winky-card border border-winky-border text-sm focus:outline-none focus:ring-2 focus:ring-winky-blue/20" /></div>
              <div className="space-y-4 pb-20">
                 {packets.filter(p => p.rawContent?.toString().toLowerCase().includes(searchTerm.toLowerCase())).map(packet => (
                   <PacketView key={packet.id} packet={packet} parameterAliases={config.parameterAliases} onDelete={deletePacket} />
                 ))}
                 {packets.length === 0 && <div className="h-40 flex flex-col items-center justify-center text-winky-text-soft italic bg-winky-card/30 rounded-3xl border-2 border-dashed border-winky-border"><Database className="w-8 h-8 mb-2 opacity-20" />Waiting for external transmission...</div>}
              </div>
            </section>
          </div>
        </main>
      )}
      {showConfig && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-winky-card rounded-2xl shadow-2xl w-full max-w-md border border-winky-border p-6 space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-winky-blue" /> Preferences</h2><button onClick={() => setShowConfig(false)}><X className="w-5 h-5" /></button></div>
              <div className="space-y-4">
                 <button onClick={() => setConfig(c => ({...c, theme: c.theme === 'DARK' ? 'LIGHT' : 'DARK'}))} className="w-full py-3 bg-winky-bg rounded-xl border border-winky-border text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-widest">Interface: {config.theme} {config.theme === 'DARK' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
                 <button onClick={() => { if(confirm("Purge all data?")) { localStorage.clear(); window.location.reload(); } }} className="w-full py-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-widest"><Trash className="w-4 h-4" /> System Wipe</button>
              </div>
              <button onClick={() => setShowConfig(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest">Done</button>
           </div>
        </div>
      )}
      {showUrlInspector && <UrlInspector isOpen={showUrlInspector} onClose={() => setShowUrlInspector(false)} onIngest={handleDataReceived} config={config} onUpdateFilters={() => {}} />}
    </div>
  );
};

export default App;
