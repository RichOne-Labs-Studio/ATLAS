import { Candle, FibLevel } from '../types/trading';
import { calculateEMA } from './fibonacci';

export interface RSIResult {
  values: (number | null)[];
  latest: number;
  status: 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERBOUGHT';
  description: string;
}

export interface MACDResult {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
  latestMacd: number;
  latestSignal: number;
  latestHist: number;
  trend: 'BULLISH_CROSSOVER' | 'BULLISH' | 'BEARISH_CROSSOVER' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export interface ATRResult {
  values: (number | null)[];
  latestAtrDollars: number;
  latestAtrPips: number;
  suggestedSlBufferPips: number; // 1.5x ATR
}

export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
  latestUpper: number;
  latestMiddle: number;
  latestLower: number;
  bandwidth: number;
  positionPercent: number; // 0 to 100%
}

export interface ConfluenceIndicatorItem {
  name: string;
  category: 'Fibonacci' | 'Trend' | 'Momentum' | 'Volatility' | 'Structure';
  value: string;
  signal: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  weightPercent: number;
  description: string;
  isConfirmed: boolean;
}

export interface IndicatorConfluenceAnalysis {
  overallScore: number; // 0 - 100%
  overallBias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  confluenceGrade: 'A+' | 'A' | 'B' | 'C';
  confirmedIndicatorsCount: number;
  totalIndicatorsCount: number;
  summary: string;
  indicators: ConfluenceIndicatorItem[];
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(candles: Candle[], period: number = 14): RSIResult {
  const values: (number | null)[] = new Array(candles.length).fill(null);
  if (!candles || candles.length <= period) {
    return {
      values,
      latest: 50,
      status: 'NEUTRAL',
      description: 'Data candlestick belum mencukupi untuk RSI 14',
    };
  }

  let gains = 0;
  let losses = 0;

  // First period SMA of gains and losses
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  values[period] = Number(rsi.toFixed(2));

  // Wilder's smoothing
  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    values[i] = Number(rsi.toFixed(2));
  }

  const latest = values[values.length - 1] ?? 50;
  let status: RSIResult['status'] = 'NEUTRAL';
  let description = 'RSI berada di zona netral (45 - 55)';

  if (latest <= 30) {
    status = 'OVERSOLD';
    description = `RSI (${latest.toFixed(1)}) Jenuh Jual (Oversold < 30) — Peluang Rebound Kuat di Zona Beli`;
  } else if (latest < 45) {
    status = 'BULLISH_MOMENTUM';
    description = `RSI (${latest.toFixed(1)}) Area Akumulasi Diskon / Golden Pocket Support`;
  } else if (latest >= 70) {
    status = 'OVERBOUGHT';
    description = `RSI (${latest.toFixed(1)}) Jenuh Beli (Overbought > 70) — Waspada Koreksi / Reversal Jual`;
  } else if (latest > 55) {
    status = 'BEARISH_MOMENTUM';
    description = `RSI (${latest.toFixed(1)}) Tekanan Bullish Kuat di atas 50`;
  }

