import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ChartCanvas } from './components/ChartCanvas';
import { TradeRecommendationPanel } from './components/TradeRecommendationPanel';
import { SupportingIndicatorsPanel } from './components/SupportingIndicatorsPanel';
import { AiAnalysisPanel } from './components/AiAnalysisPanel';
import { FibonacciLevelsTable } from './components/FibonacciLevelsTable';
import { Mt5BridgeModal } from './components/Mt5BridgeModal';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { AiChatDrawer } from './components/AiChatDrawer';
import { PriceAlertsDrawer } from './components/PriceAlertsDrawer';
import { AlertToast } from './components/AlertToast';
import { 
  MT5State, 
  Timeframe, 
  AiAnalysisResult, 
  FibLevel, 
  GoldenPocketZone,
  PriceAlert 
} from './types/trading';
import { calculateFibonacciLevels, detectMajorSwings, getGoldenPocketBounds } from './utils/fibonacci';
import { evaluateSupportingIndicators } from './utils/indicators';
import { playPriceAlertSound, playSuccessSound } from './utils/audioAlert';
import { triggerBrowserNotification } from './utils/notifications';
import { 
  ShieldAlert, 
  Sparkles, 
  Terminal, 
  Bot, 
  TrendingUp, 
  Layers, 
  Activity,
  Flame,
  Award,
  Bell,
  Compass
} from 'lucide-react';

const ALERTS_STORAGE_KEY = 'atlas_price_alerts_v1';

