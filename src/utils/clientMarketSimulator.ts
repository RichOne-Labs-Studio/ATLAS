import { MT5State, Candle, Timeframe } from '../types/trading';

const TIMEFRAME_STEPS: Record<string, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
};

let cachedCandles: Record<string, Candle[]> = {};
let lastSimBid = 2748.65;

export function generateClientMarketCandles(tf: Timeframe): Candle[] {
  if (cachedCandles[tf] && cachedCandles[tf].length > 0) {
    // Tick update latest candle
    const list = [...cachedCandles[tf]];
    const last = { ...list[list.length - 1] };
    const delta = (Math.random() - 0.49) * 0.4;
    lastSimBid = Number((Math.max(2600, Math.min(2900, lastSimBid + delta))).toFixed(2));
    last.close = lastSimBid;
    last.high = Math.max(last.high, lastSimBid);
    last.low = Math.min(last.low, lastSimBid);
    list[list.length - 1] = last;
    cachedCandles[tf] = list;
    return list;
  }

  const step = TIMEFRAME_STEPS[tf] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const count = 120;
  const candles: Candle[] = [];
  let basePrice = 2715.0;

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const volatility = tf === 'M1' ? 0.8 : tf === 'M5' ? 1.5 : tf === 'M15' ? 2.8 : tf === 'H1' ? 6.5 : tf === 'H4' ? 14.0 : 25.0;
    const wave = Math.sin(i / 12) * (volatility * 2.5) + Math.cos(i / 28) * (volatility * 4);
    const noise = (Math.random() - 0.45) * volatility;
    
    const open = Number(basePrice.toFixed(2));
    const delta = wave * 0.15 + noise;
    const close = Number((open + delta).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (volatility * 0.75)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (volatility * 0.75)).toFixed(2));
    const volume = Math.floor(150 + Math.random() * 850);

    candles.push({ time, open, high, low, close, volume });
    basePrice = close;
  }

  cachedCandles[tf] = candles;
  lastSimBid = candles[candles.length - 1].close;
  return candles;
}

export function getClientSimulatedState(tf: Timeframe): MT5State {
  const candles = generateClientMarketCandles(tf);
  const bid = lastSimBid;
  const ask = Number((bid + 0.20).toFixed(2));

  return {
    connected: false,
    isSimulated: true,
    lastSync: Math.floor(Date.now() / 1000),
    timeframe: tf,
    serverTime: new Date().toISOString(),
    symbol: {
      symbol: 'XAUUSD',
      bid,
      ask,
      spread: 20,
      digits: 2,
      point: 0.01,
      time: Math.floor(Date.now() / 1000),
      high24h: 2758.4,
      low24h: 2732.1,
      change24h: 0.62,
    },
    account: {
      broker: 'GitHub Pages Demo Mode',
      login: 88920194,
      server: 'ATLAS-ClientEngine',
      balance: 10000.0,
      equity: 10000.0,
      margin: 0.0,
      freeMargin: 10000.0,
      currency: 'USD',
      leverage: 100,
    },
    candles,
  };
}