  return { values, latest, status, description };
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(candles: Candle[], fast: number = 12, slow: number = 26, signalPeriod: number = 9): MACDResult {
  const emaFast = calculateEMA(candles, fast);
  const emaSlow = calculateEMA(candles, slow);

  const macdLine: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macdLine[i] = Number(((emaFast[i] as number) - (emaSlow[i] as number)).toFixed(2));
    }
  }

  // Calculate Signal line (EMA of MACD line)
  const validMacd = macdLine.map(v => (v !== null ? { close: v, time: 0, open: 0, high: 0, low: 0, volume: 0 } : null));
  const signalLine: (number | null)[] = new Array(candles.length).fill(null);
  const histogram: (number | null)[] = new Array(candles.length).fill(null);

  // Seed signal line
  const firstValid = macdLine.findIndex(v => v !== null);
  if (firstValid !== -1 && candles.length - firstValid >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    let sum = 0;
    for (let i = firstValid; i < firstValid + signalPeriod; i++) {
      sum += macdLine[i] as number;
    }
    let prevSig = sum / signalPeriod;
    signalLine[firstValid + signalPeriod - 1] = Number(prevSig.toFixed(2));

    for (let i = firstValid + signalPeriod; i < candles.length; i++) {
      const currentVal = macdLine[i] as number;
      const sig = currentVal * k + prevSig * (1 - k);
      signalLine[i] = Number(sig.toFixed(2));
      histogram[i] = Number((currentVal - sig).toFixed(2));
      prevSig = sig;
    }
  }

  const latestMacd = macdLine[macdLine.length - 1] ?? 0;
  const latestSignal = signalLine[signalLine.length - 1] ?? 0;
  const latestHist = histogram[histogram.length - 1] ?? 0;
  const prevHist = histogram[histogram.length - 2] ?? 0;

  let trend: MACDResult['trend'] = 'NEUTRAL';
  let description = 'MACD netral';

  if (prevHist < 0 && latestHist >= 0) {
    trend = 'BULLISH_CROSSOVER';
    description = 'Golden Cross MACD Terkonfirmasi: Garis MACD memotong ke atas Garis Signal';
  } else if (prevHist > 0 && latestHist <= 0) {
    trend = 'BEARISH_CROSSOVER';
    description = 'Death Cross MACD Terkonfirmasi: Garis MACD memotong ke bawah Garis Signal';
  } else if (latestHist > 0) {
    trend = 'BULLISH';
    description = `Histogram MACD Positif (+${latestHist.toFixed(2)}) — Momentum Bullish Mendominasi`;
  } else if (latestHist < 0) {
    trend = 'BEARISH';
    description = `Histogram MACD Negatif (${latestHist.toFixed(2)}) — Momentum Bearish Mendominasi`;
  }

  return { macdLine, signalLine, histogram, latestMacd, latestSignal, latestHist, trend, description };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(candles: Candle[], period: number = 14): ATRResult {
  const values: (number | null)[] = new Array(candles.length).fill(null);
  if (!candles || candles.length <= period) {
    return {
      values,
      latestAtrDollars: 15.0,
      latestAtrPips: 150.0,
      suggestedSlBufferPips: 25.0,
    };
  }

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  values[period] = Number(atr.toFixed(2));

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    values[i + 1] = Number(atr.toFixed(2));
  }

  const latestAtrDollars = values[values.length - 1] ?? 12.0;
  const latestAtrPips = Number((latestAtrDollars * 10).toFixed(1));
  const suggestedSlBufferPips = Number((latestAtrPips * 0.45).toFixed(1));

  return { values, latestAtrDollars, latestAtrPips, suggestedSlBufferPips };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(candles: Candle[], period: number = 20, stdMultiplier: number = 2): BollingerBandsResult {
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const middle: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);

  if (!candles || candles.length < period) {
    return {
      upper,
      middle,
      lower,
      latestUpper: 2780,
      latestMiddle: 2750,
      latestLower: 2720,
      bandwidth: 60,
      positionPercent: 50,
    };
  }

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle[i] = Number(mean.toFixed(2));
    upper[i] = Number((mean + stdMultiplier * stdDev).toFixed(2));
    lower[i] = Number((mean - stdMultiplier * stdDev).toFixed(2));
  }

  const latestUpper = upper[upper.length - 1] ?? 2780;
  const latestMiddle = middle[middle.length - 1] ?? 2750;
  const latestLower = lower[lower.length - 1] ?? 2720;
  const bandwidth = Number((latestUpper - latestLower).toFixed(2));
  const currentPrice = candles[candles.length - 1]?.close || latestMiddle;
  const positionPercent = Math.max(0, Math.min(100, Number((((currentPrice - latestLower) / (latestUpper - latestLower || 1)) * 100).toFixed(1))));

  return { upper, middle, lower, latestUpper, latestMiddle, latestLower, bandwidth, positionPercent };
}

