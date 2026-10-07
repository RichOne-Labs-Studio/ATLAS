import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calculator, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { calculateGoldPositionSize } from '../utils/fibonacci';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
  initialEntryPrice?: number;
  initialStopLoss?: number;
  initialTakeProfit?: number;
  onApplySetup?: (entry: number, sl: number, tp: number, lot: number) => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialBalance = 10000,
  initialEntryPrice = 2748.5,
  initialStopLoss = 2743.5,
  initialTakeProfit = 2760.5,
  onApplySetup,
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState(initialEntryPrice);
  const [stopLoss, setStopLoss] = useState(initialStopLoss);
  const [takeProfit, setTakeProfit] = useState(initialTakeProfit);

  useEffect(() => {
    if (initialBalance) setBalance(initialBalance);
    if (initialEntryPrice) setEntryPrice(initialEntryPrice);
    if (initialStopLoss) setStopLoss(initialStopLoss);
    if (initialTakeProfit) setTakeProfit(initialTakeProfit);
  }, [initialBalance, initialEntryPrice, initialStopLoss, initialTakeProfit, isOpen]);

  if (!isOpen) return null;

  const result = calculateGoldPositionSize(balance, riskPercent, entryPrice, stopLoss, takeProfit);

  const handleApply = () => {
    if (onApplySetup) {
      onApplySetup(entryPrice, stopLoss, takeProfit, result.recommendedLot);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Kalkulator Lot & Manajemen Risiko Ketat
              </h2>
              <p className="text-xs text-slate-400">
                Khusus XAU/USD (Gold) dengan standar 1 Pip = $0.10 ($10 / Std Lot)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Account Balance */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Saldo Akun Trader ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="100"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Risk Percentage Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Toleransi Risiko per Trade (%)
              </label>
              <div className="flex items-center gap-1.5">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPercent(pct)}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition ${
                      riskPercent === pct
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Harga Entry ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Harga Stop Loss ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-rose-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Take Profit Target */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Take Profit ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Strict Calculation Summary Result */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase">Hasil Perhitungan Disiplin</span>
              <div
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  result.isValidRR
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}
              >
                {result.isValidRR ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>RRR Disiplin Valid (1:{result.riskRewardRatio})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>RRR Kurang Ideal (1:{result.riskRewardRatio})</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Maksimal Risiko</span>
                <span className="font-bold text-rose-400 text-sm">${result.maxRiskUsd}</span>
                <span className="text-[10px] text-slate-500 block">({riskPercent}% saldo)</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Jarak Stop Loss</span>
                <span className="font-bold text-rose-300 text-sm">{result.stopLossPips} pips</span>
                <span className="text-[10px] text-slate-500 block">(${Math.abs(entryPrice - stopLoss).toFixed(2)})</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-sans font-bold">Ukuran Lot Aman</span>
                <span className="font-extrabold text-amber-300 text-base">{result.recommendedLot} Lot</span>
                <span className="text-[10px] text-slate-500 block">(Std 100oz)</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Potensi Profit</span>
                <span className="font-bold text-emerald-400 text-sm">+${result.potentialProfitUsd}</span>
                <span className="text-[10px] text-slate-500 block">({result.takeProfitPips} pips)</span>
              </div>

            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Risk to Reward Ratio (RRR):</span>
              <strong className="text-slate-100 font-mono text-xs">1 : {result.riskRewardRatio}</strong>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold shadow-md transition"
          >
            Terapkan ke Setup
          </button>
        </div>

      </div>
    </div>
  );
};
