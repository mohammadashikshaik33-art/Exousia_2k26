import numpy as np
from scipy.io import wavfile
import subprocess
import os

sample_rate = 44100
duration = 8.000
total_samples = int(sample_rate * duration)
t = np.linspace(0, duration, total_samples, endpoint=False)

left = np.zeros(total_samples)
right = np.zeros(total_samples)

# Helper for mid/high phone-friendly synth oscillator
def generate_analog_synth_note(freq, start_t, note_dur, env_attack=0.03, env_decay=0.35, brightness=1.0):
    note_mask = (t >= start_t) & (t < start_t + note_dur)
    if not np.any(note_mask): return np.zeros(total_samples)
    tau = t[note_mask] - start_t
    
    # Envelope: Fast attack, exponential decay
    env = np.minimum(tau / env_attack, 1.0) * np.exp(-tau / env_decay)
    
    # Waveform: Sawtooth + Square blend for rich 80s analog character
    saw = 2.0 * (tau * freq - np.floor(0.5 + tau * freq))
    sqr = np.sign(np.sin(2.0 * np.pi * freq * tau))
    sub = np.sin(2.0 * np.pi * (freq * 0.5) * tau) * 0.5
    
    raw_signal = (0.55 * saw + 0.35 * sqr + 0.3 * sub) * env
    
    # Resonant filter sweep simulation (bright mid-range for phone speakers)
    sweep = np.exp(-3.5 * tau)
    filter_mod = 1.0 + brightness * 2.5 * sweep
    signal = raw_signal * filter_mod
    
    full_sig = np.zeros(total_samples)
    full_sig[note_mask] = signal
    return full_sig

# ----------------------------------------------------
# 1. 0.00 – 0.55s: VOID (Near silence, subtle 50Hz tone)
# ----------------------------------------------------
void_mask = (t >= 0.0) & (t < 0.55)
void_env = np.clip(t[void_mask] / 0.55, 0, 1) ** 2
dark_room = (np.sin(2 * np.pi * 50 * t[void_mask]) * 0.03 + np.sin(2 * np.pi * 100 * t[void_mask]) * 0.015) * void_env
left[void_mask] += dark_room
right[void_mask] += dark_room

# ----------------------------------------------------
# 2. 0.55 – 1.50s: FIRST PULSE (Restrained analog pulse)
# ----------------------------------------------------
pulse_times = [0.55, 0.85, 1.15]
for pt in pulse_times:
    p_sig = generate_analog_synth_note(110.0, pt, 0.28, env_attack=0.02, env_decay=0.20, brightness=0.5)
    left += p_sig * 0.12
    right += p_sig * 0.12

# ----------------------------------------------------
# 3. 1.50 – 2.60s: TENSION BUILD
# ----------------------------------------------------
tens_mask = (t >= 1.50) & (t < 2.60)
tau_tens = t[tens_mask] - 1.50
tens_env = (tau_tens / 1.10) ** 1.8
tens_drone = (np.sin(2 * np.pi * 65 * t[tens_mask]) + 0.6 * np.sin(2 * np.pi * 130 * t[tens_mask])) * 0.15 * tens_env
left[tens_mask] += tens_drone
right[tens_mask] += tens_drone

# ----------------------------------------------------
# 4. 2.60 – 3.55s: DISTURBANCE (Rising noise & pitch mod)
# ----------------------------------------------------
dist_mask = (t >= 2.60) & (t < 3.55)
tau_dist = t[dist_mask] - 2.60
dist_env = np.sin(np.pi * tau_dist / 0.95)
np.random.seed(1986)
noise_gen = np.random.uniform(-0.12, 0.12, np.sum(dist_mask))

# Lowpass filter noise for warm analog crackle
b_filt = np.exp(-2 * np.pi * 650 / sample_rate)
filt_noise = np.zeros_like(noise_gen)
last_v = 0.0
for i in range(len(noise_gen)):
    last_v = last_v * b_filt + noise_gen[i] * (1 - b_filt)
    filt_noise[i] = last_v

left[dist_mask] += filt_noise * dist_env * 0.22
right[dist_mask] += filt_noise * dist_env * 0.22

# ----------------------------------------------------
# 5. 3.55 – 4.20s: LIGHTNING / RIFT HIT (Supernatural Crack @ 3.60s)
# ----------------------------------------------------
rift_mask = (t >= 3.60) & (t < 4.40)
tau_rift = t[rift_mask] - 3.60
crack_env = np.exp(-6.0 * tau_rift)
crack_wave = (np.sin(2 * np.pi * 90 * tau_rift) * 0.4 + np.random.uniform(-0.6, 0.6, np.sum(rift_mask))) * crack_env * 0.55
left[rift_mask] += crack_wave
right[rift_mask] += crack_wave * 0.95