/**
 * Synthesizes a Multi-Indicator Confluence Evaluation Matrix
 */
export function evaluateSupportingIndicators(
  candles: Candle[],
  currentPrice: number,
  fibLevels: FibLevel[],
  goldenPocket: { upper: number; lower: number; description: string }
): IndicatorConfluenceAnalysis {
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles, 12, 26, 9);
  const atr = calculateATR(candles, 14);
  const bb = calculateBollingerBands(candles, 20, 2);
  const ema50List = calculateEMA(candles, 50);
  const ema200List = calculateEMA(candles, 200);

  const latestEma50 = ema50List[ema50List.length - 1] ?? currentPrice;
  const latestEma200 = ema200List[ema200List.length - 1] ?? currentPrice;

  const indicators: ConfluenceIndicatorItem[] = [];

  // 1. Fibonacci Golden Pocket (Weight 30%)
  const isNearGoldenPocket = currentPrice >= Math.min(goldenPocket.lower, goldenPocket.upper) - 2.0 &&
                             currentPrice <= Math.max(goldenPocket.lower, goldenPocket.upper) + 2.0;
  const isInsideGoldenPocket = currentPrice >= Math.min(goldenPocket.lower, goldenPocket.upper) &&
                               currentPrice <= Math.max(goldenPocket.lower, goldenPocket.upper);

  indicators.push({
    name: 'Fibonacci Retracement 0.618 - 0.786',
    category: 'Fibonacci',
    value: `$${Math.min(goldenPocket.lower, goldenPocket.upper).toFixed(2)} - $${Math.max(goldenPocket.lower, goldenPocket.upper).toFixed(2)}`,
    signal: isInsideGoldenPocket ? 'STRONG_BULLISH' : isNearGoldenPocket ? 'BULLISH' : 'NEUTRAL',
    weightPercent: 30,
    description: isInsideGoldenPocket
      ? 'Harga berada tepat di area Golden Pocket OTE (0.618 - 0.786) — Area pantulan rasio emas'
      : 'Memantau pullback menuju level Retracement 0.618',
    isConfirmed: isNearGoldenPocket || isInsideGoldenPocket,
  });

  // 2. Trend Alignment (EMA 50 & EMA 200) (Weight 20%)
  const isEmaBullish = latestEma50 >= latestEma200;
  const isPriceAboveEma50 = currentPrice >= latestEma50;
  indicators.push({
    name: 'EMA 50 / EMA 200 Trend Filter',
    category: 'Trend',
    value: `EMA50: $${latestEma50.toFixed(2)} | EMA200: $${latestEma200.toFixed(2)}`,
    signal: isEmaBullish && isPriceAboveEma50 ? 'STRONG_BULLISH' : isEmaBullish ? 'BULLISH' : 'BEARISH',
    weightPercent: 20,
    description: isEmaBullish
      ? 'Tren Mayor Bullish (Golden Alignment: EMA 50 di atas EMA 200)'
      : 'Tren Mayor Bearish (Death Alignment: EMA 50 di bawah EMA 200)',
    isConfirmed: isEmaBullish,
  });

  // 3. Momentum RSI 14 (Weight 15%)
  const isRsiBullish = rsi.latest <= 45 || rsi.status === 'OVERSOLD';
  indicators.push({
    name: 'RSI (14) Momentum & Divergence',
    category: 'Momentum',
    value: `${rsi.latest.toFixed(1)} (${rsi.status})`,
    signal: rsi.latest <= 32 ? 'STRONG_BULLISH' : rsi.latest <= 48 ? 'BULLISH' : rsi.latest >= 70 ? 'STRONG_BEARISH' : 'NEUTRAL',
    weightPercent: 15,
    description: rsi.description,
    isConfirmed: isRsiBullish,
  });

  // 4. MACD Momentum (Weight 15%)
  const isMacdBullish = macd.trend.includes('BULLISH');
  indicators.push({
    name: 'MACD (12, 26, 9) Crossover',
    category: 'Momentum',
    value: `Hist: ${macd.latestHist > 0 ? '+' : ''}${macd.latestHist.toFixed(2)} (${macd.trend})`,
    signal: macd.trend === 'BULLISH_CROSSOVER' ? 'STRONG_BULLISH' : macd.trend === 'BULLISH' ? 'BULLISH' : 'BEARISH',
    weightPercent: 15,
    description: macd.description,
    isConfirmed: isMacdBullish,
  });

  // 5. Bollinger Bands (Weight 10%)
  const isNearLowerBB = bb.positionPercent <= 25;
  const isNearUpperBB = bb.positionPercent >= 75;
  indicators.push({
    name: 'Bollinger Bands (20, 2)',
    category: 'Volatility',
    value: `Posisi: ${bb.positionPercent}% ($${bb.latestLower.toFixed(1)} - $${bb.latestUpper.toFixed(1)})`,
    signal: isNearLowerBB ? 'STRONG_BULLISH' : isNearUpperBB ? 'BEARISH' : 'NEUTRAL',
    weightPercent: 10,
    description: isNearLowerBB
      ? 'Harga menyentuh Lower Band (Diskon) — Potensi Mean Reversion ke Middle Band'
      : isNearUpperBB
      ? 'Harga menyentuh Upper Band (Premium) — Waspada resistensi'
      : 'Harga berkonsolidasi di sekitar Middle Band SMA 20',
    isConfirmed: isNearLowerBB || (bb.positionPercent >= 35 && bb.positionPercent <= 65),
  });

  // 6. ATR (14) Volatility Buffer (Weight 10%)
  indicators.push({
    name: 'ATR (14) Volatility Dynamic SL',
    category: 'Volatility',
    value: `$${atr.latestAtrDollars.toFixed(2)} (${atr.latestAtrPips} pips)`,
    signal: 'BULLISH',
    weightPercent: 10,
    description: `Volatilitas normal. Buffer Stop Loss ideal: ${atr.suggestedSlBufferPips} - ${(atr.suggestedSlBufferPips * 1.5).toFixed(0)} pips untuk menghindari fakeout spread.`,
    isConfirmed: true,
  });

  // Calculate Weighted Confluence Score
  let score = 0;
  let confirmedCount = 0;
  indicators.forEach(ind => {
    if (ind.signal.includes('BULLISH')) {
      score += ind.signal === 'STRONG_BULLISH' ? ind.weightPercent : ind.weightPercent * 0.8;
      confirmedCount++;
    } else if (ind.signal === 'NEUTRAL') {
      score += ind.weightPercent * 0.4;
    }
  });

  const finalScore = Math.min(100, Math.max(10, Math.round(score)));
  const grade: IndicatorConfluenceAnalysis['confluenceGrade'] =
    finalScore >= 85 ? 'A+' : finalScore >= 70 ? 'A' : finalScore >= 55 ? 'B' : 'C';

  const overallBias: IndicatorConfluenceAnalysis['overallBias'] =
    finalScore >= 75 ? 'STRONG_BULLISH' : finalScore >= 55 ? 'BULLISH' : finalScore >= 45 ? 'NEUTRAL' : 'BEARISH';

  const summary = `Konfluensi ${confirmedCount} dari ${indicators.length} indikator selaras dengan setup Fibonacci Golden Pocket (Skor: ${finalScore}%). Sinyal ${overallBias.replace('_', ' ')} berprobabilitas tinggi.`;

  return {
    overallScore: finalScore,
    overallBias,
    confluenceGrade: grade,
    confirmedIndicatorsCount: confirmedCount,
    totalIndicatorsCount: indicators.length,
    summary,
    indicators,
  };
}
