import React from 'react'
import { useAppSelector } from '../../store'

export const LiveAnnouncer: React.FC = () => {
  const announcement = useAppSelector((state) => state.ui.announcement)

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: 0
      }}
    >
      {announcement}
    </div>
  )
}
