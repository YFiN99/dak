import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';

export default function DakAI({ account, balanceA, symbolA, setAmountA }) {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{ role: "ai", text: "DAK AI Agent Aktif. Ada instruksi, bos?" }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function handleChat() {
    if (!msg.trim() || loading) return;
    
    const userMsg = msg;
    setMsg("");
    setLoading(true);
    setChat(prev => [...prev, { role: "user", text: userMsg }]);

    try {
      // Menggunakan URL dari dokumentasi terbaru yang kamu kirim (Gemini 3 Flash)
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent';
      
      const payload = {
        contents: [{
          parts: [{
            text: `Kamu adalah DAK AI, asisten trading DEX. 
            User info: Wallet ${account || 'None'}, Bal: ${balanceA} ${symbolA}.
            Jawab singkat & padat. Jika user minta swap, deteksi angkanya dan sertakan tag [SWAP:ANGKA].
            User: ${userMsg}`
          }]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey // Sesuai dokumentasi terbaru: x-goog-api-key
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      let aiText = data.candidates[0].content.parts[0].text;

      // Handle otomatisasi input swap
      if (aiText.includes("[SWAP:")) {
        const amount = aiText.match(/\[SWAP:([\d.]+)\]/)?.[1];
        if (amount) {
          setAmountA(amount);
          aiText = aiText.replace(/\[SWAP:[\d.]+\]/, " (Gue set inputnya ke " + amount + " ya)");
        }
      }

      setChat(prev => [...prev, { role: "ai", text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setChat(prev => [...prev, { role: "ai", text: "Aduh, API lagi sibuk atau key salah. Coba lagi, bos!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#0a1814]/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-[24px] w-80 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[9999]">
      <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-emerald-500" />
          <h2 className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">DAK AGENT v3</h2>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="h-48 overflow-y-auto text-[11px] mb-3 space-y-3 pr-2 scrollbar-hide font-mono">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.role === "ai" ? "justify-start" : "justify-end"}`}>
            <div className={`p-2 rounded-2xl max-w-[90%] ${c.role === "ai" ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/20" : "bg-white/5 text-gray-400"}`}>
              {c.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-emerald-500/10">
        <input 
          className="bg-transparent outline-none text-[11px] flex-1 px-2"
          placeholder="Type instruction..."
          value={msg} 
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChat()}
        />
        <button onClick={handleChat} disabled={loading} className="bg-emerald-500 p-1.5 rounded-lg text-black hover:bg-emerald-400 transition-all">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}