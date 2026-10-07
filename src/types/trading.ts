export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MT5AccountInfo {
  broker: string;
  login: number | string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  leverage: number;
}

export interface MT5SymbolInfo {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  digits: number;
  point: number;
  time: number;
  high24h: number;
  low24h: number;
  change24h: number;
}

export interface MT5State {
  connected: boolean;
  isSimulated: boolean;
  lastSync: number;
  account: MT5AccountInfo;
  symbol: MT5SymbolInfo;
  timeframe: string;
  candles: Candle[];
  serverTime: string;
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export interface FibLevel {
  ratio: string;
  price: number;
  label: string;
}

export interface GoldenPocketZone {
  upper: number;
  lower: number;
  description: string;
}

export interface HighProbabilitySetup {
  signalType: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_NOW' | 'SELL_NOW' | 'WAIT_PULLBACK' | 'BUY_STOP' | 'SELL_STOP';
  action: 'BUY' | 'SELL' | 'WAIT';
  grade: 'A+' | 'A' | 'B' | 'NO_TRADE';
  probabilityScore: number;
  tradeStyle: 'SWING' | 'INTRADAY' | 'SCALP';
  entryZone: string;
  entryPrice: number;
  stopLoss: number;
  stopLossPips: number;
  stopLossReason?: string;
  takeProfit1: number;
  takeProfit1Pips: number;
  takeProfit1RR: string;
  takeProfit2: number;
  takeProfit2Pips: number;
  takeProfit2RR: string;
  takeProfit3?: number;
  takeProfit3Pips?: number;
  takeProfit3RR?: string;
  recommendedLotSize: number;
  maxRiskAmountUsd: number;
  potentialProfitTp1Usd: number;
  potentialProfitTp2Usd: number;
  potentialProfitTp3Usd?: number;
  confluenceFactors: string[];
  executionStrategy: string;
}

export interface TradeSetupPlan {
  primary: HighProbabilitySetup;
  alternative?: HighProbabilitySetup;
}

export interface AiAnalysisResult {
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  trendSummary: string;
  swingHigh: number;
  swingLow: number;
  goldenPocketZone: GoldenPocketZone;
  fibonacciLevels: FibLevel[];
  highProbabilitySetup: HighProbabilitySetup;
  alternativeSetup?: HighProbabilitySetup;
  invalidationRule: string;
  disciplinaryChecklist: string[];
  expertAdvice: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  targetPrice: number;
  condition: 'CROSS_ABOVE' | 'CROSS_BELOW' | 'CROSS_ANY';
  label: string;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  initialPrice: number;
}

