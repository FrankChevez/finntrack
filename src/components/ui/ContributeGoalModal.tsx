import { useState, useMemo } from 'react'
import { Modal } from './Modal'
import { fmt } from '../../lib/utils'
import type { Account, Goal } from '../../types'

interface ContributeGoalModalProps {
  goal: Goal
  accounts: Account[]
  onConfirm: (amount: number, fromAccountName: string) => void
  onClose: () => void
}

export function ContributeGoalModal({ goal, accounts, onConfirm, onClose }: ContributeGoalModalProps) {
  const goalAccount = useMemo(
    () => goal.accountId ? accounts.find(a => a.id === goal.accountId) : undefined,
    [goal.accountId, accounts]
  )

  const [amount, setAmount] = useState('')
  const [fromAccountName, setFromAccountName] = useState(
    goalAccount?.name ?? accounts[0]?.name ?? ''
  )

  const parsed = parseFloat(amount) || 0
  const remaining = Math.max(0, goal.target - goal.saved)

  const hint = goalAccount
    ? fromAccountName === goalAccount.name
      ? `Se apartará desde ${goalAccount.name} para esta meta (sin mover dinero entre cuentas)`
      : `Se transferirá de ${fromAccountName} a ${goalAccount.name} y se apartará para esta meta`
    : `Se apartará desde ${fromAccountName} (sin cuenta vinculada a la meta)`

  return (
    <Modal title={`Aportar a: ${goal.name}`} onClose={onClose}>
      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:14,fontFamily:'DM Mono,monospace'}}>
        Meta: {fmt(goal.saved)} / {fmt(goal.target)} · Faltan {fmt(remaining)}
      </div>

      <div className="form-group">
        <label className="form-label">Monto ($)</label>
        <input
          className="form-input"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">Desde cuenta</label>
        <select
          className="form-select"
          value={fromAccountName}
          onChange={e => setFromAccountName(e.target.value)}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>
          {hint}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="btn btn-accent"
          disabled={parsed <= 0 || !fromAccountName}
          onClick={() => onConfirm(parsed, fromAccountName)}
        >
          Confirmar aporte
        </button>
      </div>
    </Modal>
  )
}
