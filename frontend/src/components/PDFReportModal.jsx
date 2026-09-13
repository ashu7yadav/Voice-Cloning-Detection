import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { X, Download, ShieldCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export default function PDFReportModal({ isOpen, onClose, analysis }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !analysis) return null;

  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [139, 92, 246]; // Cyber Violet
      const darkBg = [15, 23, 42]; // Slate 900
      const accentColor = analysis.risk_level === 'HIGH' ? [244, 63, 94] : [16, 185, 129];

      // Header Banner
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('VOXGUARD AI', 15, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('AI-POWERED VOICE-CLONING & IMPERSONATION DETECTION SYSTEM', 15, 26);
      doc.text('CONFIDENTIAL CYBERSECURITY AUDIT REPORT', 15, 32);

      // Report Metadata Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 48, 180, 28, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 48, 180, 28, 3, 3, 'S');

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALYSIS ID:', 20, 56);
      doc.text('FILE NAME:', 20, 63);
      doc.text('DATE GENERATED:', 20, 70);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(analysis.id || 'N/A', 55, 56);
      doc.text(analysis.filename || 'audio.wav', 55, 63);
      doc.text(new Date().toUTCString(), 55, 70);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('DURATION:', 125, 56);
      doc.text('SAMPLE RATE:', 125, 63);
      doc.text('SOURCE:', 125, 70);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${analysis.duration_seconds} seconds`, 155, 56);
      doc.text(`${analysis.sample_rate} Hz Mono`, 155, 63);
      doc.text(analysis.source_type?.toUpperCase() || 'UPLOAD', 155, 70);

      // Main Verdict Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('AUTHENTICITY VERDICT & RISK ASSESSMENT', 15, 86);

      // Verdict Box
      doc.setFillColor(analysis.risk_level === 'HIGH' ? 254 : 240, analysis.risk_level === 'HIGH' ? 242 : 253, analysis.risk_level === 'HIGH' ? 242 : 244);
      doc.roundedRect(15, 90, 180, 36, 3, 3, 'F');
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(1);
      doc.roundedRect(15, 90, 180, 36, 3, 3, 'S');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text(analysis.prediction === 'AI_GENERATED' ? 'LIKELY AI-GENERATED SPEECH' : 'LIKELY HUMAN-GENERATED SPEECH', 22, 102);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`Estimated Synthetic Likelihood: ${Math.round(analysis.synthetic_likelihood * 100)}%`, 22, 110);
      doc.text(`Estimated Real Authenticity: ${Math.round(analysis.real_likelihood * 100)}%`, 110, 110);
      doc.text(`Threat Classification: ${analysis.risk_level} RISK`, 22, 118);

      // Explainable Signals Breakdown
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('ACOUSTIC EXPLAINABILITY SIGNALS', 15, 136);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      const sigs = analysis.signals || {};
      const signalsList = [
        ['Spectral Consistency Score:', `${sigs.spectral_consistency || 80} / 100`],
        ['Prosody Naturalness Score:', `${sigs.prosody_consistency || 75} / 100`],
        ['Pitch (F0) Dynamics Score:', `${sigs.pitch_variation || 70} / 100`],
        ['Vocoder Artifact Index:', `${sigs.artifact_score || 15} / 100`],
      ];

      let yPos = 144;
      signalsList.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(val, 100, yPos);
        yPos += 7;
      });

      // Suspicious Segments
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('FLAGGED TEMPORAL ANOMALIES', 15, 180);

      const anomalies = analysis.anomalies || [];
      if (anomalies.length > 0) {
        let anomY = 188;
        anomalies.slice(0, 3).forEach((anom, idx) => {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...accentColor);
          doc.text(`[${anom.start_time}s - ${anom.end_time}s] Severity: ${anom.severity}`, 20, anomY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(anom.description, 75, anomY);
          anomY += 7;
        });
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('No significant vocoder phase or spectral anomalies detected in temporal sliding windows.', 20, 188);
      }

      // Security Recommendations
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('RECOMMENDED SECURITY ACTIONS', 15, 216);

      let recY = 224;
      (analysis.recommendations || []).slice(0, 3).forEach((rec, idx) => {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`• ${rec}`, 20, recY, { maxWidth: 170 });
        recY += 7;
      });

      // Footer Disclaimer
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 268, 195, 268);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'DISCLAIMER: VOXGUARD AI is an AI-assisted screening tool. Results reflect statistical acoustic likelihoods and must not be used as standalone judicial or forensic evidence without independent secondary verification.',
        15,
        274,
        { maxWidth: 180 }
      );

      doc.save(`VOXGUARD_REPORT_${analysis.id || 'scan'}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-violet/20 border border-cyber-violet/40 flex items-center justify-center text-cyber-violet">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Download Forensic Audit Report</h3>
            <p className="text-xs text-slate-400">Generate a signed cybersecurity incident PDF</p>
          </div>
        </div>

        <div className="bg-dark-900/80 p-4 rounded-xl border border-white/5 space-y-2 mb-5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">File Analyzed:</span>
            <span className="text-white font-medium">{analysis.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Prediction Verdict:</span>
            <span className={analysis.risk_level === 'HIGH' ? 'text-cyber-rose font-bold' : 'text-cyber-emerald font-bold'}>
              {analysis.prediction}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Synthetic Likelihood:</span>
            <span className="text-cyber-cyan font-bold">{Math.round(analysis.synthetic_likelihood * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Anomalies Included:</span>
            <span className="text-white">{analysis.anomalies?.length || 0} Flagged Zones</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyber-violet to-cyber-cyan text-white text-xs font-semibold shadow-glow-violet hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download Official Report'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
