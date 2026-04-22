import { useState } from 'react'
import { Modal } from './Modal'
import type { Account } from '../../types'

interface PayModalProps {
  title: string
  maxAmount: number
  accounts: Account[]
  onConfirm: (amount: number, accountName: string) => void
  onClose: () => void
}

export function PayModal({ title, maxAmount, accounts, onConfirm, onClose }: PayModalProps) {
  const [amount, setAmount] = useState(maxAmount.toFixed(2))
  const [accountName, setAccountName] = useState(accounts[0]?.name ?? '')

  const parsed = parseFloat(amount) || 0

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Monto a pagar ($)</label>
        <input
          className="form-input"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Débitar de cuenta</label>
        <select
          className="form-select"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="btn btn-accent"
          disabled={parsed <= 0 || !accountName}
          onClick={() => onConfirm(parsed, accountName)}
        >
          Confirmar pago
        </button>
      </div>
    </Modal>
  )
}
