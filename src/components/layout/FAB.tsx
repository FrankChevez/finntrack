import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Nueva transacción' }: FABProps) {
  return (
    <button
      type="button"
      className="fab"
      onClick={onClick}
      aria-label={label}
    >
      <Plus size={24} strokeWidth={2.4} />
    </button>
  )
}
