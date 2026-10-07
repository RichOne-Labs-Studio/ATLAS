import React, { useState } from 'react';
import { 
  IndicatorConfluenceAnalysis, 
  ConfluenceIndicatorItem 
} from '../utils/indicators';
import { 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Gauge, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SupportingIndicatorsPanelProps {
  confluence: IndicatorConfluenceAnalysis;
  currentPrice: number;
}

export const SupportingIndicatorsPanel: React.FC<SupportingIndicatorsPanelProps> = ({
  confluence,
  currentPrice,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getSignalBadge = (signal: ConfluenceIndicatorItem['signal']) => {
    switch (signal) {
      case 'STRONG_BULLISH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            Strong Buy
          </span>
        );
      case 'BULLISH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            Buy Confluence
          </span>
        );
      case 'STRONG_BEARISH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-rose-400" />
            Strong Sell
          </span>
        );
      case 'BEARISH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-rose-400" />
            Sell Confluence
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Neutral
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl shadow-xl overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Analisa Indikator Pendukung & Konfluensi Fibonacci
              </h3>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Score: {confluence.overallScore}% ({confluence.confluenceGrade})
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Validasi sinyal entry menggunakan kombinasi Fibonacci, RSI, MACD, EMA 50/200, Bollinger Bands, & ATR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-bold">
              {confluence.confirmedIndicatorsCount} / {confluence.totalIndicatorsCount} Indikator Konfluens
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          
          {/* Confluence Summary Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-black text-sm shrink-0">
                {confluence.overallScore}%
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Status Keselarasan Multi-Indikator
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {confluence.summary}
                </p>
              </div>
            </div>

            {/* Visual Progress Meter */}
            <div className="w-full sm:w-64 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Filter Eksekusi (Min 70%)</span>
                <span className="text-amber-300 font-bold">{confluence.overallScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    confluence.overallScore >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : confluence.overallScore >= 60
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${confluence.overallScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Indicators Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                  <th className="pb-2.5 font-bold">Indikator & Parameter</th>
                  <th className="pb-2.5 font-bold">Kategori</th>
                  <th className="pb-2.5 font-bold font-mono">Nilai Terkini</th>
                  <th className="pb-2.5 font-bold">Sinyal Konfluensi</th>
                  <th className="pb-2.5 font-bold">Bobot</th>
                  <th className="pb-2.5 font-bold">Analisis Teknikal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {confluence.indicators.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40 transition">
                    
                    <td className="py-2.5 font-bold text-slate-100 flex items-center gap-2">
                      {item.isConfirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span>{item.name}</span>
                    </td>

                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-2.5 font-mono text-amber-300 font-semibold">
                      {item.value}
                    </td>

                    <td className="py-2.5">
                      {getSignalBadge(item.signal)}
                    </td>

                    <td className="py-2.5 font-mono text-slate-400 text-xs">
                      {item.weightPercent}%
                    </td>

                    <td className="py-2.5 text-slate-300 max-w-xs">
                      {item.description}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Golden Rules for Entry Execution */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                <strong className="text-slate-100">Filter Disiplin:</strong> Eksekusi entry hanya disarankan bila <strong>Fibonacci 0.618</strong> terkonfirmasi oleh minimal <strong>2 indikator momentum (RSI / MACD)</strong> dan <strong>EMA Trend Alignment</strong>.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30">
              Min RRR: 1:2.0 (Strict Rule)
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
