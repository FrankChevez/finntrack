// ─── Core types — mirror the original MisFinanzas HTML DB structure exactly ───
// so JSON exports from the old app import without any transformation.

export type AccountType = 'savings' | 'checking' | 'cash'
export type TransactionType = 'income' | 'expense'
export type DebtType = 'credit' | 'loan'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  color: string
}

export interface Card {
  id: string
  name: string
  limit: number
  balance: number
  closeDay: number
  color: string
}

export interface Transaction {
  id: string
  date: string        // 'YYYY-MM-DD'
  desc: string
  cat: string
  amount: number      // negative = expense, positive = income
  account: string     // account/card name
  type: TransactionType
}

export interface Budget {
  id: string
  cat: string
  limit: number
  color: string
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  deadline: string    // 'YYYY-MM-DD'
  color: string
}

export interface Debt {
  id: string
  name: string
  total: number
  remaining: number
  rate: number        // annual interest rate %
  monthly: number     // monthly payment
  type: DebtType
  color: string
}

export interface RecurringItem {
  id: string
  desc: string
  amount: number
  day: number         // day of month due
  cat: string
  account: string
  paid?: boolean      // paid this month
  lastPaid?: string   // 'YYYY-MM'
}

export interface Transfer {
  id: string
  date: string
  from: string
  to: string
  amount: number
  note?: string
}

export interface Installment {
  id: string
  desc: string
  total: number
  cuotas: number
  cuotaAmt: number
  card: string
  cat: string
  startDate: string   // 'YYYY-MM-DD'
  paid: number        // cuotas paid so far
}

// ─── Root DB shape — matches localStorage key 'misfinanzas_v1' exactly ─────
export interface FinanzasDB {
  accounts: Account[]
  cards: Card[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  debts: Debt[]
  recurring: RecurringItem[]
  transfers: Transfer[]
  installments: Installment[]
}

export const CATS = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación',
  'Entretenimiento', 'Ropa', 'Servicios', 'Mascotas', 'Viajes',
  'Restaurantes', 'Tecnología', 'Otros', 'Ingreso',
] as const

export type Category = typeof CATS[number]
