import type { FinanzasDB, Account, Transaction } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10)

export const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const currentYM = () => new Date().toISOString().slice(0, 7)

export const ymLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${months[parseInt(m) - 1]} ${y}`
}

export const prevYM = (ym: string) => {
  const d = new Date(ym + '-01')
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

export const nextYM = (ym: string) => {
  const d = new Date(ym + '-01')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

export const addMonths = (ym: string, n: number) => {
  const d = new Date(ym + '-01')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 7)
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

export const dayOfWeekName = (d: Date) =>
  ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]

// ─── Default seed data ────────────────────────────────────────────────────────
export function defaultData(): FinanzasDB {
  const now = new Date()
  const m  = now.toISOString().slice(0, 7)
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
  const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7)

  return {
    accounts: [
      { id: uid(), name: 'Banco Agrícola — Ahorro', type: 'savings', balance: 4200, color: '#6c8fff' },
      { id: uid(), name: 'Banco Atlántida — Corriente', type: 'checking', balance: 1350, color: '#2dd4a0' },
      { id: uid(), name: 'Efectivo', type: 'cash', balance: 280, color: '#a78bfa' },
    ],
    cards: [
      { id: uid(), name: 'Visa Agrícola', limit: 3000, balance: 620, closeDay: 20, color: '#f06060' },
      { id: uid(), name: 'Mastercard Cuscatlán', limit: 5000, balance: 1800, closeDay: 15, color: '#f0a050' },
    ],
    transactions: [
      { id: uid(), date: m+'-13', desc: 'Supermercado La Colonia', cat: 'Alimentación', amount: -85, account: 'Efectivo', type: 'expense' },
      { id: uid(), date: m+'-12', desc: 'Salario quincenal', cat: 'Ingreso', amount: 1600, account: 'Banco Atlántida — Corriente', type: 'income' },
      { id: uid(), date: m+'-11', desc: 'Netflix', cat: 'Entretenimiento', amount: -15.99, account: 'Visa Agrícola', type: 'expense' },
      { id: uid(), date: m+'-10', desc: 'Gasolina Shell', cat: 'Transporte', amount: -40, account: 'Mastercard Cuscatlán', type: 'expense' },
      { id: uid(), date: m+'-09', desc: 'Farmacia San Nicolás', cat: 'Salud', amount: -22.50, account: 'Efectivo', type: 'expense' },
      { id: uid(), date: m+'-08', desc: 'Claro internet', cat: 'Servicios', amount: -35, account: 'Banco Agrícola — Ahorro', type: 'expense' },
      { id: uid(), date: m+'-05', desc: 'Restaurante Porcao', cat: 'Alimentación', amount: -55, account: 'Visa Agrícola', type: 'expense' },
      { id: uid(), date: m+'-01', desc: 'Salario quincenal', cat: 'Ingreso', amount: 1600, account: 'Banco Atlántida — Corriente', type: 'income' },
      { id: uid(), date: prev+'-28', desc: 'Supermercado La Colonia', cat: 'Alimentación', amount: -95, account: 'Efectivo', type: 'expense' },
      { id: uid(), date: prev+'-20', desc: 'Salario', cat: 'Ingreso', amount: 1600, account: 'Banco Atlántida — Corriente', type: 'income' },
      { id: uid(), date: prev+'-15', desc: 'Agua ANDA', cat: 'Servicios', amount: -18, account: 'Banco Agrícola — Ahorro', type: 'expense' },
      { id: uid(), date: prev+'-10', desc: 'Uber', cat: 'Transporte', amount: -12, account: 'Mastercard Cuscatlán', type: 'expense' },
      { id: uid(), date: prev+'-05', desc: 'Salario', cat: 'Ingreso', amount: 1600, account: 'Banco Atlántida — Corriente', type: 'income' },
      { id: uid(), date: prev2+'-20', desc: 'Salario', cat: 'Ingreso', amount: 3200, account: 'Banco Atlántida — Corriente', type: 'income' },
      { id: uid(), date: prev2+'-18', desc: 'Supermercado', cat: 'Alimentación', amount: -110, account: 'Efectivo', type: 'expense' },
      { id: uid(), date: prev2+'-12', desc: 'Gasolina', cat: 'Transporte', amount: -45, account: 'Mastercard Cuscatlán', type: 'expense' },
    ],
    budgets: [
      { id: uid(), cat: 'Alimentación', limit: 300, color: '#6c8fff' },
      { id: uid(), cat: 'Transporte', limit: 150, color: '#2dd4a0' },
      { id: uid(), cat: 'Entretenimiento', limit: 80, color: '#a78bfa' },
      { id: uid(), cat: 'Servicios', limit: 120, color: '#f0a050' },
      { id: uid(), cat: 'Salud', limit: 80, color: '#f06060' },
    ],
    goals: [
      { id: uid(), name: 'Fondo de emergencia', target: 5000, saved: 2400, deadline: '2026-12-31', color: '#6c8fff' },
      { id: uid(), name: 'Viaje a Europa', target: 3000, saved: 800, deadline: '2027-06-30', color: '#2dd4a0' },
      { id: uid(), name: 'Laptop nueva', target: 1200, saved: 350, deadline: '2026-09-30', color: '#f0a050' },
    ],
    debts: [
      { id: uid(), name: 'Mastercard Cuscatlán', total: 5000, remaining: 1800, rate: 24, monthly: 54, type: 'credit', color: '#f0a050' },
      { id: uid(), name: 'Visa Agrícola', total: 3000, remaining: 620, rate: 22, monthly: 18, type: 'credit', color: '#f06060' },
      { id: uid(), name: 'Préstamo Banco Agrícola', total: 12000, remaining: 7400, rate: 12, monthly: 508, type: 'loan', color: '#a78bfa' },
    ],
    recurring: [
      { id: uid(), desc: 'Netflix', amount: 15.99, day: 11, cat: 'Entretenimiento', account: 'Visa Agrícola' },
      { id: uid(), desc: 'Claro internet', amount: 35, day: 8, cat: 'Servicios', account: 'Banco Agrícola — Ahorro' },
      { id: uid(), desc: 'Agua ANDA', amount: 18, day: 15, cat: 'Servicios', account: 'Banco Agrícola — Ahorro' },
    ],
    transfers: [],
    installments: [],
  }
}

// ─── Import validator: accepts old HTML app JSON and fills missing keys ───────
export function validateAndMigrateDB(raw: unknown): FinanzasDB {
  if (!raw || typeof raw !== 'object') throw new Error('JSON inválido')
  const r = raw as Record<string, unknown>
  const base = defaultData()
  return {
    accounts:     Array.isArray(r.accounts)     ? r.accounts     : base.accounts,
    cards:        Array.isArray(r.cards)         ? r.cards        : base.cards,
    transactions: Array.isArray(r.transactions) ? r.transactions : base.transactions,
    budgets:      Array.isArray(r.budgets)       ? r.budgets      : base.budgets,
    goals:        Array.isArray(r.goals)         ? r.goals        : base.goals,
    debts:        Array.isArray(r.debts)         ? r.debts        : base.debts,
    recurring:    Array.isArray(r.recurring)     ? r.recurring    : base.recurring,
    transfers:    Array.isArray(r.transfers)     ? r.transfers    : [],
    installments: Array.isArray(r.installments) ? r.installments : [],
  }
}

// ─── Emergency fund history ──────────────────────────────────────────────────
// Reconstructs the total emergency fund value for the last N months by rewinding
// transactions from the current account balance. Returns an array ordered
// oldest → newest, one point per month.
export function emergencyFundHistory(
  accounts: Account[],
  transactions: Transaction[],
  months: number = 6
): { month: string; total: number }[] {
  const emergencyAccounts = accounts.filter(a => a.emergencyFund)
  if (emergencyAccounts.length === 0) return []

  // Build list of YYYY-MM strings from (months-1) ago to current, inclusive.
  const nowYM = currentYM()
  const labels: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    labels.push(addMonths(nowYM, -i))
  }

  // For each label (month), compute end-of-month historical balance per account,
  // apply emergencyPct, and sum across accounts.
  return labels.map(ym => {
    const [y, m] = ym.split('-').map(Number)
    // Last day of month YM. Using Date(y, m, 0): m is 1-based month, day 0 rolls to last day of previous month → effectively last day of month `m`.
    const endOfMonth = new Date(y, m, 0).toISOString().slice(0, 10)

    let total = 0
    for (const acc of emergencyAccounts) {
      // Net effect of transactions after endOfMonth on this account (by name match)
      const netAfter = transactions
        .filter(t => t.account === acc.name && t.date > endOfMonth)
        .reduce((s, t) => s + t.amount, 0)
      // Historical balance = current balance - net amount that happened after that date
      const historicalBalance = acc.balance - netAfter
      const pct = acc.emergencyPct ?? 100
      total += historicalBalance * (pct / 100)
    }

    return { month: ym, total: parseFloat(total.toFixed(2)) }
  })
}
