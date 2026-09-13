import React, { useState, useEffect } from 'react';
import { Play, Pause, ShieldCheck, ShieldAlert, HelpCircle, Sparkles, Loader2, Volume2 } from 'lucide-react';
import api from '../services/api';

export default function DemoSamples({ onAnalysisComplete, onLoadingStateChange }) {
  const [samples, setSamples] = useState([]);
  const [activePlayingId, setActivePlayingId] = useState(null);
  const [audioElements, setAudioElements] = useState({});
  const [analyzingSampleId, setAnalyzingSampleId] = useState(null);

  useEffect(() => {
    const loadDemoSamples = async () => {
      try {
        const res = await api.getDemoSamples();
        if (res.status === 'success') {
          setSamples(res.samples);
        }
      } catch (err) {
        // Fallback default samples list
        setSamples([
          {
            id: "demo-human-1",
            title: "Authentic Human Voice",
            filename: "human_authentic_sample.wav",
            audio_url: "/demo-audio/human_authentic_sample.wav",
            expected_category: "HUMAN_GENERATED",
            expected_risk: "LOW",
            description: "Genuine human speech sample with natural formant trajectories and organic room acoustics."
          },
          {
            id: "demo-ai-1",
            title: "AI Voice Clone (ElevenLabs)",
            filename: "ai_cloned_elevenlabs.wav",
            audio_url: "/demo-audio/ai_cloned_elevenlabs.wav",
            expected_category: "AI_GENERATED",
            expected_risk: "HIGH",
            description: "Synthetic voice clone showing vocoder harmonic dispersion and flattened micro-prosody."
          },
          {
            id: "demo-scam-1",
            title: "Hindi Emergency Scam ('Beta, hospital...')",
            filename: "hindi_emergency_scam.wav",
            audio_url: "/demo-audio/hindi_emergency_scam.wav",
            expected_category: "AI_GENERATED",
            expected_risk: "HIGH",
            description: "Simulated India-specific emergency voice impersonation scam targeting family members."
          },
          {
            id: "demo-unc-1",
            title: "Uncertain / Heavy Ambient Noise",
            filename: "uncertain_noisy_recording.wav",
            audio_url: "/demo-audio/uncertain_noisy_recording.wav",
            expected_category: "UNCERTAIN",
            expected_risk: "MEDIUM",
            description: "Ambiguous recording with background traffic noise and codec degradation."
          }
        ]);
      }
    };
    loadDemoSamples();
  }, []);

  const togglePlayAudio = (sample) => {
    if (activePlayingId === sample.id) {
      if (audioElements[sample.id]) {
        audioElements[sample.id].pause();
      }
      setActivePlayingId(null);
    } else {
      // Pause any existing playing audio
      if (activePlayingId && audioElements[activePlayingId]) {
        audioElements[activePlayingId].pause();
      }
      let audio = audioElements[sample.id];
      if (!audio) {
        audio = new Audio(sample.audio_url);
        audio.onended = () => setActivePlayingId(null);
        setAudioElements((prev) => ({ ...prev, [sample.id]: audio }));
      }
      audio.play().catch((e) => console.log('Playback error:', e));
      setActivePlayingId(sample.id);
    }
  };

  const handleRunDemoScan = async (sample) => {
    setAnalyzingSampleId(sample.id);
    onLoadingStateChange && onLoadingStateChange(true);

    try {
      const res = await api.analyzeDemoSample(sample.audio_url, sample.filename);
      if (res.status === 'success' && res.data) {
        onAnalysisComplete({
          ...res.data,
          localAudioUrl: sample.audio_url
        });
      }
    } catch (err) {
      console.error('Demo analysis error:', err);
    } finally {
      setAnalyzingSampleId(null);
      onLoadingStateChange && onLoadingStateChange(false);
    }
  };

  const getBadgeStyle = (category, risk) => {
    if (risk === 'HIGH' || category === 'AI_GENERATED') {
      return {
        bg: 'bg-cyber-rose/10 border-cyber-rose/30 text-cyber-rose',
        icon: ShieldAlert,
        label: 'Synthetic Clone'
      };
    }
    if (risk === 'LOW' || category === 'HUMAN_GENERATED') {
      return {
        bg: 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald',
        icon: ShieldCheck,
        label: 'Authentic Human'
      };
    }
    return {
      bg: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
      icon: HelpCircle,
      label: 'Uncertain Margin'
    };
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyber-cyan" />
            <span>Preset Benchmark Audio Scenarios</span>
          </h4>
          <p className="text-xs text-slate-400">
            Click any scenario to listen and run an instant AI detection scan.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
          DEMO BENCHMARKS
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {samples.map((sample) => {
          const badge = getBadgeStyle(sample.expected_category, sample.expected_risk);
          const BadgeIcon = badge.icon;
          const isPlaying = activePlayingId === sample.id;
          const isScanning = analyzingSampleId === sample.id;

          return (
            <div
              key={sample.id}
              className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border border-white/10 relative overflow-hidden group"
            >
              {/* Category Pill */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>

                <button
                  onClick={() => togglePlayAudio(sample)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Play audio'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-cyber-cyan fill-cyber-cyan" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1 mb-4">
                <h5 className="text-xs font-semibold text-white group-hover:text-cyber-cyan transition-colors line-clamp-1">
                  {sample.title}
                </h5>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              {/* Scan Trigger CTA */}
              <button
                onClick={() => handleRunDemoScan(sample)}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-gradient-to-r hover:from-cyber-violet/30 hover:to-cyber-cyan/30 text-white text-xs font-medium border border-white/10 hover:border-cyber-cyan/40 transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyber-cyan" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
                    <span>Run AI Scan</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
