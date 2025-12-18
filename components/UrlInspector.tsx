import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Shield, AlertTriangle, CheckCircle, X, Filter, Plus, Trash2, ArrowRight } from 'lucide-react';
import { PacketSource } from '../types';

interface UrlInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (source: PacketSource, data: string, label: string) => void;
  config: {
    urlFilters: {
      enabled: boolean;
      allowedKeys: string[];
      deniedKeys: string[];
    };
  };
  onUpdateFilters: (type: 'allowed' | 'denied', key: string, action: 'add' | 'remove') => void;
  parameterAliases?: Record<string, string>;
}

export const UrlInspector: React.FC<UrlInspectorProps> = ({ 
  isOpen, 
  onClose, 
  onIngest, 
  config, 
  onUpdateFilters,
  parameterAliases = {} 
}) => {
  const [currentParams, setCurrentParams] = useState<[string, string][]>([]);
  const [manualKey, setManualKey] = useState('');
  const [manualValue, setManualValue] = useState('');

  const scanUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const entries: [string, string][] = [];
    params.forEach((value, key) => {
      entries.push([key, value]);
    });
    setCurrentParams(entries);
  };

  useEffect(() => {
    if (isOpen) scanUrl();
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatus = (key: string) => {
    if (!config.urlFilters.enabled) return { status: 'PASS', color: 'text-slate-400', icon: null };
    if (config.urlFilters.deniedKeys.includes(key)) return { status: 'BLOCKED', color: 'text-red-500', icon: <AlertTriangle className="w-3 h-3" /> };
    if (config.urlFilters.allowedKeys.length > 0 && !config.urlFilters.allowedKeys.includes(key)) return { status: 'IGNORED', color: 'text-orange-400', icon: <Filter className="w-3 h-3" /> };
    return { status: 'ALLOWED', color: 'text-green-500', icon: <CheckCircle className="w-3 h-3" /> };
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-winky-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-winky-border animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-winky-border flex items-center justify-between shrink-0 bg-winky-bg rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
               <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-winky-text">URL Parameter Inspector</h2>
               <p className="text-xs text-winky-text-soft">Deep scan of browser address bar query strings</p>
             </div>
          </div>
          <button onClick={onClose} className="text-winky-text-soft hover:text-winky-text p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-winky-border">
             <div className="text-xs font-mono text-winky-text-soft break-all flex-1">
               {window.location.href}
             </div>
             <button 
               onClick={scanUrl}
               className="px-4 py-2 bg-winky-blue text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shrink-0"
             >
               <RefreshCw className="w-3 h-3" /> Re-Scan URL
             </button>
          </div>

          {/* Params Table */}
          <div>
            <h3 className="text-xs font-bold text-winky-text-soft uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Detected Parameters
            </h3>
            
            {currentParams.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-winky-border rounded-xl">
                  <p className="text-winky-text-soft text-sm">No parameters found in current URL.</p>
                  <p className="text-xs text-slate-400 mt-1">Try appending <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">?id=123&token=abc</span> to the address bar.</p>
               </div>
            ) : (
               <div className="border border-winky-border rounded-xl overflow-hidden bg-winky-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-winky-bg border-b border-winky-border">
                      <tr>
                        <th className="p-3 font-bold text-winky-text-soft">Key / Alias</th>
                        <th className="p-3 font-bold text-winky-text-soft">Value</th>
                        <th className="p-3 font-bold text-winky-text-soft">Status</th>
                        <th className="p-3 font-bold text-winky-text-soft text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-winky-border">
                      {currentParams.map(([key, value], idx) => {
                         const info = getStatus(key);
                         const alias = parameterAliases[key];
                         return (
                           <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="p-3">
                                <div className="font-mono font-bold text-winky-text">{key}</div>
                                {alias && (
                                   <div className="flex items-center gap-1 text-[10px] text-winky-text-soft mt-0.5">
                                      <ArrowRight className="w-2 h-2" /> {alias}
                                   </div>
                                )}
                             </td>
                             <td className="p-3 font-mono text-winky-text-soft break-all max-w-[200px]">{value}</td>
                             <td className="p-3">
                                <div className={`flex items-center gap-1.5 font-bold ${info.color}`}>
                                   {info.icon} {info.status}
                                </div>
                             </td>
                             <td className="p-3 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  {/* Allow/Block Controls */}
                                  {config.urlFilters.enabled && (
                                    <>
                                      {!config.urlFilters.allowedKeys.includes(key) && (
                                        <button 
                                          onClick={() => onUpdateFilters('allowed', key, 'add')}
                                          className="p-1.5 hover:bg-green-100 text-green-600 rounded" 
                                          title="Add to Whitelist"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                        </button>
                                      )}
                                      {!config.urlFilters.deniedKeys.includes(key) && (
                                        <button 
                                          onClick={() => onUpdateFilters('denied', key, 'add')}
                                          className="p-1.5 hover:bg-red-100 text-red-600 rounded" 
                                          title="Add to Blocklist"
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  
                                  <button 
                                    onClick={() => onIngest(PacketSource.URL_PARAM, value, `Inspector (${alias || key})`)}
                                    className="px-3 py-1 bg-winky-bg border border-winky-border rounded text-[10px] font-bold text-winky-text hover:bg-winky-blue hover:text-white hover:border-winky-blue transition-colors"
                                  >
                                    Ingest
                                  </button>
                               </div>
                             </td>
                           </tr>
                         );
                      })}
                    </tbody>
                  </table>
               </div>
            )}
          </div>

          {/* Manual Injection Simulator */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-winky-border">
             <h3 className="text-xs font-bold text-winky-text mb-3">Manual Parameter Injection</h3>
             <div className="flex gap-2">
                <input 
                  className="flex-1 bg-winky-card border border-winky-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-winky-blue/50"
                  placeholder="Key (e.g. session_id)"
                  value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                />
                <input 
                  className="flex-[2] bg-winky-card border border-winky-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-winky-blue/50"
                  placeholder="Value (e.g. 8f9s8d9f8s)"
                  value={manualValue}
                  onChange={e => setManualValue(e.target.value)}
                />
                <button 
                  onClick={() => {
                     if(manualKey && manualValue) {
                       const alias = parameterAliases[manualKey];
                       onIngest(PacketSource.URL_PARAM, manualValue, `Simulator (${alias || manualKey})`);
                       setManualKey('');
                       setManualValue('');
                     }
                  }}
                  className="px-4 bg-winky-text text-winky-bg rounded-lg font-bold text-xs hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};