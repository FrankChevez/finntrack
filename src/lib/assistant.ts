import type { FinanzasDB } from '../types'
import { CATS } from '../types'
import { fmt, currentYM, prevYM, ymLabel } from './utils'

export interface AssistantAnswer {
  text: string
  list?: Array<{ main: string; sub?: string; amount?: string }>
  followUps?: string[]
}

export type QuestionCategory = 'gastos' | 'ingresos' | 'metas' | 'presupuestos' | 'deudas' | 'cuentas' | 'insights'
export type QuestionParam = 'goal' | 'category' | 'account'

export interface AssistantQuestion {
  id: string
  label: string
  category: QuestionCategory
  needsParam?: QuestionParam
  answer: (db: FinanzasDB, param?: string) => AssistantAnswer
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function txInMonth(db: FinanzasDB, ym: string) {
  return db.transactions.filter((t) => t.date.startsWith(ym))
}

function expenseOf(tx: FinanzasDB['transactions']): number {
  return Math.abs(tx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))
}

function incomeOf(tx: FinanzasDB['transactions']): number {
  return tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
}

// ─── Catalog ─────────────────────────────────────────────────────────────────
export const QUESTIONS: AssistantQuestion[] = [
  // === GASTOS ===
  {
    id: 'top-category-month',
    label: '¿Categoría más cara este mes?',
    category: 'gastos',
    answer: (db) => {
      const ym = currentYM()
      const tx = txInMonth(db, ym).filter((t) => t.amount < 0)
      if (tx.length === 0) return { text: 'Aún no tienes gastos registrados este mes.' }
      const byCat: Record<string, number> = {}
      tx.forEach((t) => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amount) })
      const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
      const total = tx.reduce((s, t) => s + Math.abs(t.amount), 0)
      const pct = Math.round((top[1] / total) * 100)
      return {
        text: `Tu categoría más cara este mes es **${top[0]}** con ${fmt(top[1])} — el ${pct}% de tus gastos.`,
        followUps: ['top-5-expenses-month', 'vs-last-month'],
      }
    },
  },
  {
    id: 'spent-in-category',
    label: '¿Cuánto gasté en una categoría este mes?',
    category: 'gastos',
    needsParam: 'category',
    answer: (db, param) => {
      if (!param) return { text: '¿Qué categoría?' }
      const ym = currentYM()
      const tx = txInMonth(db, ym).filter((t) => t.amount < 0 && t.cat === param)
      const total = tx.reduce((s, t) => s + Math.abs(t.amount), 0)
      if (tx.length === 0) return { text: `No tienes gastos de **${param}** este mes.` }
      return {
        text: `Este mes gastaste ${fmt(total)} en **${param}** (${tx.length} transacción${tx.length > 1 ? 'es' : ''}).`,
      }
    },
  },
  {
    id: 'biggest-day-month',
    label: '¿Cuál fue mi día más caro?',
    category: 'gastos',
    answer: (db) => {
      const ym = currentYM()
      const tx = txInMonth(db, ym).filter((t) => t.amount < 0)
      if (tx.length === 0) return { text: 'Aún no tienes gastos este mes.' }
      const byDay: Record<string, number> = {}
      tx.forEach((t) => { byDay[t.date] = (byDay[t.date] || 0) + Math.abs(t.amount) })
      const top = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
      return { text: `Tu día más caro fue el **${top[0]}** con ${fmt(top[1])} gastados.` }
    },
  },
  {
    id: 'top-5-expenses-month',
    label: 'Top 5 gastos del mes',
    category: 'gastos',
    answer: (db) => {
      const ym = currentYM()
      const tx = txInMonth(db, ym)
        .filter((t) => t.amount < 0)
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 5)
      if (tx.length === 0) return { text: 'No hay gastos este mes aún.' }
      return {
        text: `Tus 5 gastos más grandes de ${ymLabel(ym)}:`,
        list: tx.map((t) => ({ main: t.desc, sub: `${t.cat} · ${t.date}`, amount: fmt(Math.abs(t.amount)) })),
      }
    },
  },

  // === INGRESOS Y AHORRO ===
  {
    id: 'income-month',
    label: '¿Cuánto he ganado este mes?',
    category: 'ingresos',
    answer: (db) => {
      const ym = currentYM()
      const inc = incomeOf(txInMonth(db, ym))
      if (inc === 0) return { text: 'Aún no tienes ingresos registrados este mes.' }
      return { text: `Este mes has ingresado ${fmt(inc)}.` }
    },
  },
  {
    id: 'savings-rate-month',
    label: '¿Cuál es mi tasa de ahorro?',
    category: 'ingresos',
    answer: (db) => {
      const ym = currentYM()
      const tx = txInMonth(db, ym)
      const inc = incomeOf(tx)
      const exp = expenseOf(tx)
      if (inc === 0) return { text: 'No tienes ingresos este mes todavía, no puedo calcular la tasa.' }
      const rate = Math.round(((inc - exp) / inc) * 100)
      const verdict = rate >= 20 ? 'Excelente.' : rate >= 10 ? 'Vas bien, pero puedes mejorar.' : rate >= 0 ? 'Abajo del 20% recomendado.' : 'Estás gastando más de lo que ingresas.'
      return { text: `Tu tasa de ahorro este mes es **${rate}%**. ${verdict}` }
    },
  },
  {
    id: 'vs-last-month',
    label: '¿Gasté más o menos que el mes pasado?',
    category: 'ingresos',
    answer: (db) => {
      const ym = currentYM()
      const pm = prevYM(ym)
      const exp = expenseOf(txInMonth(db, ym))
      const prevExp = expenseOf(txInMonth(db, pm))
      if (prevExp === 0) return { text: 'No tengo datos del mes pasado para comparar.' }
      const delta = ((exp - prevExp) / prevExp) * 100
      const dir = delta >= 0 ? 'más' : 'menos'
      return { text: `Este mes has gastado ${Math.abs(delta).toFixed(1)}% **${dir}** que ${ymLabel(pm)} (${fmt(exp)} vs ${fmt(prevExp)}).` }
    },
  },

  // === METAS ===
  {
    id: 'goals-summary',
    label: '¿Cómo van mis metas?',
    category: 'metas',
    answer: (db) => {
      if (db.goals.length === 0) return { text: 'No tienes metas registradas todavía.' }
      const completed = db.goals.filter((g) => g.target > 0 && g.saved >= g.target).length
      const list = db.goals.map((g) => {
        const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0
        return {
          main: g.name,
          sub: `${pct}% completada`,
          amount: `${fmt(g.saved)} / ${fmt(g.target)}`,
        }
      })
      return {
        text: `Tienes **${db.goals.length}** meta${db.goals.length > 1 ? 's' : ''}, **${completed}** completada${completed !== 1 ? 's' : ''}.`,
        list,
      }
    },
  },
  {
    id: 'goal-projection',
    label: '¿Cuándo llego a una meta al ritmo actual?',
    category: 'metas',
    needsParam: 'goal',
    answer: (db, param) => {
      if (!param) return { text: '¿Cuál meta?' }
      const goal = db.goals.find((g) => g.id === param)
      if (!goal) return { text: 'No encontré esa meta.' }
      const remaining = Math.max(0, goal.target - goal.saved)
      if (remaining === 0) return { text: `¡Ya alcanzaste la meta **${goal.name}**! 🎉` }

      // Estimate rate from aportes de los últimos 3 meses
      const now = new Date()
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
      const recentTransfers = db.transfers.filter((t) =>
        t.date >= cutoff && t.note?.startsWith(`Aporte a meta: ${goal.name}`)
      )
      const monthlyRate = recentTransfers.reduce((s, t) => s + t.amount, 0) / 3

      if (monthlyRate <= 0) {
        return { text: `No he visto aportes recientes a **${goal.name}**, así que no puedo proyectar una fecha. La meta requiere ${fmt(remaining)} más.` }
      }

      const monthsNeeded = Math.ceil(remaining / monthlyRate)
      const projected = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
      const projectedYm = projected.toISOString().slice(0, 7)

      // Deadline may be empty or invalid — handle gracefully
      if (!goal.deadline) {
        return { text: `Al ritmo actual de ${fmt(monthlyRate)}/mes, llegas a **${goal.name}** en ${ymLabel(projectedYm)}. (Sin deadline configurada.)` }
      }
      const deadline = new Date(goal.deadline)
      if (isNaN(deadline.getTime())) {
        return { text: `Al ritmo actual de ${fmt(monthlyRate)}/mes, llegas a **${goal.name}** en ${ymLabel(projectedYm)}. (Deadline inválida.)` }
      }
      const onTrack = projected <= deadline

      return {
        text: `Al ritmo actual de ${fmt(monthlyRate)}/mes, llegas a **${goal.name}** en ${ymLabel(projectedYm)}. ${onTrack ? '✓ A tiempo.' : `⚠️ La deadline es ${goal.deadline} — vas atrasado.`}`,
      }
    },
  },
  {
    id: 'most-behind-goal',
    label: '¿Cuál meta está más atrasada?',
    category: 'metas',
    answer: (db) => {
      const active = db.goals.filter((g) => g.target > 0 && g.saved < g.target)
      if (active.length === 0) return { text: 'No tienes metas atrasadas. ¡Todo al día!' }
      const sorted = [...active].sort((a, b) => (a.saved / a.target) - (b.saved / b.target))
      const worst = sorted[0]
      const pct = Math.round((worst.saved / worst.target) * 100)
      return { text: `Tu meta más atrasada es **${worst.name}** con ${pct}% (${fmt(worst.saved)} de ${fmt(worst.target)}).` }
    },
  },

  // === PRESUPUESTOS ===
  {
    id: 'budgets-over-limit',
    label: '¿Qué presupuestos están cerca o excedidos?',
    category: 'presupuestos',
    answer: (db) => {
      if (db.budgets.length === 0) return { text: 'No tienes presupuestos configurados.' }
      const ym = currentYM()
      const tx = txInMonth(db, ym)
      const items = db.budgets.map((b) => {
        const spent = Math.abs(tx.filter((t) => t.cat === b.cat && t.amount < 0).reduce((s, t) => s + t.amount, 0))
        const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0
        return { ...b, spent, pct }
      }).filter((b) => b.pct >= 75)
      if (items.length === 0) return { text: 'Todos tus presupuestos están bajo el 75% de uso. Vas bien.' }
      return {
        text: `Tienes **${items.length}** presupuesto${items.length > 1 ? 's' : ''} en zona de alerta:`,
        list: items.sort((a, b) => b.pct - a.pct).map((b) => ({
          main: b.cat,
          sub: `${b.pct}% usado`,
          amount: `${fmt(b.spent)} / ${fmt(b.limit)}`,
        })),
      }
    },
  },
  {
    id: 'budget-remaining',
    label: '¿Cuánto me queda en un presupuesto?',
    category: 'presupuestos',
    needsParam: 'category',
    answer: (db, param) => {
      if (!param) return { text: '¿Qué categoría?' }
      const budget = db.budgets.find((b) => b.cat === param)
      if (!budget) return { text: `No tienes un presupuesto configurado para **${param}**.` }
      const ym = currentYM()
      const spent = Math.abs(txInMonth(db, ym).filter((t) => t.cat === param && t.amount < 0).reduce((s, t) => s + t.amount, 0))
      const remaining = budget.limit - spent
      if (remaining < 0) return { text: `Excediste el presupuesto de **${param}** por ${fmt(Math.abs(remaining))} (${fmt(spent)} de ${fmt(budget.limit)}).` }
      return { text: `Te quedan ${fmt(remaining)} del presupuesto de **${param}** este mes (${fmt(spent)} de ${fmt(budget.limit)} usados).` }
    },
  },

  // === DEUDAS ===
  {
    id: 'total-debt',
    label: '¿Cuánto debo en total?',
    category: 'deudas',
    answer: (db) => {
      if (db.debts.length === 0) return { text: 'No tienes deudas registradas. 🎉' }
      const total = db.debts.reduce((s, d) => s + d.remaining, 0)
      const monthly = db.debts.reduce((s, d) => s + d.monthly, 0)
      return {
        text: `Tu deuda total es ${fmt(total)} a través de ${db.debts.length} deuda${db.debts.length > 1 ? 's' : ''}. Pago mensual combinado: ${fmt(monthly)}.`,
        list: db.debts.map((d) => ({ main: d.name, sub: `${d.rate}% interés · ${fmt(d.monthly)}/mes`, amount: fmt(d.remaining) })),
      }
    },
  },
  {
    id: 'debt-payoff-date',
    label: '¿Cuándo termino de pagar todas mis deudas?',
    category: 'deudas',
    answer: (db) => {
      if (db.debts.length === 0) return { text: 'No tienes deudas. 🎉' }
      const total = db.debts.reduce((s, d) => s + d.remaining, 0)
      const monthly = db.debts.reduce((s, d) => s + d.monthly, 0)
      if (monthly <= 0) return { text: 'No tienes pagos mensuales configurados, no puedo proyectar fecha.' }
      const monthsNeeded = Math.ceil(total / monthly)
      const now = new Date()
      const target = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
      return { text: `Al ritmo actual (${fmt(monthly)}/mes), quedas libre de deudas en **${ymLabel(target.toISOString().slice(0, 7))}** (~${monthsNeeded} meses). No incluye intereses futuros.` }
    },
  },
  {
    id: 'most-expensive-debt',
    label: '¿Cuál deuda me cuesta más en intereses?',
    category: 'deudas',
    answer: (db) => {
      if (db.debts.length === 0) return { text: 'No tienes deudas.' }
      const ranked = [...db.debts].map((d) => ({ ...d, annualCost: d.remaining * (d.rate / 100) })).sort((a, b) => b.annualCost - a.annualCost)
      const worst = ranked[0]
      return { text: `**${worst.name}** te cuesta aprox ${fmt(worst.annualCost)} al año en intereses (${worst.rate}% sobre ${fmt(worst.remaining)}).` }
    },
  },

  // === CUENTAS ===
  {
    id: 'total-balance',
    label: '¿Cuál es mi balance total?',
    category: 'cuentas',
    answer: (db) => {
      const assets = db.accounts.reduce((s, a) => s + a.balance, 0)
      const debts = db.cards.reduce((s, c) => s + c.balance, 0)
      const net = assets - debts
      return {
        text: `Tu balance neto es **${fmt(net)}**. Activos: ${fmt(assets)}, deuda en tarjetas: ${fmt(debts)}.`,
        list: [
          ...db.accounts.map((a) => ({ main: a.name, sub: a.type, amount: fmt(a.balance) })),
          ...db.cards.map((c) => ({ main: c.name, sub: `tarjeta · deuda`, amount: `- ${fmt(c.balance)}` })),
        ],
      }
    },
  },
  {
    id: 'emergency-fund',
    label: '¿Cuánto tengo de fondo de emergencia?',
    category: 'cuentas',
    answer: (db) => {
      const emergency = db.accounts.filter((a) => a.emergencyFund)
      if (emergency.length === 0) return { text: 'No tienes ninguna cuenta marcada como fondo de emergencia.' }
      const total = emergency.reduce((s, a) => s + a.balance * ((a.emergencyPct ?? 100) / 100), 0)
      const ym = currentYM()
      const lastThree = [ym, prevYM(ym), prevYM(prevYM(ym))]
      const avgExp = lastThree.reduce((s, m) => s + expenseOf(txInMonth(db, m)), 0) / 3
      const coverageMonths = avgExp > 0 ? total / avgExp : 0
      const verdict = coverageMonths >= 6 ? 'Excelente cobertura.' : coverageMonths >= 3 ? 'Buena, pero apunta a 6 meses.' : 'Abajo del rango recomendado (3-6 meses).'
      return { text: `Tu fondo de emergencia es **${fmt(total)}** — cubre ~**${coverageMonths.toFixed(1)} mes${coverageMonths === 1 ? '' : 'es'}** al ritmo de gasto actual. ${verdict}` }
    },
  },

  // === INSIGHTS ===
  {
    id: 'three-insights',
    label: '✨ Dame 3 insights',
    category: 'insights',
    answer: (db) => {
      const insights: string[] = []
      const ym = currentYM()
      const tx = txInMonth(db, ym)
      const inc = incomeOf(tx)
      const exp = expenseOf(tx)
      const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0

      if (inc > 0 && rate < 10) {
        insights.push(`Tu tasa de ahorro del mes es ${rate}%, muy por debajo del 20% recomendado.`)
      } else if (inc > 0 && rate >= 25) {
        insights.push(`Vas excelente — ahorraste ${rate}% de tus ingresos este mes.`)
      }

      const excededBudgets = db.budgets.filter((b) => {
        const spent = Math.abs(tx.filter((t) => t.cat === b.cat && t.amount < 0).reduce((s, t) => s + t.amount, 0))
        return spent > b.limit && b.limit > 0
      })
      if (excededBudgets.length > 0) {
        insights.push(`Excediste ${excededBudgets.length} presupuesto${excededBudgets.length > 1 ? 's' : ''}: ${excededBudgets.map((b) => b.cat).join(', ')}.`)
      }

      const emergency = db.accounts.filter((a) => a.emergencyFund)
      if (emergency.length > 0) {
        const total = emergency.reduce((s, a) => s + a.balance * ((a.emergencyPct ?? 100) / 100), 0)
        const lastThree = [ym, prevYM(ym), prevYM(prevYM(ym))]
        const avgExp = lastThree.reduce((s, m) => s + expenseOf(txInMonth(db, m)), 0) / 3
        if (avgExp > 0) {
          const months = total / avgExp
          if (months < 3) insights.push(`Tu fondo de emergencia cubre solo ${months.toFixed(1)} meses. Se recomiendan 3-6.`)
        }
      }

      const activeGoals = db.goals.filter((g) => g.target > 0 && g.saved < g.target)
      if (activeGoals.length > 0) {
        const behind = activeGoals.find((g) => {
          const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const remaining = g.target - g.saved
          return daysLeft > 0 && remaining > 0 && (remaining / daysLeft) * 30 > 500
        })
        if (behind) insights.push(`Tu meta '${behind.name}' va atrasada — requiere aportes fuertes para llegar a tiempo.`)
      }

      const prevExp = expenseOf(txInMonth(db, prevYM(ym)))
      if (prevExp > 0 && exp > 0) {
        const delta = Math.round(((exp - prevExp) / prevExp) * 100)
        if (delta >= 20) insights.push(`Estás gastando ${delta}% más que el mes pasado.`)
        else if (delta <= -20) insights.push(`Gastaste ${Math.abs(delta)}% menos que el mes pasado — bien hecho.`)
      }

      const totalDebt = db.debts.reduce((s, d) => s + d.remaining, 0)
      if (totalDebt === 0 && db.debts.length > 0) {
        insights.push(`Ya no debes nada. ¡Libre de deudas!`)
      }

      if (insights.length < 3) {
        const top = Object.entries(tx.filter((t) => t.amount < 0).reduce((acc: Record<string, number>, t) => {
          acc[t.cat] = (acc[t.cat] || 0) + Math.abs(t.amount)
          return acc
        }, {})).sort((a, b) => b[1] - a[1])[0]
        if (top) insights.push(`Tu categoría #1 este mes: ${top[0]} con ${fmt(top[1])}.`)
      }
      if (insights.length < 3) {
        insights.push(`Tienes ${db.transactions.length} transacción${db.transactions.length === 1 ? '' : 'es'} registrada${db.transactions.length === 1 ? '' : 's'} en total.`)
      }
      if (insights.length < 3) {
        insights.push(`Sigue registrando tus transacciones — entre más datos, mejores insights.`)
      }

      return {
        text: 'Aquí tienes 3 observaciones sobre tus finanzas:',
        list: insights.slice(0, 3).map((i, idx) => ({ main: `${idx + 1}. ${i}` })),
      }
    },
  },
]

// ─── Helpers for parameter selection ─────────────────────────────────────────
export function listParams(db: FinanzasDB, kind: QuestionParam): Array<{ id: string; label: string }> {
  if (kind === 'goal') return db.goals.filter((g) => g.target > 0).map((g) => ({ id: g.id, label: g.name }))
  if (kind === 'category') return CATS.filter((c) => c !== 'Ingreso').map((c) => ({ id: c, label: c }))
  if (kind === 'account') return [
    ...db.accounts.map((a) => ({ id: a.name, label: a.name })),
    ...db.cards.map((c) => ({ id: c.name, label: c.name })),
  ]
  return []
}

export function getQuestion(id: string): AssistantQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id)
}

export const WELCOME_TEXT = '¡Hola! Soy tu asistente. Puedo responderte sobre tus finanzas. Toca una pregunta abajo para empezar, o pide "✨ 3 insights" para un resumen rápido.'
