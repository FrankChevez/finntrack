import { Sparkles } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'

export function MonthlyHero({ bgColor, periodLabel, onInView }: { bgColor: string; periodLabel: string; onInView?: () => void }) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Sparkles} label="Tu mes en finanzas" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{periodLabel}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        Aquí tienes un resumen de lo que pasó con tu dinero.
      </div>
    </WrappedSection>
  )
}
