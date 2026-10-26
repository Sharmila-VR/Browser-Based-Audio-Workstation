import { describe, it, expect, beforeEach } from 'vitest'
import { UndoRedoStack } from '../store/history'
import { Track } from '../types/daw'

describe('UndoRedoStack', () => {
  let stack: UndoRedoStack

  const createTrack = (id: string, name: string): Track => ({
    id,
    name,
    type: 'audio',
    color: '#00e5ff',
    volume: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    clips: [],
    automationLanes: [],
    effects: {} as any
  })

  beforeEach(() => {
    stack = new UndoRedoStack([], 5)
  })

  it('initializes with empty state and cannot undo or redo', () => {
    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(false)
    expect(stack.undo()).toBeNull()
    expect(stack.redo()).toBeNull()
  })

  it('records state snapshots and supports undo', () => {
    const state1 = [createTrack('t1', 'Track 1')]
    const state2 = [createTrack('t1', 'Track 1'), createTrack('t2', 'Track 2')]

    stack.push(state1)
    stack.push(state2)

    expect(stack.canUndo()).toBe(true)
    expect(stack.getCurrent()).toHaveLength(2)

    const undoneState = stack.undo()
    expect(undoneState).toHaveLength(1)
    expect(undoneState![0].id).toBe('t1')
    expect(stack.canRedo()).toBe(true)
  })

  it('supports redo back to the forward state', () => {
    const state1 = [createTrack('t1', 'Track 1')]
    const state2 = [createTrack('t1', 'Track 1'), createTrack('t2', 'Track 2')]

    stack.push(state1)
    stack.push(state2)

    stack.undo()
    expect(stack.getCurrent()).toHaveLength(1)

    const redoneState = stack.redo()
    expect(redoneState).toHaveLength(2)
    expect(stack.canRedo()).toBe(false)
  })

  it('clears future stack when a new action is pushed after undo', () => {
    const state1 = [createTrack('t1', 'Track 1')]
    const state2 = [createTrack('t2', 'Track 2')]
    const state3 = [createTrack('t3', 'Track 3')]

    stack.push(state1)
    stack.push(state2)
    stack.undo()
    expect(stack.canRedo()).toBe(true)

    stack.push(state3)
    expect(stack.canRedo()).toBe(false)
    expect(stack.getCurrent()[0].id).toBe('t3')
  })

  it('caps history size at maxHistory', () => {
    for (let i = 1; i <= 10; i++) {
      stack.push([createTrack(`t${i}`, `Track ${i}`)])
    }

    let undoCount = 0
    while (stack.canUndo()) {
      stack.undo()
      undoCount++
    }
    expect(undoCount).toBeLessThanOrEqual(5)
  })

  it('resets history cleanly', () => {
    stack.push([createTrack('t1', 'Track 1')])
    stack.push([createTrack('t2', 'Track 2')])
    stack.reset([createTrack('t0', 'Initial')])

    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(false)
    expect(stack.getCurrent()[0].name).toBe('Initial')
  })
})
