import { useState } from 'react'
import { useStore } from '../../stores/useStore'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { CATS, type Transaction } from '../../types'

interface TransactionModalProps {
  tx?: Transaction
  onClose: () => void
}

export function TransactionModal({ tx, onClose }: TransactionModalProps) {
  const { addTransaction, updateTransaction, accounts, cards } = useStore()
  const { showToast } = useToast()
  const allAccounts = [...accounts.map(a => a.name), ...cards.map(c => c.name)]

  const [form, setForm] = useState({
    date:    tx?.date    ?? new Date().toISOString().slice(0, 10),
    desc:    tx?.desc    ?? '',
    cat:     tx?.cat     ?? 'Alimentación',
    amount:  tx ? Math.abs(tx.amount).toString() : '',
    account: tx?.account ?? (allAccounts[0] ?? ''),
    type:    tx?.type    ?? 'expense' as 'income' | 'expense',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.desc || !form.amount || !form.account) {
      showToast('Completa todos los campos')
      return
    }
    const amount = parseFloat(form.amount) * (form.type === 'expense' ? -1 : 1)
    if (tx) {
      updateTransaction(tx.id, { ...form, amount, type: form.type })
    } else {
      addTransaction({ ...form, amount, type: form.type })
    }
    showToast(tx ? 'Transacción actualizada' : 'Transacción agregada')
    onClose()
  }

  return (
    <Modal title={tx ? 'Editar transacción' : 'Nueva transacción'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Tipo</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['expense', 'income'] as const).map(t => (
            <button key={t} className={`btn${form.type === t ? ' btn-accent' : ''}`} style={{ flex: 1 }}
              onClick={() => set('type', t)}>
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Monto ($)</label>
          <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" placeholder="Ej: Supermercado La Colonia" value={form.desc} onChange={e => set('desc', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-select" value={form.cat} onChange={e => set('cat', e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Cuenta / Tarjeta</label>
          <select className="form-select" value={form.account} onChange={e => set('account', e.target.value)}>
            {allAccounts.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}>Guardar</button>
      </div>
    </Modal>
  )
}
