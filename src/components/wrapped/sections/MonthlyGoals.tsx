import { Target } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  totalContributed: number
  completedNames: string[]
  onInView?: () => void
}

export function MonthlyGoals({ bgColor, totalContributed, completedNames, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Target} label="Metas del mes" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{fmt(totalContributed)}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        aportados a tus metas este mes
      </div>
      {completedNames.length > 0 && (
        <div className="wrapped-list wrapped-anim">
          {completedNames.map((n) => (
            <div key={n} className="wrapped-list-item">
              <div className="wrapped-list-item-main">✓ {n}</div>
            </div>
          ))}
        </div>
      )}
    </WrappedSection>
  )
}
