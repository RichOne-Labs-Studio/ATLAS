export const DEFAULT_PYTHON_BRIDGE_SCRIPT = `#!/usr/bin/env python3
"""
=============================================================================
ATLAS (AI Trading and Live Analysis System) - MetaTrader 5 (MT5) Python Bridge
Pasangan Fokus: XAU/USD (Gold / Emas Spot)
=============================================================================

Persyaratan Sistem:
1. Sistem Operasi: Windows 10/11 dengan MetaTrader 5 terpasang dan login.
2. Python 3.8+ (64-bit disarankan, sesuai bitness MT5).
3. Instalasi library:
   pip install MetaTrader5 requests colorama

Cara Menjalankan:
   python xauusd_mt5_bridge.py
=============================================================================
"""

import sys
import time
import argparse
from datetime import datetime
import requests

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    GREEN = Fore.GREEN
    GOLD = Fore.YELLOW
    CYAN = Fore.CYAN
    RED = Fore.RED
    WHITE = Fore.WHITE
    RESET = Style.RESET_ALL
except ImportError:
    GREEN = GOLD = CYAN = RED = WHITE = RESET = ""

DEFAULT_WEB_APP_URL = "https://ais-dev-st6x7cc53u7mtw2trcgs75-82296723781.asia-southeast1.run.app"

SYMBOL_CANDIDATES = [
    "XAUUSD", "GOLD", "XAUUSDm", "XAUUSD.m", "XAUUSD_i", 
    "XAUUSDraw", "XAUUSD.raw", "XAUUSD.a", "XAUUSD+", "XAUUSDpro"
]

def parse_arguments():
    parser = argparse.ArgumentParser(description="ATLAS XAU/USD MT5 Realtime Python Bridge")
    parser.add_argument(
        "--url", 
        type=str, 
        default=DEFAULT_WEB_APP_URL, 
        help="URL aplikasi web ATLAS (contoh: http://localhost:3000)"
    )
    return parser.parse_args()

def find_gold_symbol():
    if not MT5_AVAILABLE:
        return "XAUUSD"
    symbols = mt5.symbols_get()
    if not symbols:
        return "XAUUSD"
    available_names = [s.name for s in symbols]
    for candidate in SYMBOL_CANDIDATES:
        if candidate in available_names:
            mt5.symbol_select(candidate, True)
            return candidate
    for s in available_names:
        upper_s = s.upper()
        if "XAU" in upper_s or "GOLD" in upper_s:
            mt5.symbol_select(s, True)
            return s
    return "XAUUSD"

def get_rates_for_timeframe(symbol, mt5_timeframe, count=120):
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
    args = parse_arguments()
    web_app_url = args.url.rstrip("/")
    sync_endpoint = f"{web_app_url}/api/mt5/sync"
    tick_endpoint = f"{web_app_url}/api/mt5/tick"

    print(f"\\n{GOLD}====================================================================={RESET}")
    print(f"{GOLD}        ATLAS - AI Trading and Live Analysis System                 {RESET}")
    print(f"{GOLD}        MetaTrader 5 (MT5) Realtime Python Bridge [XAU/USD]          {RESET}")
    print(f"{GOLD}====================================================================={RESET}")
    print(f"{CYAN}[TARGET SERVER]{RESET} : {WHITE}{web_app_url}{RESET}")

    if not MT5_AVAILABLE:
        print(f"\\n{RED}[ERROR] Library 'MetaTrader5' belum terpasang di Python Anda.{RESET}")
        print(f"{GOLD}Silakan jalankan di Command Prompt / Terminal:{RESET}")
        print(f"    pip install MetaTrader5 requests colorama\\n")
        input("Tekan Enter untuk keluar...")
        sys.exit(1)

    print(f"{CYAN}[1/3] Menginisialisasi koneksi MetaTrader 5 terminal...{RESET}")
    if not mt5.initialize():
        print(f"{RED}[ERROR] Gagal menginisialisasi MT5. Error:{RESET}", mt5.last_error())
        print(f"{GOLD}Tips:{RESET} Pastikan MT5 sudah dibuka di Windows dan akun sudah login.")
        input("Tekan Enter untuk keluar...")
        sys.exit(1)

    account_info = mt5.account_info()
    if account_info is None:
        print(f"{RED}[ERROR] Tidak dapat membaca akun MT5.{RESET}")
        mt5.shutdown()
        sys.exit(1)

    print(f"{GREEN}[2/3] Berhasil Terhubung ke Akun MT5!{RESET}")
    print(f"      • Akun Login  : {WHITE}{account_info.login}{RESET}")
    print(f"      • Broker / PT : {WHITE}{account_info.company}{RESET}")
    print(f"      • Server      : {WHITE}{account_info.server}{RESET}")
    print(f"      • Saldo / Eq  : {GOLD}\${account_info.balance:,.2f} / \${account_info.equity:,.2f} {account_info.currency}{RESET}")

    gold_symbol = find_gold_symbol()
    sym_info = mt5.symbol_info(gold_symbol)
    point_val = sym_info.point if (sym_info and sym_info.point) else 0.01

    print(f"{GREEN}[3/3] Simbol Emas Terdeteksi:{RESET} {GOLD}{gold_symbol}{RESET}")
    print(f"{CYAN}Mulai sinkronisasi data realtime ke ATLAS Web Terminal...{RESET}")

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
            tick = mt5.symbol_info_tick(gold_symbol)
            if tick is None:
                time.sleep(1)
                continue

            bid = float(tick.bid)
            ask = float(tick.ask)
            spread_points = int(round((ask - bid) / point_val))
            spread_pips = spread_points / 10.0

            is_full_sync = (now_ts - last_full_sync) >= 5 or cycle == 1

            if is_full_sync:
                candles_data = {}
                for tf_name, tf_const in tf_map.items():
                    candles_data[tf_name] = get_rates_for_timeframe(gold_symbol, tf_const, count=120)

                payload = {
                    "account": {
                        "broker": str(account_info.company),
                        "login": account_info.login,
                        "server": str(account_info.server),
                        "balance": float(account_info.balance),
                        "equity": float(account_info.equity),
                        "margin": float(account_info.margin),
                        "freeMargin": float(account_info.margin_free),
                        "currency": str(account_info.currency),
                        "leverage": int(account_info.leverage)
                    },
                    "symbol": {
                        "symbol": gold_symbol,
                        "bid": bid,
                        "ask": ask,
                        "spread": spread_points,
                        "digits": sym_info.digits if sym_info else 2,
                        "point": point_val,
                        "time": int(tick.time)
                    },
                    "candles": candles_data,
                    "timeframe": "H1"
                }

                try:
                    res = requests.post(sync_endpoint, json=payload, timeout=4)
                    if res.status_code == 200:
                        timestamp_str = datetime.now().strftime('%H:%M:%S')
                        print(f"[{timestamp_str}] {GREEN}[SYNC SUKSES]{RESET} {gold_symbol} Bid: {GOLD}\${bid:.2f}{RESET} | Ask: \${ask:.2f} | Spread: {spread_pips:.1f} pips | 7 TF Synced.")
                    else:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}[SYNC HTTP {res.status_code}]{RESET} {res.text[:100]}")
                except Exception as e:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}[SYNC GAGAL]{RESET} Tidak dapat menjangkau server web: {e}")

                last_full_sync = now_ts
            else:
                try:
                    requests.post(tick_endpoint, json={
                        "bid": bid,
                        "ask": ask,
                        "spread": spread_points,
                        "time": int(tick.time)
                    }, timeout=2)
                except Exception:
                    pass

            time.sleep(1)

    except KeyboardInterrupt:
        print(f"\\n{GOLD}[INFO] Mematikan koneksi MT5 Python Bridge...{RESET}")
    finally:
        mt5.shutdown()
        print(f"{GREEN}[INFO] Selesai dengan aman.{RESET}")

if __name__ == "__main__":
    main()
`;
