import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Candle, 
  FibLevel, 
  GoldenPocketZone, 
  HighProbabilitySetup, 
  PriceAlert, 
  Timeframe 
} from '../types/trading';
import { 
  calculateFibonacciLevels, 
  getGoldenPocketBounds, 
  detectMajorSwings, 
  calculateEMA 
} from '../utils/fibonacci';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Eye, 
  EyeOff, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  BellRing
} from 'lucide-react';

interface ChartCanvasProps {
  candles: Candle[];
  currentTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  currentBid: number;
  currentAsk: number;
  aiSetup: HighProbabilitySetup | null;
  aiFibLevels?: FibLevel[];
  aiGoldenPocket?: GoldenPocketZone;
  alerts?: PriceAlert[];
  onSelectPriceForRiskCalc?: (price: number, type: 'entry' | 'sl' | 'tp') => void;
  onQuickAddAlert?: (price: number) => void;
  onOpenAlertsDrawer?: () => void;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  currentTimeframe,
  onTimeframeChange,
  currentBid,
  currentAsk,
  aiSetup,
  aiFibLevels,
  aiGoldenPocket,
  alerts = [],
  onSelectPriceForRiskCalc,
  onQuickAddAlert,
  onOpenAlertsDrawer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport / Zoom & Pan state
  const [viewRange, setViewRange] = useState({ count: 70, offset: 0 }); // offset from latest candle
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [hoverData, setHoverData] = useState<{
    candle: Candle | null;
    x: number;
    y: number;
    price: number | null;
  }>({ candle: null, x: 0, y: 0, price: null });

