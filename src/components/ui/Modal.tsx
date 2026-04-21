import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: Props) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={wide ? { width: 560 } : {}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}
