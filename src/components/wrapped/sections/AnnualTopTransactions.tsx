import { Trophy } from 'lucide-react'
import { WrappedSection } from '../WrappedSection'
import { fmt } from '../../../lib/utils'

interface Props {
  bgColor: string
  transactions: Array<{ desc: string; amount: number; date: string }>
  onInView?: () => void
}

export function AnnualTopTransactions({ bgColor, transactions, onInView }: Props) {
  return (
    <WrappedSection bgColor={bgColor} Icon={Trophy} label="Top gastos del año" onInView={onInView}>
      {transactions.length > 0 ? (
        <div className="wrapped-list wrapped-anim">
          {transactions.map((t, i) => (
            <div key={i} className="wrapped-list-item">
              <div>
                <div className="wrapped-list-item-main">{t.desc}</div>
                <div className="wrapped-list-item-sub">{t.date}</div>
              </div>
              <div className="wrapped-list-item-amount">{fmt(t.amount)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="wrapped-stat-sub wrapped-anim">Sin transacciones registradas.</div>
      )}
    </WrappedSection>
  )
}
