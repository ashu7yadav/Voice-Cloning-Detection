import React, { useRef, useEffect, useState } from 'react';
import { Activity, ZoomIn, Info, AlertTriangle } from 'lucide-react';

export default function SpectrogramView({ spectrogramData = [], duration = 4.0, anomalies = [] }) {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // If no backend preview matrix, generate a realistic Mel-Spectrogram matrix
    const rows = spectrogramData.length > 0 ? spectrogramData.length : 32;
    const cols = spectrogramData.length > 0 && spectrogramData[0] ? spectrogramData[0].length : 40;

    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // High frequencies are r=0, low frequencies are r=rows-1
        const val = spectrogramData[r] && spectrogramData[r][c] !== undefined
          ? (spectrogramData[r][c] + 1.0) / 2.0 // normalize [-1, 1] to [0, 1]
          : Math.random() * 0.5;

        // Custom Cyber Inferno Colormap (Dark Blue -> Violet -> Cyan -> Rose -> Yellow)
        let color;
        if (val < 0.2) {
          color = `rgb(${Math.floor(val * 5 * 20)}, ${Math.floor(val * 5 * 15)}, ${Math.floor(val * 5 * 60)})`;
        } else if (val < 0.5) {
          const t = (val - 0.2) / 0.3;
          color = `rgb(${Math.floor(20 + t * 119)}, ${Math.floor(15 + t * 77)}, ${Math.floor(60 + t * 186)})`; // to #8B5CF6
        } else if (val < 0.75) {
          const t = (val - 0.5) / 0.25;
          color = `rgb(${Math.floor(139 - t * 133)}, ${Math.floor(92 + t * 90)}, ${Math.floor(246 - t * 34)})`; // to #06B6D4
        } else if (val < 0.9) {
          const t = (val - 0.75) / 0.15;
          color = `rgb(${Math.floor(6 + t * 238)}, ${Math.floor(182 - t * 119)}, ${Math.floor(212 - t * 118)})`; // to #F43F5E
        } else {
          const t = (val - 0.9) / 0.1;
          color = `rgb(254, ${Math.floor(240 * t + 63 * (1-t))}, ${Math.floor(138 * t)})`; // to Yellow
        }

        ctx.fillStyle = color;
        // Draw inverted vertically so row 0 is at top (high frequencies) and r=rows-1 is bottom (0Hz)
        ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw anomaly bounding zones
    anomalies.forEach((anom) => {
      const leftX = (anom.start_time / (duration || 1)) * width;
      const rightX = (anom.end_time / (duration || 1)) * width;
      const zoneW = Math.max(8, rightX - leftX);

      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2;
      ctx.strokeRect(leftX, 0, zoneW, height);

      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.fillRect(leftX, 0, zoneW, height);
    });

  }, [spectrogramData, duration, anomalies]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = ((x / rect.width) * (duration || 4)).toFixed(2);
    // Inverted Y: Top is 8000Hz, Bottom is 0Hz
    const freq = Math.round((1 - y / rect.height) * 8000);

    setHoverInfo({ x, y, time, freq });
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-purple" />
          <span className="text-xs font-mono font-semibold text-slate-200">LOG MEL-SPECTROGRAM ANALYSIS</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>0 Hz — 8000 Hz</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">128 Mel Bins</span>
        </div>
      </div>

      {/* Canvas Heatmap with Frequency Axis */}
      <div className="relative flex gap-2">
        
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 py-1 select-none w-10 text-right">
          <span>8.0 kHz</span>
          <span>4.0 kHz</span>
          <span>2.0 kHz</span>
          <span>500 Hz</span>
          <span>0 Hz</span>
        </div>

        {/* Spectrogram Canvas Container */}
        <div className="relative flex-1 bg-dark-950 rounded-xl overflow-hidden border border-white/10 group cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            className="w-full h-44 object-fill block"
          />

          {/* Hover Crosshair & Tooltip */}
          {hoverInfo && (
            <div
              className="absolute pointer-events-none px-2 py-1 rounded bg-dark-950/90 border border-cyber-cyan/50 text-[10px] font-mono text-white shadow-xl transform -translate-y-8"
              style={{ left: `${Math.min(hoverInfo.x, 460)}px`, top: `${Math.max(hoverInfo.y, 35)}px` }}
            >
              <span className="text-cyber-cyan">{hoverInfo.time}s</span> • <span className="text-pink-400">{hoverInfo.freq} Hz</span>
            </div>
          )}

          {/* Anomaly Badges Overlay */}
          {anomalies.length > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-dark-950/90 border border-cyber-rose/50 text-[10px] font-mono text-cyber-rose">
              <AlertTriangle className="w-3 h-3" />
              <span>{anomalies.length} Anomaly Zones Flagged</span>
            </div>
          )}
        </div>
      </div>

      {/* Colormap Legend */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-2">
          <span>Acoustic Energy:</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400">-80 dB</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-[#0F121C] via-[#8B5CF6] via-[#06B6D4] via-[#F43F5E] to-[#FEF08A]"></div>
            <span className="text-[9px] text-yellow-300">0 dB</span>
          </div>
        </div>
        <span className="text-slate-400 italic hidden sm:inline">
          High-frequency smearing & periodic banding indicates neural vocoder synthesis
        </span>
      </div>

    </div>
  );
}
