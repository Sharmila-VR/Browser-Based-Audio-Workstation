const DB_NAME = 'AuraDAW_DB'
const DB_VERSION = 1
const STORE_PROJECT = 'project'
const STORE_AUDIO = 'audio_files'

export function openDAWDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_PROJECT)) {
        db.createObjectStore(STORE_PROJECT, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProjectToStorage(
  projectState: any,
  buffers: Map<string, AudioBuffer>
): Promise<void> {
  const db = await openDAWDatabase()
  const tx = db.transaction([STORE_PROJECT, STORE_AUDIO], 'readwrite')
  const projectStore = tx.objectStore(STORE_PROJECT)
  const audioStore = tx.objectStore(STORE_AUDIO)

  projectStore.put({
    id: 'current_project',
    timestamp: Date.now(),
    data: projectState
  })

  for (const [id, buffer] of buffers.entries()) {
    const channels: Float32Array[] = []
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c))
    }
    audioStore.put({
      id,
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length,
      channels
    })
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadProjectFromStorage(
  audioCtx: BaseAudioContext
): Promise<{ project: any; buffers: Map<string, AudioBuffer> } | null> {
  const db = await openDAWDatabase()
  const tx = db.transaction([STORE_PROJECT, STORE_AUDIO], 'readonly')
  const projectStore = tx.objectStore(STORE_PROJECT)
  const audioStore = tx.objectStore(STORE_AUDIO)

  const projectReq = projectStore.get('current_project')
  const audioReq = audioStore.getAll()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      const projectEntry = projectReq.result
      if (!projectEntry) {
        resolve(null)
        return
      }

      const bufferMap = new Map<string, AudioBuffer>()
      const audioEntries = audioReq.result || []

      for (const entry of audioEntries) {
        try {
          const buf = audioCtx.createBuffer(
            entry.numberOfChannels,
            entry.length,
            entry.sampleRate
          )
          for (let c = 0; c < entry.numberOfChannels; c++) {
            buf.copyToChannel(entry.channels[c], c)
          }
          bufferMap.set(entry.id, buf)
        } catch {
          // Skip invalid
        }
      }

      resolve({
        project: projectEntry.data,
        buffers: bufferMap
      })
    }

    tx.onerror = () => reject(tx.error)
  })
}
