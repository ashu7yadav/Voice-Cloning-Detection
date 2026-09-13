import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Download, RotateCcw, AlertTriangle, 
  CheckCircle2, FileText, ChevronDown, ChevronUp, Copy, Check, Share2, Activity,
  Sliders, ArrowUpRight, Lock, Sparkles
} from 'lucide-react';
import WaveformPlayer from './WaveformPlayer';
import SpectrogramView from './SpectrogramView';
import PDFReportModal from './PDFReportModal';

export default function ResultDashboard({ analysis, onResetScan }) {
  const [showRawMetrics, setShowRawMetrics] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!analysis) return null;

  const isAi = analysis.prediction === 'AI_GENERATED';
  const isHuman = analysis.prediction === 'HUMAN_GENERATED';
  const isUncertain = analysis.prediction === 'UNCERTAIN';

  const syntheticPct = Math.round(analysis.synthetic_likelihood * 100);
  const realPct = Math.round(analysis.real_likelihood * 100);

  const getRiskTheme = () => {
    if (analysis.risk_level === 'HIGH' || isAi) {
      return {
        badgeBg: 'bg-cyber-rose/15 border-cyber-rose/50 text-cyber-rose shadow-glow-rose',
        gradient: 'from-cyber-rose/20 via-pink-900/10 to-transparent',
        accentColor: '#F43F5E',
        icon: ShieldAlert,
        title: 'LIKELY AI-GENERATED',
        statusLabel: 'HIGH RISK THREAT',
      };
    }
    if (analysis.risk_level === 'LOW' || isHuman) {
      return {
        badgeBg: 'bg-cyber-emerald/15 border-cyber-emerald/50 text-cyber-emerald shadow-glow-emerald',
        gradient: 'from-cyber-emerald/20 via-teal-900/10 to-transparent',
        accentColor: '#10B981',
        icon: ShieldCheck,
        title: 'LIKELY HUMAN-GENERATED',
        statusLabel: 'AUTHENTIC SPEECH',
      };
    }
    return {
      badgeBg: 'bg-amber-400/15 border-amber-400/50 text-amber-400',
      gradient: 'from-amber-400/20 via-yellow-900/10 to-transparent',
      accentColor: '#F59E0B',
      icon: HelpCircle,
      title: 'UNCERTAIN / AMBIGUOUS',
      statusLabel: 'MEDIUM RISK',
    };
  };

  const theme = getRiskTheme();
  const RiskIcon = theme.icon;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(analysis.id || 'VOX-ANALYSIS-HASH');
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Metadata Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-white font-mono">{analysis.filename}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                {analysis.source_type?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Duration: <span className="text-slate-200">{analysis.duration_seconds}s</span> • Sample Rate: <span className="text-slate-200">{analysis.sample_rate} Hz</span> • Channels: <span className="text-slate-200">{analysis.channels === 1 ? 'Mono' : 'Stereo'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-pill text-xs text-slate-300 hover:text-white transition-colors"
            title="Copy Analysis Verification ID"
          >
            {copiedHash ? <Check className="w-3.5 h-3.5 text-cyber-emerald" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px]">{analysis.id ? `ID: ${analysis.id.substring(0, 8)}...` : 'Copy ID'}</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-violet to-cyber-cyan text-white text-xs font-semibold shadow-glow-violet hover:opacity-90 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF)</span>
          </button>

          <button
            onClick={onResetScan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-slate-300 hover:text-white text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Scan</span>
          </button>
        </div>
      </div>

      {/* Main Authenticity Verdict Hero Card */}
      <div className={`glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-gradient-to-b ${theme.gradient}`}>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Big Radial Gauge & Confidence */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            
            {/* Styled Semi-Circle Cyber Confidence Gauge */}
            <div className="relative w-52 h-36 sm:w-60 sm:h-40 flex items-center justify-center">
              
              {/* Gauge Background Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="62.8" /* 270 deg arc */
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={theme.accentColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (188.4 * (isAi ? analysis.synthetic_likelihood : isHuman ? analysis.real_likelihood : 0.5))}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Central Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                  {isAi ? `${syntheticPct}%` : isHuman ? `${realPct}%` : `${syntheticPct}%`}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mt-1">
                  {isAi ? 'Synthetic Likelihood' : isHuman ? 'Authenticity Score' : 'Estimated Likelihood'}
                </span>
              </div>
            </div>

            {/* Probability Distribution Slider Bar */}
            <div className="w-full max-w-xs mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyber-emerald font-semibold">HUMAN {realPct}%</span>
                <span className="text-cyber-rose font-semibold">SYNTHETIC {syntheticPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-dark-950 flex overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="bg-cyber-emerald h-full rounded-l-full transition-all duration-700" 
                  style={{ width: `${realPct}%` }}
                ></div>
                <div 
                  className="bg-cyber-rose h-full rounded-r-full transition-all duration-700" 
                  style={{ width: `${syntheticPct}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Right: Verdict Summary & Key Explanations */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Risk Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${theme.badgeBg}`}>
                <RiskIcon className="w-4 h-4" />
                <span>{theme.title}</span>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                RISK LEVEL: <strong className="text-white">{analysis.risk_level}</strong>
              </span>
            </div>

            {/* Headline & Summary */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {analysis.headline}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Key Acoustic Reasons */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Key Detection Indicators:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {analysis.key_reasons?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan mt-1.5 shrink-0"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Acoustic Explainability Signals Matrix */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyber-cyan" />
            <h4 className="text-sm font-semibold text-white font-mono uppercase">
              Explainable AI — Acoustic Signal Diagnostics
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">0 - 100 Scale</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Signal 1: Spectral Consistency */}
          <div className="bg-dark-900/70 rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">Spectral Consistency</span>
              <span className="text-cyber-cyan font-bold">{analysis.signals?.spectral_consistency || 80}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyber-cyan rounded-full"
                style={{ width: `${analysis.signals?.spectral_consistency || 80}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Measures high-frequency envelope continuity and harmonic stability.
            </p>
          </div>

          {/* Signal 2: Prosody Consistency */}
          <div className="bg-dark-900/70 rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">Prosody Naturalness</span>
              <span className="text-cyber-violet font-bold">{analysis.signals?.prosody_consistency || 75}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyber-violet rounded-full"
                style={{ width: `${analysis.signals?.prosody_consistency || 75}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Evaluates conversational cadence, breath pauses, and speech rhythm.
            </p>
          </div>

          {/* Signal 3: Pitch (F0) Dynamics */}
          <div className="bg-dark-900/70 rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">Pitch (F0) Dynamics</span>
              <span className="text-pink-400 font-bold">{analysis.signals?.pitch_variation || 70}%</span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                style={{ width: `${analysis.signals?.pitch_variation || 70}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Detects robotic flatlines or synthetic pitch micro-tremors.
            </p>
          </div>

          {/* Signal 4: Synthetic Artifact Score */}
          <div className="bg-dark-900/70 rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">Vocoder Artifacts</span>
              <span className={`font-bold ${analysis.signals?.artifact_score > 50 ? 'text-cyber-rose' : 'text-cyber-emerald'}`}>
                {analysis.signals?.artifact_score || 15}%
              </span>
            </div>
            <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${analysis.signals?.artifact_score > 50 ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                style={{ width: `${analysis.signals?.artifact_score || 15}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Quantifies neural vocoder phase glitches and reconstruction noise.
            </p>
          </div>

        </div>

      </div>

      {/* Suspicious Timestamp Anomalies (If Found) */}
      {analysis.anomalies && analysis.anomalies.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-cyber-rose/30 space-y-3 bg-cyber-rose/5">
          <div className="flex items-center gap-2 text-cyber-rose">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
              Detected Suspicious Temporal Segments ({analysis.anomalies.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {analysis.anomalies.map((anom, idx) => (
              <div key={idx} className="bg-dark-950/70 p-3 rounded-xl border border-cyber-rose/30 flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-cyber-rose/20 text-cyber-rose font-mono text-[11px] font-bold shrink-0">
                  {anom.start_time}s - {anom.end_time}s
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Severity: {anom.severity}</span>
                    <span className="text-[10px] font-mono text-slate-400">Score: {anom.score}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{anom.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waveform & Spectrogram Visualizer Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaveformPlayer
          audioUrl={analysis.localAudioUrl}
          waveformData={analysis.waveform_preview}
          duration={analysis.duration_seconds}
          anomalies={analysis.anomalies || []}
        />
        <SpectrogramView
          spectrogramData={analysis.spectrogram_preview}
          duration={analysis.duration_seconds}
          anomalies={analysis.anomalies || []}
        />
      </div>

      {/* Actionable Security Recommendations */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyber-violet" />
          <h4 className="text-sm font-semibold text-white font-mono uppercase">
            Recommended Security Actions & Fraud Defense
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysis.recommendations?.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-dark-900/60 p-3.5 rounded-xl border border-white/5">
              <span className="w-5 h-5 rounded-full bg-cyber-violet/20 border border-cyber-violet/40 text-cyber-violet text-[11px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>

        {/* Responsible AI Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p>
            <strong>Responsible AI Notice:</strong> VOXGUARD AI is an AI-assisted screening decision-support layer. It provides statistical likelihood estimates and acoustic anomaly indicators; results should not be treated as standalone legal proof or judicial forensic certainty.
          </p>
        </div>
      </div>

      {/* Raw Acoustic Telemetry Accordion */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10">
        <button
          onClick={() => setShowRawMetrics(!showRawMetrics)}
          className="w-full flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Raw Acoustic Telemetry & PyTorch Descriptors</span>
          </span>
          {showRawMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRawMetrics && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <pre className="text-[11px] font-mono bg-dark-950 p-4 rounded-xl text-emerald-400 overflow-x-auto border border-white/5">
              {JSON.stringify(
                {
                  analysis_id: analysis.id,
                  filename: analysis.filename,
                  duration: `${analysis.duration_seconds}s`,
                  model_architecture: "VoxNet-2D Spectro-Acoustic CNN",
                  synthetic_probability: analysis.synthetic_likelihood,
                  real_probability: analysis.real_likelihood,
                  risk_level: analysis.risk_level,
                  acoustic_metrics: analysis.acoustic_metrics,
                  signals: analysis.signals,
                  anomalies_count: analysis.anomalies?.length || 0
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* PDF Export Modal */}
      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        analysis={analysis}
      />

    </div>
  );
}
