import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  RefreshCw,
  Server
} from 'lucide-react';
import { MT5State } from '../types/trading';

interface Mt5BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mt5State: MT5State | null;
  onSimulateTick?: () => void;
}

export const Mt5BridgeModal: React.FC<Mt5BridgeModalProps> = ({
  isOpen,
  onClose,
  mt5State,
  onSimulateTick,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedPip, setCopiedPip] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);
  const [scriptCode, setScriptCode] = useState<string>('');
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingScript(true);
      fetch('/api/mt5/bridge-script')
        .then(res => res.json())
        .then(data => {
          setScriptCode(data.script || '');
          setIsLoadingScript(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingScript(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = mt5State?.connected ?? false;
  const account = mt5State?.account;
  const symbol = mt5State?.symbol;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyPip = () => {
    navigator.clipboard.writeText('pip install MetaTrader5 requests colorama');
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const handleCopyRun = () => {
    navigator.clipboard.writeText('python xauusd_mt5_bridge.py');
    setCopiedRun(true);
    setTimeout(() => setCopiedRun(false), 2000);
  };

  const handleDownloadScript = () => {
    window.location.href = '/api/mt5/bridge-script?download=true';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Terminal className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Integrasi MetaTrader 5 (MT5) Realtime via Python</span>
                {isConnected ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    MT5 Terhubung
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    Menunggu Python Bridge
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Hubungkan grafik live XAU/USD dari broker MT5 Anda langsung ke aplikasi ATLAS (AI Trading and Live Analysis System)
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Active MT5 Connection Telemetry Box */}
          {isConnected && account && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-800/30 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  DATA STREAM MT5 AKTIF
                </span>
                <span className="text-slate-400 text-[11px]">Server: {account.server}</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-200">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Broker</span>
                  <span className="font-bold text-amber-300 truncate block">{account.broker}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Akun Login</span>
                  <span className="font-bold text-slate-100">{account.login}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Equity / Saldo</span>
                  <span className="font-bold text-emerald-400">${account.equity.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Spread Emas</span>
                  <span className="font-bold text-amber-300">{((symbol?.spread || 20) / 10).toFixed(1)} pips</span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Step Tutorial */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>Langkah Menghubungkan MT5 ke Aplikasi:</span>
            </h3>

            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">1</span>
                  Install Library Python di PC / Laptop Anda
                </span>
                <button
                  onClick={handleCopyPip}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition"
                >
                  {copiedPip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPip ? 'Tersalin' : 'Salin Perintah'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Buka Command Prompt (CMD) atau Terminal di Windows, lalu jalankan perintah:
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 select-all">
                pip install MetaTrader5 requests colorama
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">2</span>
                  Unduh / Simpan Script Python Bridge
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadScript}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .py</span>
                  </button>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Simpan script dengan nama <code className="text-amber-300 font-mono">xauusd_mt5_bridge.py</code> di folder komputer Anda.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">3</span>
                  Buka Terminal MT5 Anda & Jalankan Script
                </span>
                <button
                  onClick={handleCopyRun}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition"
                >
                  {copiedRun ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRun ? 'Tersalin' : 'Salin Perintah'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Pastikan aplikasi MetaTrader 5 di Windows sudah dibuka dan login ke akun broker Anda, lalu jalankan:
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 select-all">
                python xauusd_mt5_bridge.py
              </div>
              <p className="text-[11px] text-slate-400">
                Script akan otomatis mendeteksi simbol <code className="text-slate-200 font-mono">XAUUSD</code> (atau variasi broker seperti <code className="text-slate-200 font-mono">GOLD</code>, <code className="text-slate-200 font-mono">XAUUSD.m</code>) dan mengirimkan candle realtime ke website ini!
              </p>
            </div>

          </div>

          {/* Script Code Preview */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs text-slate-400">
              <span>Preview Script: <code className="text-amber-400">xauusd_mt5_bridge.py</code></span>
              <span>Python 3.9+</span>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
              {scriptCode || 'Memuat script python...'}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Mode Standby: Auto-switch ke Live MT5 saat script python aktif</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
