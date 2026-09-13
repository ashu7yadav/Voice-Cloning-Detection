import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { encodeWAV } from '../utils/wavEncoder';

export default function AudioRecorder({ onAnalysisComplete, onLoadingStateChange }) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'recording', 'stopped'
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');

  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const streamRef = useRef(null);

  // Live Canvas Visualizer
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8B5CF6');
        gradient.addColorStop(0.5, '#06B6D4');
        gradient.addColorStop(1, '#EC4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };
    render();
  };

  const startRecording = async () => {
    setErrorMsg('');
    setRecordedBlob(null);
    setAudioUrl('');
    setRecordDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Collect raw PCM samples via ScriptProcessor for lossless WAV generation
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      drawVisualizer();
      setRecordingState('recording');

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser settings.');
      } else {
        setErrorMsg(`Could not initialize microphone: ${err.message}`);
      }
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    clearInterval(timerIntervalRef.current);

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Merge Float32 arrays into one continuous buffer
    const totalSamples = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Encode to WAV
    const wavBlob = encodeWAV(merged, 16000);
    setRecordedBlob(wavBlob);
    const url = URL.createObjectURL(wavBlob);
    setAudioUrl(url);

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    setRecordingState('stopped');
  };

  const handleReRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setRecordedBlob(null);
    setAudioUrl('');
    setRecordDuration(0);
    setRecordingState('idle');
    setErrorMsg('');
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAnalyzeRecordedVoice = async () => {
    if (!recordedBlob) return;

    if (recordDuration < 1.0) {
      setErrorMsg('Recording is too short. Please record at least 2 seconds of speech.');
      return;
    }

    setIsAnalyzing(true);
    onLoadingStateChange && onLoadingStateChange(true);
    setErrorMsg('');

    setAnalysisStage('Uploading recorded voice sample...');

    try {
      setTimeout(() => setAnalysisStage('Acoustic signal normalization & VAD...'), 300);
      setTimeout(() => setAnalysisStage('Computing high-resolution Mel-Spectrogram...'), 700);
      setTimeout(() => setAnalysisStage('Evaluating VoxNet deep acoustic features...'), 1100);
      setTimeout(() => setAnalysisStage('Generating explainable risk report...'), 1500);

      const filename = `live_recording_${Date.now()}.wav`;
      const res = await api.analyzeRecording(recordedBlob, filename);

      if (res.status === 'success' && res.data) {
        onAnalysisComplete({
          ...res.data,
          localAudioUrl: audioUrl
        });
      } else {
        throw new Error(res.message || 'Analysis error');
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Analysis failed.';
      setErrorMsg(detail);
    } finally {
      setIsAnalyzing(false);
      onLoadingStateChange && onLoadingStateChange(false);
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl p-8 sm:p-12 text-center glass-panel border border-white/10 relative overflow-hidden">
        
        {/* Glowing Ambiance */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-cyber-pink/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Live Audio Spectrum Canvas */}
        {recordingState === 'recording' && (
          <div className="mb-6 flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={320}
              height={60}
              className="w-full max-w-xs h-14 rounded-lg bg-dark-950/60 p-1 border border-cyber-cyan/30 shadow-glow-cyan"
            />
          </div>
        )}

        {/* Center Mic Avatar */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            recordingState === 'recording'
              ? 'bg-cyber-rose/20 border-2 border-cyber-rose shadow-glow-rose scale-110'
              : recordedBlob
              ? 'bg-cyber-emerald/20 border-2 border-cyber-emerald shadow-glow-emerald'
              : 'bg-dark-900 border-2 border-white/10 group-hover:border-cyber-violet/50'
          }`}>
            {recordingState === 'recording' && (
              <span className="absolute inset-0 rounded-full bg-cyber-rose/30 animate-ping"></span>
            )}

            {recordingState === 'recording' ? (
              <Mic className="w-10 h-10 text-cyber-rose animate-pulse" />
            ) : recordedBlob ? (
              <Play className="w-10 h-10 text-cyber-emerald" />
            ) : (
              <Mic className="w-10 h-10 text-slate-300" />
            )}
          </div>

          {/* Status & Timer Label */}
          <div className="mt-4">
            {recordingState === 'recording' ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-cyber-rose font-mono font-bold text-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyber-rose animate-pulse"></span>
                  RECORDING... {formatTimer(recordDuration)}
                </div>
                <p className="text-xs text-slate-400">Speak clearly into your microphone</p>
              </div>
            ) : recordingState === 'stopped' ? (
              <div className="space-y-1">
                <div className="text-cyber-emerald font-mono font-semibold text-sm">
                  Voice Captured ({recordDuration}s) • Lossless 16kHz WAV
                </div>
                <p className="text-xs text-slate-400">Preview recording or initiate deep authenticity scan</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-white">Live Microphone Detection</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Click below to record a voice sample in real time. We analyze acoustic harmonics and vocoder tremor patterns.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyber-rose via-pink-600 to-cyber-violet text-white text-sm font-semibold shadow-glow-rose hover:opacity-95 transition-all transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-cyber-rose text-white text-sm font-semibold shadow-glow-rose hover:bg-rose-600 transition-all transform active:scale-95 animate-bounce"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording ({formatTimer(recordDuration)})</span>
            </button>
          )}

          {recordingState === 'stopped' && (
            <>
              {/* Playback Preview */}
              <button
                onClick={togglePlayback}
                className="flex items-center gap-2 px-5 py-3 rounded-xl glass-pill text-white text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>

              <button
                onClick={handleReRecord}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-3 rounded-xl glass-pill text-slate-400 hover:text-white text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-record</span>
              </button>

              <button
                onClick={handleAnalyzeRecordedVoice}
                disabled={isAnalyzing}
                className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-cyber-violet to-cyber-cyan hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-glow-violet transition-all transform hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{analysisStage || 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Analyze Voice</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Hidden Audio Player for Preview */}
        {audioUrl && (
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-cyber-rose/10 border border-cyber-rose/30 flex items-start gap-3 text-cyber-rose text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-semibold block">Microphone / Validation Error</span>
            <span className="text-slate-300">{errorMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
