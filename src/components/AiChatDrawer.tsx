import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  Flame, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ChatMessage, MT5State } from '../types/trading';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mt5State: MT5State | null;
  currentTimeframe: string;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  mt5State,
  currentTimeframe,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo Trader! Saya ATLAS (AI Trading and Live Analysis System), asisten trading dan analisis realtime khusus XAU/USD Anda. Saya menganalisis market menggunakan rasio Fibonacci Retracement, Golden Pocket (0.618 - 0.786), Extension, konfluensi indikator pendukung, dan manajemen risiko disiplin. Ada yang ingin Anda diskusikan tentang grafik Gold saat ini?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Evaluasi Golden Pocket H1 sekarang',
    'Berapa lot aman untuk $10,000 risk 1%?',
    'Cek konfluensi & level invalidation',
    'Tips disiplin menunggu candle close',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentPrice: mt5State?.symbol.bid || 2748.5,
          timeframe: currentTimeframe,
          accountBalance: mt5State?.account.balance || 10000,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Gagal menerima respon AI');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Maaf, terjadi kendala saat menganalisis: ${err.message}. Pastikan koneksi internet stabil.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-amber-500/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>ATLAS Advisor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400">AI Trading and Live Analysis System • XAU/USD</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 border border-amber-500/30 text-amber-400'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl p-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-slate-950 rounded-tr-none font-medium'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none leading-relaxed'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <span
                className={`block text-[9px] mt-1.5 text-right font-mono ${
                  msg.role === 'user' ? 'text-slate-800' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-slate-400 italic">
              ATLAS sedang menganalisis data XAU/USD...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-700 transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Tanyakan analisis teknikal XAU/USD..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
