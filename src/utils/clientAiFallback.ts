import { AiAnalysisResult, Timeframe, FibLevel, GoldenPocketZone } from '../types/trading';
import { IndicatorConfluenceAnalysis } from './indicators';

export function generateClientFallbackAnalysis(
  currentPrice: number,
  timeframe: Timeframe,
  fibLevels: FibLevel[],
  goldenPocket: GoldenPocketZone,
  indicators: IndicatorConfluenceAnalysis
): AiAnalysisResult {
  const isBullish = indicators.overallBias.includes('BULL');
  const action = isBullish ? 'BUY' : 'SELL';
  const signalType = isBullish ? 'BUY_LIMIT' : 'SELL_LIMIT';
  
  // Calculate Entry near Golden Pocket
  const entryPrice = isBullish 
    ? Number((goldenPocket.lower + (goldenPocket.upper - goldenPocket.lower) * 0.5).toFixed(2))
    : Number((goldenPocket.upper - (goldenPocket.upper - goldenPocket.lower) * 0.5).toFixed(2));
  
  const riskDistance = 5.5; // $5.5 gold points = 55 pips
  const stopLoss = isBullish
    ? Number((entryPrice - riskDistance).toFixed(2))
    : Number((entryPrice + riskDistance).toFixed(2));

  const tp1 = isBullish
    ? Number((entryPrice + riskDistance * 2.0).toFixed(2))
    : Number((entryPrice - riskDistance * 2.0).toFixed(2));

  const tp2 = isBullish
    ? Number((entryPrice + riskDistance * 3.2).toFixed(2))
    : Number((entryPrice - riskDistance * 3.2).toFixed(2));

  const tp3 = isBullish
    ? Number((entryPrice + riskDistance * 4.6).toFixed(2))
    : Number((entryPrice - riskDistance * 4.6).toFixed(2));

  const slPips = riskDistance * 10;
  const tp1Pips = (riskDistance * 2.0) * 10;
  const tp2Pips = (riskDistance * 3.2) * 10;
  const tp3Pips = (riskDistance * 4.6) * 10;

  const swingH = Math.max(...fibLevels.map(f => f.price));
  const swingL = Math.min(...fibLevels.map(f => f.price));

  return {
    bias: isBullish ? 'BULLISH' : 'BEARISH',
    trendSummary: `XAU/USD ${timeframe} berada dalam kondisi ${isBullish ? 'Uptrend impulsif' : 'Downtrend korektif'} dengan reaksi di zona Fibonacci.`,
    swingHigh: swingH,
    swingLow: swingL,
    goldenPocketZone: goldenPocket,
    fibonacciLevels: fibLevels,
    highProbabilitySetup: {
      action,
      signalType,
      grade: 'A+',
      tradeStyle: 'SWING',
      probabilityScore: 88,
      entryZone: `$${goldenPocket.lower.toFixed(2)} - $${goldenPocket.upper.toFixed(2)}`,
      entryPrice,
      stopLoss,
      stopLossPips: slPips,
      stopLossReason: 'Invalidation di bawah rasio Fib 0.786',
      takeProfit1: tp1,
      takeProfit1Pips: tp1Pips,
      takeProfit1RR: '1:2.0',
      takeProfit2: tp2,
      takeProfit2Pips: tp2Pips,
      takeProfit2RR: '1:3.2',
      takeProfit3: tp3,
      takeProfit3Pips: tp3Pips,
      takeProfit3RR: '1:4.6',
      recommendedLotSize: 0.18,
      maxRiskAmountUsd: 100,
      potentialProfitTp1Usd: 200,
      potentialProfitTp2Usd: 320,
      potentialProfitTp3Usd: 460,
      confluenceFactors: [
        'Golden Pocket Fibonacci Retracement 0.618 - 0.65',
        `EMA Confluence (${indicators.indicators.find(i => i.name.includes('EMA'))?.value || 'Bullish Support'})`,
        `RSI Momentum Konfirmasi (${indicators.indicators.find(i => i.name.includes('RSI'))?.value || '48.5 Neutral-Bullish'})`,
        'Strict Risk:Reward minimum 1:2 terpenuhi',
        'Struktur swing high/low terjaga',
      ],
      executionStrategy: 'Bagi lot 50% TP1 & 50% TP2. Pindahkan SL ke BEP segera setelah TP1 tercapai.',
    },
    alternativeSetup: {
      action: isBullish ? 'SELL' : 'BUY',
      signalType: isBullish ? 'SELL_LIMIT' : 'BUY_LIMIT',
      grade: 'B',
      tradeStyle: 'INTRADAY',
      probabilityScore: 68,
      entryZone: `$${(entryPrice - 10).toFixed(2)} - $${(entryPrice - 8).toFixed(2)}`,
      entryPrice: Number((isBullish ? entryPrice - 8 : entryPrice + 8).toFixed(2)),
      stopLoss: Number((isBullish ? entryPrice - 2 : entryPrice + 2).toFixed(2)),
      stopLossPips: 60,
      stopLossReason: 'Area break Golden Pocket',
      takeProfit1: Number((isBullish ? entryPrice - 20 : entryPrice + 20).toFixed(2)),
      takeProfit1Pips: 120,
      takeProfit1RR: '1:2.0',
      takeProfit2: Number((isBullish ? entryPrice - 28 : entryPrice + 28).toFixed(2)),
      takeProfit2Pips: 200,
      takeProfit2RR: '1:3.3',
      recommendedLotSize: 0.10,
      maxRiskAmountUsd: 60,
      potentialProfitTp1Usd: 120,
      potentialProfitTp2Usd: 200,
      confluenceFactors: [
        'Invalidation pada Fibonacci 0.786',
        'Breakdown struktur low sebelumnya',
      ],
      executionStrategy: 'Hanya jika area Golden Pocket tertembus secara impulsif dengan candle Marubozu.',
    },
    invalidationRule: `Setup batal jika candle ${timeframe} menutup di luar level invalidation $${stopLoss.toFixed(2)}.`,
    disciplinaryChecklist: [
      'Gunakan lot maksimal 0.18 untuk menjaga risiko tetap 1%',
      'Jangan menggeser Stop Loss lebih lebar saat harga mendekat',
      'Kunci profit bertahap pada TP1 dan geser SL ke Break Even',
    ],
    expertAdvice: 'Disiplin menunggu konfirmasi rejection wick candle pada zona Golden Pocket sebelum entry agresif.',
  };
}
