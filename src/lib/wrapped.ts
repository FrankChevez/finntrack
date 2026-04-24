import type { FinanzasDB, Transaction, Account, Card } from '../types'
import { ymLabel, prevYM } from './utils'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface MonthlyWrapped {
  period: string              // 'YYYY-MM'
  periodLabel: string         // 'Octubre 2026'
  balance: {
    income: number
    expense: number
    savings: number
    savingsRate: number       // 0-100
  }
  topCategory: { name: string; amount: number; pctOfTotal: number } | null
  topTransactions: Array<{ desc: string; amount: number; date: string }>
  biggestDay: { date: string; amount: number } | null
  goals: {
    totalContributed: number
    completedNames: string[]
  }
  vsPrev: { expenseDeltaPct: number; savingsDeltaPct: number } | null
}

export interface AnnualWrapped {
  period: string              // 'YYYY'
  periodLabel: string         // '2026'
  overview: {
    income: number
    expense: number
    savings: number
    txCount: number
  }
  bestMonth: { ym: string; savingsRate: number } | null
  worstMonth: { ym: string; expense: number } | null
  topCategories: Array<{ name: string; amount: number; pct: number }>
  topTransactions: Array<{ desc: string; amount: number; date: string }>
  goals: { completed: number; totalContributed: number }
  debtsPaidDown: number
  netWorth: { start: number; end: number; delta: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthRangeTx(transactions: Transaction[], ym: string): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(ym))
}

function yearRangeTx(transactions: Transaction[], year: string): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(year))
}

function sumIncome(tx: Transaction[]): number {
  return tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
}

function sumExpense(tx: Transaction[]): number {
  return Math.abs(tx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))
}

// Net worth at end of a given YYYY-MM: (accounts - cards) rewound to historical.
function netWorthAtEndOfMonth(accounts: Account[], cards: Card[], transactions: Transaction[], ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  const endOfMonth = new Date(y, m, 0).toISOString().slice(0, 10)

  let total = 0
  for (const acc of accounts) {
    const netAfter = transactions
      .filter((t) => t.account === acc.name && t.date > endOfMonth)
      .reduce((s, t) => s + t.amount, 0)
    total += acc.balance - netAfter
  }
  for (const card of cards) {
    const netAfter = transactions
      .filter((t) => t.account === card.name && t.date > endOfMonth)
      .reduce((s, t) => s + t.amount, 0)
    const historicalDebt = card.balance - netAfter
    total -= historicalDebt
  }
  return parseFloat(total.toFixed(2))
}

// ─── Available periods ───────────────────────────────────────────────────────
export function availableMonths(transactions: Transaction[]): string[] {
  const set = new Set<string>()
  transactions.forEach((t) => set.add(t.date.slice(0, 7)))
  return Array.from(set).sort().reverse()
}

export function availableYears(transactions: Transaction[]): string[] {
  const set = new Set<string>()
  transactions.forEach((t) => set.add(t.date.slice(0, 4)))
  return Array.from(set).sort().reverse()
}

