
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UniversalReceiver } from './components/UniversalReceiver';
import { PacketView } from './components/PacketView';
import { SignalLog } from './components/SignalLog';
import { ApiDocs } from './components/ApiDocs';
import { DataVisualizer } from './components/DataVisualizer';
import { ClipboardHistory } from './components/ClipboardHistory';
import { UrlInspector } from './components/UrlInspector';
import { DataPacket, PacketSource, PacketStatus, FilterType, SignalLogEntry, SystemConfig, OriginMetadata } from './types';
import { analyzeDataPacket } from './services/geminiService';
import { Search, Database, Globe2, Inbox, Activity, BookOpen, Settings, X, Save, LayoutDashboard, Server, Moon, Sun, Monitor, Plus, Trash2, Link2, Tag, ArrowRight, Download, Trash, Ghost, Info } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 15);

const STORAGE_KEYS = {
  PACKETS: 'winky_database_packets',
  LOGS: 'winky_database_logs',
  CONFIG: 'winky_system_config',
  CLIPBOARD: 'winky_clipboard_history',
  PENDING_SYNC: 'winky_pending_sync_queue'
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
      theme: 'LIGHT',
      autoScanUrlParams: true,
      parameterAliases: {},
      urlFilters: {
          enabled: false,
          allowedKeys: [],
          deniedKeys: []
      }
    };
  });

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'DOCS'>('DASHBOARD');
  const [showConfig, setShowConfig] = useState(false);
  const [showUrlInspector, setShowUrlInspector] = useState(false);
  const [newAliasKey, setNewAliasKey] = useState('');
  const [newAliasValue, setNewAliasValue] = useState('');

  const addLog = useCallback((message: string, type: SignalLogEntry['type'], detail?: string) => {
    setLogs(prev => {
        const newLogs = [...prev, {
            id: generateId(),
            timestamp: Date.now(),
            type,
            message,
            detail
        }].slice(-500);
        return newLogs;
    }); 
  }, []);

  const getOriginMetadata = (): OriginMetadata => ({
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: (navigator as any).platform || 'Unknown',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: Date.now(),
    referrer: document.referrer || 'Direct'
  });

  const handleDataReceived = useCallback(async (source: PacketSource, data: string | ArrayBuffer, label?: string) => {
    if (source === PacketSource.CLIPBOARD && typeof data === 'string') {
        setClipboardHistory(prev => [{
            id: generateId(),
            content: data,
            timestamp: Date.now()
        }, ...prev].slice(0, 100));
    }

    let size = 0;
    if (typeof data === 'string') size = new Blob([data]).size;
    else if (data instanceof ArrayBuffer) size = data.byteLength;

    const newPacket: DataPacket = {
      id: generateId(),
      timestamp: Date.now(),
      source,
      rawContent: data,
      mimeType: typeof data === 'string' ? 'text/plain' : 'application/octet-stream',
      size,
      label,
      status: PacketStatus.RAW,
      origin: getOriginMetadata()
    };

    setPackets(prev => {
      const updated = [newPacket, ...prev];
      return config.maxRetention === -1 ? updated : updated.slice(0, config.maxRetention);
    });

    if (config.autoAnalyze) {
      processAnalysis(newPacket, data, source);
    }
  }, [config.maxRetention, config.autoAnalyze]);

  const processAnalysis = async (packet: DataPacket, data: string | ArrayBuffer, source: string) => {
    setPackets(prev => prev.map(p => p.id === packet.id ? { ...p, status: PacketStatus.ANALYZING } : p));
    try {
      const analysis = await analyzeDataPacket(data, source);
      setPackets(prev => prev.map(p => 
        p.id === packet.id ? { ...p, status: PacketStatus.ANALYZED, analysis } : p
      ));
    } catch (error) {
      setPackets(prev => prev.map(p => p.id === packet.id ? { ...p, status: PacketStatus.ERROR } : p));
    }
  };

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(packets));
  }, [packets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIPBOARD, JSON.stringify(clipboardHistory));
  }, [clipboardHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  // Sync Stealth Queue on Launch
  useEffect(() => {
    const syncHeadlessQueue = () => {
        const queue = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
        if (queue) {
            const records = JSON.parse(queue);
            if (records.length > 0) {
                addLog(`Recovering Headless Sync`, "INFO", `${records.length} records restored from IndexedDB cache`);
                records.forEach((r: any) => {
                    handleDataReceived(r.source, r.data, r.label);
                });
                localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
            }
        }
    };
    
    addLog("System Initialize", "INFO", "Scanning persistent database partitions...");
    syncHeadlessQueue();
  }, [addLog, handleDataReceived]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowConfig(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        setShowUrlInspector(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowConfig(false);
        setShowUrlInspector(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = false;
      if (config.theme === 'DARK') isDark = true;
      else if (config.theme === 'SYSTEM') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    applyTheme();
  }, [config.theme]);

  const clearDatabase = () => {
    if (window.confirm("ARE YOU SURE? This will purge all captured signals from the local database forever.")) {
      setPackets([]);
      setLogs([]);
      setClipboardHistory([]);
      addLog("Database Purged", "WARNING", "All local records deleted");
    }
  };

  const deletePacket = useCallback((id: string) => {
    setPackets(prev => prev.filter(p => p.id !== id));
    addLog(`Signal Purged`, "WARNING", `Record ${id.slice(0, 4)} removed`);
  }, [addLog]);

  const downloadSession = () => {
    const sessionData = {
      app: "Winky",
      version: "1.3.0",
      exportDate: new Date().toISOString(),
      packetCount: packets.length,
      packets: packets.map(p => ({
        ...p,
        rawContent: p.rawContent instanceof ArrayBuffer 
          ? Array.from(new Uint8Array(p.rawContent)) 
          : p.rawContent
      }))
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winky_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Database Exported", "SUCCESS", `${packets.length} signals backed up`);
  };

  useEffect(() => {
    (window as any).Winky = {
      ingest: (data: any, label?: string) => {
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        handleDataReceived(PacketSource.GLOBAL_API, payload, label || 'Winky.ingest() Injection');
        addLog("Manual Injection Intercepted", "TRAFFIC", label || "Global API Call");
        return { status: 'recorded', timestamp: Date.now() };
      },
      stealthInject: (data: any) => {
        const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        const url = `${window.location.origin}/?payload=${encodeURIComponent(payload)}&headless=true`;
        
        addLog("Deploying Stealth Beacon", "INFO", "Attempting multi-vector delivery...");
        
        let delivered = false;

        // Vector 1: navigator.sendBeacon (Preferred)
        if (navigator.sendBeacon) {
          const result = navigator.sendBeacon(url);
          if (result) {
            addLog("Beacon Delivered", "SUCCESS", "Vector: navigator.sendBeacon");
            delivered = true;
          }
        }

        // Vector 2: Background Iframe (Fallback)
        if (!delivered) {
          const iframe = document.createElement('iframe');
          iframe.name = 'winky_stealth_frame';
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          setTimeout(() => iframe.remove(), 5000);
          addLog("Beacon Delivered", "SUCCESS", "Vector: Invisible Iframe");
          delivered = true;
        }

        // Vector 3: Image Ping (Final Fallback)
        if (!delivered) {
          const img = new Image();
          img.src = url;
          addLog("Beacon Delivered", "SUCCESS", "Vector: Image Ping Fallback");
        }

        return { status: 'stealth_deployed', timestamp: Date.now() };
      },
      getStatus: () => ({
        listening: true,
        packets: packets.length,
        version: '1.3.0'
      }),
      config: config
    };
    return () => { delete (window as any).Winky; }
  }, [packets.length, config, handleDataReceived, addLog]);

  const filteredPackets = useMemo(() => {
    return packets.filter(p => {
      const matchesFilter = filter === 'ALL' || p.source === filter;
      const rawText = typeof p.rawContent === 'string' ? p.rawContent : '[BINARY DATA]';
      const searchLower = searchTerm.toLowerCase();
      return matchesFilter && (searchTerm === '' || 
         rawText.toLowerCase().includes(searchLower) || 
         p.analysis?.summary?.toLowerCase().includes(searchLower) ||
         p.analysis?.dataType?.toLowerCase().includes(searchLower));
    });
  }, [packets, filter, searchTerm]);

  const stats = useMemo(() => {
    const totalVolume = packets.reduce((acc, p) => acc + p.size, 0);
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };
    return { 
      totalVolume: formatBytes(totalVolume), 
      count: packets.length, 
      topType: Object.entries(packets.reduce<Record<string, number>>((acc, p) => {
        const type = p.analysis?.dataType || 'Raw Data';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Waiting...'
    };
  }, [packets]);

  const handleUrlFilterChange = (type: 'allowed' | 'denied', val: string, action: 'add' | 'remove') => {
      setConfig(prev => {
          const target = type === 'allowed' ? prev.urlFilters.allowedKeys : prev.urlFilters.deniedKeys;
          const newArr = action === 'add' ? [...target, val] : target.filter(k => k !== val);
          return { ...prev, urlFilters: { ...prev.urlFilters, [type === 'allowed' ? 'allowedKeys' : 'deniedKeys']: newArr } };
      });
  };

  const handleAliasChange = (action: 'add' | 'remove', key: string, alias?: string) => {
      setConfig(prev => {
          const newAliases = { ...prev.parameterAliases };
          if (action === 'add' && alias) newAliases[key] = alias;
          else delete newAliases[key];
          return { ...prev, parameterAliases: newAliases };
      });
  };

  return (
    <div className="h-screen w-full bg-winky-bg text-winky-text font-sans flex flex-col overflow-hidden transition-colors duration-300">
      <nav className="shrink-0 bg-winky-card/80 backdrop-blur-md border-b border-winky-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-winky-pink rounded-xl flex items-center justify-center shadow-lg shadow-winky-pink/20">
               <Inbox className="text-white w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-winky-text tracking-tight">Winky</h1>
               <p className="text-[10px] font-bold text-winky-pink uppercase tracking-widest">Signal Database v1.3.0</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex bg-winky-bg p-1 rounded-lg border border-winky-border">
                <button 
                  onClick={() => setCurrentView('DASHBOARD')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'DASHBOARD' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft hover:text-winky-text'}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Monitor</span>
                </button>
                <button 
                  onClick={() => setCurrentView('DOCS')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'DOCS' ? 'bg-winky-card text-winky-blue shadow-sm' : 'text-winky-text-soft hover:text-winky-text'}`}
                >
                  <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Manual</span>
                </button>
             </div>

             <button onClick={() => setShowUrlInspector(true)} className="p-2 text-winky-text-soft hover:text-winky-blue transition-colors rounded-full hover:bg-winky-bg" title="URL Scanner (Ctrl+Shift+U)">
               <Link2 className="w-5 h-5" />
             </button>

             <button onClick={() => setShowConfig(true)} className="p-2 text-winky-text-soft hover:text-winky-blue transition-colors rounded-full hover:bg-winky-bg" title="Settings (Ctrl+K)">
               <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      <UrlInspector isOpen={showUrlInspector} onClose={() => setShowUrlInspector(false)} onIngest={handleDataReceived} config={config} onUpdateFilters={handleUrlFilterChange} parameterAliases={config.parameterAliases} />

      {showConfig && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-winky-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-winky-border">
              <div className="bg-winky-bg p-6 border-b border-winky-border flex items-center justify-between shrink-0">
                 <h2 className="text-lg font-bold text-winky-text flex items-center gap-2"><Settings className="w-5 h-5 text-winky-blue" /> System Preferences</h2>
                 <button onClick={() => setShowConfig(false)} className="text-winky-text-soft hover:text-winky-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                 <div>
                    <h3 className="text-xs font-bold text-winky-text-soft uppercase mb-3">Environment Theme</h3>
                    <div className="flex gap-2">
                       <button onClick={() => setConfig(c => ({...c, theme: 'LIGHT'}))} className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold ${config.theme === 'LIGHT' ? 'bg-winky-blue text-white' : 'bg-winky-bg text-winky-text-soft'}`}><Sun className="w-4 h-4" /> Light</button>
                       <button onClick={() => setConfig(c => ({...c, theme: 'DARK'}))} className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold ${config.theme === 'DARK' ? 'bg-winky-blue text-white' : 'bg-winky-bg text-winky-text-soft'}`}><Moon className="w-4 h-4" /> Dark</button>
                       <button onClick={() => setConfig(c => ({...c, theme: 'SYSTEM'}))} className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold ${config.theme === 'SYSTEM' ? 'bg-winky-blue text-white' : 'bg-winky-bg text-winky-text-soft'}`}><Monitor className="w-4 h-4" /> System</button>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-bold text-winky-text-soft uppercase mb-3 tracking-wider">Dynamic Parameter Aliases</h3>
                    <div className="bg-winky-bg p-4 rounded-xl border border-winky-border space-y-3">
                       <div className="flex gap-2">
                          <input placeholder="Original Key" className="flex-1 text-xs p-2 rounded border border-winky-border bg-white dark:bg-slate-800" value={newAliasKey} onChange={(e) => setNewAliasKey(e.target.value)} />
                          <input placeholder="Display Alias" className="flex-1 text-xs p-2 rounded border border-winky-border bg-white dark:bg-slate-800" value={newAliasValue} onChange={(e) => setNewAliasValue(e.target.value)} />
                          <button onClick={() => { if (newAliasKey && newAliasValue) { handleAliasChange('add', newAliasKey, newAliasValue); setNewAliasKey(''); setNewAliasValue(''); } }} className="px-3 bg-winky-blue text-white rounded text-xs font-bold">Add</button>
                       </div>
                       <div className="space-y-1">
                          {Object.entries(config.parameterAliases).map(([key, alias]) => (
                             <div key={key} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded border border-winky-border">
                                <span><code className="text-winky-pink">{key}</code> → <b>{alias}</b></span>
                                <button onClick={() => handleAliasChange('remove', key)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between bg-winky-bg p-3 rounded-lg border border-winky-border">
                    <div>
                      <span className="text-sm text-winky-text font-bold block">Aggressive Auto-Scan</span>
                      <span className="text-[10px] text-winky-text-soft">Continuously ingest all discovered URL parameters.</span>
                    </div>
                    <button onClick={() => setConfig(c => ({...c, autoScanUrlParams: !c.autoScanUrlParams}))} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.autoScanUrlParams ? 'bg-winky-blue' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoScanUrlParams ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 <div className="pt-4">
                    <button 
                      onClick={clearDatabase}
                      className="w-full bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <Trash className="w-4 h-4" /> Reset All Local Partitions
                    </button>
                 </div>
              </div>
              <div className="p-4 border-t border-winky-border"><button onClick={() => setShowConfig(false)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-colors">Save Configurations</button></div>
           </div>
        </div>
      )}

      {currentView === 'DOCS' ? (
        <ApiDocs />
      ) : (
        <main className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-winky-border">
          <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 space-y-6">
               <UniversalReceiver onDataReceived={handleDataReceived} onLog={addLog} onOpenDocs={() => setCurrentView('DASHBOARD')} urlFilters={config.urlFilters} autoScanUrlParams={config.autoScanUrlParams} parameterAliases={config.parameterAliases} />
               <ClipboardHistory history={clipboardHistory} onReIngest={(content) => handleDataReceived(PacketSource.CLIPBOARD, content, 'Local Cache Recall')} onClear={() => setClipboardHistory([])} />
               <SignalLog logs={logs} />
               <div className="bg-winky-card rounded-2xl p-4 border border-winky-border shadow-soft flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Info className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-[10px] font-bold text-winky-text-soft uppercase tracking-wider">
                    Database Persistent: <span className="text-emerald-500">Active</span>
                  </div>
               </div>
            </section>

            <section className="lg:col-span-8 flex flex-col min-w-0">
              <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Signals Committed</div><div className="text-2xl font-bold text-winky-text">{stats.count}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Payload Weight</div><div className="text-2xl font-bold text-winky-blue">{stats.totalVolume}</div></div>
                 <div className="bg-winky-card p-4 rounded-2xl shadow-soft border border-winky-border"><div className="text-[10px] text-winky-text-soft font-bold uppercase mb-1">Primary Type</div><div className="text-lg font-bold text-winky-pink truncate">{stats.topType}</div></div>
              </div>
              
              <DataVisualizer packets={packets} />
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-winky-text-soft" />
                  <input type="text" placeholder="Search persistent signal records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-winky-card border border-winky-border text-sm focus:outline-none focus:ring-2 focus:ring-winky-blue/20 transition-all" />
                </div>
                {packets.length > 0 && (
                  <button 
                    onClick={downloadSession}
                    className="px-4 py-2.5 bg-winky-text text-winky-bg rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap shadow-md"
                    title="Export database snapshot"
                  >
                    <Save className="w-4 h-4" /> Backup Database
                  </button>
                )}
              </div>

              <div className="space-y-4 pb-12">
                 {filteredPackets.map(packet => (<PacketView key={packet.id} packet={packet} parameterAliases={config.parameterAliases} onDelete={deletePacket} />))}
                 {filteredPackets.length === 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-winky-text-soft bg-winky-card/30 rounded-3xl border-2 border-dashed border-winky-border animate-pulse">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Awaiting signal transmission...</p>
                  </div>
                 )}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
