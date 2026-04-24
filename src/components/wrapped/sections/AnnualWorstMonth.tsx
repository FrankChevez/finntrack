import { Flame } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt, ymLabel } from '../../../lib/utils'

interface Props {
  bgColor: string
  worstMonth: { ym: string; expense: number } | null
  onInView?: () => void
}

export function AnnualWorstMonth({ bgColor, worstMonth, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Flame} label="Tu mes más caótico" onInView={onInView}>
      {worstMonth ? (
        <>
          <div className="wrapped-stat-big wrapped-anim">{ymLabel(worstMonth.ym).split(' ')[0]}</div>
          <div className="wrapped-stat-sub wrapped-anim">
            Gastaste {fmt(worstMonth.expense)}. Todos tenemos un mes así.
          </div>
        </>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin datos suficientes.</div>
      )}
    </WrappedSection>
  )
}
