import React from 'react';
import { Cpu, Activity, ShieldCheck, Layers, Eye, Binary, Zap, ArrowDown, Lock } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Audio Ingestion & Preprocessing',
      desc: 'Audio files (WAV, MP3, M4A, FLAC) or live microphone streams are validated, converted to mono, resampled to standard 16,000 Hz, peak-normalized, and trimmed of excessive silence via Voice Activity Detection (VAD).',
      icon: Activity,
      badge: 'Signal Standardization'
    },
    {
      num: '02',
      title: 'Dual-Path Feature Extraction',
      desc: 'The engine extracts a 128-band Log Mel-Spectrogram (capturing harmonic envelopes and frequency smearing) alongside a 52-dimensional statistical acoustic vector (MFCCs, Spectral Centroid, Bandwidth, Zero Crossing Rate, and Pitch/F0 stability).',
      icon: Layers,
      badge: '128 Mel Bins + 52-dim Vectors'
    },
    {
      num: '03',
      title: 'VoxNet Deep Neural Inference',
      desc: 'Our PyTorch VoxNet architecture processes spectrograms through a 4-Block Residual CNN with Squeeze-and-Excitation (SE) attention, fusing them with the acoustic MLP branch to predict synthetic likelihood while avoiding speaker memorization.',
      icon: Cpu,
      badge: 'ResNet-SE + Acoustic MLP'
    },
    {
      num: '04',
      title: 'Explainable AI & Anomaly Sliding Windows',
      desc: 'Audio is analyzed across 1.5-second overlapping sliding windows to detect localized vocoder phase glitches, high-frequency dispersion, and unnatural prosodic cadence, pinpointing exact suspicious time segments.',
      icon: Eye,
      badge: 'Temporal Anomaly Pinpointing'
    },
    {
      num: '05',
      title: 'Calibrated Risk Engine & Scam Defense',
      desc: 'Likelihood scores are mapped into calibrated risk tiers (LOW, MEDIUM, HIGH) with actionable verification steps tailored for emergency impersonation fraud defense.',
      icon: ShieldCheck,
      badge: 'Calibrated Decision Support'
    },
  ];

  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto">
      
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-violet/10 border border-cyber-violet/30 text-cyber-violet text-xs font-mono font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>TECHNICAL ARCHITECTURE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          How VOXGUARD AI Detects Synthetic Speech
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Combining deep residual convolutional networks with acoustic physical descriptors to unmask AI voice cloning artifacts.
        </p>
      </div>

      {/* Step by Step Flow */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.num}
              className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-cyber-violet/40 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyber-violet/20 to-cyber-cyan/20 border border-cyber-violet/30 flex items-center justify-center text-cyber-cyan font-mono font-bold text-lg shrink-0">
                  {step.num}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-cyber-cyan transition-colors">
                      {step.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center text-slate-400 group-hover:text-cyber-violet transition-colors shrink-0">
                <StepIcon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Speaker-Disjoint Research Strategy Card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 bg-gradient-to-r from-dark-900 via-dark-900 to-cyber-violet/10">
        <div className="flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyber-cyan" />
          <h3 className="text-base font-bold text-white font-mono uppercase">
            Speaker-Disjoint Generalization & Anti-Overfitting
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Standard voice classifiers often fail in the wild because they memorize speaker pitch identities rather than neural vocoder signatures. VOXGUARD AI enforces strict <strong>speaker-disjoint dataset partitions</strong> during training and evaluation, compelling the neural network to focus on physical phase discontinuities, high-frequency harmonic smearing, and micro-prosody flattening typical of TTS/VC generators like ElevenLabs, Bark, and HiFi-GAN.
        </p>
      </div>

    </div>
  );
}
