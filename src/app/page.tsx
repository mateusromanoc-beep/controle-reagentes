"use client";

import { Box, Beaker, ExternalLink } from "lucide-react";

export default function Portal() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl w-full flex flex-col items-center gap-16 relative z-10">
        
        {/* Floating Logo Area */}
        <div className="animate-float flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150" />
            <img 
              src="/logo.png" 
              alt="Flo Tech Logo" 
              className="w-72 md:w-96 h-auto object-contain brightness-110 drop-shadow-[0_0_30px_rgba(99,102,241,0.4)] relative z-10" 
            />
          </div>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 bg-clip-text text-transparent px-2 text-center leading-tight">
              Controle de Reagentes
            </h1>
            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs md:text-sm">
              Sistema de Gestão & Ciclo de Vida
            </p>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-4">
          <a 
            href="https://swimmingseal-n8n.cloudfy.live/form/4a198632-6a61-494c-afc2-e2cc80e1960e"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] hover:bg-indigo-600/10 hover:border-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all group backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-6 text-left">
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20 group-hover:rotate-6 transition-transform">
                <Box className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Entrada</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Novo Item</p>
              </div>
            </div>
            <ExternalLink className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>

          <a 
            href="https://swimmingseal-n8n.cloudfy.live/form/982c22e6-5697-463f-95a7-2e1a2a32bec1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-between p-8 bg-teal-600/5 border border-teal-500/20 rounded-[2rem] hover:bg-teal-600/10 hover:border-teal-500/40 hover:scale-[1.02] active:scale-95 transition-all group backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-6 text-left">
              <div className="p-4 bg-teal-600 rounded-2xl shadow-xl shadow-teal-600/20 group-hover:-rotate-6 transition-transform">
                <Beaker className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Saída</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Uso / Descarte</p>
              </div>
            </div>
            <ExternalLink className="w-6 h-6 text-teal-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>

        <footer className="mt-12 opacity-30 text-slate-400 text-[10px] font-black tracking-[0.4em] uppercase">
          Powered by Flo Tech Ambient Solutions
        </footer>
      </div>
    </div>
  );
}