  // Overlays visibility toggles
  const [showFib, setShowFib] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showGoldenPocket, setShowGoldenPocket] = useState(true);
  const [showSetupOverlay, setShowSetupOverlay] = useState(true);
  const [showAlertsOverlay, setShowAlertsOverlay] = useState(true);

  // Technical calculations
  const swings = useMemo(() => detectMajorSwings(candles, 60), [candles]);
  
  const computedFibLevels = useMemo(() => {
    if (aiFibLevels && aiFibLevels.length > 0) return aiFibLevels;
    return calculateFibonacciLevels(swings.swingHigh.price, swings.swingLow.price, swings.trend);
  }, [aiFibLevels, swings]);

  const goldenPocket = useMemo(() => {
    if (aiGoldenPocket) return aiGoldenPocket;
    return getGoldenPocketBounds(swings.swingHigh.price, swings.swingLow.price, swings.trend);
  }, [aiGoldenPocket, swings]);

  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const ema200 = useMemo(() => calculateEMA(candles, 200), [candles]);

  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  // Handle Zoom
  const handleZoomIn = () => {
    setViewRange(prev => ({ ...prev, count: Math.max(25, prev.count - 10) }));
  };

  const handleZoomOut = () => {
    setViewRange(prev => ({ ...prev, count: Math.min(candles.length, prev.count + 15) }));
  };

  const handleResetView = () => {
    setViewRange({ count: 70, offset: 0 });
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const candleWidth = (canvasRef.current.width - 70) / viewRange.count;
      const candleDelta = Math.round(deltaX / candleWidth);
      if (candleDelta !== 0) {
        setViewRange(prev => {
          const newOffset = Math.max(0, Math.min(candles.length - prev.count, prev.offset + candleDelta));
          return { ...prev, offset: newOffset };
        });
        setDragStartX(e.clientX);
      }
    }

    // Update hover
    const visibleCandles = getVisibleCandles();
    if (visibleCandles.length > 0) {
      const chartWidth = canvasRef.current.width - 75;
      const candleWidth = chartWidth / visibleCandles.length;
      const candleIndex = Math.floor(x / candleWidth);

      if (candleIndex >= 0 && candleIndex < visibleCandles.length) {
        const c = visibleCandles[candleIndex];
        const { minPrice, maxPrice } = getPriceBounds(visibleCandles);
        const chartHeight = canvasRef.current.height - 35;
        const price = maxPrice - (y / chartHeight) * (maxPrice - minPrice);
        setHoverData({ candle: c, x, y, price: Number(price.toFixed(2)) });
      } else {
        setHoverData({ candle: null, x, y, price: null });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverData({ candle: null, x: 0, y: 0, price: null });
  };

  // Get subset of visible candles based on zoom & pan
  const getVisibleCandles = useCallback(() => {
    if (!candles || candles.length === 0) return [];
    const end = Math.max(0, candles.length - viewRange.offset);
    const start = Math.max(0, end - viewRange.count);
    return candles.slice(start, end);
  }, [candles, viewRange]);

  const getPriceBounds = (visible: Candle[]) => {
    if (visible.length === 0) return { minPrice: 2700, maxPrice: 2800 };
    let min = Infinity;
    let max = -Infinity;
    for (const c of visible) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }

    // Include Fib levels in bounds if enabled
    if (showFib && computedFibLevels.length > 0) {
      computedFibLevels.forEach(lvl => {
        if (lvl.price > max && lvl.price < max + 30) max = lvl.price;
        if (lvl.price < min && lvl.price > min - 30) min = lvl.price;
      });
    }

    // Include Setup targets if enabled
    if (showSetupOverlay && aiSetup) {
      if (aiSetup.stopLoss) {
        min = Math.min(min, aiSetup.stopLoss);
        max = Math.max(max, aiSetup.stopLoss);
      }
      if (aiSetup.takeProfit2) {
        min = Math.min(min, aiSetup.takeProfit2);
        max = Math.max(max, aiSetup.takeProfit2);
      }
    }

    // Include Active Alert levels
    if (showAlertsOverlay && alerts.length > 0) {
      alerts.filter(a => a.isActive).forEach(a => {
        if (a.targetPrice > max && a.targetPrice < max + 40) max = a.targetPrice;
        if (a.targetPrice < min && a.targetPrice > min - 40) min = a.targetPrice;
      });
    }

    const padding = (max - min) * 0.08 || 5;
    return {
      minPrice: Number((min - padding).toFixed(2)),
      maxPrice: Number((max + padding).toFixed(2)),
    };
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Margins
    const rightMargin = 75; // for price axis
    const bottomMargin = 28; // for time axis
    const chartWidth = width - rightMargin;
    const chartHeight = height - bottomMargin;
    const volumeHeight = showVolume ? chartHeight * 0.18 : 0;
    const candleAreaHeight = chartHeight - volumeHeight;

    // Clear Background
    ctx.fillStyle = '#090d16'; // Deep obsidian navy
    ctx.fillRect(0, 0, width, height);

    const visibleCandles = getVisibleCandles();
    if (visibleCandles.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('Memuat data chart XAU/USD...', width / 2, height / 2);
      return;
    }

    const { minPrice, maxPrice } = getPriceBounds(visibleCandles);
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => {
      return candleAreaHeight - ((price - minPrice) / priceRange) * candleAreaHeight;
    };

    const candleCount = visibleCandles.length;
    const candleWidth = chartWidth / candleCount;
    const barBodyWidth = Math.max(2, candleWidth * 0.72);

    // 1. Draw Grid Lines (Horizontal Price Grid)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const gridStep = priceRange > 50 ? 10 : priceRange > 20 ? 5 : priceRange > 10 ? 2 : 1;
    const firstGrid = Math.ceil(minPrice / gridStep) * gridStep;

    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';

    for (let p = firstGrid; p <= maxPrice; p += gridStep) {
      const y = getY(p);
      if (y >= 0 && y <= candleAreaHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        // Price label on right axis
        ctx.fillText(`$${p.toFixed(2)}`, chartWidth + 6, y + 3);
      }
    }
    ctx.setLineDash([]); // Reset dash

    // 2. Draw Golden Pocket Zone (OTE 0.618 - 0.786)
    if (showGoldenPocket && goldenPocket) {
      const yTop = getY(Math.max(goldenPocket.upper, goldenPocket.lower));
      const yBottom = getY(Math.min(goldenPocket.upper, goldenPocket.lower));
      const zoneHeight = Math.abs(yBottom - yTop);

      // Shaded golden band
      const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0.18)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, yTop, chartWidth, zoneHeight);

      // Border lines for Golden Pocket
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      
      ctx.beginPath();
      ctx.moveTo(0, yTop);
      ctx.lineTo(chartWidth, yTop);
      ctx.moveTo(0, yBottom);
      ctx.lineTo(chartWidth, yBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText('★ GOLDEN POCKET (0.618 - 0.786)', chartWidth - 12, yTop + 14);
    }

    // 3. Draw Fibonacci Levels
    if (showFib && computedFibLevels.length > 0) {
      computedFibLevels.forEach(lvl => {
        const y = getY(lvl.price);
        if (y < 0 || y > candleAreaHeight) return;

        let color = '#64748b';
        let lineWidth = 1;
        let isGolden = false;

        if (lvl.ratio === '0.618') {
          color = '#f59e0b';
          lineWidth = 2;
          isGolden = true;
        } else if (lvl.ratio === '0.786') {
          color = '#d97706';
          lineWidth = 1.5;
        } else if (lvl.ratio === '0.500') {
          color = '#38bdf8';
          lineWidth = 1.5;
        } else if (lvl.ratio === '0.382' || lvl.ratio === '0.236') {
          color = '#818cf8';
        } else if (lvl.ratio.includes('1.')) {
          color = '#10b981'; // Extension targets
          lineWidth = 1.5;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(isGolden ? [6, 2] : [3, 3]);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label on chart
        ctx.fillStyle = color;
        ctx.font = isGolden ? 'bold 10px JetBrains Mono' : '9px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`Fib ${lvl.ratio} (${lvl.label}) - $${lvl.price.toFixed(2)}`, 8, y - 4);

        // Right axis badge for Golden Pocket
        if (isGolden) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(chartWidth + 1, y - 8, rightMargin - 4, 16);
          ctx.fillStyle = '#020617';
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(`0.618 $${lvl.price.toFixed(1)}`, chartWidth + (rightMargin / 2), y + 3);
        }
      });
    }

    // 4. Draw Trade Setup Levels (Entry, SL, TP1, TP2)
    if (showSetupOverlay && aiSetup && aiSetup.grade !== 'NO_TRADE') {
      const { entryPrice, stopLoss, takeProfit1, takeProfit2, signalType, grade } = aiSetup;

      // Stop Loss Line
      if (stopLoss) {
        const ySL = getY(stopLoss);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(0, ySL);
        ctx.lineTo(chartWidth, ySL);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`✖ STOP LOSS: $${stopLoss.toFixed(2)} (-${aiSetup.stopLossPips} pips)`, 12, ySL - 5);

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(chartWidth + 1, ySL - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`SL $${stopLoss.toFixed(1)}`, chartWidth + (rightMargin / 2), ySL + 3);
      }

      // Entry Price Line
      if (entryPrice) {
        const yEntry = getY(entryPrice);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(0, yEntry);
        ctx.lineTo(chartWidth, yEntry);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ ENTRY (${signalType}) [Grade ${grade}]: $${entryPrice.toFixed(2)}`, 12, yEntry - 5);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(chartWidth + 1, yEntry - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`ENTRY`, chartWidth + (rightMargin / 2), yEntry + 3);
      }

      // TP1 Line
      if (takeProfit1) {
        const yTP1 = getY(takeProfit1);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, yTP1);
        ctx.lineTo(chartWidth, yTP1);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`✔ TAKE PROFIT 1 (RR ${aiSetup.takeProfit1RR}): $${takeProfit1.toFixed(2)}`, 12, yTP1 - 5);

        ctx.fillStyle = '#059669';
        ctx.fillRect(chartWidth + 1, yTP1 - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`TP1 $${takeProfit1.toFixed(1)}`, chartWidth + (rightMargin / 2), yTP1 + 3);
      }

      // TP2 Line
      if (takeProfit2) {
        const yTP2 = getY(takeProfit2);
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, yTP2);
        ctx.lineTo(chartWidth, yTP2);
        ctx.stroke();

        ctx.fillStyle = '#14b8a6';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`🎯 TAKE PROFIT 2 (RR ${aiSetup.takeProfit2RR}): $${takeProfit2.toFixed(2)}`, 12, yTP2 - 5);

        ctx.fillStyle = '#0d9488';
        ctx.fillRect(chartWidth + 1, yTP2 - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`TP2 $${takeProfit2.toFixed(1)}`, chartWidth + (rightMargin / 2), yTP2 + 3);
      }

      // TP3 Line (Runner Target)
      if (aiSetup.takeProfit3) {
        const yTP3 = getY(aiSetup.takeProfit3);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(0, yTP3);
        ctx.lineTo(chartWidth, yTP3);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`★ TAKE PROFIT 3 RUNNER (RR ${aiSetup.takeProfit3RR || '1:5'}): $${aiSetup.takeProfit3.toFixed(2)}`, 12, yTP3 - 5);

        ctx.fillStyle = '#d97706';
        ctx.fillRect(chartWidth + 1, yTP3 - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`TP3 $${aiSetup.takeProfit3.toFixed(1)}`, chartWidth + (rightMargin / 2), yTP3 + 3);
      }
    }

    // 5. Draw Active Price Alert Lines
    if (showAlertsOverlay && alerts.length > 0) {
      alerts.filter(a => a.isActive).forEach(alert => {
        const yAlert = getY(alert.targetPrice);
        if (yAlert < 0 || yAlert > candleAreaHeight) return;

        ctx.strokeStyle = '#eab308'; // Bright amber
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(0, yAlert);
        ctx.lineTo(chartWidth, yAlert);
        ctx.stroke();
        ctx.setLineDash([]);

        // Alert Tag on chart
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(`🔔 ALERT: $${alert.targetPrice.toFixed(2)} (${alert.label})`, chartWidth - 10, yAlert - 4);

        // Right axis badge
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(chartWidth + 1, yAlert - 8, rightMargin - 4, 16);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`🔔 $${alert.targetPrice.toFixed(1)}`, chartWidth + (rightMargin / 2), yAlert + 3);
      });
    }

    // 6. Draw EMAs
    if (showEMA) {
      const startIndex = Math.max(0, candles.length - viewRange.offset - viewRange.count);
      
      // EMA 50
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started50 = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const fullIndex = startIndex + i;
        const val = ema50[fullIndex];
        if (val !== null && val !== undefined) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(val);
          if (!started50) {
            ctx.moveTo(x, y);
            started50 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      if (started50) ctx.stroke();

      // EMA 200
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started200 = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const fullIndex = startIndex + i;
        const val = ema200[fullIndex];
        if (val !== null && val !== undefined) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(val);
          if (!started200) {
            ctx.moveTo(x, y);
            started200 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      if (started200) ctx.stroke();
    }

    // 7. Draw Volume Bars
    if (showVolume) {
      const maxVol = Math.max(...visibleCandles.map(c => c.volume || 1), 10);
      const volBaseY = chartHeight;

      for (let i = 0; i < candleCount; i++) {
        const c = visibleCandles[i];
        const isBullish = c.close >= c.open;
        const x = i * candleWidth + (candleWidth - barBodyWidth) / 2;
        const vHeight = ((c.volume || 1) / maxVol) * (volumeHeight - 10);

        ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)';
        ctx.fillRect(x, volBaseY - vHeight, barBodyWidth, vHeight);
      }
    }

    // 8. Draw Candlesticks (Wicks + Bodies)
    for (let i = 0; i < candleCount; i++) {
      const c = visibleCandles[i];
      const isBullish = c.close >= c.open;
      const xCenter = i * candleWidth + candleWidth / 2;
      const xLeft = i * candleWidth + (candleWidth - barBodyWidth) / 2;

      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const yOpen = getY(c.open);
      const yClose = getY(c.close);

      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

      const wickColor = isBullish ? '#10b981' : '#f43f5e';
      const bodyColor = isBullish ? '#10b981' : '#f43f5e';

      // Draw Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xCenter, yHigh);
      ctx.lineTo(xCenter, yLow);
      ctx.stroke();

      // Draw Candle Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(xLeft, bodyTop, barBodyWidth, bodyHeight);
    }

    // 9. Draw Live Price Line (Bid / Ask)
    if (currentBid) {
      const yBid = getY(currentBid);
      if (yBid >= 0 && yBid <= candleAreaHeight) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(0, yBid);
        ctx.lineTo(chartWidth, yBid);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flashing Price Tag on Right Axis
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(chartWidth + 1, yBid - 9, rightMargin - 4, 18);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`$${currentBid.toFixed(2)}`, chartWidth + (rightMargin / 2), yBid + 3);
      }
    }

    // 10. Draw Time Axis (Bottom)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, chartHeight, width, bottomMargin);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, chartHeight);
    ctx.lineTo(width, chartHeight);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';

    const timeStep = Math.max(1, Math.floor(candleCount / 6));
    for (let i = 0; i < candleCount; i += timeStep) {
      const c = visibleCandles[i];
      const x = i * candleWidth + candleWidth / 2;
      const date = new Date(c.time * 1000);
      const timeStr =
        currentTimeframe === 'D1'
          ? `${date.getDate()}/${date.getMonth() + 1}`
          : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      ctx.fillText(timeStr, x, chartHeight + 18);
    }

    // 11. Draw Interactive Crosshair on Hover
    if (hoverData.candle && hoverData.price !== null) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverData.x, 0);
      ctx.lineTo(hoverData.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverData.y);
      ctx.lineTo(chartWidth, hoverData.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hover Price Badge on Right Axis
      ctx.fillStyle = '#334155';
      ctx.fillRect(chartWidth + 1, hoverData.y - 8, rightMargin - 4, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`$${hoverData.price.toFixed(2)}`, chartWidth + (rightMargin / 2), hoverData.y + 3);

      // Hover Date Badge on Bottom Axis
      const hoverDate = new Date(hoverData.candle.time * 1000);
      const fullDateStr = `${hoverDate.toLocaleDateString()} ${hoverDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      ctx.fillStyle = '#334155';
      ctx.fillRect(hoverData.x - 55, chartHeight + 2, 110, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(fullDateStr, hoverData.x, chartHeight + 15);
    }
  }, [
    candles,
    viewRange,
    showFib,
    showEMA,
    showVolume,
    showGoldenPocket,
    showSetupOverlay,
    showAlertsOverlay,
    alerts,
    computedFibLevels,
    goldenPocket,
    ema50,
    ema200,
    currentBid,
    hoverData,
    aiSetup,
    currentTimeframe,
    getVisibleCandles,
  ]);

  const activeCandle = hoverData.candle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const activeAlertsCount = alerts.filter(a => a.isActive).length;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        
        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded font-mono font-semibold transition ${
                currentTimeframe === tf
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* OHLCV Legend Display */}
        {activeCandle && (
          <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-300">
            <span className="text-amber-400 font-bold">XAU/USD ({currentTimeframe})</span>
            <span>O: <strong className="text-slate-100">${activeCandle.open.toFixed(2)}</strong></span>
            <span>H: <strong className="text-emerald-400">${activeCandle.high.toFixed(2)}</strong></span>
            <span>L: <strong className="text-rose-400">${activeCandle.low.toFixed(2)}</strong></span>
            <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${activeCandle.close.toFixed(2)}</strong></span>
            {showVolume && <span>Vol: <strong className="text-slate-400">{activeCandle.volume}</strong></span>}
          </div>
        )}

        {/* Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Price Alerts Overlay Toggle */}
          <button
            onClick={() => setShowAlertsOverlay(!showAlertsOverlay)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium transition ${
              showAlertsOverlay && activeAlertsCount > 0
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
            title="Tampilkan Garis Alert Harga"
          >
            <Bell className="w-3 h-3 text-yellow-400" />
            <span>Alerts ({activeAlertsCount})</span>
          </button>

          {/* Fibonacci Toggle */}
          <button
            onClick={() => setShowFib(!showFib)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium transition ${
              showFib
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
            title="Tampilkan Garis Fibonacci Retracement & Extension"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Fib</span>
          </button>

          {/* Golden Pocket Toggle */}
          <button
            onClick={() => setShowGoldenPocket(!showGoldenPocket)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium transition ${
              showGoldenPocket
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
            title="Tampilkan Zona Golden Pocket OTE (0.618 - 0.786)"
          >
            <span>★ GP Zone</span>
          </button>

          {/* Setup Overlay Toggle */}
          {aiSetup && (
            <button
              onClick={() => setShowSetupOverlay(!showSetupOverlay)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium transition ${
                showSetupOverlay
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
              title="Tampilkan Garis Setup AI (Entry / SL / TP1 / TP2)"
            >
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Setup AI</span>
            </button>
          )}

          {/* EMA Toggle */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border font-medium transition ${
              showEMA
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
          >
            <span>EMA 50/200</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Zoom Buttons */}
          <button
            onClick={handleZoomIn}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Perbesar Grafik"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Perkecil Grafik"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Tampilan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative flex-1 w-full min-h-[420px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Floating Quick Action / Swing Info Tag */}
        <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-lg p-2 text-[11px] font-mono text-slate-300 flex flex-col gap-1 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Swing H:</span>
            <span className="text-emerald-400 font-bold">${swings.swingHigh.price.toFixed(2)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Swing L:</span>
            <span className="text-rose-400 font-bold">${swings.swingLow.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-amber-400 font-semibold">Golden Pocket (0.618 - 0.786):</span>
            <span className="text-amber-200">${Math.min(goldenPocket.upper, goldenPocket.lower).toFixed(2)} - ${Math.max(goldenPocket.upper, goldenPocket.lower).toFixed(2)}</span>
          </div>
        </div>

        {/* Quick Add Alert at Cursor Button (Floating) */}
        {hoverData.price && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {onQuickAddAlert && (
              <button
                onClick={() => onQuickAddAlert(hoverData.price!)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-lg transition"
                title={`Pasang Alert pada $${hoverData.price.toFixed(2)}`}
              >
                <Bell className="w-3 h-3 fill-slate-950" />
                <span>Alert ${hoverData.price.toFixed(2)}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
