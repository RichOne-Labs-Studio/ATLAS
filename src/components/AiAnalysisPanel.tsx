import React, { useState } from 'react';
import { 
  AiAnalysisResult, 
  MT5AccountInfo 
} from '../types/trading';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertOctagon, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Award, 
  Percent, 
  DollarSign, 
  Sparkles,
  Info,
  Clock,
  Bell
} from 'lucide-react';

interface AiAnalysisPanelProps {
  analysis: AiAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  account: MT5AccountInfo;
  onOpenRiskModalWithSetup?: () => void;
  onSetAlert?: (price: number, label: string) => void;
}

export const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({
  analysis,
  isLoading,
  onRefresh,
  account,
  onOpenRiskModalWithSetup,
  onSetAlert,
}) => {
  const [copied, setCopied] = useState(false);
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});

  const toggleRule = (idx: number) => {
    setCheckedRules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopySignal = () => {
    if (!analysis) return;
    const setup = analysis.highProbabilitySetup;
    const profitEst = setup.potentialProfitTp1Usd || ((setup.recommendedLotSize * setup.takeProfit1Pips * 10).toFixed(0));
    const text = `🔥 [ATLAS - AI Trading and Live Analysis System | XAU/USD Setup Signal]
Grade: ${setup.grade} (${setup.probabilityScore}% Probability)
Sinyal: ${setup.signalType}
Area Entry: $${setup.entryPrice.toFixed(2)} (${setup.entryZone})
Stop Loss: $${setup.stopLoss.toFixed(2)} (${setup.stopLossPips} pips)
Take Profit 1: $${setup.takeProfit1.toFixed(2)} (RR ${setup.takeProfit1RR})
Take Profit 2: $${setup.takeProfit2.toFixed(2)} (RR ${setup.takeProfit2RR})
Take Profit 3: $${setup.takeProfit3 ? setup.takeProfit3.toFixed(2) : '-'} (RR ${setup.takeProfit3RR || '1:5'})
Lot Direkomendasikan: ${setup.recommendedLotSize} Lot (Risk 1%: $${setup.maxRiskAmountUsd})
Potensi Profit: $${profitEst}
Golden Pocket: $${analysis.goldenPocketZone.lower} - $${analysis.goldenPocketZone.upper}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[380px] text-center shadow-xl">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4 animate-pulse">
          <Sparkles className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          ATLAS AI Sedang Menganalisis Grafik XAU/USD...
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Menghitung swing high & swing low, rasio Fibonacci (0.618 Golden Pocket, 0.786 OTE, 1.618 Extension), dan menyusun setup dengan RRR minimal 1:2.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[380px] text-center shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Pindai Setup Fibonacci AI
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Dapatkan analisis teknikal objektif, area Golden Pocket, dan setup trading disiplin berprobabilitas tinggi untuk Gold XAU/USD.
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>Mulai Analisis AI Sekarang</span>
        </button>
      </div>
    );
  }

  const { bias, trendSummary, goldenPocketZone, highProbabilitySetup: setup, invalidationRule, disciplinaryChecklist, expertAdvice } = analysis;

  const isBullish = bias.includes('BULLISH');
  const isBearish = bias.includes('BEARISH');

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl flex flex-col gap-4 p-4 font-sans">
      
      {/* Header & Bias Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40">
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">ATLAS Audit XAU/USD</h2>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  setup.grade === 'A+'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : setup.grade === 'A'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                }`}
              >
                Grade: {setup.grade} ({setup.probabilityScore}% Akurasi)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{trendSummary}</p>
          </div>
        </div>

        {/* Bias Gauge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono font-bold text-xs ${
              isBullish
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : isBearish
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{bias.replace('_', ' ')}</span>
          </div>

          <button
            onClick={handleCopySignal}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Salin Sinyal Lengkap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Tersalin!' : 'Salin'}</span>
          </button>
        </div>

      </div>

      {/* Golden Pocket Highlight Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Golden Pocket Zone (0.618 - 0.786 OTE)
            </div>
            <div className="font-mono text-sm font-extrabold text-amber-200">
              ${goldenPocketZone.lower.toFixed(2)} — ${goldenPocketZone.upper.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onSetAlert && (
            <button
              onClick={() => onSetAlert(goldenPocketZone.lower, 'Golden Pocket 0.618 Entry')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-bold text-[10px] transition"
              title="Pasang Alert di Golden Pocket"
            >
              <Bell className="w-3 h-3" />
              <span>Alert GP</span>
            </button>
          )}
          <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">{goldenPocketZone.description}</span>
        </div>
      </div>

      {/* Main Order Ticket / Signal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Left: Execution Parameters */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between gap-3">
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Instruksi Order</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {setup.signalType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">Entry Target</span>
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(setup.entryPrice, `Entry ${setup.signalType}`)}
                    className="text-slate-500 hover:text-cyan-400 p-0.5"
                    title="Pasang Alert Entry"
                  >
                    <Bell className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-sm font-bold text-cyan-300">${setup.entryPrice.toFixed(2)}</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">Stop Loss ({setup.stopLossPips}p)</span>
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(setup.stopLoss, 'Stop Loss Trigger')}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Pasang Alert Stop Loss"
                  >
                    <Bell className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-sm font-bold text-rose-400">${setup.stopLoss.toFixed(2)}</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">TP 1 (RR {setup.takeProfit1RR})</span>
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(setup.takeProfit1, 'Take Profit 1 Hit')}
                    className="text-slate-500 hover:text-emerald-400 p-0.5"
                    title="Pasang Alert TP1"
                  >
                    <Bell className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-sm font-bold text-emerald-400">${setup.takeProfit1.toFixed(2)}</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block">TP 2 (RR {setup.takeProfit2RR})</span>
                {onSetAlert && (
                  <button
                    onClick={() => onSetAlert(setup.takeProfit2, 'Take Profit 2 Hit')}
                    className="text-slate-500 hover:text-teal-400 p-0.5"
                    title="Pasang Alert TP2"
                  >
                    <Bell className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-sm font-bold text-teal-300">${setup.takeProfit2.toFixed(2)}</span>
            </div>

          </div>

          {/* Strict Risk Sizing Breakdown */}
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-amber-500/20 text-[11px] font-mono flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Lot Size Aman (Risk 1%)</span>
              <span className="text-amber-300 font-extrabold text-sm">{setup.recommendedLotSize} Lot</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Maks Risiko / Potensi Profit</span>
              <span className="text-rose-400">-${setup.maxRiskAmountUsd}</span> / <span className="text-emerald-400">+${setup.potentialProfitTp1Usd || ((setup.recommendedLotSize * setup.stopLossPips * 20).toFixed(0))}</span>
            </div>
          </div>

        </div>

        {/* Right: Confluence & Invalidation */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
          
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Faktor Konfluensi (High-Probability)</span>
            </div>
            <ul className="space-y-1">
              {setup.confluenceFactors.map((factor, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Invalidation Rule */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-2 text-[11px]">
            <div className="flex items-center gap-1 text-rose-400 font-bold text-[10px] uppercase mb-0.5">
              <AlertOctagon className="w-3 h-3" />
              <span>Aturan Invalidation (Disiplin Cut Loss)</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">{invalidationRule}</p>
          </div>

        </div>

      </div>

      {/* Disciplinary Execution Checklist */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Checklist Disiplin Sebelum Klik Entry</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {Object.values(checkedRules).filter(Boolean).length} / {disciplinaryChecklist.length} Terpenuhi
          </span>
        </div>

        <div className="space-y-1.5">
          {disciplinaryChecklist.map((rule, idx) => {
            const isChecked = !!checkedRules[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleRule(idx)}
                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${
                  isChecked
                    ? 'bg-emerald-950/40 border border-emerald-800/40 text-slate-200'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:bg-slate-900'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className={isChecked ? 'line-through text-slate-300' : ''}>{rule}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Senior Trader Expert Advice */}
      {expertAdvice && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block mb-0.5">Catatan Psikologi & Eksekusi:</span>
            <p className="text-[11px] leading-relaxed text-slate-400">{expertAdvice}</p>
          </div>
        </div>
      )}

    </div>
  );
};
