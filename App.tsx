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
import { Search, Database, Globe2, Inbox, Activity, BookOpen, Settings, X, Save, LayoutDashboard, Server, Moon, Sun, Monitor, Plus, Trash2, Link2, Tag, ArrowRight, Download, Trash, Ghost } from 'lucide-react';

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
      maxRetention: 500,
      notifications: true,
      theme: 'LIGHT',
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

  // Persistence
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(packets)); }, [packets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CLIPBOARD, JSON.stringify(clipboardHistory)); }, [clipboardHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config)); }, [config]);

  const addLog = useCallback((message: string, type: SignalLogEntry['type'], detail?: string) => {
    setLogs(prev => [...prev, { id: generateId(), timestamp: Date.now(), type, message, detail }].slice(-500)); 
  }, []);

  const handleDataReceived = useCallback(async (source: PacketSource, data: string | ArrayBuffer, label?: string) => {
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
    addLog(`Record Purged`, "WARNING", `ID: ${id.slice(0,4)}`);
  }, [addLog]);

  // HEADLESS SYNC: Service Worker Stealth Queue
  useEffect(() => {
    const syncStealthQueue = async () => {
      try {
        const dbName = 'winky_headless_db';
        const storeName = 'stealth_queue';
        const request = indexedDB.open(dbName, 1);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(storeName)) return;
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            getReq.result.forEach(record => {
              handleDataReceived(PacketSource.GLOBAL_API, record.data, 'Headless Ingest (Offline)');
              store.delete(record.id);
            });
            if (getReq.result.length > 0) addLog("Stealth Signals Sync", "SUCCESS", `${getReq.result.length} packets recovered from background queue`);
          };
        };
      } catch (e) { console.warn("Stealth DB Sync Failed", e); }
    };

    syncStealthQueue();
    const bc = new BroadcastChannel('winky_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'HEADLESS_INGEST') {
        const record = event.data.payload;
        addLog("Stealth Signal Intercepted", "TRAFFIC", "Service Worker Handover");
        handleDataReceived(PacketSource.GLOBAL_API, record.data, 'Headless Ingest (Live)');
        // Cleanup IndexedDB since we ingested it live
        const request = indexedDB.open('winky_headless_db', 1);
        request.onsuccess = () => request.result.transaction('stealth_queue', 'readwrite').objectStore('stealth_queue').delete(record.id);
      }
    };
    return () => bc.close();
  }, [handleDataReceived, addLog]);

  // Enhanced Global API
  useEffect(() => {
    (window as any).Winky = {
      ingest: (data: any, label?: string) => {
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        handleDataReceived(PacketSource.GLOBAL_API, payload, label || 'Manual Ingest');
        return { status: 'recorded', timestamp: Date.now() };
      },
      stealthBeacon: (data: any) => {
        // Absolute Headless: Use image ping or fetch(no-cors) to hit SW interceptor
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        const endpoint = `${window.location.origin}/ingest?payload=${encodeURIComponent(payload)}`;
        // Try multiple vectors for guaranteed headless delivery
        if ('sendBeacon' in navigator) navigator.sendBeacon(endpoint);
        else new Image().src = endpoint;
        return { status: 'beacon_sent', timestamp: Date.now() };
      },
      getStatus: () => ({ listening: true, packets: packets.length, version: '1.2.0' }),
      config: config
    };
  }, [packets.length, config, handleDataReceived]);

  const filteredPackets = useMemo(() => {
    return packets.filter(p => {
      const matchesFilter = filter === 'ALL' || p.source === filter;
      const rawText = typeof p.rawContent === 'string' ? p.rawContent : '[BINARY DATA]';
      const searchLower = searchTerm.toLowerCase();
      return matchesFilter && (searchTerm === '' || rawText.toLowerCase().includes(searchLower));
    });
  }, [packets, filter, searchTerm]);

  const stats = useMemo(() => {
    const totalVolume = packets.reduce((acc, p) => acc + p.size, 0);
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = totalVolume === 0 ? 0 : Math.floor(Math.log(totalVolume) / Math.log(k));
    const volumeStr = `${(totalVolume / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    return { totalVolume: volumeStr, count: packets.length };
  }, [packets]);

  return (
    <div className="h-screen w-full bg-winky-bg text-winky-text font-sans flex flex-col overflow-hidden transition-colors duration-300">
      <nav className="shrink-0 bg-winky-card/80 backdrop-blur-md border-b border-winky-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-winky-pink rounded-xl flex items-center justify-center shadow-lg"><Inbox className="text-white w-6 h-6" /></div>
             <div><h1 className="text-xl font-bold text-winky-text tracking-tight">Winky</h1><p className="text-[10px] font-bold text-winky-pink uppercase tracking-widest">Universal Database v1.2</p></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-winky-bg p-1 rounded-lg border border-winky-border">
                <button onClick={() => setCurrentView('DASHBOARD')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${currentView === 'DASHBOARD' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft'}`}>Dashboard</button>
                <button onClick={() => setCurrentView('DOCS')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${currentView === 'DOCS' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft'}`}>Docs</button>
             </div>
             <button onClick={() => setShowUrlInspector(true)} className="p-2 text-winky-text-soft hover:text-winky-blue"><Link2 className="w-5 h-5" /></button>
             <button onClick={() => setShowConfig(true)} className="p-2 text-winky-text-soft hover:text-winky-blue"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {currentView === 'DOCS' ? <ApiDocs /> : (
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 space-y-6">
               <UniversalReceiver onDataReceived={handleDataReceived} onLog={addLog} onOpenDocs={() => setCurrentView('DOCS')} urlFilters={config.urlFilters} autoScanUrlParams={config.autoScanUrlParams} parameterAliases={config.parameterAliases} />
               <ClipboardHistory history={clipboardHistory} onReIngest={(content) => handleDataReceived(PacketSource.CLIPBOARD, content, 'Database Recall')} onClear={() => setClipboardHistory([])} />
               <SignalLog logs={logs} />
            </section>
            <section className="lg:col-span-8 flex flex-col min-w-0">
              <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Records</div><div className="text-2xl font-bold">{stats.count}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Weight</div><div className="text-2xl font-bold text-winky-blue">{stats.totalVolume}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border flex items-center justify-center"><Ghost className="w-8 h-8 text-winky-pink opacity-50 animate-pulse" /></div>
              </div>
              <DataVisualizer packets={packets} />
              <div className="relative mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-winky-text-soft" /><input type="text" placeholder="Search signals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-winky-card border border-winky-border" /></div>
              <div className="space-y-4 pb-12">
                 {filteredPackets.map(packet => (<PacketView key={packet.id} packet={packet} parameterAliases={config.parameterAliases} onDelete={deletePacket} />))}
                 {filteredPackets.length === 0 && <div className="h-40 flex items-center justify-center text-winky-text-soft italic">No signals found...</div>}
              </div>
            </section>
          </div>
        </main>
      )}
      {showUrlInspector && <UrlInspector isOpen={showUrlInspector} onClose={() => setShowUrlInspector(false)} onIngest={handleDataReceived} config={config} onUpdateFilters={() => {}} />}
    </div>
  );
};

export default App;
