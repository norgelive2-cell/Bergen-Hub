'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Cpu, Globe, Shield } from 'lucide-react';

type Status = 'idle' | 'thinking' | 'responding';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

function IntegratedEngine({ status = 'idle' }: { status?: Status }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef<Status>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let particles: Particle[] = [];
    const gridSize = 86;

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

    const draw = () => {
      ctx.fillStyle = 'rgb(1, 2, 4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mode = statusRef.current;
      const isThinking = mode === 'thinking';
      const isResponding = mode === 'responding';
      const intensity = isThinking ? 0.4 : isResponding ? 0.8 : 0.15;

      ctx.strokeStyle = `rgba(0, 112, 243, ${intensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }

      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }

      ctx.stroke();

      particles.forEach((p, i) => {
        const speedMultiplier = isResponding ? 4 : isThinking ? 0.5 : 1;

        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isResponding
          ? 'rgba(0, 255, 180, 0.5)'
          : 'rgba(0, 112, 243, 0.4)';
        ctx.fill();

        if (isResponding || isThinking) {
          for (let j = i + 1; j < particles.length; j += 8) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(0, 112, 243, ${(1 - dist / 150) * 0.15})`;
              ctx.stroke();
            }
          }
        }
      });

      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCommand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();

    setInput('');
    setStatus('thinking');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: '' },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) {
        throw new Error('Link Severed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      setStatus('responding');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullText,
          };
          return updated;
        });
      }

      fullText += decoder.decode();
    } catch (error) {
      console.error(error);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'CRITICAL ERROR: Neural Link Timeout. Sjekk API-konfigurasjon.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setStatus('idle');
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#010204] p-4 text-white md:p-8">
      <IntegratedEngine status={status} />

      <div className="z-10 w-full max-w-2xl space-y-8">
        <header className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 text-[8px] font-mono uppercase tracking-[0.5em] text-blue-500/50"
          >
            <span className="flex items-center gap-1">
              <Globe size={10} />
              Global_Edge
            </span>
            <span className="flex items-center gap-1">
              <Shield size={10} />
              Encrypted
            </span>
          </motion.div>

          <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(0,112,243,0.4)] md:text-8xl">
            Ray.Core
          </h1>

          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        </header>

        <div className="relative flex h-[480px] flex-col rounded-[40px] border border-white/5 bg-white/[0.01] p-6 backdrop-blur-3xl md:p-10">
          <div
            ref={scrollRef}
            className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center space-y-4 opacity-20">
                <div className="animate-pulse rounded-full border border-blue-500/20 bg-blue-500/10 p-4">
                  <Cpu size={40} className="text-blue-400" />
                </div>
                <p className="text-[10px] font-mono uppercase tracking-[0.5em]">
                  System_Ready // Awaiting_Link
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl border p-5 font-mono text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'border-blue-500/20 bg-blue-600/10 text-blue-100'
                      : 'border-white/5 bg-white/[0.03] text-white/70'
                  }`}
                >
                  <span className="mb-2 block text-[8px] uppercase opacity-30">
                    {m.role}
                  </span>
                  {m.content || <span className="animate-pulse">...</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <form onSubmit={handleCommand} className="group relative">
          <div className="absolute inset-0 bg-blue-600/5 blur-3xl transition-all group-focus-within:bg-blue-600/15" />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? 'Streaming neural tokens...'
                : 'Send kommando til Bergen Hub...'
            }
            className="relative z-10 w-full rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-7 font-mono text-sm outline-none backdrop-blur-xl transition-all focus:border-blue-500/50"
          />

          <button
            type="submit"
            disabled={isStreaming}
            className="absolute right-8 top-1/2 z-20 -translate-y-1/2 text-blue-500 transition-all hover:text-white disabled:opacity-0"
          >
            <ChevronRight size={32} />
          </button>
        </form>

        <footer className="flex justify-between px-8 font-mono text-[8px] uppercase tracking-[0.4em] opacity-20">
          <span>Node: Bergen_Hub_01</span>
          <span className="text-blue-400">Status: {status}</span>
          <span>© 2024 Ray.ai.art</span>
        </footer>
      </div>
    </main>
  );
}
