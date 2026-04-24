import { Target } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  completed: number
  totalContributed: number
  onInView?: () => void
}

export function AnnualGoals({ bgColor, completed, totalContributed, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Target} label="Metas conquistadas" onInView={onInView}>
      <div className="wrapped-stat-big wrapped-anim">{completed}</div>
      <div className="wrapped-stat-sub wrapped-anim">
        {completed === 1 ? 'meta completada' : 'metas completadas'} este año
      </div>
      {totalContributed > 0 && (
        <div className="wrapped-stat-sub wrapped-anim" style={{marginTop:10,opacity:0.75}}>
          Aportaste {fmt(totalContributed)} en total
        </div>
      )}
    </WrappedSection>
  )
}
