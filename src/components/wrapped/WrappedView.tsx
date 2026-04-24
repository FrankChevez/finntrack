import { useMemo, useState, useCallback, useEffect } from 'react'
import type { FinanzasDB } from '../../types'
import { computeMonthlyWrapped, computeAnnualWrapped } from '../../lib/wrapped'
import { MonthlyHero } from './sections/MonthlyHero'
import { MonthlyBalance } from './sections/MonthlyBalance'
import { MonthlyTopCategory } from './sections/MonthlyTopCategory'
import { MonthlyTopTransactions } from './sections/MonthlyTopTransactions'
import { MonthlyBiggestDay } from './sections/MonthlyBiggestDay'
import { MonthlyGoals } from './sections/MonthlyGoals'
import { MonthlyVsPrev } from './sections/MonthlyVsPrev'
import { AnnualHero } from './sections/AnnualHero'
import { AnnualOverview } from './sections/AnnualOverview'
import { AnnualBestMonth } from './sections/AnnualBestMonth'
import { AnnualWorstMonth } from './sections/AnnualWorstMonth'
import { AnnualTopCategories } from './sections/AnnualTopCategories'
import { AnnualTopTransactions } from './sections/AnnualTopTransactions'
import { AnnualGoals } from './sections/AnnualGoals'
import { AnnualDebtsPaid } from './sections/AnnualDebtsPaid'
import { AnnualNetWorth } from './sections/AnnualNetWorth'
import { ClosingCard } from './sections/ClosingCard'

const PALETTE = ['#cc004a', '#1A4FB8', '#5B3FA8', '#157A45', '#9A5A00', '#6898FF', '#30D47A', '#F5A623']
const color = (i: number) => PALETTE[i % PALETTE.length]

interface WrappedViewProps {
  type: 'monthly' | 'annual'
  period: string
  db: FinanzasDB
  onClose: () => void
}

export function WrappedView({ type, period, db, onClose }: WrappedViewProps) {
  const monthlyData = useMemo(
    () => (type === 'monthly' ? computeMonthlyWrapped(db, period) : null),
    [type, period, db]
  )
  const annualData = useMemo(
    () => (type === 'annual' ? computeAnnualWrapped(db, period) : null),
    [type, period, db]
  )

  const totalSections = type === 'monthly' ? 8 : 10
  const [activeIdx, setActiveIdx] = useState(0)
  const makeOnInView = useCallback((idx: number) => () => setActiveIdx(idx), [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const title = type === 'monthly'
    ? `Wrapped · ${monthlyData?.periodLabel ?? ''}`
    : `Wrapped · ${annualData?.periodLabel ?? ''}`

  return (
    <div className="wrapped-overlay">
      <div className="wrapped-topbar">
        <div className="wrapped-dots">
          {Array.from({ length: totalSections }).map((_, i) => (
            <div key={i} className={`wrapped-dot ${i === activeIdx ? 'active' : ''}`} />
          ))}
        </div>
        <div className="wrapped-title">{title}</div>
        <button className="wrapped-close" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      {monthlyData && (
        <>
          <MonthlyHero bgColor={color(0)} periodLabel={monthlyData.periodLabel} onInView={makeOnInView(0)} />
          <MonthlyBalance bgColor={color(1)} {...monthlyData.balance} onInView={makeOnInView(1)} />
          <MonthlyTopCategory bgColor={color(2)} category={monthlyData.topCategory} onInView={makeOnInView(2)} />
          <MonthlyTopTransactions bgColor={color(3)} transactions={monthlyData.topTransactions} onInView={makeOnInView(3)} />
          <MonthlyBiggestDay bgColor={color(4)} biggestDay={monthlyData.biggestDay} onInView={makeOnInView(4)} />
          <MonthlyGoals bgColor={color(5)} totalContributed={monthlyData.goals.totalContributed} completedNames={monthlyData.goals.completedNames} onInView={makeOnInView(5)} />
          <MonthlyVsPrev bgColor={color(6)} vsPrev={monthlyData.vsPrev} onInView={makeOnInView(6)} />
          <ClosingCard bgColor={color(7)} message={`Eso fue ${monthlyData.periodLabel.split(' ')[0]}. Nos vemos en el próximo mes.`} onClose={onClose} onInView={makeOnInView(7)} />
        </>
      )}

      {annualData && (
        <>
          <AnnualHero bgColor={color(0)} year={annualData.periodLabel} onInView={makeOnInView(0)} />
          <AnnualOverview bgColor={color(1)} {...annualData.overview} onInView={makeOnInView(1)} />
          <AnnualBestMonth bgColor={color(2)} bestMonth={annualData.bestMonth} onInView={makeOnInView(2)} />
          <AnnualWorstMonth bgColor={color(3)} worstMonth={annualData.worstMonth} onInView={makeOnInView(3)} />
          <AnnualTopCategories bgColor={color(4)} categories={annualData.topCategories} onInView={makeOnInView(4)} />
          <AnnualTopTransactions bgColor={color(5)} transactions={annualData.topTransactions} onInView={makeOnInView(5)} />
          <AnnualGoals bgColor={color(6)} completed={annualData.goals.completed} totalContributed={annualData.goals.totalContributed} onInView={makeOnInView(6)} />
          <AnnualDebtsPaid bgColor={color(7)} debtsPaidDown={annualData.debtsPaidDown} onInView={makeOnInView(7)} />
          <AnnualNetWorth bgColor={color(0)} start={annualData.netWorth.start} end={annualData.netWorth.end} delta={annualData.netWorth.delta} onInView={makeOnInView(8)} />
          <ClosingCard bgColor={color(1)} message={`Eso fue ${annualData.periodLabel}. A por el siguiente año.`} onClose={onClose} onInView={makeOnInView(9)} />
        </>
      )}
    </div>
  )
}
