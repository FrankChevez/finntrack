import { LineChart } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  start: number
  end: number
  delta: number
  onInView?: () => void
}

export function AnnualNetWorth({ bgColor, start, end, delta, onInView }: Props) {
  const sign = delta >= 0 ? '+' : '−'
  return (
    <WrappedSection bgColor={bgColor} Icon={LineChart} label="Evolución del patrimonio" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{sign}{fmt(Math.abs(delta))}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        Tu patrimonio neto {delta >= 0 ? 'creció' : 'bajó'} este año.
      </div>
      <div className="wrapped-list wrapped-anim">
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Inicio del año</div>
          <div className="wrapped-list-item-amount">{fmt(start)}</div>
        </div>
        <div className="wrapped-list-item">
          <div className="wrapped-list-item-main">Fin del año</div>
          <div className="wrapped-list-item-amount">{fmt(end)}</div>
        </div>
      </div>
    </WrappedSection>
  )
}
