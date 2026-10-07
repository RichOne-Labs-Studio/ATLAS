import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

// In-Memory Data Store for MT5 Bridge & Simulated Live Market
class MarketDataStore {
  private lastMt5Sync: number = 0;
  private accountInfo: MT5AccountInfo = {
    broker: 'MetaQuotes MT5 Demo',
    login: 88920194,
    server: 'MetaQuotes-Demo',
    balance: 10000.0,
    equity: 10000.0,
    margin: 0.0,
    freeMargin: 10000.0,
    currency: 'USD',
    leverage: 100,
  };
  private symbolInfo: MT5SymbolInfo = {
    symbol: 'XAUUSD',
    bid: 2748.65,
    ask: 2748.85,
    spread: 20, // 20 points / 2.0 pips
    digits: 2,
    point: 0.01,
    time: Math.floor(Date.now() / 1000),
    high24h: 2758.4,
    low24h: 2732.1,
    change24h: 0.62,
  };
  private candlesByTimeframe: Record<string, Candle[]> = {};
  private isLiveSimulated: boolean = true;
  private simInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.generateInitialGoldCandles();
    this.startSimulationEngine();
  }

  private generateInitialGoldCandles() {
    const timeframes: Record<string, number> = {
      M1: 60,
      M5: 300,
      M15: 900,
      M30: 1800,
      H1: 3600,
      H4: 14400,
      D1: 86400,
    };

    const now = Math.floor(Date.now() / 1000);
    const count = 150;

    for (const [tf, step] of Object.entries(timeframes)) {
      const candles: Candle[] = [];
      let basePrice = 2715.0; // Start of recent Gold swing
      let trendBias = 0.6; // Slight bullish bias for gold

      for (let i = count; i >= 0; i--) {
        const time = now - i * step;
        const volatility = tf === 'M1' ? 0.8 : tf === 'M5' ? 1.5 : tf === 'M15' ? 2.8 : tf === 'H1' ? 6.5 : tf === 'H4' ? 14.0 : 25.0;
        
        // Add harmonic cyclical swing for realistic Fibonacci swings
        const wave = Math.sin(i / 12) * (volatility * 2.5) + Math.cos(i / 28) * (volatility * 4);
        const noise = (Math.random() - (0.5 - trendBias * 0.08)) * volatility;
        
        const open = Number((basePrice).toFixed(2));
        const delta = wave * 0.15 + noise;
        const close = Number((open + delta).toFixed(2));
        const high = Number((Math.max(open, close) + Math.random() * (volatility * 0.75)).toFixed(2));
        const low = Number((Math.min(open, close) - Math.random() * (volatility * 0.75)).toFixed(2));
        const volume = Math.floor(150 + Math.random() * 850 * (volatility / 2));

        candles.push({ time, open, high, low, close, volume });
        basePrice = close;
      }

      this.candlesByTimeframe[tf] = candles;
    }

    const latestH1 = this.candlesByTimeframe['H1'][this.candlesByTimeframe['H1'].length - 1];
    if (latestH1) {
      this.symbolInfo.bid = latestH1.close;
      this.symbolInfo.ask = Number((latestH1.close + 0.2).toFixed(2));
      this.symbolInfo.time = latestH1.time;
    }
  }

  private startSimulationEngine() {
    if (this.simInterval) clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      // If MT5 synced in last 10 seconds, don't simulate
      const isMt5Active = Date.now() - this.lastMt5Sync < 10000;
      if (isMt5Active) {
        this.isLiveSimulated = false;
        return;
      }
      this.isLiveSimulated = true;

      // Realistic tick simulation for XAUUSD
      const tickDelta = (Math.random() - 0.495) * 0.35;
      const newBid = Number(Math.max(2600, this.symbolInfo.bid + tickDelta).toFixed(2));
      const spread = 0.2; // typical 20 points
      const newAsk = Number((newBid + spread).toFixed(2));
      const now = Math.floor(Date.now() / 1000);

      this.symbolInfo.bid = newBid;
      this.symbolInfo.ask = newAsk;
      this.symbolInfo.time = now;

      // Update M1 candle
      const m1Candles = this.candlesByTimeframe['M1'];
      if (m1Candles && m1Candles.length > 0) {
        const lastM1 = m1Candles[m1Candles.length - 1];
        const currentM1Bucket = Math.floor(now / 60) * 60;

        if (lastM1.time === currentM1Bucket) {
          lastM1.high = Math.max(lastM1.high, newBid);
          lastM1.low = Math.min(lastM1.low, newBid);
          lastM1.close = newBid;
          lastM1.volume += Math.floor(Math.random() * 3 + 1);
        } else {
          m1Candles.push({
            time: currentM1Bucket,
            open: newBid,
            high: newBid,
            low: newBid,
            close: newBid,
            volume: 1,
          });
          if (m1Candles.length > 300) m1Candles.shift();
        }
      }

      // Update M5, M15, H1 current candle close
      ['M5', 'M15', 'M30', 'H1', 'H4', 'D1'].forEach((tf) => {
        const list = this.candlesByTimeframe[tf];
        if (list && list.length > 0) {
          const last = list[list.length - 1];
          last.high = Math.max(last.high, newBid);
          last.low = Math.min(last.low, newBid);
          last.close = newBid;
        }
      });
    }, 1000);
  }

  public updateFromMT5(data: {
    account?: Partial<MT5AccountInfo>;
    symbol?: Partial<MT5SymbolInfo>;
    candles?: Record<string, Candle[]>;
    timeframe?: string;
  }) {
    this.lastMt5Sync = Date.now();
    this.isLiveSimulated = false;

    if (data.account) {
      this.accountInfo = { ...this.accountInfo, ...data.account };
    }
    if (data.symbol) {
      this.symbolInfo = { ...this.symbolInfo, ...data.symbol };
    }
    if (data.candles) {
      for (const [tf, candleList] of Object.entries(data.candles)) {
        if (Array.isArray(candleList) && candleList.length > 0) {
          this.candlesByTimeframe[tf] = candleList;
        }
      }
    }
  }

  public getState(timeframe: string = 'H1') {
    const isMt5Active = Date.now() - this.lastMt5Sync < 10000;
    const candles = this.candlesByTimeframe[timeframe] || this.candlesByTimeframe['H1'] || [];

    return {
      connected: isMt5Active,
      isSimulated: this.isLiveSimulated,
      lastSync: this.lastMt5Sync,
      account: this.accountInfo,
      symbol: this.symbolInfo,
      timeframe,
      candles,
      serverTime: new Date().toISOString(),
    };
  }
}

