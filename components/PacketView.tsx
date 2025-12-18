import React, { useState, useMemo } from 'react';
import { DataPacket, PacketStatus } from '../types';
import { Code, FileText, Globe, Shield, Tag, ChevronDown, ChevronUp, Database, Binary, Eye, Table, Copy, Check, ArrowRight, Download, Trash2 } from 'lucide-react';

interface PacketViewProps {
  packet: DataPacket;
  parameterAliases?: Record<string, string>;
  onDelete: (id: string) => void;
}

export const PacketView: React.FC<PacketViewProps> = ({ packet, parameterAliases = {}, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'TEXT' | 'HEX' | 'STRUCTURE'>('STRUCTURE');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [packetCopied, setPacketCopied] = useState(false);

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'CLIPBOARD': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'FILE_DROP': return <Database className="w-4 h-4 text-blue-500" />;
      case 'URL_PARAM': return <Globe className="w-4 h-4 text-pink-500" />;
      default: return <Code className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRiskBadge = (risk?: string) => {
    if (!risk) return null;
    const r = risk.toLowerCase();
    let color = 'bg-slate-100 text-slate-600';
    if (r.includes('high')) color = 'bg-red-100 text-red-600';
    if (r.includes('medium')) color = 'bg-orange-100 text-orange-600';
    if (r.includes('low')) color = 'bg-green-100 text-green-600';
    
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 ${color}`}>
        <Shield className="w-3 h-3" /> {risk}
      </span>
    );
  };

  const hexDump = useMemo(() => {
    let buffer: Uint8Array;
    if (packet.rawContent instanceof ArrayBuffer) {
      buffer = new Uint8Array(packet.rawContent);
    } else if (typeof packet.rawContent === 'string') {
      buffer = new TextEncoder().encode(packet.rawContent);
    } else {
      return '';
    }

    const lines = [];
    const limit = Math.min(buffer.length, 2048);
    for (let i = 0; i < limit; i += 16) {
      const chunk = buffer.slice(i, i + 16);
      const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
      const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
      lines.push(`${i.toString(16).padStart(4, '0')}  ${hex.padEnd(48, ' ')}  |${ascii}|`);
    }
    if (buffer.length > limit) lines.push('... (truncated for display)');
    return lines.join('\n');
  }, [packet.rawContent]);

  const downloadRaw = () => {
    let blob: Blob;
    let fileName = `winky_signal_${packet.id.slice(0, 8)}`;
    let extension = ".bin";

    if (packet.rawContent instanceof ArrayBuffer) {
      blob = new Blob([packet.rawContent], { type: 'application/octet-stream' });
      extension = ".bin";
    } else {
      blob = new Blob([packet.rawContent || ""], { type: 'text/plain' });
      const dt = (packet.analysis?.dataType || "").toLowerCase();
      
      // Extensive extension mapping based on AI analysis
      if (dt.includes("json")) extension = ".json";
      else if (dt.includes("javascript") || dt.includes("source code")) extension = ".js";
      else if (dt.includes("python")) extension = ".py";
      else if (dt.includes("html")) extension = ".html";
      else if (dt.includes("css")) extension = ".css";
      else if (dt.includes("csv")) extension = ".csv";
      else if (dt.includes("log")) extension = ".log";
      else if (dt.includes("text")) extension = ".txt";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPacketContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    let content = "";
    if (typeof packet.rawContent === 'string') {
        content = packet.rawContent;
    } else if (packet.rawContent instanceof ArrayBuffer) {
        content = hexDump;
    }
    
    if (content) {
        navigator.clipboard.writeText(content);
        setPacketCopied(true);
        setTimeout(() => setPacketCopied(false), 2000);
    }
  };

  const isBinary = packet.rawContent instanceof ArrayBuffer;
  const hasStructure = packet.analysis?.extractedFields && Object.keys(packet.analysis.extractedFields).length > 0;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-winky-card rounded-[1.5rem] shadow-soft border border-winky-border overflow-hidden transition-all hover:shadow-md mb-4 group/packet">
      <div 
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="p-3 bg-winky-bg border border-winky-border rounded-2xl group-hover/packet:scale-110 transition-transform">
            {getSourceIcon(packet.source)}
          </div>
          
          <div className="min-w-0">
             <div className="flex items-center gap-2">
                <span className="font-bold text-winky-text text-sm truncate uppercase tracking-tight">
                  {packet.analysis?.dataType || (isBinary ? "Binary Stream" : "Data Record")}
                </span>
                {packet.label && (
                   <span className="text-[10px] font-bold bg-winky-bg border border-winky-border px-1.5 py-0.5 rounded text-winky-text-soft truncate max-w-[150px]">
                     {packet.label}
                   </span>
                )}
             </div>
             <div className="text-[10px] text-winky-text-soft font-bold mt-1 flex items-center gap-2 uppercase tracking-widest">
               {new Date(packet.timestamp).toLocaleTimeString()} 
               <span>•</span> 
               {packet.size.toLocaleString()} BYTES
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {packet.analysis && getRiskBadge(packet.analysis.securityRisk)}
          <div className="flex items-center bg-winky-bg rounded-xl border border-winky-border p-1 opacity-100 md:opacity-0 group-hover/packet:opacity-100 transition-opacity">
            <button 
              onClick={copyPacketContent}
              className={`p-1.5 transition-colors rounded-lg flex items-center justify-center ${packetCopied ? 'text-emerald-500' : 'text-winky-text-soft hover:text-winky-blue'}`}
              title="Copy Signal Data"
            >
              {packetCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); downloadRaw(); }}
              className="p-1.5 text-winky-text-soft hover:text-winky-blue transition-colors rounded-lg flex items-center justify-center"
              title="Download Raw Signal"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(packet.id); }}
              className="p-1.5 text-winky-text-soft hover:text-red-500 transition-colors rounded-lg flex items-center justify-center"
              title="Purge Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <button className="text-winky-text-soft hover:text-winky-text p-1">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-winky-border bg-winky-bg/50 p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-6">
            
            {packet.analysis && (
              <div className="bg-winky-card p-5 rounded-2xl border border-winky-border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black text-winky-text-soft uppercase tracking-widest">Signal Analysis</h4>
                  <div className="flex gap-2">
                    <button onClick={copyPacketContent} className="text-[10px] font-bold text-winky-blue flex items-center gap-1 hover:underline">
                      <Copy className="w-3 h-3" /> COPY
                    </button>
                    <button onClick={downloadRaw} className="text-[10px] font-bold text-winky-blue flex items-center gap-1 hover:underline">
                      <Download className="w-3 h-3" /> EXPORT
                    </button>
                  </div>
                </div>
                <p className="text-sm text-winky-text leading-relaxed font-semibold">
                  {packet.analysis.summary}
                </p>
                {packet.analysis.tags && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {packet.analysis.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-winky-blue-light dark:bg-winky-blue/10 text-winky-blue text-[10px] rounded-lg font-black border border-winky-blue/10 uppercase tracking-tighter">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-black text-winky-text-soft uppercase tracking-widest">Raw Payload</h4>
               <div className="flex bg-winky-card rounded-xl p-1 border border-winky-border shadow-sm">
                  {hasStructure && (
                    <button 
                      onClick={() => setViewMode('STRUCTURE')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode === 'STRUCTURE' ? 'bg-winky-bg text-winky-text shadow-sm' : 'text-winky-text-soft hover:text-winky-text'}`}
                    >
                      <Table className="w-3 h-3" /> SCHEMA
                    </button>
                  )}
                  <button 
                    onClick={() => setViewMode('TEXT')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode === 'TEXT' ? 'bg-winky-bg text-winky-text shadow-sm' : 'text-winky-text-soft hover:text-winky-text'}`}
                    disabled={isBinary}
                  >
                    <Eye className="w-3 h-3" /> TEXT
                  </button>
                  <button 
                    onClick={() => setViewMode('HEX')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all ${viewMode === 'HEX' ? 'bg-winky-bg text-winky-text shadow-sm' : 'text-winky-text-soft hover:text-winky-text'}`}
                  >
                    <Binary className="w-3 h-3" /> HEX
                  </button>
               </div>
            </div>

            {viewMode === 'STRUCTURE' && hasStructure && packet.analysis?.extractedFields && (
               <div className="border border-winky-border rounded-2xl overflow-hidden bg-winky-card shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-winky-bg border-b border-winky-border">
                      <tr>
                        <th className="p-4 font-black text-winky-text-soft uppercase tracking-widest text-[9px]">Field</th>
                        <th className="p-4 font-black text-winky-text-soft uppercase tracking-widest text-[9px]">Value</th>
                        <th className="p-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-winky-border">
                      {Object.entries(packet.analysis.extractedFields).map(([k, v]) => {
                        const alias = parameterAliases[k];
                        return (
                          <tr key={k} className="hover:bg-winky-bg transition-colors group/row">
                            <td className="p-4 align-top">
                               <div className="font-mono font-bold text-winky-text">{k}</div>
                               {alias && (
                                 <div className="flex items-center gap-1 text-[10px] text-winky-pink font-bold mt-1 uppercase tracking-tight">
                                    <ArrowRight className="w-3 h-3" /> {alias}
                                 </div>
                               )}
                            </td>
                            <td className="p-4 font-mono text-winky-text-soft break-all align-top leading-relaxed">
                              {String(v)}
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => copyToClipboard(String(v), k)}
                                className="text-winky-text-soft hover:text-winky-blue opacity-100 md:opacity-0 group-hover/row:opacity-100 transition-all p-2 bg-winky-bg rounded-lg border border-winky-border"
                              >
                                {copiedField === k ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            )}

            {(viewMode === 'TEXT' || viewMode === 'HEX') && (
              <div className="bg-slate-950 rounded-2xl p-6 overflow-x-auto border border-slate-900 shadow-2xl relative">
                <button 
                  onClick={copyPacketContent}
                  className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all shadow-lg"
                  title="Copy All"
                >
                  {packetCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre font-medium max-h-96 custom-scrollbar">
                  {viewMode === 'TEXT' ? (typeof packet.rawContent === 'string' ? packet.rawContent : '[BINARY_STREAM]') : hexDump}
                </pre>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
