import { useState } from 'react'
import type { AssistantQuestion, QuestionCategory } from '../../lib/assistant'

const CATEGORIES: Array<{ id: QuestionCategory; label: string; emoji: string }> = [
  { id: 'insights', label: 'Insights', emoji: '✨' },
  { id: 'gastos', label: 'Gastos', emoji: '💰' },
  { id: 'ingresos', label: 'Ahorro', emoji: '📊' },
  { id: 'metas', label: 'Metas', emoji: '🎯' },
  { id: 'presupuestos', label: 'Presupuestos', emoji: '📅' },
  { id: 'deudas', label: 'Deudas', emoji: '💳' },
  { id: 'cuentas', label: 'Cuentas', emoji: '🏦' },
]

interface Props {
  questions: AssistantQuestion[]
  onPick: (questionId: string) => void
  paramOptions?: Array<{ id: string; label: string }>
  onPickParam?: (paramId: string) => void
  onCancelParam?: () => void
  suggested?: string[]
}

export function ChipPanel({ questions, onPick, paramOptions, onPickParam, onCancelParam, suggested = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('insights')

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
