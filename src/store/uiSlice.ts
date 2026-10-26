import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  mixerOpen: boolean
  pianoRollTrackId: string | null
  pianoRollClipId: string | null
  effectsModalTrackId: string | null
  synthModalTrackId: string | null
  exportModalOpen: boolean
  keyboardOpen: boolean
  shortcutsModalOpen: boolean
  announcement: string
}

const initialState: UIState = {
  mixerOpen: false,
  pianoRollTrackId: null,
  pianoRollClipId: null,
  effectsModalTrackId: null,
  synthModalTrackId: null,
  exportModalOpen: false,
  keyboardOpen: false,
  shortcutsModalOpen: false,
  announcement: 'Welcome to AuraDAW. Ready.'
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMixer(state) {
      state.mixerOpen = !state.mixerOpen
    },
    openPianoRoll(state, action: PayloadAction<{ trackId: string; clipId: string }>) {
      state.pianoRollTrackId = action.payload.trackId
      state.pianoRollClipId = action.payload.clipId
    },
    closePianoRoll(state) {
      state.pianoRollTrackId = null
      state.pianoRollClipId = null
    },
    openEffectsModal(state, action: PayloadAction<string>) {
      state.effectsModalTrackId = action.payload
    },
    closeEffectsModal(state) {
      state.effectsModalTrackId = null
    },
    openSynthModal(state, action: PayloadAction<string>) {
      state.synthModalTrackId = action.payload
    },
    closeSynthModal(state) {
      state.synthModalTrackId = null
    },
    setExportModalOpen(state, action: PayloadAction<boolean>) {
      state.exportModalOpen = action.payload
    },
    toggleKeyboard(state) {
      state.keyboardOpen = !state.keyboardOpen
    },
    setShortcutsModalOpen(state, action: PayloadAction<boolean>) {
      state.shortcutsModalOpen = action.payload
    },
    announce(state, action: PayloadAction<string>) {
      state.announcement = action.payload
    }
  }
})

export const {
  toggleMixer,
  openPianoRoll,
  closePianoRoll,
  openEffectsModal,
  closeEffectsModal,
  openSynthModal,
  closeSynthModal,
  setExportModalOpen,
  toggleKeyboard,
  setShortcutsModalOpen,
  announce
} = uiSlice.actions

export default uiSlice.reducer
