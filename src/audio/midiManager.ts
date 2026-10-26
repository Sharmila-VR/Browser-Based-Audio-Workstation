export interface MidiListener {
  onNoteOn: (pitch: number, velocity: number) => void
  onNoteOff: (pitch: number) => void
}

const KEY_NOTE_MAP: Record<string, number> = {
  KeyA: 60, // C4
  KeyW: 61, // C#4
  KeyS: 62, // D4
  KeyE: 63, // D#4
  KeyD: 64, // E4
  KeyF: 65, // F4
  KeyT: 66, // F#4
  KeyG: 67, // G4
  KeyY: 68, // G#4
  KeyH: 69, // A4
  KeyU: 70, // A#4
  KeyJ: 71, // B4
  KeyK: 72, // C5
  KeyO: 73, // C#5
  KeyL: 74  // D5
}

export class MidiManager {
  private listeners: MidiListener[] = []
  private activeKeys = new Set<string>()
  private octaveOffset = 0
  private midiAccess: any = null
  private isListeningKeyboard = false

  constructor() {
    this.initMidi()
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  public addListener(listener: MidiListener) {
    this.listeners.push(listener)
  }

  public removeListener(listener: MidiListener) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  public setOctaveOffset(offset: number) {
    this.octaveOffset = Math.max(-3, Math.min(3, offset))
  }

  public getOctaveOffset(): number {
    return this.octaveOffset
  }

  public startKeyboardListening() {
    if (this.isListeningKeyboard || typeof window === 'undefined') return
    this.isListeningKeyboard = true
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  public stopKeyboardListening() {
    if (!this.isListeningKeyboard || typeof window === 'undefined') return
    this.isListeningKeyboard = false
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.activeKeys.clear()
  }

  private async initMidi() {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      try {
        const access = await (navigator as any).requestMIDIAccess()
        this.midiAccess = access
        this.bindMidiInputs()
        access.onstatechange = () => {
          this.bindMidiInputs()
        }
      } catch {
        // Web MIDI not supported or denied
      }
    }
  }

  private bindMidiInputs() {
    if (!this.midiAccess) return
    const inputs = this.midiAccess.inputs.values()
    for (const input of inputs) {
      input.onmidimessage = (event: any) => {
        this.handleMidiMessage(event.data)
      }
    }
  }

  private handleMidiMessage(data: Uint8Array) {
    const status = data[0] & 0xf0
    const pitch = data[1]
    const velocity = data[2]

    if (status === 0x90 && velocity > 0) {
      this.listeners.forEach((l) => l.onNoteOn(pitch, velocity))
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      this.listeners.forEach((l) => l.onNoteOff(pitch))
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return
    }

    if (e.code === 'KeyZ') {
      this.setOctaveOffset(this.octaveOffset - 1)
      return
    }
    if (e.code === 'KeyX') {
      this.setOctaveOffset(this.octaveOffset + 1)
      return
    }

    const basePitch = KEY_NOTE_MAP[e.code]
    if (basePitch !== undefined && !this.activeKeys.has(e.code)) {
      this.activeKeys.add(e.code)
      const pitch = basePitch + this.octaveOffset * 12
      this.listeners.forEach((l) => l.onNoteOn(pitch, 100))
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const basePitch = KEY_NOTE_MAP[e.code]
    if (basePitch !== undefined && this.activeKeys.has(e.code)) {
      this.activeKeys.delete(e.code)
      const pitch = basePitch + this.octaveOffset * 12
      this.listeners.forEach((l) => l.onNoteOff(pitch))
    }
  }
}

export const midiManager = new MidiManager()
