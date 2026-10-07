import React from 'react';
import { BellRing, X, ArrowUpRight, Flame, Volume2 } from 'lucide-react';
import { PriceAlert } from '../types/trading';

interface AlertToastProps {
  alert: PriceAlert | null;
  onDismiss: () => void;
  onOpenDrawer: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  alert,
  onDismiss,
  onOpenDrawer,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl shadow-amber-500/30 flex items-start justify-between gap-3 text-slate-100 ring-4 ring-amber-500/20 backdrop-blur-md">
        
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 animate-bounce">
            <BellRing className="w-5 h-5 fill-slate-950" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                PRICE ALERT HIT
              </span>
              <span className="text-[11px] text-amber-300/90 font-mono">XAU/USD</span>
            </div>

            <h4 className="text-base font-extrabold text-amber-300 font-mono mt-1">
              ${alert.targetPrice.toFixed(2)}
            </h4>
            <p className="text-xs text-slate-200 font-medium">
              {alert.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              onDismiss();
              onOpenDrawer();
            }}
            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition"
            title="Buka Panel Alert"
          >
            Lihat
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
