import { BarChart3 } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  income: number
  expense: number
  savings: number
  txCount: number
  onInView?: () => void
}

export function AnnualOverview({ bgColor, income, expense, savings, txCount, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={BarChart3} label="El año en números" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{fmt(savings)}</div>
      <div className="wrapped-stat-sub wrapped-anim">ahorro neto del año</div>
      <div className="wrapped-list wrapped-anim">
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Ingresos</div>
          <div className="wrapped-list-item-amount">{fmt(income)}</div>
        </div>
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Gastos</div>
          <div className="wrapped-list-item-amount">{fmt(expense)}</div>
        </div>
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Transacciones</div>
          <div className="wrapped-list-item-amount">{txCount}</div>
        </div>
      </div>
    </WrappedSection>
  )
}