const marketStore = new MarketDataStore();

// API Endpoints

// 1. Get current market state & candles
app.get('/api/mt5/state', (req: Request, res: Response) => {
  const tf = (req.query.tf as string) || 'H1';
  res.json(marketStore.getState(tf));
});

// 2. MT5 Python Bridge Data Sync Endpoint
app.post('/api/mt5/sync', (req: Request, res: Response) => {
  try {
    const { account, symbol, candles, timeframe } = req.body;
    marketStore.updateFromMT5({ account, symbol, candles, timeframe });
    res.json({ success: true, message: 'MT5 data synced successfully', timestamp: Date.now() });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Fast MT5 Tick Sync
app.post('/api/mt5/tick', (req: Request, res: Response) => {
  try {
    const { bid, ask, spread, time } = req.body;
    marketStore.updateFromMT5({
      symbol: {
        bid: Number(bid),
        ask: Number(ask),
        spread: Number(spread || (ask - bid) * 100),
        time: time || Math.floor(Date.now() / 1000),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Download / Fetch Python Bridge Script
app.get('/api/mt5/bridge-script', (req: Request, res: Response) => {
  const hostUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const scriptContent = generatePythonBridgeScript(hostUrl);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', 'text/x-python');
    res.setHeader('Content-Disposition', 'attachment; filename="xauusd_mt5_bridge.py"');
    return res.send(scriptContent);
  }

  res.json({
    filename: 'xauusd_mt5_bridge.py',
    hostUrl,
    script: scriptContent,
  });
});

// 5. Server-side Gemini AI: Specialized XAU/USD Technical & Fibonacci Analysis
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const {
      timeframe = 'H1',
      candles = [],
      currentPrice = 2748.5,
      accountBalance = 10000,
      riskPercentage = 1.0,
      swingHigh,
      swingLow,
      fibLevels,
      supportingIndicators,
      userNotes,
    } = req.body;

    // Build context-rich prompt for Gold Fibonacci specialist
    const systemInstruction = `Anda adalah "ATLAS" (AI Trading and Live Analysis System) - Senior Commodity Technical Analyst & Gold (XAU/USD) Trading Specialist.
Karakteristik & Prinsip Analisis Anda:
1. MURNI ANALISIS TEKNIKAL dengan fokus utama pada rasio Fibonacci Retracement (0.236, 0.382, 0.5, 0.618 Golden Pocket, 0.786) dan Fibonacci Extension (1.272, 1.618, 2.0, 2.618).
2. KONFLUENSI INDIKATOR PENDUKUNG: Wajib memvalidasi pantulan Fibonacci dengan indikator pendukung (RSI 14 momentum & divergence, MACD crossover, EMA 50/200 trend alignment, Bollinger Bands, dan ATR volatility filter).
3. Objektif, berbasis data kuantitatif, disiplin eksekusi tanpa emosi.
4. Strict Risk-to-Reward Ratio (RRR minimal 1:2 atau 1:3). Jangan pernah memberikan setup di bawah 1:1.5.
5. Utamakan High-Probability Setups (A+ Confluence: Golden Pocket 0.618-0.786 + Rejection Candle/Pinbar/Engulfing + Support/Resistance + Break of Structure/CHoCH).
6. Selalu hitung manajemen risiko presisi:
   - Jarak Stop Loss dalam pips/points (1 pip Gold = $0.10 atau 10 points)
   - Ukuran Lot yang direkomendasikan berdasarkan Risk % dan Equity/Balance
   - Rumus: Lot Size = (Balance * Risk%) / (SL_pips * 10)
7. Berikan respon terstruktur rapi dalam format JSON bahasa Indonesia.`;

    const recentCandles = candles.slice(-30);
    const prompt = `Analisis grafik realtime XAU/USD saat ini dengan konfluensi multi-indikator:
Timeframe: ${timeframe}
Harga Terkini: $${currentPrice}
Saldo Akun Trader: $${accountBalance}
Toleransi Risiko: ${riskPercentage}% ($${((accountBalance * riskPercentage) / 100).toFixed(2)})
Identifikasi Swing High Terakhir: ${swingHigh ? `$${swingHigh}` : 'Hitung otomatis dari data candle'}
Identifikasi Swing Low Terakhir: ${swingLow ? `$${swingLow}` : 'Hitung otomatis dari data candle'}
Fibonacci Data: ${fibLevels ? JSON.stringify(fibLevels) : 'Auto calculate 0.236, 0.382, 0.5, 0.618, 0.786, 1.272, 1.618'}
Indikator Pendukung Terkini (RSI, MACD, EMA 50/200, ATR, BB): ${supportingIndicators ? JSON.stringify(supportingIndicators) : 'Hitung dari candle data'}
Catatan Tambahan Trader: ${userNotes || 'Tidak ada'}

Data 15 Candlestick Terakhir (Open, High, Low, Close, Vol):
${JSON.stringify(recentCandles.slice(-15), null, 2)}

Mohon berikan analisis lengkap dan keluarkan respon valid JSON dengan struktur:
{
  "bias": "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH",
  "trendSummary": "Ringkasan arah tren saat ini dan struktur market (BOS/CHoCH)",
  "swingHigh": number,
  "swingLow": number,
  "goldenPocketZone": {
    "upper": number,
    "lower": number,
    "description": string
  },
  "fibonacciLevels": [
    { "ratio": "0.000", "price": number, "label": "Swing Low/High" },
    { "ratio": "0.236", "price": number, "label": "Minor Retracement" },
    { "ratio": "0.382", "price": number, "label": "Moderate Retracement" },
    { "ratio": "0.500", "price": number, "label": "Equilibrium / 50%" },
    { "ratio": "0.618", "price": number, "label": "Golden Pocket Retracement" },
    { "ratio": "0.786", "price": number, "label": "Deep OTE Retracement" },
    { "ratio": "1.000", "price": number, "label": "Swing High/Low" },
    { "ratio": "1.272", "price": number, "label": "Target Extension 1" },
    { "ratio": "1.618", "price": number, "label": "Golden Extension Target" }
  ],
  "highProbabilitySetup": {
    "signalType": "BUY_LIMIT" | "SELL_LIMIT" | "BUY_NOW" | "SELL_NOW" | "WAIT_PULLBACK" | "BUY_STOP" | "SELL_STOP",
    "action": "BUY" | "SELL" | "WAIT",
    "grade": "A+" | "A" | "B" | "NO_TRADE",
    "probabilityScore": number, // 0 - 100%
    "tradeStyle": "SWING" | "INTRADAY" | "SCALP",
    "entryZone": string,
    "entryPrice": number,
    "stopLoss": number,
    "stopLossPips": number,
    "stopLossReason": string,
    "takeProfit1": number,
    "takeProfit1Pips": number,
    "takeProfit1RR": string,
    "takeProfit2": number,
    "takeProfit2Pips": number,
    "takeProfit2RR": string,
    "takeProfit3": number,
    "takeProfit3Pips": number,
    "takeProfit3RR": string,
    "recommendedLotSize": number,
    "maxRiskAmountUsd": number,
    "potentialProfitTp1Usd": number,
    "potentialProfitTp2Usd": number,
    "potentialProfitTp3Usd": number,
    "confluenceFactors": string[],
    "executionStrategy": string
  },
  "alternativeSetup": {
    "signalType": "BUY_STOP" | "SELL_STOP" | "BUY_LIMIT" | "SELL_LIMIT",
    "action": "BUY" | "SELL",
    "grade": "A" | "B",
    "probabilityScore": number,
    "tradeStyle": "INTRADAY" | "SCALP",
    "entryZone": string,
    "entryPrice": number,
    "stopLoss": number,
    "stopLossPips": number,
    "stopLossReason": string,
    "takeProfit1": number,
    "takeProfit1Pips": number,
    "takeProfit1RR": string,
    "takeProfit2": number,
    "takeProfit2Pips": number,
    "takeProfit2RR": string,
    "recommendedLotSize": number,
    "maxRiskAmountUsd": number,
    "potentialProfitTp1Usd": number,
    "potentialProfitTp2Usd": number,
    "confluenceFactors": string[],
    "executionStrategy": string
  },
  "invalidationRule": "Kondisi pasti yang membatalkan setup ini (SL hit / candle close break)",
  "disciplinaryChecklist": [
    "Poin 1 konfirmasi yang wajib ditunggu",
    "Poin 2 validasi spread / sesi London-NY",
    "Poin 3 eksekusi disiplin tanpa FOMO"
  ],
  "expertAdvice": "Pesan langsung dari AI Senior Trader untuk psikologi dan eksekusi"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for high objectivity and calculation precision
      },
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    res.json({
      success: true,
      analysis: parsedData,
      analyzedAt: new Date().toISOString(),
      currentPrice,
      timeframe,
    });
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Gagal melakukan analisis AI',
    });
  }
});

// 6. Server-side Gemini AI: Interactive Trading Chatbot
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], currentPrice, timeframe, accountBalance } = req.body;

    const systemInstruction = `Anda adalah "ATLAS" (AI Trading and Live Analysis System), mitra trading profesional trader komoditas XAU/USD (Gold).
Gaya analisis Anda:
- Spesialis Emas XAU/USD.
- Analisis teknikal objektif, rasio Fibonacci (0.382, 0.5, 0.618 Golden Pocket, 0.786, Extension 1.272, 1.618).
- Manajemen risiko ketat (Risk-to-Reward minimal 1:2, pembatasan lot size).
- Bahasa Indonesia yang profesional, tegas, dan membimbing trader tetap disiplin.
- Konteks market terkini: Harga Gold XAU/USD saat ini sekitar $${currentPrice || 2748}, Timeframe: ${timeframe || 'H1'}, Saldo Trader: $${accountBalance || 10000}.`;

    // Format conversation history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      reply: response.text,
    });
  } catch (err: any) {
    console.error('Gemini Chat Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Gagal memproses pesan AI',
    });
  }
});

function generatePythonBridgeScript(appUrl: string): string {
  return `"""
=============================================================================
ATLAS (AI Trading and Live Analysis System) - MetaTrader 5 (MT5) Python Bridge
Pasangan Target: XAU/USD (Gold)
=============================================================================
Panduan Singkat:
1. Pastikan MT5 sudah terinstall & login ke akun broker Anda di Windows.
2. Install library yang dibutuhkan di terminal/cmd:
   pip install MetaTrader5 requests colorama
3. Jalankan script ini:
   python xauusd_mt5_bridge.py
4. Script akan otomatis mendeteksi terminal MT5 aktif, mengambil data tick &
   candlestick M1, M5, M15, M30, H1, H4, D1, lalu mengirimkannya realtime ke ATLAS Web App.
=============================================================================
"""

import sys
import time
from datetime import datetime
import requests

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    print("[WARNING] MetaTrader5 python package not installed.")
    print("Silakan jalankan: pip install MetaTrader5 requests")

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    GREEN = Fore.GREEN
    GOLD = Fore.YELLOW
    CYAN = Fore.CYAN
    RED = Fore.RED
    RESET = Style.RESET_ALL
except ImportError:
    GREEN = GOLD = CYAN = RED = RESET = ""

# Konfigurasi Koneksi ke Web App
WEB_APP_URL = "${appUrl.replace(/\/$/, '')}"
SYNC_ENDPOINT = f"{WEB_APP_URL}/api/mt5/sync"
TICK_ENDPOINT = f"{WEB_APP_URL}/api/mt5/tick"

# Pasangan Simbol Emas (script akan mencoba variasi nama broker jika 'XAUUSD' berbeda)
SYMBOL_CANDIDATES = ["XAUUSD", "GOLD", "XAUUSDm", "XAUUSD.m", "XAUUSD_i", "XAUUSDraw", "XAUUSD.raw", "XAUUSD.a"]

def find_gold_symbol():
    """Mencari simbol emas yang aktif pada broker MT5."""
    if not MT5_AVAILABLE:
        return "XAUUSD"
    
    symbols = mt5.symbols_get()
    if not symbols:
        return "XAUUSD"
        
    available_names = [s.name for s in symbols]
    for candidate in SYMBOL_CANDIDATES:
        if candidate in available_names:
            # Pastikan simbol aktif di Market Watch
            mt5.symbol_select(candidate, True)
            return candidate
            
    # Cari yang mengandung kata XAU atau GOLD
    for s in available_names:
        if "XAU" in s.upper() or "GOLD" in s.upper():
            mt5.symbol_select(s, True)
            return s
            
    return "XAUUSD"

def get_rates_for_timeframe(symbol, mt5_timeframe, count=120):
    """Mengambil data candlestick OHLCV dari MT5."""
    rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
    if rates is None or len(rates) == 0:
        return []
    
    candles = []
    for r in rates:
        candles.append({
            "time": int(r['time']),
            "open": float(r['open']),
            "high": float(r['high']),
            "low": float(r['low']),
            "close": float(r['close']),
            "volume": int(r['tick_volume'])
        })
    return candles

def main():
    print(f"{GOLD}============================================================={RESET}")
    print(f"{GOLD}       AuraGold AI - MT5 Real-time Bridge for XAU/USD        {RESET}")
    print(f"{GOLD}============================================================={RESET}")
    print(f"{CYAN}[TARGET WEB APP]{RESET} : {WEB_APP_URL}")
    
    if not MT5_AVAILABLE:
        print(f"{RED}[ERROR] Library 'MetaTrader5' belum terinstall.{RESET}")
        print("Silakan jalankan di Command Prompt: pip install MetaTrader5 requests")
        input("Tekan Enter untuk keluar...")
        sys.exit(1)

    print(f"{CYAN}[1/3] Menginisialisasi koneksi MetaTrader 5...{RESET}")
    if not mt5.initialize():
        print(f"{RED}[ERROR] Gagal inisialisasi MT5. Kode error:{RESET}", mt5.last_error())
        print("Pastikan aplikasi MetaTrader 5 di Windows sudah dibuka dan login.")
        input("Tekan Enter untuk keluar...")
        sys.exit(1)

    account_info = mt5.account_info()
    if account_info is None:
        print(f"{RED}[ERROR] Tidak dapat membaca info akun MT5.{RESET}")
        mt5.shutdown()
        sys.exit(1)

    print(f"{GREEN}[2/3] Terhubung ke Akun MT5:{RESET}")
    print(f"      - Akun Login : {account_info.login}")
    print(f"      - Broker     : {account_info.company}")
    print(f"      - Server     : {account_info.server}")
    print(f"      - Saldo / Eq : {GOLD}\${account_info.balance:,.2f} / \${account_info.equity:,.2f}{RESET} {account_info.currency}")
    print(f"      - Leverage   : 1:{account_info.leverage}")

    gold_symbol = find_gold_symbol()
    print(f"{GREEN}[3/3] Simbol Emas Terdeteksi:{RESET} {GOLD}{gold_symbol}{RESET}")
    print(f"{CYAN}Mulai streaming data realtime ke AuraGold AI Web App...{RESET}")
    print(f"{GREEN}Tekan CTRL + C untuk berhenti kapan saja.{RESET}\n")

    tf_map = {
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
        "D1": mt5.TIMEFRAME_D1,
    }

    last_full_sync = 0
    cycle = 0

    try:
        while True:
            cycle += 1
            now_ts = time.time()
            
            # Ambil Tick Terkini
            tick = mt5.symbol_info_tick(gold_symbol)
            if tick is None:
                time.sleep(1)
                continue

            bid = float(tick.bid)
            ask = float(tick.ask)
            spread_points = int(round((ask - bid) / (mt5.symbol_info(gold_symbol).point or 0.01)))
            spread_pips = spread_points / 10.0

            # Lakukan full candle sync setiap 5 detik, atau tick cepat setiap 1 detik
            is_full_sync = (now_ts - last_full_sync) >= 5 or cycle == 1

            if is_full_sync:
                candles_data = {}
                for tf_name, tf_const in tf_map.items():
                    candles_data[tf_name] = get_rates_for_timeframe(gold_symbol, tf_const, count=100)

                acc_payload = {
                    "broker": str(account_info.company),
                    "login": account_info.login,
                    "server": str(account_info.server),
                    "balance": float(account_info.balance),
                    "equity": float(account_info.equity),
                    "margin": float(account_info.margin),
                    "freeMargin": float(account_info.margin_free),
                    "currency": str(account_info.currency),
                    "leverage": int(account_info.leverage)
                }

                symbol_payload = {
                    "symbol": gold_symbol,
                    "bid": bid,
                    "ask": ask,
                    "spread": spread_points,
                    "digits": mt5.symbol_info(gold_symbol).digits,
                    "point": mt5.symbol_info(gold_symbol).point,
                    "time": int(tick.time)
                }

                payload = {
                    "account": acc_payload,
                    "symbol": symbol_payload,
                    "candles": candles_data,
                    "timeframe": "H1"
                }

                try:
                    res = requests.post(SYNC_ENDPOINT, json=payload, timeout=4)
                    if res.status_code == 200:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {GREEN}[SYNC OK]{RESET} XAU/USD Bid: {GOLD}\${bid:.2f}{RESET} | Ask: \${ask:.2f} | Spread: {spread_pips:.1f} pips | All Timeframes Synced.")
                    else:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}[SYNC HTTP {res.status_code}]{RESET} {res.text[:80]}")
                except Exception as e:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}[SYNC FAIL]{RESET} Tidak dapat menjangkau server: {e}")

                last_full_sync = now_ts
            else:
                # Fast tick sync
                try:
                    requests.post(TICK_ENDPOINT, json={
                        "bid": bid,
                        "ask": ask,
                        "spread": spread_points,
                        "time": int(tick.time)
                    }, timeout=2)
                except Exception:
                    pass

            time.sleep(1)

    except KeyboardInterrupt:
        print(f"\n{GOLD}[INFO] Mematikan koneksi MT5 Bridge...{RESET}")
    finally:
        mt5.shutdown()
        print(f"{GREEN}[INFO] MT5 Bridge selesai dengan aman.{RESET}")

if __name__ == "__main__":
    main()
`;
}

// Development and Production Handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AuraGold AI Trading Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
