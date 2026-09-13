import React, { useState } from 'react';
import { 
  Shield, Mic, UploadCloud, Sparkles, Activity, FileCheck, Lock, 
  ArrowRight, CheckCircle2, ChevronRight, AlertTriangle, Cpu
} from 'lucide-react';
import Navbar from './components/Navbar';
import AudioUploader from './components/AudioUploader';
import AudioRecorder from './components/AudioRecorder';
import DemoSamples from './components/DemoSamples';
import ResultDashboard from './components/ResultDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import HistoryTable from './components/HistoryTable';
import HowItWorks from './components/HowItWorks';
import AboutPrivacy from './components/AboutPrivacy';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze', 'record', 'dashboard', 'history', 'tech', 'about'
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'record'

  const handleAnalysisComplete = (result) => {
    setActiveAnalysis(result);
  };

  const handleResetScan = () => {
    setActiveAnalysis(null);
  };

  const handleSelectFromHistory = (item) => {
    setActiveAnalysis(item);
    setActiveTab('analyze');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-100 bg-dark-950 font-sans selection:bg-cyber-violet/30 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        
        {/* ANALYZE / SCANNER TAB */}
        {activeTab === 'analyze' && (
          <div className="space-y-10">
            
            {/* If Analysis Result is active, display Result Dashboard */}
            {activeAnalysis ? (
              <ResultDashboard
                analysis={activeAnalysis}
                onResetScan={handleResetScan}
              />
            ) : (
              <>
                {/* Hero Pitch Section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-6">
                  
                  {/* Floating Pill Header */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs text-slate-300 shadow-glow-violet animate-pulse-subtle">
                    <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
                    <span>AI-Powered Voice Authenticity & Deepfake Defense</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                    Hear a voice. <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-cyber-violet via-purple-400 to-cyber-cyan bg-clip-text text-transparent">
                      Verify its authenticity.
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Protect yourself and your organization from AI voice-cloning scams, family emergency fraud, and executive impersonation with deep spectro-acoustic neural analysis.
                  </p>

                  {/* Mode Selector Tabs (Upload vs Microphone) */}
                  <div className="pt-4 flex items-center justify-center gap-3">
                    <div className="glass-panel p-1 rounded-xl flex items-center gap-1 border border-white/10">
                      <button
                        onClick={() => setInputMode('upload')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                          inputMode === 'upload'
                            ? 'bg-gradient-to-r from-cyber-violet to-cyber-purple text-white shadow-glow-violet'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Audio File</span>
                      </button>

                      <button
                        onClick={() => setInputMode('record')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                          inputMode === 'record'
                            ? 'bg-gradient-to-r from-cyber-rose to-cyber-purple text-white shadow-glow-rose'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>Live Mic Recording</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ingestion Component: Uploader or Recorder */}
                <div className="max-w-3xl mx-auto">
                  {inputMode === 'upload' ? (
                    <AudioUploader
                      onAnalysisComplete={handleAnalysisComplete}
                      onLoadingStateChange={setIsLoading}
                    />
                  ) : (
                    <AudioRecorder
                      onAnalysisComplete={handleAnalysisComplete}
                      onLoadingStateChange={setIsLoading}
                    />
                  )}
                </div>

                {/* Preset Benchmark Demo Audio Showcase */}
                <div className="max-w-5xl mx-auto pt-6 border-t border-white/5">
                  <DemoSamples
                    onAnalysisComplete={handleAnalysisComplete}
                    onLoadingStateChange={setIsLoading}
                  />
                </div>

                {/* 3 Core Value Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto pt-6">
                  
                  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-cyber-violet/10 border border-cyber-violet/30 flex items-center justify-center text-cyber-violet">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">128-Band Mel Spectrograms</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Detects neural vocoder phase glitches, high-frequency harmonic smearing, and unnatural formant modulation.
                    </p>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Speaker-Disjoint VoxNet CNN</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Trained to detect synthesis artifacts without memorizing specific speaker identities or pitch characteristics.
                    </p>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30 flex items-center justify-center text-cyber-emerald">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Zero Audio Storage</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Privacy-first architecture: audio files are processed in ephemeral memory and discarded immediately after inference.
                    </p>
                  </div>

                </div>
              </>
            )}

          </div>
        )}

        {/* LIVE MIC TAB */}
        {activeTab === 'record' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Live Microphone Voice Screening</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Record a voice directly from your browser to analyze acoustic harmonics in real time.
              </p>
            </div>

            {activeAnalysis ? (
              <ResultDashboard
                analysis={activeAnalysis}
                onResetScan={handleResetScan}
              />
            ) : (
              <AudioRecorder
                onAnalysisComplete={handleAnalysisComplete}
                onLoadingStateChange={setIsLoading}
              />
            )}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <SecurityDashboard onSelectAnalysis={handleSelectFromHistory} />
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <HistoryTable onSelectAnalysis={handleSelectFromHistory} />
        )}

        {/* HOW IT WORKS TAB */}
        {activeTab === 'tech' && (
          <HowItWorks />
        )}

        {/* ABOUT & PRIVACY TAB */}
        {activeTab === 'about' && (
          <AboutPrivacy />
        )}

      </main>

      {/* Global Footer */}
      <Footer setActiveTab={setActiveTab} />

    </div>
  );
}
