import { Crown } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  category: { name: string; amount: number; pctOfTotal: number } | null
  onInView?: () => void
}

export function MonthlyTopCategory({ bgColor, category, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Crown} label="Tu categoría reina" onInView={onInView}>
      {category ? (
        <>
          <div className="wrapped-stat-big wrapped-anim">{category.name}</div>
          <div className="wrapped-stat-sub wrapped-anim">
            {fmt(category.amount)} · {category.pctOfTotal}% de tus gastos
          </div>
        </>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin gastos registrados este mes.</div>
      )}
    </WrappedSection>
  )
}
