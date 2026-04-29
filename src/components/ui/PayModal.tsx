import { useState } from 'react'
import { Modal } from './Modal'
import type { Account, Card } from '../../types'

interface PayModalProps {
  title: string
  maxAmount: number
  accounts: Account[]
  cards?: Card[]
  excludeCardId?: string
  onConfirm: (amount: number, sourceName: string) => void
  onClose: () => void
}

export function PayModal({ title, maxAmount, accounts, cards = [], excludeCardId, onConfirm, onClose }: PayModalProps) {
  const availableCards = cards.filter(c => c.id !== excludeCardId)
  const [amount, setAmount] = useState(maxAmount.toFixed(2))
  const [sourceName, setSourceName] = useState(accounts[0]?.name ?? availableCards[0]?.name ?? '')

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
        <label className="form-label">Pagar con</label>
        <select
          className="form-select"
          value={sourceName}
          onChange={e => setSourceName(e.target.value)}
        >
          {accounts.length > 0 && (
            <optgroup label="Cuentas">
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </optgroup>
          )}
          {availableCards.length > 0 && (
            <optgroup label="Tarjetas de crédito">
              {availableCards.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="btn btn-accent"
          disabled={parsed <= 0 || !sourceName}
          onClick={() => onConfirm(parsed, sourceName)}
        >
          Confirmar pago
        </button>
      </div>
    </Modal>
  )
}