export default function App() {
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('H1');
  const [mt5State, setMt5State] = useState<MT5State | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // Modals & Drawers
  const [isMt5ModalOpen, setIsMt5ModalOpen] = useState<boolean>(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);

  // Price Alert Notification State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial alert presets for gold
    return [
      {
        id: 'alert-gp-default',
        targetPrice: 2744.5,
        condition: 'CROSS_ANY',
        label: 'Golden Pocket 0.618 Entry Zone',
        isActive: true,
        createdAt: Date.now(),
        soundEnabled: true,
        browserNotificationEnabled: true,
        initialPrice: 2748.5,
      },
      {
        id: 'alert-swing-high',
        targetPrice: 2760.0,
        condition: 'CROSS_ABOVE',
        label: 'Resistance Swing High Breakout',
        isActive: true,
        createdAt: Date.now(),
        soundEnabled: true,
        browserNotificationEnabled: true,
        initialPrice: 2748.5,
      }
    ];
  });

  const [activeToastAlert, setActiveToastAlert] = useState<PriceAlert | null>(null);
  const lastCheckedPriceRef = useRef<number | null>(null);

  // Save alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.error(e);
    }
  }, [alerts]);

  // Risk Calculator custom inputs
  const [riskModalParams, setRiskModalParams] = useState({
    entryPrice: 2748.5,
    stopLoss: 2743.5,
    takeProfit: 2760.5,
  });

  // 1. Fetch Real-time Market & MT5 State from Backend API
  const fetchMarketState = useCallback(async (tf: Timeframe) => {
    try {
      const res = await fetch(`/api/mt5/state?tf=${tf}`);
      if (res.ok) {
        const data: MT5State = await res.json();
        setMt5State(data);
      }
    } catch (err) {
      console.error('Error fetching market state:', err);
    }
  }, []);

  // Poll market data every 1 second for live tick experience
  useEffect(() => {
    fetchMarketState(currentTimeframe);
    const interval = setInterval(() => {
      fetchMarketState(currentTimeframe);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTimeframe, fetchMarketState]);

  // 2. Real-time Price Alert Monitor
  useEffect(() => {
    if (!mt5State) return;
    const currentPrice = mt5State.symbol.bid;
    const prevPrice = lastCheckedPriceRef.current;

    if (prevPrice !== null && prevPrice !== undefined && prevPrice !== currentPrice) {
      alerts.forEach((alert) => {
        if (!alert.isActive) return;

        let isHit = false;
        const target = alert.targetPrice;

        if (alert.condition === 'CROSS_ABOVE') {
          // Crossed upward
          if (prevPrice <= target && currentPrice >= target) {
            isHit = true;
          }
        } else if (alert.condition === 'CROSS_BELOW') {
          // Crossed downward
          if (prevPrice >= target && currentPrice <= target) {
            isHit = true;
          }
        } else {
          // CROSS_ANY / TOUCH
          const crossed = (prevPrice <= target && currentPrice >= target) || 
                          (prevPrice >= target && currentPrice <= target);
          const withinSpread = Math.abs(currentPrice - target) <= 0.20;
          if (crossed || withinSpread) {
            isHit = true;
          }
        }

        if (isHit) {
          // 1. Mark alert as triggered
          setAlerts((prevAlerts) =>
            prevAlerts.map((a) =>
              a.id === alert.id
                ? { ...a, isActive: false, triggeredAt: Date.now() }
                : a
            )
          );

          // 2. Play Web Audio synthesized chime
          if (alert.soundEnabled) {
            playPriceAlertSound();
          }

          // 3. Trigger Browser Push Notification
          if (alert.browserNotificationEnabled) {
            triggerBrowserNotification(`🔔 XAU/USD Alert: $${target.toFixed(2)}`, {
              body: `${alert.label} — Harga Emas terkini menyentuh $${currentPrice.toFixed(2)}`,
            });
          }

          // 4. Show in-app floating toast
          setActiveToastAlert({ ...alert, triggeredAt: Date.now() });
        }
      });
    }

    lastCheckedPriceRef.current = currentPrice;
  }, [mt5State?.symbol.bid, alerts]);

  // Alert Management Handlers
  const handleAddAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearTriggeredAlerts = () => {
    setAlerts((prev) => prev.filter((a) => a.isActive));
  };

  const handleQuickSetAlert = (price: number, customLabel?: string) => {
    const targetPriceNum = Number(price.toFixed(2));
    const currentP = mt5State?.symbol.bid || 2748.5;
    const cond = targetPriceNum >= currentP ? 'CROSS_ABOVE' : 'CROSS_BELOW';

    handleAddAlert({
      targetPrice: targetPriceNum,
      condition: cond,
      label: customLabel || `Alert Level $${targetPriceNum.toFixed(2)}`,
      isActive: true,
      soundEnabled: true,
      browserNotificationEnabled: true,
      initialPrice: currentP,
    });

    playSuccessSound();
    setIsAlertsDrawerOpen(true);
  };

  const handleSetMultipleAlerts = (alertsList: { price: number; label: string }[]) => {
    const currentP = mt5State?.symbol.bid || 2748.5;
    const newAlerts: PriceAlert[] = alertsList.map((item, idx) => ({
      id: `alert-${Date.now()}-${idx}`,
      targetPrice: Number(item.price.toFixed(2)),
      condition: item.price >= currentP ? 'CROSS_ABOVE' : 'CROSS_BELOW',
      label: item.label,
      isActive: true,
      createdAt: Date.now() + idx,
      soundEnabled: true,
      browserNotificationEnabled: true,
      initialPrice: currentP,
    }));

    setAlerts(prev => [...newAlerts, ...prev]);
    playSuccessSound();
  };

  const currentPrice = mt5State?.symbol.bid || 2748.5;
  const swings = mt5State ? detectMajorSwings(mt5State.candles, 60) : { swingHigh: { price: 2760 }, swingLow: { price: 2720 }, trend: 'UP' as const };
  const fallbackFibs = calculateFibonacciLevels(swings.swingHigh.price, swings.swingLow.price, swings.trend);
  const activeFibLevels = aiAnalysis?.fibonacciLevels || fallbackFibs;
  const activeGoldenPocket = aiAnalysis?.goldenPocketZone || getGoldenPocketBounds(swings.swingHigh.price, swings.swingLow.price, swings.trend);

  // Calculate real-time supporting indicators confluence
  const indicatorConfluence = useMemo(() => {
    if (!mt5State || !mt5State.candles || mt5State.candles.length === 0) {
      return {
        overallScore: 85,
        overallBias: 'STRONG_BULLISH' as const,
        confluenceGrade: 'A+' as const,
        confirmedIndicatorsCount: 5,
        totalIndicatorsCount: 6,
        summary: 'Menghitung indikator teknikal...',
        indicators: [],
      };
    }
    return evaluateSupportingIndicators(mt5State.candles, currentPrice, activeFibLevels, activeGoldenPocket);
  }, [mt5State?.candles, currentPrice, activeFibLevels, activeGoldenPocket]);

  // 3. Perform Gemini AI Technical & Fibonacci Analysis
  const runAiAnalysis = async () => {
    if (!mt5State || isAiAnalyzing) return;
    setIsAiAnalyzing(true);

    try {
      const payload = {
        timeframe: currentTimeframe,
        candles: mt5State.candles,
        currentPrice: mt5State.symbol.bid,
        accountBalance: mt5State.account.balance,
        riskPercentage: 1.0,
        swingHigh: swings.swingHigh.price,
        swingLow: swings.swingLow.price,
        fibLevels: activeFibLevels,
        goldenPocket: activeGoldenPocket,
        supportingIndicators: indicatorConfluence,
      };

      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Gagal menerima analisis');
      }
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Run initial AI analysis once data loads
  useEffect(() => {
    if (mt5State && mt5State.candles.length > 0 && !aiAnalysis && !isAiAnalyzing) {
      runAiAnalysis();
    }
  }, [mt5State?.candles.length]);

  const handleSelectPriceForRisk = (price: number) => {
    setRiskModalParams(prev => ({
      ...prev,
      entryPrice: price,
      stopLoss: Number((price - 5.0).toFixed(2)),
      takeProfit: Number((price + 12.0).toFixed(2)),
    }));
    setIsRiskModalOpen(true);
  };

  const handleApplySetupFromCalculator = (entry: number, sl: number, tp: number, lot: number) => {
    if (aiAnalysis) {
      setAiAnalysis({
        ...aiAnalysis,
        highProbabilitySetup: {
          ...aiAnalysis.highProbabilitySetup,
          entryPrice: entry,
          stopLoss: sl,
          takeProfit1: tp,
          recommendedLotSize: lot,
        },
      });
    }
  };

  const activeAlertsCount = alerts.filter(a => a.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navbar with Ticker, MT5 status & Alert Badge */}
      <Navbar
        mt5State={mt5State}
        onOpenMt5Modal={() => setIsMt5ModalOpen(true)}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        onOpenAlertsDrawer={() => setIsAlertsDrawerOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onTriggerAiAnalysis={runAiAnalysis}
        isAiAnalyzing={isAiAnalyzing}
        isChatOpen={isChatOpen}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Trading Terminal Layout */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1920px] w-full mx-auto space-y-4">
        
        {/* Dedicated Buy/Sell Entry Suggestion Panel with Complete SL and TP1/TP2/TP3 */}
        <TradeRecommendationPanel
          primarySetup={aiAnalysis?.highProbabilitySetup || null}
          alternativeSetup={aiAnalysis?.alternativeSetup || null}
          currentPrice={currentPrice}
          account={mt5State?.account || {
            broker: 'MetaQuotes MT5 Demo',
            login: 88920194,
            server: 'MetaQuotes-Demo',
            balance: 10000,
            equity: 10000,
            margin: 0,
            freeMargin: 10000,
            currency: 'USD',
            leverage: 100,
          }}
          onSetAlert={(p, lbl) => handleQuickSetAlert(p, lbl)}
          onSetMultipleAlerts={handleSetMultipleAlerts}
          onOpenRiskModal={(e, sl, tp) => {
            setRiskModalParams({ entryPrice: e, stopLoss: sl, takeProfit: tp });
            setIsRiskModalOpen(true);
          }}
          onRefreshAi={runAiAnalysis}
          isAiLoading={isAiAnalyzing}
        />

        {/* Multi-Indicator Confluence Matrix Dashboard */}
        <SupportingIndicatorsPanel
          confluence={indicatorConfluence}
          currentPrice={currentPrice}
        />

        {/* 2-Column Grid: Left Chart + Fib Table | Right AI Audit + MT5 Connect */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          
          {/* Left / Center Column: Candlestick Chart & Fibonacci Matrix (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            
            {/* Chart Canvas Card */}
            <div className="h-[520px] sm:h-[600px] w-full">
              <ChartCanvas
                candles={mt5State?.candles || []}
                currentTimeframe={currentTimeframe}
                onTimeframeChange={setCurrentTimeframe}
                currentBid={mt5State?.symbol.bid || 2748.5}
                currentAsk={mt5State?.symbol.ask || 2748.7}
                aiSetup={aiAnalysis?.highProbabilitySetup || null}
                aiFibLevels={aiAnalysis?.fibonacciLevels}
                aiGoldenPocket={aiAnalysis?.goldenPocketZone}
                alerts={alerts}
                onSelectPriceForRiskCalc={handleSelectPriceForRisk}
                onQuickAddAlert={(p) => handleQuickSetAlert(p, `Chart Alert $${p.toFixed(2)}`)}
                onOpenAlertsDrawer={() => setIsAlertsDrawerOpen(true)}
              />
            </div>

            {/* Fibonacci Levels Matrix Table */}
            <FibonacciLevelsTable
              levels={activeFibLevels}
              currentPrice={currentPrice}
              onSelectLevel={handleSelectPriceForRisk}
              onSetAlert={(p, lbl) => handleQuickSetAlert(p, lbl)}
            />

          </div>

          {/* Right Column: AI Analysis, Setup Grade, Risk Checklist (5 Cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            
            {/* AI Setup & Fibonacci Audit Panel */}
            <AiAnalysisPanel
              analysis={aiAnalysis}
              isLoading={isAiAnalyzing}
              onRefresh={runAiAnalysis}
              account={mt5State?.account || {
                broker: 'Demo',
                login: 12345,
                server: 'Demo',
                balance: 10000,
                equity: 10000,
                margin: 0,
                freeMargin: 10000,
                currency: 'USD',
                leverage: 100,
              }}
              onOpenRiskModalWithSetup={() => {
                if (aiAnalysis) {
                  setRiskModalParams({
                    entryPrice: aiAnalysis.highProbabilitySetup.entryPrice,
                    stopLoss: aiAnalysis.highProbabilitySetup.stopLoss,
                    takeProfit: aiAnalysis.highProbabilitySetup.takeProfit1,
                  });
                  setIsRiskModalOpen(true);
                }
              }}
              onSetAlert={(p, lbl) => handleQuickSetAlert(p, lbl)}
            />

            {/* Quick MT5 Python Connect Banner if not yet connected */}
            {(!mt5State || !mt5State.connected) && (
              <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Sambungkan MetaTrader 5 (MT5) Realtime
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Jalankan script Python <code className="text-amber-300 font-mono">xauusd_mt5_bridge.py</code> untuk membaca tick & candle langsung dari broker Anda ke sistem ATLAS.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMt5ModalOpen(true)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
                >
                  Setup Python
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Price Alerts Management Drawer */}
      <PriceAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onToggleAlert={handleToggleAlert}
        onDeleteAlert={handleDeleteAlert}
        onClearTriggered={handleClearTriggeredAlerts}
        currentPrice={currentPrice}
        fibLevels={activeFibLevels}
        goldenPocket={activeGoldenPocket}
      />

      {/* Floating Price Alert Hit Toast */}
      <AlertToast
        alert={activeToastAlert}
        onDismiss={() => setActiveToastAlert(null)}
        onOpenDrawer={() => setIsAlertsDrawerOpen(true)}
      />

      {/* MT5 Python Bridge Modal */}
      <Mt5BridgeModal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
        mt5State={mt5State}
      />

      {/* Strict Risk & Lot Size Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        initialBalance={mt5State?.account.balance || 10000}
        initialEntryPrice={riskModalParams.entryPrice}
        initialStopLoss={riskModalParams.stopLoss}
        initialTakeProfit={riskModalParams.takeProfit}
        onApplySetup={handleApplySetupFromCalculator}
      />

      {/* Interactive AI Chat Drawer */}
      <AiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mt5State={mt5State}
        currentTimeframe={currentTimeframe}
      />

    </div>
  );
}
