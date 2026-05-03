import { useState } from 'react'
import type { AssistantQuestion, QuestionCategory } from '../../lib/assistant'
import type { Account } from '../../types'

const CATEGORIES: Array<{ id: QuestionCategory; label: string; emoji: string }> = [
  { id: 'insights', label: 'Insights', emoji: '✨' },
  { id: 'gastos', label: 'Gastos', emoji: '💰' },
  { id: 'ingresos', label: 'Ahorro', emoji: '📊' },
  { id: 'metas', label: 'Metas', emoji: '🎯' },
  { id: 'presupuestos', label: 'Presupuestos', emoji: '📅' },
  { id: 'deudas', label: 'Deudas', emoji: '💳' },
  { id: 'cuentas', label: 'Cuentas', emoji: '🏦' },
]

interface AffordMode {
  accounts: Account[]
  onSubmit: (amount: number, accountNames: string[]) => void
  onCancel: () => void
}

interface Props {
  questions: AssistantQuestion[]
  onPick: (questionId: string) => void
  paramOptions?: Array<{ id: string; label: string }>
  onPickParam?: (paramId: string) => void
  onCancelParam?: () => void
  affordMode?: AffordMode
  suggested?: string[]
}

export function ChipPanel({ questions, onPick, paramOptions, onPickParam, onCancelParam, affordMode, suggested = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('insights')
  const [affordAmount, setAffordAmount] = useState('')
  const [affordAccounts, setAffordAccounts] = useState<Set<string>>(new Set())

  if (affordMode) {
    const toggle = (name: string) => {
      const next = new Set(affordAccounts)
      if (next.has(name)) next.delete(name); else next.add(name)
      setAffordAccounts(next)
    }
    const amt = parseFloat(affordAmount) || 0
    const canSubmit = amt > 0 && affordAccounts.size > 0
    const submit = () => {
      if (!canSubmit) return
      affordMode.onSubmit(amt, Array.from(affordAccounts))
      setAffordAmount('')
      setAffordAccounts(new Set())
    }
    const cancel = () => {
      setAffordAmount('')
      setAffordAccounts(new Set())
      affordMode.onCancel()
    }
    return (
      <div className="chip-panel">
        <div className="chip-panel-hint">¿Cuánto cuesta y desde qué cuentas pagarías?</div>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Monto ($)"
            value={affordAmount}
            onChange={(e) => setAffordAmount(e.target.value)}
          />
        </div>
        <div className="chip-panel-chips">
          {affordMode.accounts.map((a) => {
            const selected = affordAccounts.has(a.name)
            return (
              <button
                key={a.id}
                className={`chip ${selected ? 'suggested' : ''}`}
                onClick={() => toggle(a.name)}
              >
                {selected ? '✓ ' : ''}{a.name}
              </button>
            )
          })}
        </div>
        <div className="chip-panel-chips" style={{ marginTop: 8 }}>
          <button className="chip suggested" onClick={submit} disabled={!canSubmit}>
            Calcular
          </button>
          <button className="chip chip-cancel" onClick={cancel}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (paramOptions && onPickParam) {
    return (
      <div className="chip-panel">
        <div className="chip-panel-hint">Elige una opción:</div>
        <div className="chip-panel-chips">
          {paramOptions.map((opt) => (
            <button key={opt.id} className="chip" onClick={() => onPickParam(opt.id)}>
              {opt.label}
            </button>
          ))}
          {onCancelParam && (
            <button className="chip chip-cancel" onClick={onCancelParam}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    )
  }

  const filtered = questions.filter((q) => q.category === activeCategory)
  const suggestedQs = suggested.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as AssistantQuestion[]

  return (
    <div className="chip-panel">
      <div className="chip-panel-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip-tab ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {suggestedQs.length > 0 && (
        <div className="chip-panel-suggested">
          <div className="chip-panel-hint">Sugeridas:</div>
          <div className="chip-panel-chips">
            {suggestedQs.map((q) => (
              <button key={q.id} className="chip suggested" onClick={() => onPick(q.id)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chip-panel-chips">
        {filtered.map((q) => (
          <button key={q.id} className="chip" onClick={() => onPick(q.id)}>
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
