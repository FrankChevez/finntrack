import { Check } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'

interface Props {
  bgColor: string
  message: string
  onClose: () => void
  onInView?: () => void
}

export function ClosingCard({ bgColor, message, onClose, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Check} label="Fin del Wrapped" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim" style={{fontSize:'clamp(28px, 4vw, 42px)'}}>{message}</div>
      <button className="wrapped-closing-button wrapped-anim" onClick={onClose}>
        Cerrar
      </button>
    </WrappedSection>
  )
}
