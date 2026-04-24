import { useEffect, useState, useCallback } from 'react'
import type { Transaction } from '../types'

export type AutoWrappedTarget =
  | { type: 'monthly'; period: string }
  | { type: 'annual'; period: string }
  | null

const MONTHLY_KEY = 'wrapped_seen_monthly'
const ANNUAL_KEY = 'wrapped_seen_annual'

function prevYM(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1) // m is 1-based; m-2 gives previous month
  return d.toISOString().slice(0, 7)
}

function hasTxIn(transactions: Transaction[], prefix: string): boolean {
  return transactions.some((t) => t.date.startsWith(prefix))
}

export function useAutoWrapped(transactions: Transaction[]): {
  target: AutoWrappedTarget
  markSeen: (target: AutoWrappedTarget) => void
} {
  const [target, setTarget] = useState<AutoWrappedTarget>(null)

  useEffect(() => {
    const today = new Date()
    const currentYm = today.toISOString().slice(0, 7)
    const prevYear = String(today.getFullYear() - 1)
    const prevMonth = prevYM(currentYm)

    const seenMonthly = localStorage.getItem(MONTHLY_KEY)
    const seenAnnual = localStorage.getItem(ANNUAL_KEY)
    const isFirstTime = seenMonthly === null && seenAnnual === null

    // First-time user: silently mark previous period as seen, don't auto-show
    if (isFirstTime) {
      localStorage.setItem(MONTHLY_KEY, prevMonth)
      localStorage.setItem(ANNUAL_KEY, prevYear)
      return
    }

    // Priority: annual takes precedence — only fires in January
    const annualQualifies =
      today.getMonth() === 0 &&
      (seenAnnual ?? '') < prevYear &&
      hasTxIn(transactions, prevYear)

    if (annualQualifies) {
      setTarget({ type: 'annual', period: prevYear })
      return
    }

    const monthlyQualifies =
      (seenMonthly ?? '') < prevMonth &&
      hasTxIn(transactions, prevMonth)

    if (monthlyQualifies) {
      setTarget({ type: 'monthly', period: prevMonth })
    }
  }, [transactions])

  const markSeen = useCallback((t: AutoWrappedTarget) => {
    if (!t) return
    if (t.type === 'monthly') localStorage.setItem(MONTHLY_KEY, t.period)
    else localStorage.setItem(ANNUAL_KEY, t.period)
    setTarget(null)
  }, [])

  return { target, markSeen }
}
