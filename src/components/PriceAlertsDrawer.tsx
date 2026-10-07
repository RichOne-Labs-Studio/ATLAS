import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  Check, 
  Volume2, 
  VolumeX, 
  Globe, 
  ArrowUpRight, 
  ArrowDownRight, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { PriceAlert, FibLevel, GoldenPocketZone } from '../types/trading';
import { playPriceAlertSound, playSuccessSound } from '../utils/audioAlert';
import { 
  requestBrowserNotificationPermission, 
  getBrowserNotificationPermission, 
  isBrowserNotificationSupported, 
  triggerBrowserNotification 
} from '../utils/notifications';

interface PriceAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onClearTriggered: () => void;
  currentPrice: number;
  fibLevels?: FibLevel[];
  goldenPocket?: GoldenPocketZone;
}

export const PriceAlertsDrawer: React.FC<PriceAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  onClearTriggered,
  currentPrice,
  fibLevels = [],
  goldenPocket,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice ? currentPrice.toFixed(2) : '2750.00');
  const [condition, setCondition] = useState<'CROSS_ABOVE' | 'CROSS_BELOW' | 'CROSS_ANY'>('CROSS_ANY');
  const [label, setLabel] = useState<string>('Target Level XAUUSD');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(getBrowserNotificationPermission());

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      triggerBrowserNotification('Notifikasi Browser XAU/USD Aktif', {
        body: 'Anda akan menerima alert saat harga Emas menyentuh level target.',
      });
      playSuccessSound();
    }
  };

  const handleTestSound = () => {
    playPriceAlertSound();
    if (permissionStatus === 'granted') {
      triggerBrowserNotification('⚡ Tes Alert XAU/USD Berhasil', {
        body: `Harga uji: $${currentPrice.toFixed(2)} - Web Audio & Notifikasi berfungsi normal.`,
      });
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    // Auto deduce condition if CROSS_ANY
    let finalCondition = condition;
    if (finalCondition === 'CROSS_ANY') {
      finalCondition = priceNum > currentPrice ? 'CROSS_ABOVE' : 'CROSS_BELOW';
    }

    onAddAlert({
      targetPrice: Number(priceNum.toFixed(2)),
      condition: finalCondition,
      label: label.trim() || `Alert $${priceNum.toFixed(2)}`,
      isActive: true,
      soundEnabled,
      browserNotificationEnabled,
      initialPrice: currentPrice,
    });

    playSuccessSound();
    setLabel('Target Level XAUUSD');
  };

  const activeAlerts = alerts.filter(a => a.isActive);
  const triggeredAlerts = alerts.filter(a => !a.isActive && a.triggeredAt);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-amber-500/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Price Alert XAU/USD</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {activeAlerts.length} Aktif
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Notifikasi audio & browser realtime</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Permission & Test Sound Banner */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Izin Notifikasi Browser:</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {permissionStatus === 'granted' ? 'Diizinkan' : 'Belum Aktif'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi Web</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestSound}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Uji Suara Alert</span>
            </button>
          </div>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleCreateAlert} className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
              <Plus className="w-4 h-4" />
              <span>Pasang Alert Baru</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Spot: <strong className="text-amber-400 font-bold">${currentPrice.toFixed(2)}</strong>
            </span>
          </div>

          {/* Quick Presets based on Fibonacci & Gold Swings */}
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-semibold mb-1.5">
              Preset Cepat Fibonacci:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {goldenPocket && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetPrice(goldenPocket.lower.toFixed(2));
                    setLabel('Golden Pocket 0.618 OTE');
                  }}
                  className="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono text-amber-300 hover:bg-amber-500/25 transition"
                >
                  GP ${goldenPocket.lower.toFixed(1)}
                </button>
              )}

              {fibLevels.slice(1, 6).map(f => (
                <button
                  key={f.ratio}
                  type="button"
                  onClick={() => {
                    setTargetPrice(f.price.toFixed(2));
                    setLabel(`Fib ${f.ratio} (${f.label})`);
                  }}
                  className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300 hover:bg-slate-800 transition"
                >
                  {f.ratio} (${f.price.toFixed(1)})
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setTargetPrice((currentPrice + 2.0).toFixed(2));
                  setLabel('Breakout +20 pips');
                }}
                className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition"
              >
                +20 pips
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetPrice((currentPrice - 2.0).toFixed(2));
                  setLabel('Pullback -20 pips');
                }}
                className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/40 text-[10px] font-mono text-rose-300 hover:bg-rose-900/60 transition"
              >
                -20 pips
              </button>
            </div>
          </div>

          {/* Target Price & Condition */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Target Harga ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                placeholder="2750.00"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Kondisi Alert
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="CROSS_ANY">Menyentuh Level (Any)</option>
                <option value="CROSS_ABOVE">Naik Melintasi (≥)</option>
                <option value="CROSS_BELOW">Turun Melintasi (≤)</option>
              </select>
            </div>
          </div>

          {/* Label / Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Catatan / Nama Level
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="Contoh: Golden Pocket 0.618 Entry"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
              />
              <span>Bunyikan Suara</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={browserNotificationEnabled}
                onChange={(e) => setBrowserNotificationEnabled(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
              />
              <span>Push Notifikasi</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <BellRing className="w-4 h-4 fill-slate-950" />
            <span>Simpan Alert Harga</span>
          </button>
        </form>

        {/* Active Alerts List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">
              Daftar Alert Aktif ({activeAlerts.length})
            </span>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
              Belum ada alert aktif. Pasang alert untuk Golden Pocket atau level kunci di atas.
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert) => {
                const diff = alert.targetPrice - currentPrice;
                const pips = (diff * 10).toFixed(1);
                const isAbove = diff > 0;

                return (
                  <div
                    key={alert.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleAlert(alert.id)}
                        className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                        title="Klik untuk nonaktifkan"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-100">
                            ${alert.targetPrice.toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-mono font-semibold ${isAbove ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ({isAbove ? '+' : ''}{pips} pips)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                          {alert.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Hapus Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Triggered Alerts History */}
        {triggeredAlerts.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Riwayat Alert Tersentuh ({triggeredAlerts.length})
              </span>
              <button
                onClick={onClearTriggered}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition"
              >
                Bersihkan
              </button>
            </div>

            <div className="space-y-1.5">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-950/40 border border-emerald-900/30 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-slate-200 block">
                        ${alert.targetPrice.toFixed(2)} - {alert.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Tersentuh: {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : 'Baru saja'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-slate-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