// ─── Monthly compute ─────────────────────────────────────────────────────────
export function computeMonthlyWrapped(db: FinanzasDB, ym: string): MonthlyWrapped {
  const tx = monthRangeTx(db.transactions, ym)
  const income = sumIncome(tx)
  const expense = sumExpense(tx)
  const savings = income - expense
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

  const byCat: Record<string, number> = {}
  tx.filter((t) => t.amount < 0).forEach((t) => {
    byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amount)
  })
  const topCatEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
  const topCategory = topCatEntry
    ? { name: topCatEntry[0], amount: topCatEntry[1], pctOfTotal: expense > 0 ? Math.round((topCatEntry[1] / expense) * 100) : 0 }
    : null

  const topTransactions = tx
    .filter((t) => t.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3)
    .map((t) => ({ desc: t.desc, amount: Math.abs(t.amount), date: t.date }))

  const byDay: Record<string, number> = {}
  tx.filter((t) => t.amount < 0).forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + Math.abs(t.amount)
  })
  const biggestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  const biggestDay = biggestDayEntry ? { date: biggestDayEntry[0], amount: biggestDayEntry[1] } : null

  const transfersInMonth = db.transfers.filter((t) => t.date.startsWith(ym) && t.note?.startsWith('Aporte a meta:'))
  const totalContributed = transfersInMonth.reduce((s, t) => s + t.amount, 0)
  const completedNames = db.goals
    .filter((g) => g.target > 0 && g.saved >= g.target)
    .map((g) => g.name)

  const pm = prevYM(ym)
  const prevTx = monthRangeTx(db.transactions, pm)
  let vsPrev: { expenseDeltaPct: number; savingsDeltaPct: number } | null = null
  if (prevTx.length > 0) {
    const prevIncome = sumIncome(prevTx)
    const prevExpense = sumExpense(prevTx)
    const prevSavings = prevIncome - prevExpense
    const expenseDeltaPct = prevExpense > 0 ? parseFloat((((expense - prevExpense) / prevExpense) * 100).toFixed(1)) : 0
    const savingsDeltaPct = prevSavings !== 0 ? parseFloat((((savings - prevSavings) / Math.abs(prevSavings)) * 100).toFixed(1)) : 0
    vsPrev = { expenseDeltaPct, savingsDeltaPct }
  }

  return {
    period: ym,
    periodLabel: ymLabel(ym),
    balance: {
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      savingsRate,
    },
    topCategory,
    topTransactions,
    biggestDay,
    goals: { totalContributed: parseFloat(totalContributed.toFixed(2)), completedNames },
    vsPrev,
  }
}

// ─── Annual compute ──────────────────────────────────────────────────────────
export function computeAnnualWrapped(db: FinanzasDB, year: string): AnnualWrapped {
  const tx = yearRangeTx(db.transactions, year)
  const income = sumIncome(tx)
  const expense = sumExpense(tx)
  const savings = income - expense

  let bestMonth: { ym: string; savingsRate: number } | null = null
  let worstMonth: { ym: string; expense: number } | null = null
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, '0')}`
    const mtx = monthRangeTx(db.transactions, ym)
    if (mtx.length === 0) continue
    const mIncome = sumIncome(mtx)
    const mExpense = sumExpense(mtx)
    const mSavings = mIncome - mExpense
    const mRate = mIncome > 0 ? Math.round((mSavings / mIncome) * 100) : 0
    if (!bestMonth || mRate > bestMonth.savingsRate) bestMonth = { ym, savingsRate: mRate }
    if (!worstMonth || mExpense > worstMonth.expense) worstMonth = { ym, expense: parseFloat(mExpense.toFixed(2)) }
  }

  const byCat: Record<string, number> = {}
  tx.filter((t) => t.amount < 0).forEach((t) => {
    byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amount)
  })
  const topCategories = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount: parseFloat(amount.toFixed(2)),
      pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
    }))

  const topTransactions = tx
    .filter((t) => t.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3)
    .map((t) => ({ desc: t.desc, amount: Math.abs(t.amount), date: t.date }))

  const transfersInYear = db.transfers.filter((t) => t.date.startsWith(year) && t.note?.startsWith('Aporte a meta:'))
  const totalContributed = transfersInYear.reduce((s, t) => s + t.amount, 0)
  const completed = db.goals.filter((g) => g.saved >= g.target && g.target > 0).length

  const debtsPaidDown = Math.abs(
    tx.filter((t) => t.cat === 'Pago deuda' && t.amount < 0).reduce((s, t) => s + t.amount, 0)
  )

  const startYm = `${parseInt(year) - 1}-12`
  const endYm = `${year}-12`
  const startNW = netWorthAtEndOfMonth(db.accounts, db.cards, db.transactions, startYm)
  const endNW = netWorthAtEndOfMonth(db.accounts, db.cards, db.transactions, endYm)

  return {
    period: year,
    periodLabel: year,
    overview: {
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      txCount: tx.length,
    },
    bestMonth,
    worstMonth,
    topCategories,
    topTransactions,
    goals: { completed, totalContributed: parseFloat(totalContributed.toFixed(2)) },
    debtsPaidDown: parseFloat(debtsPaidDown.toFixed(2)),
    netWorth: {
      start: startNW,
      end: endNW,
      delta: parseFloat((endNW - startNW).toFixed(2)),
    },
  }
}
