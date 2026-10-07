import React from 'react';
import { 
  Zap, 
  Terminal, 
  Calculator, 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  BellRing
} from 'lucide-react';
import { MT5State } from '../types/trading';

interface NavbarProps {
  mt5State: MT5State | null;
  onOpenMt5Modal: () => void;
  onOpenRiskModal: () => void;
  onOpenAlertsDrawer: () => void;
  onToggleChat: () => void;
  onTriggerAiAnalysis: () => void;
  isAiAnalyzing: boolean;
  isChatOpen: boolean;
  activeAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  mt5State,
  onOpenMt5Modal,
  onOpenRiskModal,
  onOpenAlertsDrawer,
  onToggleChat,
  onTriggerAiAnalysis,
  isAiAnalyzing,
  isChatOpen,
  activeAlertsCount,
}) => {
  const isConnected = mt5State?.connected ?? false;
  const isSimulated = mt5State?.isSimulated ?? true;
  const symbol = mt5State?.symbol;
  const account = mt5State?.account;

  const spreadPips = symbol ? ((symbol.ask - symbol.bid) * 10).toFixed(1) : '2.0';
  const change24h = symbol?.change24h ?? 0.45;
  const isPositive = change24h >= 0;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-40 px-4 py-2.5 font-sans">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Market Asset */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-800 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                ATLAS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                XAU/USD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="font-medium text-amber-400/90">AI Trading and Live Analysis System</span>
            </p>
          </div>
        </div>

        {/* Live Price Ticker */}
        {symbol && (
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-1.5 font-mono shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Bid</span>
              <span className="text-sm font-bold text-slate-100">${symbol.bid.toFixed(2)}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Ask</span>
              <span className="text-sm font-bold text-amber-300">${symbol.ask.toFixed(2)}</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase">Spread</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                {spreadPips} pips
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* MT5 Status & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Price Alerts Drawer Button */}
          <button
            onClick={onOpenAlertsDrawer}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              activeAlertsCount > 0
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
            }`}
            title="Buka Pengaturan Price Alert XAUUSD"
          >
            {activeAlertsCount > 0 ? (
              <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Alerts</span>
            {activeAlertsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px] font-mono">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* MT5 Bridge Connection Status Button */}
          <button
            onClick={onOpenMt5Modal}
            className={`group flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-800/80 border-amber-500/40 text-amber-200 hover:bg-slate-800 shadow-sm'
            }`}
          >
            <div className="relative">
              <Terminal className="w-3.5 h-3.5" />
              <div
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </div>
            <span>
              {isConnected ? (
                <span className="flex items-center gap-1 font-mono">
                  MT5 LIVE <span className="text-slate-400 text-[10px]">({account?.broker || 'Connected'})</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Hubungkan MT5 (Python)
                </span>
              )}
            </span>
          </button>

          {/* Strict Risk Calculator Button */}
          <button
            onClick={onOpenRiskModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition"
            title="Kalkulator Manajemen Risiko & Ukuran Lot"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Kalkulator Lot</span>
          </button>

          {/* AI Scan & Audit Button */}
          <button
            onClick={onTriggerAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isAiAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memindai Fib AI...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Pindai Fibonacci AI</span>
              </>
            )}
          </button>

          {/* AI Chat Assistant Toggle */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              isChatOpen
                ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>

        </div>
      </div>
    </header>
  );
};
