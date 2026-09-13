import React from 'react';
import { Shield, Lock, ExternalLink } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="w-full mt-20 border-t border-white/10 bg-dark-950/80 backdrop-blur-xl py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyber-violet/20 border border-cyber-violet/40 flex items-center justify-center text-cyber-violet">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-white tracking-wider">VOXGUARD AI</span>
            <p className="text-[11px] text-slate-400">"Hear a voice. Verify its authenticity."</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <button onClick={() => setActiveTab('analyze')} className="hover:text-white transition-colors">
            Audio Scanner
          </button>
          <button onClick={() => setActiveTab('record')} className="hover:text-white transition-colors">
            Live Mic
          </button>
          <button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition-colors">
            Security Intelligence
          </button>
          <button onClick={() => setActiveTab('tech')} className="hover:text-white transition-colors">
            Architecture
          </button>
          <button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors">
            Responsible AI
          </button>
        </div>

        {/* Legal & Hackathon Disclaimer */}
        <div className="text-center md:text-right text-[11px] text-slate-500 font-mono">
          <p>© 2026 VOXGUARD AI. Built for Voice Authenticity & Security.</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Probabilistic AI decision support • Not judicial proof</p>
        </div>

      </div>
    </footer>
  );
}
