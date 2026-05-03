import { useEffect, useRef, useState } from 'react'
import { Bot } from 'lucide-react'
import { useStore } from '../stores/useStore'
import { ChatBubble } from '../components/asistente/ChatBubble'
import { TypingIndicator } from '../components/asistente/TypingIndicator'
import { ChipPanel } from '../components/asistente/ChipPanel'
import { QUESTIONS, getQuestion, listParams, WELCOME_TEXT } from '../lib/assistant'
import type { QuestionParam } from '../lib/assistant'
import type { FinanzasDB } from '../types'

export default function Asistente() {
  const store = useStore()
  const { assistantMessages, addAssistantMessage, clearAssistantMessages } = store
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const pendingTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const [typing, setTyping] = useState(false)
  const [pendingParam, setPendingParam] = useState<{ questionId: string; param: QuestionParam } | null>(null)
  const [affordPending, setAffordPending] = useState<{ questionId: string } | null>(null)
  const [suggested, setSuggested] = useState<string[]>([])

  // Schedule a timer and track it so it can be cleared if component unmounts
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimers.current.delete(id)
      fn()
    }, ms)
    pendingTimers.current.add(id)
    return id
  }

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const timers = pendingTimers.current
    return () => {
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
    }
  }, [])

  // Build the db snapshot for calling assistant functions
  const buildDb = (): FinanzasDB => ({
    accounts: store.accounts,
    cards: store.cards,
    transactions: store.transactions,
    budgets: store.budgets,
    goals: store.goals,
    debts: store.debts,
    recurring: store.recurring,
    transfers: store.transfers,
    installments: store.installments,
    assistantMessages: store.assistantMessages,
  })

  // Inject welcome message on first mount if history empty
  useEffect(() => {
    if (assistantMessages.length === 0) {
      addAssistantMessage({ role: 'bot', text: WELCOME_TEXT })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistantMessages.length, typing])

  const handleChip = (questionId: string) => {
    const q = getQuestion(questionId)
    if (!q) return

    addAssistantMessage({ role: 'user', text: q.label })

    if (q.needsParam === 'afford') {
      if (store.accounts.length === 0) {
        setTyping(true)
        schedule(() => {
          setTyping(false)
          addAssistantMessage({ role: 'bot', text: 'No tienes cuentas configuradas aún.' })
        }, 400)
        return
      }
      setTyping(true)
      schedule(() => {
        setTyping(false)
        addAssistantMessage({ role: 'bot', text: 'Dime el monto y elige una o varias cuentas:' })
        setAffordPending({ questionId })
      }, 400)
      return
    }

    if (q.needsParam) {
      const options = listParams(buildDb(), q.needsParam)

      if (options.length === 0) {
        setTyping(true)
        schedule(() => {
          setTyping(false)
          const emptyText = q.needsParam === 'goal'
            ? 'No tienes metas para consultar esto aún.'
            : q.needsParam === 'category'
              ? 'No tienes categorías configuradas aún.'
              : 'No tienes cuentas para consultar esto aún.'
          addAssistantMessage({ role: 'bot', text: emptyText })
        }, 400)
        return
      }

      setTyping(true)
      schedule(() => {
        setTyping(false)
        addAssistantMessage({ role: 'bot', text: '¿De cuál? Elige abajo:' })
        setPendingParam({ questionId, param: q.needsParam! })
      }, 400)
      return
    }

    setTyping(true)
    schedule(() => {
      setTyping(false)
      const ans = q.answer(buildDb())
      addAssistantMessage({ role: 'bot', text: ans.text, list: ans.list })
      setSuggested(ans.followUps ?? [])
    }, 450)
  }

  const handleParamPick = (paramId: string) => {
    if (!pendingParam) return
    const q = getQuestion(pendingParam.questionId)
    if (!q) {
      setPendingParam(null)
      return
    }

    const options = listParams(buildDb(), pendingParam.param)
    const selected = options.find((o) => o.id === paramId)
    addAssistantMessage({ role: 'user', text: selected?.label ?? paramId })

    setPendingParam(null)
    setTyping(true)
    schedule(() => {
      setTyping(false)
      const ans = q.answer(buildDb(), paramId)
      addAssistantMessage({ role: 'bot', text: ans.text, list: ans.list })
      setSuggested(ans.followUps ?? [])
    }, 450)
  }

  const handleClear = () => {
    if (!confirm('¿Limpiar todo el historial del chat?')) return
    clearAssistantMessages()
    setSuggested([])
    setPendingParam(null)
    schedule(() => {
      addAssistantMessage({ role: 'bot', text: WELCOME_TEXT })
    }, 100)
  }

  const handleCancelParam = () => {
    setPendingParam(null)
    addAssistantMessage({ role: 'bot', text: 'Entendido, cancelado. ¿Qué más quieres preguntar?' })
  }

  const handleAffordSubmit = (amount: number, accountNames: string[]) => {
    if (!affordPending) return
    const q = getQuestion(affordPending.questionId)
    if (!q) {
      setAffordPending(null)
      return
    }
    const paramId = [amount.toString(), ...accountNames].join('|')
    addAssistantMessage({ role: 'user', text: `${amount} desde ${accountNames.join(', ')}` })
    setAffordPending(null)
    setTyping(true)
    schedule(() => {
      setTyping(false)
      const ans = q.answer(buildDb(), paramId)
      addAssistantMessage({ role: 'bot', text: ans.text, list: ans.list })
      setSuggested(ans.followUps ?? [])
    }, 450)
  }

  const handleAffordCancel = () => {
    setAffordPending(null)
    addAssistantMessage({ role: 'bot', text: 'Entendido, cancelado. ¿Qué más quieres preguntar?' })
  }

  const paramOptions = pendingParam ? listParams(buildDb(), pendingParam.param) : undefined
  const affordMode = affordPending
    ? { accounts: store.accounts, onSubmit: handleAffordSubmit, onCancel: handleAffordCancel }
    : undefined

  return (
    <div className="page-enter chat-page">
      <div className="chat-header">
        <div className="chat-avatar">
          <Bot size={22} strokeWidth={2} />
        </div>
        <div className="chat-header-title">
          <div className="chat-header-name">Asistente Finntrack</div>
          <div className="chat-header-status">En línea</div>
        </div>
        <button className="chat-clear-btn" onClick={handleClear}>Limpiar</button>
      </div>

      <div className="chat-messages">
        {assistantMessages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <ChipPanel
        questions={QUESTIONS}
        onPick={handleChip}
        paramOptions={paramOptions}
        onPickParam={handleParamPick}
        onCancelParam={handleCancelParam}
        affordMode={affordMode}
        suggested={suggested}
      />
    </div>
  )
}
