# AuraDAW - Browser-Based Digital Audio Workstation

A client-side digital audio workstation built with React, Redux Toolkit, Material UI, and native browser APIs (Web Audio API, AudioWorklet, Web Workers, IndexedDB, Web MIDI). Zero third-party audio or music libraries.

---

## 1. Scheduling Strategy

AuraDAW implements a sample-accurate lookahead scheduler based on the "Tale of Two Clocks" paradigm:

- **AudioContext Hardware Clock**: The high-priority audio rendering thread maintains an uninterrupted hardware clock (`audioContext.currentTime`) that is decoupled from the main UI thread.
- **Lookahead Interval & Windowing**: A lightweight timer runs at a 25ms interval with a 100ms lookahead window (`scheduleAheadTime = 0.1s`).
- **Pre-scheduling Events**: On each tick, the scheduler inspects active tracks for any audio clip triggers, MIDI synth note-ons/note-offs, and automation breakpoints falling within `[nextScheduleBeat, nextScheduleBeat + window]`. Events are scheduled ahead of time directly onto native audio nodes:
  - `AudioBufferSourceNode.start(audioContextTime, offset, duration)`
  - `SynthEngine.noteOn(pitch, velocity, audioContextTime, settings, duration)`
  - `AudioParam.setValueAtTime` / `linearRampToValueAtTime`
- **Zero Drift & Dropout Protection**: Even if heavy DOM updates, zooming, or layout recalculations block the main JavaScript thread for up to 50ms, the audio thread queue remains full, preventing audio dropouts or timing drift.

---

## 2. AudioWorklet Custom DSP Design

Custom DSP processing runs inside dedicated `AudioWorkletProcessor` classes on the audio rendering thread:

### 3-Band Parametric EQ (`ParametricEQProcessor`)
- **Low Shelf Band**: Biquad filter difference equation computing shelf curve at configurable frequency (20 Hz - 1000 Hz) and gain (-24 dB to +24 dB).
- **Mid Peaking Band**: Bell filter with adjustable center frequency (200 Hz - 8000 Hz), gain (-24 dB to +24 dB), and Q factor (0.1 - 10).
- **High Shelf Band**: High frequency shelf filter (1000 Hz - 20000 Hz) and gain.
- **Direct Form Implementation**: Second-order IIR difference equation executed per sample across channels with smooth parameter transitions.

### Dynamics Compressor (`CompressorProcessor`)
- **Envelope Detection**: Peak detector with exponential attack (`attackCoeff = exp(-1 / (attack * sampleRate))`) and release smoothing.
- **Logarithmic Gain Reduction**: Converts detected linear amplitude to decibels, applies soft-knee threshold and ratio compression curve:
  $$\text{Gain Reduction (dB)} = (1/\text{ratio} - 1) \cdot (\text{envDb} - \text{threshold})$$
- **Makeup Gain**: Linear makeup gain applied to post-compression signal.

### Stereo Delay & Reverb (`DelayReverbProcessor`)
- **Ring Buffer Delay Line**: Circular 2-second stereo float buffer.
- **High-Frequency Damping**: One-pole lowpass filter in feedback path simulating natural acoustic air absorption.
- **Stereo Cross-Feedback**: Left feedback routed to right channel and right feedback to left channel for spacious ping-pong diffusion.

---

## 3. Waveform Pipeline

To render waveforms for clips up to 30 minutes long at 60fps without freezing the UI:

1. **Precomputed Multi-Resolution Peak Pyramid**:
   When an audio file or sample is loaded, a dedicated Web Worker computes peak min/max pairs at multiple block resolutions:
   - **64 samples/bin**: High-zoom detail
   - **256 samples/bin**: Medium-zoom inspection
   - **1024 samples/bin**: Overview display
   - **4096 samples/bin**: Full 30-minute macro view
2. **Transferable Float32Arrays**: Data is exchanged between the worker and main thread via structured cloning / transferable buffers without blocking UI interactions.
3. **Adaptive Canvas Drawing**:
   During timeline rendering, the component computes the exact samples-per-pixel ratio based on horizontal zoom. It selects the optimal pyramid level and draws vertical peak lines for the visible viewport only ($O(\text{viewport width})$ instead of $O(\text{total audio samples})$).

---

## 4. Built-in Subtractive Synthesizer & Piano Roll

- **Voice Architecture**: Polyphonic voice allocation with dual oscillators (Sawtooth, Square, Triangle, Sine), detune in cents, and oscillator mix.
- **ADSR Envelope**: Attack, Decay, Sustain, and Release curves modulating amplitude via exponential Web Audio ramps.
- **Resonant Filter**: Biquad lowpass/bandpass/highpass filter with cutoff frequency, resonance (Q), and velocity-sensitive filter envelope.
- **Piano Roll Editor**:
  - Interactive pitch grid (C2 to C6)
  - Draw, drag-to-move, and edge-trim note durations
  - Quantize note starts and durations (1/4, 1/8, 1/16, 1/32)
  - Velocity editor lane with adjustable vertical velocity bars

---

## 5. Web MIDI & Musical Typing

- **Web MIDI API**: Automatically connects to available USB/Bluetooth MIDI keyboards via `navigator.requestMIDIAccess()`.
- **Computer Keyboard Fallback**: Full musical typing mapping:
  - White keys: `A` (C4), `S` (D4), `D` (E4), `F` (F4), `G` (G4), `H` (A4), `J` (B4), `K` (C5), `L` (D5)
  - Black keys: `W` (C#4), `E` (D#4), `T` (F#4), `Y` (G#4), `U` (A#4), `O` (C#5)
  - Octave shifting: `Z` (octave down), `X` (octave up)
- **Live Recording**: When a MIDI track is armed (`R`) and the global record button is active, notes played via keyboard or Web MIDI are timestamped and recorded directly into a timeline clip.

---

## 6. Mixer Console & Metering

- **Per-Track Controls**: Volume fader (dB scale), Pan slider (-1.0 to +1.0), Mute, Solo, and Record Arm.
- **Stereo VU Meters**: AnalyserNode time-domain evaluation computing true RMS and Peak dB levels with color-coded gradients (Green: -60 to -12 dB, Yellow: -12 to 0 dB, Red Clip: > 0 dB).
- **Master Bus**: Master channel strip with master fader and master stereo VU meter.

---

## 7. Offline Mix Export & IndexedDB Autosave

- **OfflineAudioContext Export**: Renders all audio tracks, synthesizers, DSP effects, and automation curves to an uncompressed 16-bit 44.1 kHz stereo WAV file with progress reporting and cancellation support.
- **IndexedDB Persistence**: Stores full project state and large audio buffers (`Float32Array`) in IndexedDB (`AuraDAW_DB`) for instant project restore on page reload.
- **Undo / Redo**: History stack preserving complete track and clip edits with Ctrl+Z / Ctrl+Y keybindings.

---

## 8. Accessibility (a11y)

- Keyboard-navigable transport (`Space` for play/pause, `R` for record, `Enter`/`Home` for rewind, `S` for split, `Delete` for delete).
- Standard ARIA labels, roles, and values across sliders, buttons, and meters.
- Hidden `aria-live="polite"` region providing real-time screen-reader announcements on playhead movement, clip selection, and state changes.

---

## 9. Running and Testing

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run development server (opens at http://localhost:5180/)
npm run dev

# Build production bundle (< 130 KB gzipped)
npm run build
```
