import { useMemo, useState } from 'react'
import { useStore } from '../stores/useStore'
import { ymLabel } from '../lib/utils'
import { availableMonths, availableYears } from '../lib/wrapped'
import { WrappedView } from '../components/wrapped/WrappedView'

export default function WrappedPage() {
  const { accounts, cards, transactions, budgets, goals, debts, recurring, transfers, installments } = useStore()
  const [wrappedPeriod, setWrappedPeriod] = useState<{ type: 'monthly' | 'annual'; period: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const monthOptions = useMemo(() => availableMonths(transactions), [transactions])
  const yearOptions = useMemo(() => availableYears(transactions), [transactions])

  return (
    <div className="page-enter">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Tu Wrapped</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Un resumen visual de tu mes o año financiero.
        </div>
        <div className="wrapped-reporte-card">
          <div className="form-group">
            <label className="form-label">Mensual</label>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">— Elegir mes —</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {ymLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-accent"
            disabled={!selectedMonth}
            onClick={() => setWrappedPeriod({ type: 'monthly', period: selectedMonth })}
          >
            Ver Mensual
          </button>

          <div className="form-group">
            <label className="form-label">Anual</label>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">— Elegir año —</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-accent"
            disabled={!selectedYear}
            onClick={() => setWrappedPeriod({ type: 'annual', period: selectedYear })}
          >
            Ver Anual
          </button>
        </div>
      </div>

      {wrappedPeriod && (
        <WrappedView
          type={wrappedPeriod.type}
          period={wrappedPeriod.period}
          db={{ accounts, cards, transactions, budgets, goals, debts, recurring, transfers, installments, assistantMessages: [] }}
          onClose={() => setWrappedPeriod(null)}
        />
      )}
    </div>
  )
}
