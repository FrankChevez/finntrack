import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FinanzasDB, Account, Card, Transaction, Budget, Goal, Debt, RecurringItem, Transfer, Installment, AssistantMessage } from '../types'
import { defaultData, uid, validateAndMigrateDB } from '../lib/utils'

type Theme = 'light' | 'dark'

interface FinanzasState extends FinanzasDB {
  theme: Theme
  // ─── Theme ───
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  // ─── Import/Export ───
  exportJSON: () => void
  importJSON: (json: unknown) => void
  // ─── Accounts ───
  addAccount: (a: Omit<Account, 'id'>) => void
  updateAccount: (id: string, a: Partial<Account>) => void
  deleteAccount: (id: string) => void
  // ─── Cards ───
  addCard: (c: Omit<Card, 'id'>) => void
  updateCard: (id: string, c: Partial<Card>) => void
  deleteCard: (id: string) => void
  // ─── Transactions ───
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  // ─── Budgets ───
  addBudget: (b: Omit<Budget, 'id'>) => void
  updateBudget: (id: string, b: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  // ─── Goals ───
  addGoal: (g: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, g: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  contributeToGoal: (goalId: string, amount: number, fromAccountName: string) => void
  // ─── Debts ───
  addDebt: (d: Omit<Debt, 'id'>) => void
  updateDebt: (id: string, d: Partial<Debt>) => void
  deleteDebt: (id: string) => void
  // ─── Recurring ───
  addRecurring: (r: Omit<RecurringItem, 'id'>) => void
  updateRecurring: (id: string, r: Partial<RecurringItem>) => void
  deleteRecurring: (id: string) => void
  payRecurring: (id: string) => void
  // ─── Transfers ───
  addTransfer: (t: Omit<Transfer, 'id'>) => void
  deleteTransfer: (id: string) => void
  // ─── Installments ───
  addInstallment: (i: Omit<Installment, 'id'>) => void
  updateInstallment: (id: string, i: Partial<Installment>) => void
  deleteInstallment: (id: string) => void
  payInstallment: (id: string) => void
  payCard: (cardId: string, amount: number, accountName: string) => void
  payDebt: (debtId: string, amount: number, accountName: string) => void
  // ─── Asistente ───
  addAssistantMessage: (m: Omit<AssistantMessage, 'id'|'timestamp'>) => void
  clearAssistantMessages: () => void
}

export const useStore = create<FinanzasState>()(
  persist(
    (set, get) => ({
      ...defaultData(),
      theme: 'light',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      exportJSON: () => {
        const { theme, ...db } = get()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void theme
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `misfinanzas_backup_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
      },

      importJSON: (json) => {
        const db = validateAndMigrateDB(json)
        set(db)
      },

      // Accounts
      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, { ...a, id: uid() }] })),
      updateAccount: (id, a) => set((s) => ({ accounts: s.accounts.map((x) => x.id === id ? { ...x, ...a } : x) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== id) })),

      // Cards
      addCard: (c) => set((s) => ({ cards: [...s.cards, { ...c, id: uid() }] })),
      updateCard: (id, c) => set((s) => ({ cards: s.cards.map((x) => x.id === id ? { ...x, ...c } : x) })),
      deleteCard: (id) => set((s) => ({ cards: s.cards.filter((x) => x.id !== id) })),

      payCard: (cardId, amount, accountName) => {
        set((s) => {
          const card = s.cards.find((c) => c.id === cardId)
          if (!card) return {}
          const tx: Transaction = {
            id: uid(),
            date: new Date().toISOString().slice(0, 10),
            desc: `Pago ${card.name}`,
            cat: 'Pago tarjeta',
            amount: -amount,
            account: accountName,
            type: 'expense',
          }
          return {
            transactions: [...s.transactions, tx],
            cards: s.cards.map((c) => c.id === cardId ? { ...c, balance: Math.max(0, c.balance - amount) } : c),
            accounts: s.accounts.map((a) => a.name === accountName ? { ...a, balance: a.balance - amount } : a),
          }
        })
      },

      payDebt: (debtId, amount, accountName) => {
        set((s) => {
          const debt = s.debts.find((d) => d.id === debtId)
          if (!debt) return {}
          const tx: Transaction = {
            id: uid(),
            date: new Date().toISOString().slice(0, 10),
            desc: `Pago ${debt.name}`,
            cat: 'Pago deuda',
            amount: -amount,
            account: accountName,
            type: 'expense',
          }
          return {
            transactions: [...s.transactions, tx],
            debts: s.debts.map((d) => d.id === debtId ? { ...d, remaining: Math.max(0, d.remaining - amount) } : d),
            accounts: s.accounts.map((a) => a.name === accountName ? { ...a, balance: a.balance - amount } : a),
          }
        })
      },

      // Asistente
      addAssistantMessage: (m) => set((s) => ({
        assistantMessages: [...s.assistantMessages, { ...m, id: uid(), timestamp: Date.now() }],
      })),
      clearAssistantMessages: () => set({ assistantMessages: [] }),

      // Transactions
      // Accounts: balance += amount (income up, expense down). Cards: balance -= amount (charge grows debt, payment shrinks debt, clamped to 0).
      addTransaction: (t) => set((s) => {
        const newTx = { ...t, id: uid() }
        const inAccount = s.accounts.some((a) => a.name === t.account)
        const inCard = !inAccount && s.cards.some((c) => c.name === t.account)
        return {
          transactions: [...s.transactions, newTx],
          accounts: inAccount
            ? s.accounts.map((a) => a.name === t.account ? { ...a, balance: a.balance + t.amount } : a)
            : s.accounts,
          cards: inCard
            ? s.cards.map((c) => c.name === t.account ? { ...c, balance: Math.max(0, c.balance - t.amount) } : c)
            : s.cards,
        }
      }),
      updateTransaction: (id, t) => set((s) => {
        const oldTx = s.transactions.find((x) => x.id === id)
        if (!oldTx) return {}
        const newTx = { ...oldTx, ...t }

        let accounts = s.accounts
        let cards = s.cards

        // Revert old transaction's effect
        if (accounts.some((a) => a.name === oldTx.account)) {
          accounts = accounts.map((a) => a.name === oldTx.account ? { ...a, balance: a.balance - oldTx.amount } : a)
        } else if (cards.some((c) => c.name === oldTx.account)) {
          cards = cards.map((c) => c.name === oldTx.account ? { ...c, balance: Math.max(0, c.balance + oldTx.amount) } : c)
        }

        // Apply new transaction's effect
        if (accounts.some((a) => a.name === newTx.account)) {
          accounts = accounts.map((a) => a.name === newTx.account ? { ...a, balance: a.balance + newTx.amount } : a)
        } else if (cards.some((c) => c.name === newTx.account)) {
          cards = cards.map((c) => c.name === newTx.account ? { ...c, balance: Math.max(0, c.balance - newTx.amount) } : c)
        }

        return {
          transactions: s.transactions.map((x) => x.id === id ? newTx : x),
          accounts,
          cards,
        }
      }),
      deleteTransaction: (id) => set((s) => {
        const tx = s.transactions.find((x) => x.id === id)
        if (!tx) return {}
        const inAccount = s.accounts.some((a) => a.name === tx.account)
        const inCard = !inAccount && s.cards.some((c) => c.name === tx.account)
        return {
          transactions: s.transactions.filter((x) => x.id !== id),
          accounts: inAccount
            ? s.accounts.map((a) => a.name === tx.account ? { ...a, balance: a.balance - tx.amount } : a)
            : s.accounts,
          cards: inCard
            ? s.cards.map((c) => c.name === tx.account ? { ...c, balance: Math.max(0, c.balance + tx.amount) } : c)
            : s.cards,
        }
      }),

      // Budgets
      addBudget: (b) => set((s) => ({ budgets: [...s.budgets, { ...b, id: uid() }] })),
      updateBudget: (id, b) => set((s) => ({ budgets: s.budgets.map((x) => x.id === id ? { ...x, ...b } : x) })),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((x) => x.id !== id) })),

      // Goals
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid() }] })),
      updateGoal: (id, g) => set((s) => ({ goals: s.goals.map((x) => x.id === id ? { ...x, ...g } : x) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })),

      contributeToGoal: (goalId, amount, fromAccountName) => {
        set((s) => {
          const goal = s.goals.find((g) => g.id === goalId)
          if (!goal) return {}

          const goalAccount = goal.accountId
            ? s.accounts.find((a) => a.id === goal.accountId)
            : undefined
          const needsTransfer = goalAccount && fromAccountName !== goalAccount.name

          let accounts = s.accounts
          let transfers = s.transfers

          if (needsTransfer) {
            accounts = s.accounts.map((a) => {
              if (a.name === fromAccountName) return { ...a, balance: a.balance - amount }
              if (a.name === goalAccount.name) return { ...a, balance: a.balance + amount }
              return a
            })
            const transfer: Transfer = {
              id: uid(),
              date: new Date().toISOString().slice(0, 10),
              from: fromAccountName,
              to: goalAccount.name,
              amount,
              note: `Aporte a meta: ${goal.name}`,
            }
            transfers = [...s.transfers, transfer]
          }

          const goals = s.goals.map((g) =>
            g.id === goalId ? { ...g, saved: g.saved + amount } : g
          )

          return { accounts, transfers, goals }
        })
      },

      // Debts
      addDebt: (d) => set((s) => ({ debts: [...s.debts, { ...d, id: uid() }] })),
      updateDebt: (id, d) => set((s) => ({ debts: s.debts.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((x) => x.id !== id) })),

      // Recurring
      addRecurring: (r) => set((s) => ({ recurring: [...s.recurring, { ...r, id: uid() }] })),
      updateRecurring: (id, r) => set((s) => ({ recurring: s.recurring.map((x) => x.id === id ? { ...x, ...r } : x) })),
      deleteRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) })),
      payRecurring: (id) => {
        const ym = new Date().toISOString().slice(0, 7)
        set((s) => {
          const item = s.recurring.find((x) => x.id === id)
          if (!item) return {}
          const tx: Transaction = {
            id: uid(),
            date: new Date().toISOString().slice(0, 10),
            desc: item.desc + ' (recurrente)',
            cat: item.cat,
            amount: -Math.abs(item.amount),
            account: item.account,
            type: 'expense',
          }
          return {
            transactions: [...s.transactions, tx],
            recurring: s.recurring.map((x) => x.id === id ? { ...x, paid: true, lastPaid: ym } : x),
          }
        })
      },

      // Transfers
      addTransfer: (t) => {
        set((s) => {
          const transfer = { ...t, id: uid() }
          const accounts = s.accounts.map((a) => {
            if (a.name === t.from) return { ...a, balance: a.balance - t.amount }
            if (a.name === t.to) return { ...a, balance: a.balance + t.amount }
            return a
          })
          return { transfers: [...s.transfers, transfer], accounts }
        })
      },
      deleteTransfer: (id) => set((s) => ({ transfers: s.transfers.filter((x) => x.id !== id) })),

      // Installments
      addInstallment: (i) => set((s) => ({ installments: [...s.installments, { ...i, id: uid() }] })),
      updateInstallment: (id, i) => set((s) => ({ installments: s.installments.map((x) => x.id === id ? { ...x, ...i } : x) })),
      deleteInstallment: (id) => set((s) => ({ installments: s.installments.filter((x) => x.id !== id) })),
      payInstallment: (id) => {
        set((s) => {
          const inst = s.installments.find((x) => x.id === id)
          if (!inst || inst.paid >= inst.cuotas) return {}
          const tx: Transaction = {
            id: uid(),
            date: new Date().toISOString().slice(0, 10),
            desc: `${inst.desc} (cuota ${inst.paid + 1}/${inst.cuotas})`,
            cat: inst.cat,
            amount: -inst.cuotaAmt,
            account: inst.card,
            type: 'expense',
          }
          const cards = s.cards.map((c) =>
            c.name === inst.card ? { ...c, balance: Math.max(0, c.balance - inst.cuotaAmt) } : c
          )
          return {
            transactions: [...s.transactions, tx],
            cards,
            installments: s.installments.map((x) => x.id === id ? { ...x, paid: x.paid + 1 } : x),
          }
        })
      },
    }),
    {
      name: 'misfinanzas_v1', // same key as old HTML app → data migrates automatically
    }
  )
)
