import { Sparkles } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'

export function AnnualHero({ bgColor, year, onInView }: { bgColor: string; year: string; onInView?: () => void }) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Sparkles} label="Tu año en finanzas" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim" style={{fontSize:'clamp(72px, 12vw, 120px)'}}>{year}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        Lo resumimos en 9 tarjetas. Desliza para verlas.
      </div>
    </WrappedSection>
  )
}
