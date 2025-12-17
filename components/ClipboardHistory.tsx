import React from 'react';
import { Clipboard, RefreshCw, X, Clock } from 'lucide-react';
import { PacketSource } from '../types';

interface ClipboardHistoryProps {
  history: { id: string, content: string, timestamp: number }[];
  onReIngest: (content: string) => void;
  onClear: () => void;
}

export const ClipboardHistory: React.FC<ClipboardHistoryProps> = ({ history, onReIngest, onClear }) => {
  return (
    <div className="bg-winky-card rounded-2xl shadow-soft border border-winky-border p-6 h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <Clipboard className="w-4 h-4 text-purple-500" />
             <h3 className="text-sm font-bold text-winky-text uppercase tracking-wide">Clipboard History</h3>
          </div>
          {history.length > 0 && (
            <button 
              onClick={onClear}
              className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded bg-red-50 dark:bg-red-900/20"
            >
              CLEAR ALL
            </button>
          )}
       </div>

       <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {history.length === 0 ? (
             <div className="h-32 flex flex-col items-center justify-center text-winky-text-soft opacity-50">
                <Clock className="w-6 h-6 mb-2" />
                <p className="text-xs">No clipboard data captured yet.</p>
             </div>
          ) : (
             history.map((item) => (
                <div key={item.id} className="group relative border border-winky-border rounded-xl p-3 bg-winky-bg hover:bg-white dark:hover:bg-slate-800 transition-all">
                   <p className="text-xs font-mono text-winky-text line-clamp-3 mb-2 break-all">
                      {item.content}
                   </p>
                   <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-winky-text-soft">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      <button 
                        onClick={() => onReIngest(item.content)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-winky-blue bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 transition-all"
                      >
                         <RefreshCw className="w-3 h-3" /> Re-Ingest
                      </button>
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
};