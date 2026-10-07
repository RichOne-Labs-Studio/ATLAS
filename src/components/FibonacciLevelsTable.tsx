import React from 'react';
import { FibLevel } from '../types/trading';
import { Sparkles, Bell, ArrowRight, Target, Shield } from 'lucide-react';

interface FibonacciLevelsTableProps {
  levels: FibLevel[];
  currentPrice: number;
  onSelectLevel?: (price: number) => void;
  onSetAlert?: (price: number, label: string) => void;
}

export const FibonacciLevelsTable: React.FC<FibonacciLevelsTableProps> = ({
  levels,
  currentPrice,
  onSelectLevel,
  onSetAlert,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 shadow-xl flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Matriks Level Fibonacci XAU/USD
            </h3>
            <p className="text-[10px] text-slate-400">Rasio Retracement & Extension Presisi</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
          Spot: ${currentPrice.toFixed(2)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
              <th className="pb-2 font-semibold">Rasio</th>
              <th className="pb-2 font-semibold">Tingkat Level</th>
              <th className="pb-2 font-semibold text-right">Harga ($)</th>
              <th className="pb-2 font-semibold text-right">Jarak (Pips)</th>
              <th className="pb-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {levels.map((lvl) => {
              const diffPrice = lvl.price - currentPrice;
              const pips = (diffPrice * 10).toFixed(1);
              const isAbove = diffPrice > 0;
              const isGolden = lvl.ratio === '0.618';
              const isOTE = lvl.ratio === '0.786';
              const isExt = lvl.ratio.includes('1.');

              return (
                <tr
                  key={lvl.ratio}
                  className={`transition ${
                    isGolden
                      ? 'bg-amber-500/10 hover:bg-amber-500/15'
                      : isOTE
                      ? 'bg-yellow-500/5 hover:bg-yellow-500/10'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isGolden
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : isOTE
                          ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                          : isExt
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {lvl.ratio}
                    </span>
                  </td>

                  <td className="py-2 text-slate-300 font-sans">
                    <span className={isGolden ? 'font-bold text-amber-300' : ''}>{lvl.label}</span>
                  </td>

                  <td className="py-2 text-right font-bold text-slate-100">
                    <span className={isGolden ? 'text-amber-300 font-extrabold' : ''}>
                      ${lvl.price.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-2 text-right">
                    <span className={isAbove ? 'text-emerald-400' : 'text-rose-400'}>
                      {isAbove ? '+' : ''}{pips} p
                    </span>
                  </td>

                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onSetAlert && (
                        <button
                          onClick={() => onSetAlert(lvl.price, `Fib ${lvl.ratio} (${lvl.label})`)}
                          className="p-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition"
                          title="Pasang Alert pada Level Ini"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onSelectLevel && (
                        <button
                          onClick={() => onSelectLevel(lvl.price)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-slate-700 transition"
                        >
                          Pilih
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
