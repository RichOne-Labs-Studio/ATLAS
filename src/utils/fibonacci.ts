import { Candle, FibLevel } from '../types/trading';

export interface SwingPoints {
  swingHigh: { price: number; index: number; time: number };
  swingLow: { price: number; index: number; time: number };
  trend: 'UP' | 'DOWN';
}

/**
 * Detects the most prominent Swing High and Swing Low in a given series of candles
 */
export function detectMajorSwings(candles: Candle[], lookback: number = 60): SwingPoints {
  if (!candles || candles.length < 5) {
    return {
      swingHigh: { price: 2760, index: 0, time: Date.now() / 1000 },
      swingLow: { price: 2720, index: 0, time: Date.now() / 1000 },
      trend: 'UP',
    };
  }

  const slice = candles.slice(-lookback);
  let maxHigh = -Infinity;
  let maxHighIndex = 0;
  let minLow = Infinity;
  let minLowIndex = 0;

  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    if (c.high > maxHigh) {
      maxHigh = c.high;
      maxHighIndex = i;
    }
    if (c.low < minLow) {
      minLow = c.low;
      minLowIndex = i;
    }
  }

  const highCandle = slice[maxHighIndex];
  const lowCandle = slice[minLowIndex];

  // If low came before high -> Uptrend (measuring retracement of bullish impulse)
  // If high came before low -> Downtrend (measuring retracement of bearish impulse)
  const trend = lowCandle.time < highCandle.time ? 'UP' : 'DOWN';

  return {
    swingHigh: {
      price: Number(maxHigh.toFixed(2)),
      index: candles.length - lookback + maxHighIndex,
      time: highCandle.time,
    },
    swingLow: {
      price: Number(minLow.toFixed(2)),
      index: candles.length - lookback + minLowIndex,
      time: lowCandle.time,
    },
    trend,
  };
}

/**
 * Computes exact Fibonacci Retracement and Extension levels for XAU/USD
 */
export function calculateFibonacciLevels(
  swingHigh: number,
  swingLow: number,
  trend: 'UP' | 'DOWN'
): FibLevel[] {
  const diff = swingHigh - swingLow;

  if (trend === 'UP') {
    // In Uptrend: 0% is at Swing High, 100% is at Swing Low (measuring dip from top)
    // Retracement levels = SwingHigh - (diff * ratio)
    return [
      { ratio: '0.000', price: Number(swingHigh.toFixed(2)), label: '0.0% (Swing High)' },
      { ratio: '0.236', price: Number((swingHigh - diff * 0.236).toFixed(2)), label: '23.6% Minor' },
      { ratio: '0.382', price: Number((swingHigh - diff * 0.382).toFixed(2)), label: '38.2% Retracement' },
      { ratio: '0.500', price: Number((swingHigh - diff * 0.5).toFixed(2)), label: '50.0% Equilibrium' },
      { ratio: '0.618', price: Number((swingHigh - diff * 0.618).toFixed(2)), label: '61.8% Golden Pocket' },
      { ratio: '0.786', price: Number((swingHigh - diff * 0.786).toFixed(2)), label: '78.6% Deep OTE' },
      { ratio: '1.000', price: Number(swingLow.toFixed(2)), label: '100.0% (Swing Low)' },
      { ratio: '1.272', price: Number((swingHigh + diff * 0.272).toFixed(2)), label: '127.2% Target Ext 1' },
      { ratio: '1.618', price: Number((swingHigh + diff * 0.618).toFixed(2)), label: '161.8% Golden Extension' },
      { ratio: '2.000', price: Number((swingHigh + diff * 1.0).toFixed(2)), label: '200.0% Target Ext 2' },
    ];
  } else {
    // In Downtrend: 0% is at Swing Low, 100% is at Swing High (measuring rally from bottom)
    // Retracement levels = SwingLow + (diff * ratio)
    return [
      { ratio: '0.000', price: Number(swingLow.toFixed(2)), label: '0.0% (Swing Low)' },
      { ratio: '0.236', price: Number((swingLow + diff * 0.236).toFixed(2)), label: '23.6% Minor' },
      { ratio: '0.382', price: Number((swingLow + diff * 0.382).toFixed(2)), label: '38.2% Retracement' },
      { ratio: '0.500', price: Number((swingLow + diff * 0.5).toFixed(2)), label: '50.0% Equilibrium' },
      { ratio: '0.618', price: Number((swingLow + diff * 0.618).toFixed(2)), label: '61.8% Golden Pocket' },
      { ratio: '0.786', price: Number((swingLow + diff * 0.786).toFixed(2)), label: '78.6% Deep OTE' },
      { ratio: '1.000', price: Number(swingHigh.toFixed(2)), label: '100.0% (Swing High)' },
      { ratio: '1.272', price: Number((swingLow - diff * 0.272).toFixed(2)), label: '127.2% Target Ext 1' },
      { ratio: '1.618', price: Number((swingLow - diff * 0.618).toFixed(2)), label: '161.8% Golden Extension' },
      { ratio: '2.000', price: Number((swingLow - diff * 1.0).toFixed(2)), label: '200.0% Target Ext 2' },
    ];
  }
}

