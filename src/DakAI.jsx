import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export default function DakAI({ account, balanceA, symbolA, setAmountA }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([
    { role: 'ai', text: 'Yo! DAK AI di sini. Mau swap atau staking apa kita hari ini? 🚀' }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const askGemini = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    setInput('');
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const prompt = `
        Kamu adalah DAK AI, asisten trading gaul di DAK DEX.
        INFO USER: Wallet=${account || 'Not Connected'}, Balance=${balanceA} ${symbolA}.
        TUGAS: Jawab dengan gaya asik dan singkat. 
        PERINTAH KHUSUS: Jika user ingin melakukan swap, deteksi jumlahnya dan akhiri jawabanmu dengan kode: [COMMAND:SWAP:ANGKA].
        Contoh: "Oke bos, 0.5 X1T siap! [COMMAND:SWAP:0.5]"
        User Chat: "${userMsg}"
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      let aiText = data.candidates[0].content.parts[0].text;

      // Logika otomatis mengisi input di App.jsx
      if (aiText.includes("[COMMAND:SWAP:")) {
        const match = aiText.match(/\[COMMAND:SWAP:([\d.]+)\]/);
        if (match) {
          setAmountA(match[1]); // Mengisi state amountA di App.jsx
          aiText = aiText.replace(/\[COMMAND:SWAP:[\d.]+\]/, " (Gue bantu input angkanya ke form ya, tinggal klik SWAP!)");
        }
      }
      setHistory(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'ai', text: "Lagi overload nih, sikat manual dulu aja!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-110 transition-all">
          <MessageSquare size={28} />
        </button>
      ) : (
        <div className="w-80 h-[450px] bg-[#0a1814] border border-emerald-500/30 rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-emerald-500 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-black animate-pulse" />
              <span className="text-black font-black text-xs tracking-widest">DAK AI AGENT</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black/70 hover:text-black"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[11px] font-mono">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/20' : 'bg-black/60 text-emerald-400 border border-emerald-900/50'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-emerald-900 text-[10px] animate-pulse">AI is thinking...</div>}
            <div ref={scrollRef}></div>
          </div>
          <div className="p-4 flex gap-2 border-t border-emerald-900/30 bg-black/20">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && askGemini()}
              placeholder="Tuker berapa X1T?..." 
              className="flex-1 bg-transparent outline-none text-xs text-emerald-100 placeholder:text-emerald-900" 
            />
            <button onClick={askGemini} className="text-emerald-500 hover:text-emerald-300 transition-colors"><Send size={20}/></button>
          </div>
        </div>
      )}
    </div>
  );
}