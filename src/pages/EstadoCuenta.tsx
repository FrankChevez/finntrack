import { useState } from 'react'
import { useStore } from '../stores/useStore'
import { fmt } from '../lib/utils'
import type { Transaction } from '../types'

interface Cycle {
  start: string
  end: string
  label: string
  isCurrent: boolean
}

function clampDay(y: number, m: number, d: number): Date {
  const lastDay = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(d, lastDay))
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

function buildCycles(closeDay: number, count = 6): Cycle[] {
  const today = new Date()
  const todayISO = toISO(today)
  const cycles: Cycle[] = []

  let anchorYear = today.getFullYear()
  let anchorMonth = today.getMonth()
  if (today.getDate() < closeDay) {
    anchorMonth -= 1
    if (anchorMonth < 0) { anchorMonth = 11; anchorYear -= 1 }
  }

  const anchorDate = clampDay(anchorYear, anchorMonth, closeDay)

  cycles.push({
    start: toISO(anchorDate),
    end: todayISO,
    label: `${shortDate(toISO(anchorDate))} – hoy`,
    isCurrent: true,
  })

  for (let i = 1; i <= count; i++) {
    let eMonth = anchorMonth - i + 1
    let eYear = anchorYear
    while (eMonth < 0) { eMonth += 12; eYear -= 1 }

    let sMonth = eMonth - 1
    let sYear = eYear
    if (sMonth < 0) { sMonth = 11; sYear -= 1 }

    const startDate = clampDay(sYear, sMonth, closeDay)
    const endDateFull = clampDay(eYear, eMonth, closeDay)
    const endDate = new Date(endDateFull.getFullYear(), endDateFull.getMonth(), endDateFull.getDate() - 1)

    cycles.push({
      start: toISO(startDate),
      end: toISO(endDate),
      label: `${shortDate(toISO(startDate))} – ${shortDate(toISO(endDate))}`,
      isCurrent: false,
    })
  }

  return cycles
}

function cycleTxs(transactions: Transaction[], cardName: string, cycle: Cycle): Transaction[] {
  return transactions
    .filter(t => t.account === cardName && t.date >= cycle.start && t.date <= cycle.end)
    .sort((a, b) => b.date.localeCompare(a.date))
}

function cycleTotal(txs: Transaction[]): number {
  return txs.reduce((s, t) => s + (t.type === 'expense' ? Math.abs(t.amount) : 0), 0)
}

export function EstadoCuenta() {
  const { cards, transactions } = useStore()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(cards[0]?.id ?? null)
  const [openCycle, setOpenCycle] = useState(0)

  if (cards.length === 0) {
    return (
      <div className="page-enter">
        <div className="empty">Sin tarjetas registradas</div>
      </div>
    )
  }

  const card = cards.find(c => c.id === selectedCardId) ?? cards[0]
  const cycles = buildCycles(card.closeDay)
  const currentTxs = cycleTxs(transactions, card.name, cycles[0])
  const currentTotal = cycleTotal(currentTxs)

  return (
    <div className="page-enter">

      {/* Card selector */}
      <div className="form-group" style={{ marginBottom: 14 }}>
        <select
          className="form-select"
          value={selectedCardId ?? ''}
          onChange={e => { setSelectedCardId(e.target.value); setOpenCycle(0) }}
        >
          {cards.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="metric">
          <div className="metric-label">Saldo actual</div>
          <div className="metric-value neg">{fmt(card.balance)}</div>
        </div>
        <div className="metric accent">
          <div className="metric-label">Este ciclo</div>
          <div className="metric-value">{fmt(currentTotal)}</div>
        </div>
      </div>

      {/* Cycles accordion */}
      <div className="section-label">Historial</div>
      <div className="card mb">
        {cycles.map((cycle, idx) => {
          const txs = cycleTxs(transactions, card.name, cycle)
          const total = cycleTotal(txs)
          const isOpen = openCycle === idx
          return (
            <div
              key={cycle.start}
              style={{ borderBottom: idx < cycles.length - 1 ? '0.5px solid var(--border)' : undefined }}
            >
              <button
                type="button"
                onClick={() => setOpenCycle(isOpen ? -1 : idx)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: cycle.isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {cycle.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {txs.length} movimiento{txs.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--neg)', fontWeight: 700 }}>
                    {fmt(total)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && txs.length > 0 && (
                <div style={{ paddingBottom: 10 }}>
                  {txs.map(t => (
                    <div
                      key={t.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '0.5px solid var(--border)' }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{t.desc}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.date} · {t.cat}</div>
                      </div>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--neg)' }}>
                        {fmt(Math.abs(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {isOpen && txs.length === 0 && (
                <div className="empty" style={{ padding: '8px 0 12px' }}>Sin movimientos en este ciclo</div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
