import { Award } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { ymLabel } from '../../../lib/utils'

interface Props {
  bgColor: string
  bestMonth: { ym: string; savingsRate: number } | null
  onInView?: () => void
}

export function AnnualBestMonth({ bgColor, bestMonth, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Award} label="Tu mes más disciplinado" onInView={onInView}>
      {bestMonth ? (
        <>
          <div className="wrapped-stat-big wrapped-anim">{ymLabel(bestMonth.ym).split(' ')[0]}</div>
          <div className="wrapped-stat-sub wrapped-anim">
            {bestMonth.savingsRate}% de tasa de ahorro — impecable.
          </div>
        </>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin datos suficientes del año.</div>
      )}
    </WrappedSection>
  )
}
