import { TrendingUp } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  income: number
  expense: number
  savings: number
  savingsRate: number
  onInView?: () => void
}

export function MonthlyBalance({ bgColor, income, expense, savings, savingsRate, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={TrendingUp} label="Balance del mes" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{fmt(savings)}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        ahorro neto · {savingsRate}% de tu ingreso
      </div>
      <div className="wrapped-list wrapped-anim">
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Ingresos</div>
          <div className="wrapped-list-item-amount">{fmt(income)}</div>
        </div>
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Gastos</div>
          <div className="wrapped-list-item-amount">{fmt(expense)}</div>
        </div>
      </div>
    </WrappedSection>
  )
}
