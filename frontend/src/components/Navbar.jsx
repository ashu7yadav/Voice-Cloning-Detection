import React, { useState, useEffect } from 'react';
import { Shield, Activity, Mic, Upload, BarChart3, History, Cpu, FileText, Info } from 'lucide-react';
import api from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err) {
        setHealth({ status: 'offline', device: 'cpu' });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'analyze', label: 'Analyze Audio', icon: Upload },
    { id: 'record', label: 'Live Mic', icon: Mic },
    { id: 'dashboard', label: 'Security Dashboard', icon: BarChart3 },
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'tech', label: 'Under the Hood', icon: Cpu },
    { id: 'about', label: 'About & Privacy', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-xl border border-white/10">
        
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => setActiveTab('analyze')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-violet to-cyber-cyan p-0.5 flex items-center justify-center shadow-glow-violet transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyber-violet group-hover:text-cyber-cyan transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">VOXGUARD</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-violet/20 border border-cyber-violet/40 text-cyber-violet font-mono font-semibold">AI 2.0</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Hear a voice. Verify its authenticity.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-dark-900/60 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyber-violet/20 to-cyber-cyan/20 text-white border border-cyber-violet/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyber-cyan' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* System Health Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health?.status === 'online' ? 'bg-cyber-emerald' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'online' ? 'bg-cyber-emerald' : 'bg-amber-400'}`}></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
              VoxNet {health?.device ? `[${health.device.toUpperCase()}]` : '[READY]'}
            </span>
            <span className="text-cyber-emerald font-semibold text-[11px]">ACTIVE</span>
          </div>

          <button
            onClick={() => setActiveTab('record')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyber-violet to-cyber-purple hover:from-cyber-purple hover:to-cyber-pink text-white text-xs font-semibold shadow-glow-violet transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Scan</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav Row */}
      <div className="flex md:hidden items-center justify-around mt-2 py-2 glass-panel rounded-xl overflow-x-auto gap-1 border border-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] ${
                isActive ? 'text-cyber-cyan font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
