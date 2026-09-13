import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function WaveformPlayer({ audioUrl, waveformData = [], duration = 0, anomalies = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Generate fallback waveform data if empty
  const wavePoints = waveformData.length > 0 ? waveformData : [
    0.1, 0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.9, 0.7, 0.4, 0.2, 0.5, 0.8, 1.0, 0.7, 0.4, 0.2, 0.6, 0.8, 0.5, 0.3
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setAudioDuration(audioRef.current.duration || duration);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
  }, [audioUrl, duration]);

  const updateProgress = () => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = clickRatio * (audioDuration || 1);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
      
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></span>
          <span className="text-xs font-mono font-semibold text-slate-200">INTERACTIVE WAVEFORM PLAYER</span>
        </div>
        <div className="text-xs font-mono text-cyber-cyan font-bold">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      </div>

      {/* Interactive Waveform Bar Canvas / SVG Container */}
      <div
        onClick={handleSeek}
        className="relative w-full h-24 bg-dark-950/80 rounded-xl cursor-pointer p-3 flex items-center justify-between gap-1 overflow-hidden group border border-white/5 hover:border-cyber-violet/30 transition-colors"
      >
        {/* Scrubber playback head line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 shadow-glow-cyan pointer-events-none transition-all"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 -ml-1 -top-1 absolute shadow-glow-cyan"></div>
        </div>

        {/* Suspicious Anomaly Interval Highlights */}
        {anomalies.map((anom, idx) => {
          if (audioDuration <= 0) return null;
          const leftPct = (anom.start_time / audioDuration) * 100;
          const widthPct = ((anom.end_time - anom.start_time) / audioDuration) * 100;
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 bg-cyber-rose/25 border-x border-cyber-rose/60 z-10 pointer-events-none"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              title={`Anomaly: ${anom.description}`}
            >
              <span className="text-[9px] font-mono text-cyber-rose font-bold px-1 bg-dark-950/80 rounded absolute top-1 left-1">
                ⚠️ ANOMALY
              </span>
            </div>
          );
        })}

        {/* Waveform vertical bars */}
        {wavePoints.map((val, idx) => {
          const barProgress = (idx / wavePoints.length) * 100;
          const isPassed = barProgress <= progressPercent;
          const heightPct = Math.max(12, Math.min(95, Math.abs(val) * 100));

          return (
            <div
              key={idx}
              className="flex-1 rounded-full transition-all duration-75"
              style={{
                height: `${heightPct}%`,
                backgroundColor: isPassed ? '#06B6D4' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isPassed ? '0 0 8px rgba(6, 182, 212, 0.4)' : 'none',
              }}
            ></div>
          );
        })}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyber-violet to-cyber-cyan text-white flex items-center justify-center shadow-glow-violet hover:opacity-95 transition-all transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
              setCurrentTime(0);
            }}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
            title="Reset to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-cyber-rose" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <span className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-white/5 border border-white/5">
            16 kHz Mono • Resampled
          </span>
        </div>
      </div>

      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />
      )}
    </div>
  );
}
