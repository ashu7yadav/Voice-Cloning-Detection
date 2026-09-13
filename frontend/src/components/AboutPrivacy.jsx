import React from 'react';
import { Shield, Lock, EyeOff, AlertCircle, FileCheck, CheckCircle2, HeartHandshake, Globe } from 'lucide-react';

export default function AboutPrivacy() {
  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto">
      
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-xs font-mono font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>ETHICS & PRIVACY ARCHITECTURE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Privacy-First Cybersecurity & Responsible AI
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Built with uncompromising security safeguards, ephemeral audio memory pipelines, and transparent explainability.
        </p>
      </div>

      {/* 3 Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Ephemeral In-Memory Processing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uploaded and recorded speech audio is processed temporarily in-memory and immediately destroyed following neural feature extraction. Raw audio is never stored permanently.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-violet/10 border border-cyber-violet/30 flex items-center justify-center text-cyber-violet">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero Identity Profiling</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            VOXGUARD AI does not perform biometric voiceprint identification or speaker identity tracking. Our models only analyze vocoder artifacts and acoustic synthesis signatures.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30 flex items-center justify-center text-cyber-emerald">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Auditable & Transparent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Users retain full control over their metadata logs. Scan records can be audited, exported as signed forensic PDFs, or permanently wiped from the database in one click.
          </p>
        </div>

      </div>

      {/* Responsible AI & Real-World Scam Defense */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyber-violet" />
          <h3 className="text-base font-bold text-white font-mono uppercase">
            Real-World Impact: Defending Against Family Voice Scams
          </h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            AI voice-cloning technology has democratized synthetic audio generation. Fraudsters frequently clone 15-second audio snippets of family members from social media or public videos to execute <strong>distress emergency scams</strong> (e.g. <em>"Beta, main hospital mein hoon, turant paise bhejo..."</em>).
          </p>
          <p>
            VOXGUARD AI acts as an accessible, explainable screening defense to help families, enterprises, and cybersecurity teams pause, inspect acoustic signals, and verify the caller through an independent channel before transferring funds or disclosing sensitive information.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-2">
          <span className="text-xs font-mono font-bold text-white uppercase block">
            Forensic Decision-Support Policy:
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            VOXGUARD AI is an AI-assisted screening tool, not an absolute legal verdict. Machine learning outputs are probabilistic likelihood estimates and should always be paired with human verification in critical financial or legal decisions.
          </p>
        </div>
      </div>

    </div>
  );
}
