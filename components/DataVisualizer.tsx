import React, { useMemo } from 'react';
import { DataPacket } from '../types';
import { Activity, BarChart3, TrendingUp, Clock, Calendar, ArrowUpRight } from 'lucide-react';

interface DataVisualizerProps {
  packets: DataPacket[];
}

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ packets }) => {
  
  // Last 60 data points for the "Stock Market" Live Ticker
  const tickerData = useMemo(() => {
    return packets.slice(0, 60).reverse().map(p => ({
      val: p.size,
      time: new Date(p.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      id: p.id
    }));
  }, [packets]);

  // Aggregate Volume by Day of Week (0-6)
  const weeklyDistribution = useMemo(() => {
    const counts = new Array(7).fill(0);
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    packets.forEach(p => {
      const day = new Date(p.timestamp).getDay();
      counts[day] += p.size;
    });
    return names.map((name, i) => ({ name, volume: counts[i] }));
  }, [packets]);

  const maxTicker = Math.max(...tickerData.map(d => d.val), 100);
  const maxWeekly = Math.max(...weeklyDistribution.map(d => d.volume), 1);

  // SVG Line Path Generation for Stock Chart
  const svgPath = useMemo(() => {
    if (tickerData.length < 2) return "";
    const width = 1000;
    const height = 100;
    const padding = 10;
    const effectiveHeight = height - (padding * 2);
    const xStep = width / (tickerData.length - 1);
    
    const points = tickerData.map((d, i) => {
      const x = i * xStep;
      const y = height - padding - ((d.val / maxTicker) * effectiveHeight);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [tickerData, maxTicker]);

  const svgArea = useMemo(() => {
    if (tickerData.length < 2) return "";
    const path = svgPath;
    return `${path} L 1000,100 L 0,100 Z`;
  }, [svgPath]);

  if (packets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Professional Stock Market Style Ticker */}
      <div className="bg-winky-card p-8 rounded-[3rem] shadow-soft border border-winky-border h-96 flex flex-col group relative overflow-hidden transition-all hover:shadow-2xl">
        <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl shadow-sm">
               <TrendingUp className="w-5 h-5 text-emerald-600" />
             </div>
             <div>
               <h3 className="text-[10px] font-black text-winky-text-soft uppercase tracking-widest">Ingest Velocity Index</h3>
               <p className="text-xl font-bold text-winky-text tracking-tighter flex items-center gap-1">
                 Live Ticker <ArrowUpRight className="w-4 h-4 text-emerald-500" />
               </p>
             </div>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-mono font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-200/30 animate-pulse uppercase tracking-widest">
              Real-time_Feed
           </div>
        </div>

        <div className="flex-1 relative mt-4">
           {/* Grid lines */}
           <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none">
              <div className="border-t border-dashed border-winky-border w-full"></div>
              <div className="border-t border-dashed border-winky-border w-full"></div>
              <div className="border-t border-dashed border-winky-border w-full"></div>
              <div className="border-t border-dashed border-winky-border w-full"></div>
           </div>

           <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                 <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                 </linearGradient>
              </defs>
              <path d={svgArea} fill="url(#chartGradient)" className="transition-all duration-1000" />
              <path d={svgPath} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500 drop-shadow-lg" />
              
              {tickerData.length > 0 && (
                <g className="animate-pulse">
                  <circle 
                    cx="1000" 
                    cy={100 - 10 - ((tickerData[tickerData.length-1].val / maxTicker) * 80)} 
                    r="5" 
                    fill="#3B82F6"
                  />
                  <circle 
                    cx="1000" 
                    cy={100 - 10 - ((tickerData[tickerData.length-1].val / maxTicker) * 80)} 
                    r="12" 
                    fill="#3B82F6"
                    fillOpacity="0.2"
                  />
                </g>
              )}
           </svg>
        </div>

        <div className="flex justify-between mt-6 text-[9px] font-mono font-black text-winky-text-soft tracking-widest shrink-0 uppercase border-t border-winky-border pt-4">
           <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-winky-blue" /> T-START: {tickerData[0]?.time || '--:--'}</div>
           <div className="text-winky-text">CURRENT_VOL: <span className="text-winky-blue">{tickerData[tickerData.length-1]?.val.toLocaleString() || 0} B</span></div>
           <div className="bg-winky-bg px-2 rounded">60S WINDOW</div>
        </div>
      </div>

      {/* Weekly Breakdown Chart */}
      <div className="bg-winky-card p-8 rounded-[3rem] shadow-soft border border-winky-border h-96 flex flex-col group overflow-hidden transition-all hover:shadow-2xl">
        <div className="flex items-center gap-3 mb-10 shrink-0">
          <div className="p-3 bg-winky-pink/10 rounded-2xl shadow-sm">
            <Calendar className="w-5 h-5 text-winky-pink" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-winky-text-soft uppercase tracking-widest">Historical Volume</h3>
            <p className="text-xl font-bold text-winky-text tracking-tighter">Weekly Cumulative</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-end justify-between gap-4 px-2">
           {weeklyDistribution.map((d, idx) => {
             const h = (d.volume / maxWeekly) * 100;
             const isActiveDay = new Date().getDay() === idx;
             return (
               <div key={d.name} className="flex-1 flex flex-col items-center group/bar">
                  <div className="w-full relative flex items-end justify-center h-48">
                    <div 
                      className={`w-full rounded-t-2xl transition-all duration-1000 group-hover/bar:brightness-110 ${isActiveDay ? 'bg-winky-pink shadow-glow' : 'bg-winky-border dark:bg-slate-800'}`}
                      style={{ height: `${Math.max(h, 6)}%` }}
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full mb-3 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-xl font-black whitespace-nowrap z-20 pointer-events-none shadow-xl transform -translate-y-1 transition-all">
                        {d.volume.toLocaleString()} B
                      </div>
                    </div>
                  </div>
                  <span className={`mt-4 text-[10px] font-black uppercase tracking-widest ${isActiveDay ? 'text-winky-pink' : 'text-winky-text-soft'}`}>
                    {d.name}
                  </span>
               </div>
             );
           })}
        </div>
      </div>

    </div>
  );
};