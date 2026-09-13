import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, AlertCircle, CheckCircle2, Loader2, Sparkles, Music2 } from 'lucide-react';
import api from '../services/api';

export default function AudioUploader({ onAnalysisComplete, onLoadingStateChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');

  const fileInputRef = useRef(null);

  const allowedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm'];

  const validateAndSelectFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedFormats.includes(ext)) {
      setErrorMsg(`Unsupported format "${ext}". Please upload WAV, MP3, M4A, FLAC, OGG, or WEBM.`);
      setSelectedFile(null);
      setFileDetails(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg(`File size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      setSelectedFile(null);
      setFileDetails(null);
      return;
    }

    // Read audio metadata via HTML5 Audio
    const audioUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(audioUrl);
    
    tempAudio.onloadedmetadata = () => {
      setFileDetails({
        duration: tempAudio.duration,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type || ext.replace('.', '').toUpperCase(),
        url: audioUrl
      });
      setSelectedFile(file);
    };

    tempAudio.onerror = () => {
      // Still allow upload if browser cannot preview
      setFileDetails({
        duration: 0,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: ext.replace('.', '').toUpperCase(),
        url: audioUrl
      });
      setSelectedFile(file);
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    onLoadingStateChange && onLoadingStateChange(true);
    setErrorMsg('');
    setUploadProgress(0);

    // Realistic multi-stage telemetry
    setAnalysisStage('Uploading audio payload...');
    
    try {
      setTimeout(() => setAnalysisStage('Preprocessing & 16kHz resampling...'), 300);
      setTimeout(() => setAnalysisStage('Extracting Mel-Spectrogram & MFCC vectors...'), 700);
      setTimeout(() => setAnalysisStage('Executing VoxNet Deep Neural Ensemble...'), 1100);
      setTimeout(() => setAnalysisStage('Calculating XAI segment anomalies & risk metrics...'), 1500);

      const res = await api.analyzeAudio(selectedFile, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      if (res.status === 'success' && res.data) {
        onAnalysisComplete({
          ...res.data,
          localAudioUrl: fileDetails?.url
        });
      } else {
        throw new Error(res.message || 'Analysis did not return valid results');
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Error communicating with analysis engine.';
      setErrorMsg(detail);
    } finally {
      setIsAnalyzing(false);
      onLoadingStateChange && onLoadingStateChange(false);
    }
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed ${
          dragOver
            ? 'border-cyber-cyan bg-cyber-cyan/5 scale-[1.01] shadow-glow-cyan'
            : selectedFile
            ? 'border-cyber-violet/60 bg-dark-900/80 shadow-glow-violet'
            : 'border-white/15 bg-dark-900/40 hover:border-cyber-violet/50 hover:bg-dark-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.m4a,.flac,.ogg,.webm,audio/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        {/* Floating background glowing orb */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyber-violet/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyber-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          
          {/* Main Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
            selectedFile
              ? 'bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/40 shadow-glow-violet'
              : 'bg-white/5 text-slate-300 border border-white/10 group-hover:text-cyber-cyan group-hover:border-cyber-cyan/30'
          }`}>
            {isAnalyzing ? (
              <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan" />
            ) : selectedFile ? (
              <FileAudio className="w-8 h-8 text-cyber-violet animate-pulse-subtle" />
            ) : (
              <UploadCloud className="w-8 h-8 transition-transform group-hover:-translate-y-1" />
            )}
          </div>

          {/* Prompt / Selected State */}
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald" />
                <span className="font-mono text-sm text-white font-medium break-all">{selectedFile.name}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{fileDetails?.sizeMB} MB</span>
                {fileDetails?.duration > 0 && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{fileDetails.duration.toFixed(1)}s duration</span>
                )}
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{fileDetails?.type}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Drag & drop speech audio, or <span className="text-cyber-cyan underline decoration-cyber-cyan/40 underline-offset-4">browse file</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Supports WAV, MP3, M4A, FLAC, OGG & WEBM (up to 25MB). Audio will be processed securely in memory and never stored permanently.
              </p>
            </div>
          )}

          {/* Formats Badges */}
          {!selectedFile && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {['WAV (Lossless)', 'MP3', 'M4A', 'FLAC', 'WEBM'].map((fmt) => (
                <span key={fmt} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  {fmt}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-cyber-rose/10 border border-cyber-rose/30 flex items-start gap-3 text-cyber-rose text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-semibold block">Validation Alert</span>
            <span className="text-slate-300">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Action Toolbar & Progress */}
      {selectedFile && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => { setSelectedFile(null); setFileDetails(null); setErrorMsg(''); }}
              disabled={isAnalyzing}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Choose different file
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyber-violet via-cyber-purple to-cyber-cyan hover:opacity-95 text-white text-sm font-semibold shadow-glow-violet transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{analysisStage || 'Analyzing Voice...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Analyze Authenticity</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Telemetry Stage Indicators during Analysis */}
      {isAnalyzing && (
        <div className="mt-4 p-4 rounded-xl glass-panel border border-cyber-cyan/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyber-cyan flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping"></span>
              {analysisStage}
            </span>
            <span className="text-slate-400">{uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}% Uploaded` : 'Neural Processing'}</span>
          </div>
          <div className="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyber-violet via-cyber-cyan to-cyber-emerald h-1.5 rounded-full animate-pulse transition-all duration-300 w-full"></div>
          </div>
        </div>
      )}

    </div>
  );
}
