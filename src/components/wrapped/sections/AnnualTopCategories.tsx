import { List } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  categories: Array<{ name: string; amount: number; pct: number }>
  onInView?: () => void
}

export function AnnualTopCategories({ bgColor, categories, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={List} label="Top 3 categorías del año" onInView={onInView}>
      {categories.length > 0 ? (
        <div className="wrapped-list wrapped-anim">
          {categories.map((c, i) => (
            <div key={c.name} className="wrapped-list-item">
              <div>
                <div className="wrapped-list-item-main">#{i + 1} · {c.name}</div>
                <div className="wrapped-list-item-sub">{c.pct}% del gasto total</div>
              </div>
              <div className="wrapped-list-item-amount">{fmt(c.amount)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin gastos registrados este año.</div>
      )}
    </WrappedSection>
  )
}
