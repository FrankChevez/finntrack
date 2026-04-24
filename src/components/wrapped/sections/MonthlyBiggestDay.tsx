import { Calendar } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  biggestDay: { date: string; amount: number } | null
  onInView?: () => void
}

export function MonthlyBiggestDay({ bgColor, biggestDay, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Calendar} label="Tu día más caro" onInView={onInView}>
      {biggestDay ? (
        <>
          <div className="wrapped-stat-big wrapped-anim">{fmt(biggestDay.amount)}</div>
          <div className="wrapped-stat-sub wrapped-anim">el {biggestDay.date}</div>
        </>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin gastos registrados.</div>
      )}
    </WrappedSection>
  )
}
