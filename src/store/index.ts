import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import transportReducer from './transportSlice'
import tracksReducer from './tracksSlice'
import timelineReducer from './timelineSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    transport: transportReducer,
    tracks: tracksReducer,
    timeline: timelineReducer,
    ui: uiReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
