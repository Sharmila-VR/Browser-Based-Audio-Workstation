import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GridSnap } from '../types/daw'

export type ToolMode = 'pointer' | 'cut' | 'draw' | 'erase'

export interface TimelineState {
  zoom: number
  gridSnap: GridSnap
  selectedTrackId: string | null
  selectedClipId: string | null
  activeTool: ToolMode
  scrollLeft: number
}

const initialState: TimelineState = {
  zoom: 60,
  gridSnap: '1/4',
  selectedTrackId: null,
  selectedClipId: null,
  activeTool: 'pointer',
  scrollLeft: 0
}

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setZoom(state, action: PayloadAction<number>) {
      state.zoom = Math.max(15, Math.min(250, action.payload))
    },
    setGridSnap(state, action: PayloadAction<GridSnap>) {
      state.gridSnap = action.payload
    },
    setSelectedTrackId(state, action: PayloadAction<string | null>) {
      state.selectedTrackId = action.payload
    },
    setSelectedClipId(state, action: PayloadAction<string | null>) {
      state.selectedClipId = action.payload
    },
    setActiveTool(state, action: PayloadAction<ToolMode>) {
      state.activeTool = action.payload
    },
    setScrollLeft(state, action: PayloadAction<number>) {
      state.scrollLeft = Math.max(0, action.payload)
    }
  }
})

export const {
  setZoom,
  setGridSnap,
  setSelectedTrackId,
  setSelectedClipId,
  setActiveTool,
  setScrollLeft
} = timelineSlice.actions

export default timelineSlice.reducer
