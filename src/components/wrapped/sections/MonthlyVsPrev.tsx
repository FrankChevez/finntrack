import { ArrowUpDown } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'

interface Props {
  bgColor: string
  vsPrev: { expenseDeltaPct: number; savingsDeltaPct: number } | null
  onInView?: () => void
}

export function MonthlyVsPrev({ bgColor, vsPrev, onInView }: Props) {
  if (!vsPrev) {
    return (
      <WrappedSection bgColor={bgColor} Icon={ArrowUpDown} label="vs el mes pasado" onInView={onInView}>
        <div className="wrapped-stat-sub wrapped-anim">
          Este es tu primer mes registrado. ¡Ya empezamos a llevar la cuenta!
        </div>
      </WrappedSection>
    )
  }

  const expMsg = vsPrev.expenseDeltaPct >= 0
    ? `Gastaste ${Math.abs(vsPrev.expenseDeltaPct)}% más que el mes pasado`
    : `Gastaste ${Math.abs(vsPrev.expenseDeltaPct)}% menos que el mes pasado`

  const savMsg = vsPrev.savingsDeltaPct >= 0
    ? `y ahorraste ${Math.abs(vsPrev.savingsDeltaPct)}% más`
    : `y ahorraste ${Math.abs(vsPrev.savingsDeltaPct)}% menos`

  return (
    <WrappedSection bgColor={bgColor} Icon={ArrowUpDown} label="vs el mes pasado" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim" style={{fontSize:'clamp(28px, 4vw, 42px)'}}>{expMsg}</div>
      <div className="wrapped-stat-sub wrapped-anim">{savMsg}</div>
    </WrappedSection>
  )
}