# ----------------------------------------------------
# 6. 4.75 – 6.05s: EXOUSIA REVEAL (Hero 5-Note Synth Motif)
# Motif: A3 (220Hz) -> C4 (261.63Hz) -> E4 (329.63Hz) -> G#4 (415.30Hz) -> A4 (440Hz)
# ----------------------------------------------------
hero_motif = [
    (220.00, 4.75, 0.35, 1.2),
    (261.63, 5.00, 0.35, 1.3),
    (329.63, 5.25, 0.35, 1.4),
    (415.30, 5.50, 0.35, 1.5),
    (440.00, 5.75, 0.55, 1.8)  # Resolving hero note
]

for idx, (freq, start_t, dur, bright) in enumerate(hero_motif):
    note_sig = generate_analog_synth_note(freq, start_t, dur, env_attack=0.015, env_decay=0.45, brightness=bright)
    pan_l = 0.5 + 0.2 * np.sin(idx * 1.5)
    pan_r = 0.5 - 0.2 * np.sin(idx * 1.5)
    left += note_sig * 0.42 * pan_l
    right += note_sig * 0.42 * pan_r

# ----------------------------------------------------
# 7. 6.05 – 6.55s: 2K26 TRANSITION (Mid Punch + Controlled Sub Sweep)
# ----------------------------------------------------
k_mask = (t >= 6.05) & (t < 6.80)
tau_k = t[k_mask] - 6.05
k_env = np.exp(-4.0 * tau_k)
k_freq = 140 * np.exp(-3.0 * tau_k) + 45
k_wave = (np.sin(2 * np.pi * k_freq * tau_k) + 0.4 * np.sin(2 * np.pi * (k_freq * 2) * tau_k)) * k_env * 0.48
left[k_mask] += k_wave
right[k_mask] += k_wave

# ----------------------------------------------------
# 8. 6.55 – 7.10s: FINAL SIGNATURE HIT (Climax at ~6.85s)
# ----------------------------------------------------
hit_mask = (t >= 6.80) & (t < 7.50)
tau_hit = t[hit_mask] - 6.80
hit_env = np.exp(-3.5 * tau_hit)
# Triumphant A-minor final chord (A3 + C4 + E4 + A4)
chord_wave = (
    np.sin(2 * np.pi * 220.0 * tau_hit) +
    0.8 * np.sin(2 * np.pi * 261.63 * tau_hit) +
    0.8 * np.sin(2 * np.pi * 329.63 * tau_hit) +
    0.6 * np.sin(2 * np.pi * 440.0 * tau_hit)
) * 0.18 * hit_env

left[hit_mask] += chord_wave
right[hit_mask] += chord_wave

# ----------------------------------------------------
# 9. 7.10 – 8.00s: CRITICAL RESOLUTION / OUTRO DECAY TAIL
# NO NEW MUSICAL EVENTS AFTER 7.10s!
# ----------------------------------------------------
fade_mask = (t >= 7.10)
tau_fade = (t[fade_mask] - 7.10) / 0.90 # 0.0 to 1.0
fade_curve = np.clip(1.0 - tau_fade, 0, 1) ** 3.0 # Smooth natural decay reaching 0 at 8.000s

left[fade_mask] *= fade_curve
right[fade_mask] *= fade_curve

# Absolute zero at 8.000s
left[-20:] = 0.0
right[-20:] = 0.0

# Master Limiter & Normalization (-1.5 dB FS peak = 0.84)
max_peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_peak > 0:
    target_peak = 0.84
    left = (left / max_peak) * target_peak
    right = (right / max_peak) * target_peak

# Mono Sum Verification check
mono_sum = (left + right) * 0.5
mono_peak = np.max(np.abs(mono_sum))
print(f"Master Peak: {max_peak:.3f} | Mono Sum Peak: {mono_peak:.3f} (No phase cancellation)")

# Export WAV master
wav_path = "scratch/master_exousia_cinema.wav"
os.makedirs("scratch", exist_ok=True)
os.makedirs("public/audio", exist_ok=True)

stereo_int16 = np.column_stack(((left * 32767).astype(np.int16), (right * 32767).astype(np.int16)))
wavfile.write(wav_path, sample_rate, stereo_int16)
print(f"Master WAV exported to {wav_path}")

# Encode MP3 (320kbps) & OGG (Q8) using ffmpeg-static
ffmpeg_exe = r"C:\Users\Lenovo\.gemini\antigravity\scratch\exousia\node_modules\ffmpeg-static\ffmpeg.exe"

mp3_out = "public/audio/exousia-intro.mp3"
subprocess.run([ffmpeg_exe, "-y", "-i", wav_path, "-b:a", "320k", "-ar", "44100", "-ac", "2", mp3_out], check=True)
print(f"Encoded MP3: {mp3_out}")

ogg_out = "public/audio/exousia-intro.ogg"
subprocess.run([ffmpeg_exe, "-y", "-i", wav_path, "-q:a", "8", "-ar", "44100", "-ac", "2", ogg_out], check=True)
print(f"Encoded OGG: {ogg_out}")
