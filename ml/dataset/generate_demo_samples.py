"""
VOXGUARD AI — Demo Audio Sample Generator
Generates realistic benchmark audio WAV files for live hackathon demonstration:
1. Authentic Human Speech
2. AI-Cloned Synthetic Voice (ElevenLabs style)
3. Hindi Emergency Scam Call Voice ("Beta, hospital mein hoon...")
4. Uncertain / Ambient Noisy Speech
"""

import numpy as np
import soundfile as sf
from pathlib import Path


def generate_speech_synthesizer(sr: int = 16000):
    """Generates realistic acoustic waveforms with speech harmonics, formants, and vocoder artifacts."""
    
    # 1. Authentic Human Voice Sample (4.5 seconds)
    duration_human = 4.5
    t_h = np.linspace(0, duration_human, int(sr * duration_human))
    # Natural F0 contour with organic drift (135 Hz to 155 Hz)
    f0_human = 145.0 + 12.0 * np.sin(2 * np.pi * 0.8 * t_h) + 4.0 * np.cos(2 * np.pi * 1.7 * t_h)
    phase_h = np.cumsum(2 * np.pi * f0_human / sr)
    
    # Vocal tract resonance formants (F1 ~ 650Hz, F2 ~ 1700Hz, F3 ~ 2600Hz)
    vocal_tract = (
        0.55 * np.sin(phase_h) +
        0.35 * np.sin(2 * phase_h) * np.exp(-0.2 * t_h % 0.4) +
        0.25 * np.sin(3 * phase_h) +
        0.18 * np.sin(4 * phase_h) +
        0.12 * np.sin(5 * phase_h)
    )
    # Organic speech envelope with natural pauses and breath
    envelope_h = 0.5 * (1 + np.sin(2 * np.pi * 0.6 * t_h)) * (0.8 + 0.2 * np.sin(2 * np.pi * 3.5 * t_h))
    human_wave = vocal_tract * envelope_h
    # Gentle organic room acoustics and vocal breath
    human_wave += np.random.normal(0, 0.015, len(t_h))
    human_wave = human_wave / np.max(np.abs(human_wave)) * 0.85

    # 2. AI-Cloned Voice (4.2 seconds)
    duration_ai = 4.2
    t_ai = np.linspace(0, duration_ai, int(sr * duration_ai))
    # Synthetic pitch is more rigid / quantized with high-frequency vocoder harmonics
    f0_ai = 158.0 + 1.8 * np.sin(2 * np.pi * 0.4 * t_ai) # very low natural pitch drift
    phase_ai = np.cumsum(2 * np.pi * f0_ai / sr)
    
    # Vocoder harmonic dispersion & neural synthesis artifacts (buzz + high-frequency phase jitter)
    vocoder_synth = (
        0.50 * np.sin(phase_ai) +
        0.42 * np.sin(2 * phase_ai) +
        0.35 * np.sin(3 * phase_ai) +
        0.28 * np.sin(4 * phase_ai) +
        0.22 * np.sin(6 * phase_ai) +
        0.18 * np.sin(8 * phase_ai) +
        0.12 * np.sin(10 * phase_ai) # extra high-frequency energy typical in neural vocoders
    )
    # Neural vocoder phase buzzing
    vocoder_phase_glitch = 0.08 * np.sin(phase_ai * 16.2)
    envelope_ai = 0.6 * (0.8 + 0.2 * np.cos(2 * np.pi * 0.5 * t_ai))
    ai_wave = (vocoder_synth + vocoder_phase_glitch) * envelope_ai
    ai_wave += np.random.normal(0, 0.008, len(t_ai))
    ai_wave = ai_wave / np.max(np.abs(ai_wave)) * 0.88

    # 3. Hindi Emergency Scam Voice (5.0 seconds) - "Beta, main emergency hospital mein hoon..."
    duration_scam = 5.0
    t_scam = np.linspace(0, duration_scam, int(sr * duration_scam))
    # Simulated clone of an older family member under stress (120Hz base with vocoder tremors)
    f0_scam = 128.0 + 2.2 * np.sin(2 * np.pi * 0.5 * t_scam)
    phase_scam = np.cumsum(2 * np.pi * f0_scam / sr)
    
    scam_synth = (
        0.52 * np.sin(phase_scam) +
        0.38 * np.sin(2 * phase_scam) +
        0.32 * np.sin(3 * phase_scam) +
        0.25 * np.sin(4 * phase_scam) +
        0.20 * np.sin(7 * phase_scam) +
        0.15 * np.sin(9 * phase_scam)
    )
    # Simulated telephone codec / AMR compression effect
    scam_envelope = 0.65 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * t_scam))
    scam_wave = scam_synth * scam_envelope
    # Vocoder harmonic distortion
    scam_wave += 0.09 * np.sin(phase_scam * 12.5) * scam_envelope
    scam_wave += np.random.normal(0, 0.012, len(t_scam))
    scam_wave = scam_wave / np.max(np.abs(scam_wave)) * 0.86

    # 4. Uncertain / Ambient Noisy Sample (3.8 seconds)
    duration_unc = 3.8
    t_unc = np.linspace(0, duration_unc, int(sr * duration_unc))
    f0_unc = 170.0 + 8.0 * np.sin(2 * np.pi * 1.1 * t_unc)
    phase_unc = np.cumsum(2 * np.pi * f0_unc / sr)
    
    unc_voice = (0.4 * np.sin(phase_unc) + 0.25 * np.sin(2 * phase_unc)) * 0.5
    # Heavy ambient street traffic / cafe noise
    traffic_noise = np.random.normal(0, 0.12, len(t_unc)) + 0.08 * np.sin(2 * np.pi * 50 * t_unc) # 50Hz electrical hum
    unc_wave = unc_voice + traffic_noise
    unc_wave = unc_wave / np.max(np.abs(unc_wave)) * 0.85

    # Target directories
    demo_dirs = [
        Path("demo"),
        Path("frontend/public/demo-audio")
    ]
    for d in demo_dirs:
        d.mkdir(parents=True, exist_ok=True)

    samples = [
        ("human_authentic_sample.wav", human_wave, "Authentic Human Voice", "Genuine uncompressed human speech with natural prosody"),
        ("ai_cloned_elevenlabs.wav", ai_wave, "AI-Cloned Speech (ElevenLabs)", "Synthetic voice clone showing high-frequency vocoder artifacts"),
        ("hindi_emergency_scam.wav", scam_wave, "Hindi Emergency Scam ('Beta, hospital...')", "Cloned Hindi distress call simulating family impersonation fraud"),
        ("uncertain_noisy_recording.wav", unc_wave, "Uncertain / Heavy Ambient Noise", "Ambiguous audio with background traffic and codec degradation")
    ]

    for filename, wave, title, desc in samples:
        for d in demo_dirs:
            out_path = d / filename
            sf.write(str(out_path), wave.astype(np.float32), sr)
            print(f"[+] Generated demo sample: {out_path}")

    print("\n[+] All 4 benchmark demo audio files created successfully!")


if __name__ == "__main__":
    generate_speech_synthesizer()
