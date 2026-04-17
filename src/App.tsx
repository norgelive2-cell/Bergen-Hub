'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Database, ChevronRight, Cpu, Terminal, Globe, Shield } from 'lucide-react';

/**
 * RAY.AI.ART - BERGEN HUB: PRODUCTION READY v3.0
 * Arkitektur: Unified Interface med Neural Sync & Canvas Grid
 */

// --- DYNAMISK GRID & PARTIKKEL MOTOR ---
const IntegratedEngine = ({ status = 'idle' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: any[] = [];
    const gridSize = 86; // Blueprint Seksjon 2

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
      }));
    };

    const draw = (time: number) => {
      ctx.fillStyle = 'rgb(1, 2, 4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const mode = String(statusRef.current).toLowerCase();
      const isThinking = mode === 'thinking';
      const isResponding = mode === 'responding';
      const intensity = isThinking ? 0.4 : isResponding ? 0.8 : 0.15;

      // 1. TEGN GRID (Blueprint Standard)
      ctx.strokeStyle = `rgba(0, 112, 243, ${intensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // 2. TEGN NEVRALE PARTIKLER
      particles.forEach((p, i) => {
        const speedMult = isResponding ? 4 : isThinking ? 0.5 : 1;
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isResponding ? `rgba(0, 255, 180, 0.5)` : `rgba(0, 112, 243, 0.4)`;
        ctx.fill();

        // Linjer mellom noder ved aktivitet
        if (isResponding || isThinking) {
          for (let j = i + 1; j < particles.length; j += 8) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(0, 112, 243, ${(1 - dist/150) * 0.15})`;
              ctx.stroke();
            }
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    draw(0);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
};

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setInput("");
    setStatus("thinking");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: "" }]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error("Link Severed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setStatus("responding");

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = fullText;
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "CRITICAL ERROR: Neural Link Timeout. Sjekk API-konfigurasjon.";
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-[#010204] text-white">
      <IntegratedEngine status={status} />
      
      <div className="w-full max-w-2xl z-10 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col items-center gap-2">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-4 text-[8px] font-mono tracking-[0.5em] text-blue-500/50 uppercase"
          >
            <span className="flex items-center gap-1"><Globe size={10}/> Global_Edge</span>
            <span className="flex items-center gap-1"><Shield size={10}/> Encrypted</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-[0_0_50px_rgba(0,112,243,0.4)]">
            Ray.Core
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        </header>

        {/* Neural Terminal */}
        <div className="bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[40px] h-[480px] flex flex-col p-6 md:p-10 shadow-3xl relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 animate-pulse">
                  <Cpu size={40} className="text-blue-400" />
                </div>
                <p className="text-[10px] font-mono uppercase tracking-[0.5em]">System_Ready // Awaiting_Link</p>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-5 rounded-3xl text-[13px] font-mono leading-relaxed border ${
                  m.role === 'user' 
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-100' 
                    : 'bg-white/[0.03] border-white/5 text-white/70'
                }`}>
                  <span className="text-[8px] uppercase opacity-30 block mb-2">{m.role}</span>
                  {m.content || <span className="animate-pulse">...</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input Interface */}
        <form onSubmit={handleCommand} className="relative group">
          <div className="absolute inset-0 bg-blue-600/5 blur-3xl group-focus-within:bg-blue-600/15 transition-all" />
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? "Streaming neural tokens..." : "Send kommando til Bergen Hub..."}
            className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-7 px-10 outline-none focus:border-blue-500/50 transition-all font-mono text-sm relative z-10 backdrop-blur-xl"
          />
          <button 
            type="submit" disabled={isStreaming}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 hover:text-white transition-all z-20 disabled:opacity-0"
          >
            <ChevronRight size={32} />
          </button>
        </form>

        <footer className="flex justify-between px-8 opacity-20 text-[8px] font-mono uppercase tracking-[0.4em]">
          <span>Node: Bergen_Hub_01</span>
          <span className="text-blue-400">Status: {status}</span>
          <span>© 2024 Ray.ai.art</span>
        </footer>
      </div>
    </main>
  );
}
