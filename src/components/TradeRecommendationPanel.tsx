import React, { useState } from 'react';
import { 
  HighProbabilitySetup, 
  MT5AccountInfo 
} from '../types/trading';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  Bell, 
  Zap, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Award, 
  Sliders, 
  CheckCircle2, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Compass
} from 'lucide-react';
import { playSuccessSound } from '../utils/audioAlert';

interface TradeRecommendationPanelProps {
  primarySetup: HighProbabilitySetup | null;
  alternativeSetup?: HighProbabilitySetup | null;
  currentPrice: number;
  account: MT5AccountInfo;
  onSetAlert?: (price: number, label: string) => void;
  onSetMultipleAlerts?: (alertsList: { price: number; label: string }[]) => void;
  onOpenRiskModal?: (entry: number, sl: number, tp: number) => void;
  onRefreshAi?: () => void;
  isAiLoading?: boolean;
}

export const TradeRecommendationPanel: React.FC<TradeRecommendationPanelProps> = ({
  primarySetup,
  alternativeSetup,
  currentPrice,
  account,
  onSetAlert,
  onSetMultipleAlerts,
  onOpenRiskModal,
  onRefreshAi,
  isAiLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'alternative'>('primary');
  const [copied, setCopied] = useState(false);
  const [alertsSet, setAlertsSet] = useState(false);

  // Active setup based on selected tab
  const setup = activeTab === 'primary' ? primarySetup : (alternativeSetup || primarySetup);

  if (!setup) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center shadow-xl flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
          <Compass className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Panel Saran Entry XAU/USD Belum Tersedia
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Tekan tombol di bawah untuk meminta Gemini AI menganalisis level Entry, SL, TP1, TP2, dan TP3 presisi.
        </p>
        <button
          onClick={onRefreshAi}
          disabled={isAiLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>{isAiLoading ? 'Memindai Setup...' : 'Analisis Saran Entry AI'}</span>
        </button>
      </div>
    );
  }

  const isBuy = setup.action === 'BUY' || setup.signalType.includes('BUY');
  const isSell = setup.action === 'SELL' || setup.signalType.includes('SELL');

  // Calculate pip distances from current market price
  const entryDiff = (setup.entryPrice - currentPrice) * 10;
  const slPips = setup.stopLossPips || Math.abs((setup.entryPrice - setup.stopLoss) * 10);
  const tp1Pips = setup.takeProfit1Pips || Math.abs((setup.takeProfit1 - setup.entryPrice) * 10);
  const tp2Pips = setup.takeProfit2Pips || Math.abs((setup.takeProfit2 - setup.entryPrice) * 10);
  const tp3Price = setup.takeProfit3 || (isBuy ? setup.entryPrice + (setup.entryPrice - setup.stopLoss) * 4.5 : setup.entryPrice - (setup.stopLoss - setup.entryPrice) * 4.5);
  const tp3Pips = setup.takeProfit3Pips || Math.abs((tp3Price - setup.entryPrice) * 10);
  const tp3RR = setup.takeProfit3RR || '1:4.5';

  const handleCopyTelegramFormat = () => {
    const text = `🎯 [ATLAS - AI Trading and Live Analysis System | XAU/USD SIGNAL]
📊 Pair: XAU/USD (Gold Spot)
⚡ Order: ${setup.signalType}
💎 Grade: ${setup.grade} (${setup.probabilityScore}% Akurasi)
────────────────────
📍 Entry Price : $${setup.entryPrice.toFixed(2)} (${setup.entryZone})
🛑 Stop Loss   : $${setup.stopLoss.toFixed(2)} (-${slPips.toFixed(1)} pips)
🎯 Take Profit 1: $${setup.takeProfit1.toFixed(2)} (RR ${setup.takeProfit1RR} | +${tp1Pips.toFixed(1)} pips)
🎯 Take Profit 2: $${setup.takeProfit2.toFixed(2)} (RR ${setup.takeProfit2RR} | +${tp2Pips.toFixed(1)} pips)
🎯 Take Profit 3: $${tp3Price.toFixed(2)} (RR ${tp3RR} | +${tp3Pips.toFixed(1)} pips)
────────────────────
⚖️ Lot Aman (Risk 1%): ${setup.recommendedLotSize} Lot
💵 Max Risk   : -$${setup.maxRiskAmountUsd}
💰 Potensi TP1: +$${setup.potentialProfitTp1Usd || ((setup.recommendedLotSize * tp1Pips * 10).toFixed(0))}
💰 Potensi TP2: +$${setup.potentialProfitTp2Usd || ((setup.recommendedLotSize * tp2Pips * 10).toFixed(0))}
📌 Strategi: ${setup.executionStrategy || 'Close 50% di TP1, geser SL ke BEP (Break Even)'}
────────────────────`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    playSuccessSound();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSetAllAlerts = () => {
    if (!onSetMultipleAlerts) return;
    const list = [
      { price: setup.entryPrice, label: `Entry ${setup.signalType}` },
      { price: setup.stopLoss, label: `Stop Loss ${setup.signalType}` },
      { price: setup.takeProfit1, label: `TP 1 (${setup.takeProfit1RR})` },
      { price: setup.takeProfit2, label: `TP 2 (${setup.takeProfit2RR})` },
    ];
    if (tp3Price) {
      list.push({ price: tp3Price, label: `TP 3 Runner (${tp3RR})` });
    }
    onSetMultipleAlerts(list);
    setAlertsSet(true);
    playSuccessSound();
    setTimeout(() => setAlertsSet(false), 2500);
  };

  return (
    <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
      
      {/* Top Banner: Primary Action & Grade */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          {/* Action Icon Badge */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg text-lg ring-2 ${
              isBuy
                ? 'bg-gradient-to-br from-emerald-400 to-teal-700 text-slate-950 ring-emerald-400/40 shadow-emerald-500/20'
                : 'bg-gradient-to-br from-rose-400 to-red-700 text-slate-950 ring-rose-400/40 shadow-rose-500/20'
            }`}
          >
            {isBuy ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase font-mono tracking-wider ${
                  isBuy
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {setup.signalType}
              </span>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                  setup.grade === 'A+'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : setup.grade === 'A'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Grade {setup.grade}
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                {setup.probabilityScore}% Akurasi
              </span>
            </div>

            <h2 className="text-base font-extrabold text-slate-100 mt-1 flex items-center gap-2">
              <span>Saran Order: <strong className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>{setup.action} XAU/USD</strong></span>
              <span className="text-xs text-slate-500 font-normal font-mono">• {setup.tradeStyle || 'INTRADAY'}</span>
            </h2>
          </div>
        </div>

        {/* Strategy Tabs Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('primary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'primary'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skenario Utama</span>
          </button>

          {alternativeSetup && (
            <button
              onClick={() => setActiveTab('alternative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'alternative'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Skenario Plan B</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Signal Cards Grid */}
      <div className="p-5 space-y-4">
        
        {/* Entry & Stop Loss & Targets Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
          
          {/* Card 1: ENTRY TARGET */}
          <div className="bg-slate-950/80 border-2 border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-sans font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                <span>ENTRY PRICE</span>
              </span>
              {onSetAlert && (
                <button
                  onClick={() => onSetAlert(setup.entryPrice, `Entry ${setup.signalType}`)}
                  className="p-1 rounded bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-cyan-500/30 transition"
                  title="Pasang Alert Entry"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>

            <div>
              <div className="text-xl font-extrabold text-cyan-300">
                ${setup.entryPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                Zona: {setup.entryZone || `$${(setup.entryPrice - 1.5).toFixed(1)} - $${(setup.entryPrice + 1.5).toFixed(1)}`}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Jarak Spot:</span>
              <span className={entryDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {entryDiff > 0 ? '+' : ''}{entryDiff.toFixed(1)} pips
              </span>
            </div>
          </div>

          {/* Card 2: STOP LOSS (SL) */}
          <div className="bg-slate-950/80 border-2 border-rose-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-sans font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>STOP LOSS (SL)</span>
              </span>
              {onSetAlert && (
                <button
                  onClick={() => onSetAlert(setup.stopLoss, `Stop Loss ${setup.signalType}`)}
                  className="p-1 rounded bg-slate-900 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/30 transition"
                  title="Pasang Alert Stop Loss"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>

            <div>
              <div className="text-xl font-extrabold text-rose-400">
                ${setup.stopLoss.toFixed(2)}
              </div>
              <div className="text-[10px] text-rose-300/80 mt-0.5">
                -{slPips.toFixed(1)} pips (${Math.abs(setup.entryPrice - setup.stopLoss).toFixed(2)})
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-rose-400/90 flex items-center justify-between">
              <span>Maksimal Rugi:</span>
              <strong className="font-bold">-${setup.maxRiskAmountUsd}</strong>
            </div>
          </div>

          {/* Card 3: TAKE PROFIT 1 (TP1) */}
          <div className="bg-slate-950/80 border-2 border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-sans font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TARGET TP 1</span>
              </span>
              {onSetAlert && (
                <button
                  onClick={() => onSetAlert(setup.takeProfit1, `Take Profit 1 ${setup.signalType}`)}
                  className="p-1 rounded bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 transition"
                  title="Pasang Alert TP 1"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>

            <div>
              <div className="text-xl font-extrabold text-emerald-400">
                ${setup.takeProfit1.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                +{tp1Pips.toFixed(1)} pips (RR {setup.takeProfit1RR})
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 flex items-center justify-between">
              <span>Potensi Cuan:</span>
              <strong className="font-bold">+${setup.potentialProfitTp1Usd || ((setup.recommendedLotSize * tp1Pips * 10).toFixed(0))}</strong>
            </div>
          </div>

          {/* Card 4: TAKE PROFIT 2 (TP2) */}
          <div className="bg-slate-950/80 border-2 border-teal-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-sans font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                <span>TARGET TP 2</span>
              </span>
              {onSetAlert && (
                <button
                  onClick={() => onSetAlert(setup.takeProfit2, `Take Profit 2 ${setup.signalType}`)}
                  className="p-1 rounded bg-slate-900 hover:bg-teal-500 hover:text-slate-950 text-teal-400 border border-teal-500/30 transition"
                  title="Pasang Alert TP 2"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>

            <div>
              <div className="text-xl font-extrabold text-teal-300">
                ${setup.takeProfit2.toFixed(2)}
              </div>
              <div className="text-[10px] text-teal-300/80 mt-0.5">
                +{tp2Pips.toFixed(1)} pips (RR {setup.takeProfit2RR})
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-teal-300 flex items-center justify-between">
              <span>Potensi Cuan:</span>
              <strong className="font-bold">+${setup.potentialProfitTp2Usd || ((setup.recommendedLotSize * tp2Pips * 10).toFixed(0))}</strong>
            </div>
          </div>

          {/* Card 5: TAKE PROFIT 3 (TP3 - RUNNER) */}
          <div className="bg-slate-950/80 border-2 border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between shadow-inner relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-sans font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RUNNER TP 3</span>
              </span>
              {onSetAlert && (
                <button
                  onClick={() => onSetAlert(tp3Price, `Take Profit 3 Runner ${setup.signalType}`)}
                  className="p-1 rounded bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 transition"
                  title="Pasang Alert TP 3"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>

            <div>
              <div className="text-xl font-extrabold text-amber-300">
                ${tp3Price.toFixed(2)}
              </div>
              <div className="text-[10px] text-amber-300/80 mt-0.5">
                +{tp3Pips.toFixed(1)} pips (RR {tp3RR})
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-300 flex items-center justify-between">
              <span>Potensi Cuan:</span>
              <strong className="font-bold">+${setup.potentialProfitTp3Usd || ((setup.recommendedLotSize * tp3Pips * 10).toFixed(0))}</strong>
            </div>
          </div>

        </div>

        {/* Strict Money Management & Lot Sizing Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Saldo Trader (MT5)</span>
              <span className="text-sm font-bold text-slate-100">${account.balance.toLocaleString()} {account.currency}</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Risk per Trade (1.0%)</span>
              <span className="text-sm font-bold text-rose-400">${((account.balance * 0.01)).toFixed(2)}</span>
            </div>

            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 p-2.5 rounded-lg border border-amber-500/40 font-mono">
              <span className="text-[10px] text-amber-400 uppercase block font-bold">Ukuran Lot Aman</span>
              <span className="text-base font-extrabold text-amber-300">{setup.recommendedLotSize} Lot</span>
            </div>

            <div className="text-xs text-slate-300 max-w-sm">
              <span className="font-bold text-slate-200 block text-[11px] mb-0.5">Strategi Parsial & Trailing Stop:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {setup.executionStrategy || 'Ambil profit 50% di TP1, segera geser Stop Loss ke harga Entry (BEP), lalu biarkan sisa lot berlari ke TP2 & TP3.'}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Quick Set All Alerts */}
            <button
              onClick={handleSetAllAlerts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
              title="Pasang Alert otomatis untuk Entry, SL, TP1, TP2, TP3"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{alertsSet ? '✔ Semua Alert Aktif' : 'Pasang Semua Alert'}</span>
            </button>

            {/* Open Risk Calculator with setup prefilled */}
            {onOpenRiskModal && (
              <button
                onClick={() => onOpenRiskModal(setup.entryPrice, setup.stopLoss, setup.takeProfit1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                title="Sesuaikan Lot & Risiko di Kalkulator"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kalkulator Lot</span>
              </button>
            )}

            {/* Copy Signal to Clipboard */}
            <button
              onClick={handleCopyTelegramFormat}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copied ? 'Format Tersalin!' : 'Salin Format Signal'}</span>
            </button>

          </div>

        </div>

        {/* Confluence Factors & SL Invalidation Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Alasan Teknis & Konfluensi (High-Probability):</span>
            </span>
            <ul className="space-y-1 text-[11px] text-slate-300">
              {setup.confluenceFactors?.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5 font-bold">•</span>
                  <span>{f}</span>
                </li>
              )) || (
                <li className="text-slate-400">Konfluensi Golden Pocket 0.618 - 0.786 + Rejection Candle</li>
              )}
            </ul>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <span className="font-bold text-rose-400 flex items-center gap-1.5 text-xs uppercase">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Logika Invalidation Stop Loss:</span>
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {setup.stopLossReason || `Stop loss diletakkan di $${setup.stopLoss.toFixed(2)} karena jika harga menembus level ini, struktur market ${setup.action} telah batal dan momentum berbalik.`}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