/**
 * Calculates Golden Pocket bounds (0.618 to 0.786 area)
 */
export function getGoldenPocketBounds(swingHigh: number, swingLow: number, trend: 'UP' | 'DOWN') {
  const diff = swingHigh - swingLow;
  if (trend === 'UP') {
    const upper = Number((swingHigh - diff * 0.618).toFixed(2));
    const lower = Number((swingHigh - diff * 0.786).toFixed(2));
    return { upper, lower, description: 'Golden Pocket Area (Optimal Trade Entry 0.618 - 0.786)' };
  } else {
    const lower = Number((swingLow + diff * 0.618).toFixed(2));
    const upper = Number((swingLow + diff * 0.786).toFixed(2));
    return { upper, lower, description: 'Golden Pocket Resistance (OTE 0.618 - 0.786)' };
  }
}

/**
 * Calculates strict risk parameters and lot sizing for Gold XAU/USD:
 * 1 Standard Lot Gold = 100 troy oz
 * $1.00 move in Gold = 10 pips (1 pip = $0.10 price difference)
 * Pip Value per 1.00 Lot = $10.00 USD
 */
export function calculateGoldPositionSize(
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number
) {
  const maxRiskUsd = (accountBalance * riskPercent) / 100;
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const pips = Math.max(1, Number((priceDistance * 10).toFixed(1))); // 1 pip = $0.10 move
  
  // Lot calculation: Lot = MaxRisk / (Pips * 10)
  // For example: $100 risk with 20 pips SL ($2.00 move): Lot = 100 / (20 * 10) = 0.50 Lot
  let recommendedLot = maxRiskUsd / (pips * 10);
  recommendedLot = Math.max(0.01, Number(recommendedLot.toFixed(2)));

  const tpPriceDistance = Math.abs(takeProfitPrice - entryPrice);
  const tpPips = Number((tpPriceDistance * 10).toFixed(1));
  const potentialProfitUsd = Number((recommendedLot * tpPips * 10).toFixed(2));

  const riskRewardRatio = priceDistance > 0 ? Number((tpPriceDistance / priceDistance).toFixed(2)) : 0;

  return {
    maxRiskUsd: Number(maxRiskUsd.toFixed(2)),
    stopLossPips: pips,
    takeProfitPips: tpPips,
    recommendedLot,
    potentialProfitUsd,
    riskRewardRatio,
    isValidRR: riskRewardRatio >= 2.0, // Minimum 1:2 strict requirement
  };
}

/**
 * Computes Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  if (!candles || candles.length === 0) return [];
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return result;

  // Simple average for initial seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  result[period - 1] = Number(prevEma.toFixed(2));

  for (let i = period; i < candles.length; i++) {
    const currentEma = candles[i].close * k + prevEma * (1 - k);
    result[i] = Number(currentEma.toFixed(2));
    prevEma = currentEma;
  }

  return result;
}
