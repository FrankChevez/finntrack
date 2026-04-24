import { CheckCircle } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  debtsPaidDown: number
  onInView?: () => void
}

export function AnnualDebtsPaid({ bgColor, debtsPaidDown, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={CheckCircle} label="Deudas que empujaste" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{fmt(debtsPaidDown)}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        {debtsPaidDown > 0
          ? 'pagados a deudas este año — cada dólar cuenta.'
          : 'No registraste pagos de deuda este año.'}
      </div>
    </WrappedSection>
  )
}
