import { Track } from '../types/daw'

export class UndoRedoStack {
  private past: Track[][] = []
  private present: Track[]
  private future: Track[][] = []
  private maxHistory: number

  constructor(initialState: Track[] = [], maxHistory = 40) {
    this.present = JSON.parse(JSON.stringify(initialState))
    this.maxHistory = maxHistory
  }

  public push(newState: Track[]) {
    this.past.push(JSON.parse(JSON.stringify(this.present)))
    if (this.past.length > this.maxHistory) {
      this.past.shift()
    }
    this.present = JSON.parse(JSON.stringify(newState))
    this.future = []
  }

  public undo(): Track[] | null {
    if (this.past.length === 0) return null
    const previous = this.past.pop()!
    this.future.unshift(JSON.parse(JSON.stringify(this.present)))
    this.present = previous
    return JSON.parse(JSON.stringify(this.present))
  }

  public redo(): Track[] | null {
    if (this.future.length === 0) return null
    const next = this.future.shift()!
    this.past.push(JSON.parse(JSON.stringify(this.present)))
    this.present = next
    return JSON.parse(JSON.stringify(this.present))
  }

  public canUndo(): boolean {
    return this.past.length > 0
  }

  public canRedo(): boolean {
    return this.future.length > 0
  }

  public getCurrent(): Track[] {
    return JSON.parse(JSON.stringify(this.present))
  }

  public reset(initialState: Track[]) {
    this.past = []
    this.future = []
    this.present = JSON.parse(JSON.stringify(initialState))
  }
}

export const undoRedoStack = new UndoRedoStack()
