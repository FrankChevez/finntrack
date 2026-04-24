import { useMemo, useState } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM, ymLabel } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { CATS, type Transaction } from '../types'

function TransactionModal({ tx, onClose }: { tx?: Transaction; onClose: () => void }) {
  const { addTransaction, updateTransaction, accounts, cards } = useStore()
  const { showToast } = useToast()
  const allAccounts = [...accounts.map(a=>a.name), ...cards.map(c=>c.name)]

  const [form, setForm] = useState({
    date:    tx?.date    ?? new Date().toISOString().slice(0,10),
    desc:    tx?.desc    ?? '',
    cat:     tx?.cat     ?? 'Alimentación',
    amount:  tx ? Math.abs(tx.amount).toString() : '',
    account: tx?.account ?? (allAccounts[0] ?? ''),
    type:    tx?.type    ?? 'expense' as 'income'|'expense',
  })

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}))

  const save = () => {
    if (!form.desc || !form.amount || !form.account) { showToast('Completa todos los campos'); return }
    const amount = parseFloat(form.amount) * (form.type==='expense' ? -1 : 1)
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
        <div style={{display:'flex',gap:8}}>
          {(['expense','income'] as const).map(t=>(
            <button key={t} className={`btn${form.type===t?' btn-accent':''}`} style={{flex:1}}
              onClick={()=>set('type',t)}>
              {t==='expense'?'Gasto':'Ingreso'}
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="form-input" type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Monto ($)</label>
          <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>set('amount',e.target.value)}/>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" placeholder="Ej: Supermercado La Colonia" value={form.desc} onChange={e=>set('desc',e.target.value)}/>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-select" value={form.cat} onChange={e=>set('cat',e.target.value)}>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Cuenta / Tarjeta</label>
          <select className="form-select" value={form.account} onChange={e=>set('account',e.target.value)}>
            {allAccounts.map(a=><option key={a}>{a}</option>)}
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

export default function Gastos() {
  const { transactions, deleteTransaction } = useStore()
  const { showToast } = useToast()
  const [filterMonth, setFilterMonth] = useState(() =>
    transactions.some(t => t.date.startsWith(currentYM())) ? currentYM() : ''
  )
  const [filterCat, setFilterCat] = useState('')
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [adding, setAdding] = useState(false)

  const months = useMemo(() => {
    const set = new Set(transactions.map(t=>t.date.slice(0,7)))
    return [...set].sort().reverse()
  }, [transactions])

  const filtered = useMemo(() =>
    transactions.filter(t =>
      (filterMonth ? t.date.startsWith(filterMonth) : true) &&
      (filterCat   ? t.cat === filterCat             : true)
    ).sort((a,b)=>b.date.localeCompare(a.date)),
    [transactions, filterMonth, filterCat])

  const income  = filtered.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const expense = Math.abs(filtered.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))
  const net     = income - expense

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    showToast('Transacción eliminada')
  }

  return (
    <div className="page-enter">
      {(adding || editing) && (
        <TransactionModal tx={editing} onClose={()=>{ setAdding(false); setEditing(undefined) }}/>
      )}

      <div className="metrics metrics-3 mb">
        <div className="metric">
          <div className="metric-label">Ingresos</div>
          <div className="metric-value pos">{fmt(income)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Gastos</div>
          <div className="metric-value neg">{fmt(expense)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Neto</div>
          <div className={`metric-value ${net>=0?'pos':'neg'}`}>{fmt(net)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Transacciones ({filtered.length})</span>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <select className="form-select" style={{width:'auto',padding:'5px 10px',fontSize:12}}
              value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
              <option value="">Todos los meses</option>
              {months.map(m=><option key={m} value={m}>{ymLabel(m)}</option>)}
            </select>
            <select className="form-select" style={{width:'auto',padding:'5px 10px',fontSize:12}}
              value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-accent btn-sm" onClick={()=>setAdding(true)}>+ Agregar</button>
          </div>
        </div>

        {filtered.length > 0 ? filtered.map(tx=>(
          <div key={tx.id} className="row">
            <div style={{flex:1,minWidth:0}}>
              <div className="row-main" style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.desc}</div>
              <div className="row-sub">{tx.cat} · {tx.account} · {tx.date}</div>
            </div>
            <div className="row-right" style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <div className={`amount ${tx.amount>0?'pos':'neg'}`}>{tx.amount>0?'+':''}{fmt(tx.amount)}</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(tx)}>Editar</button>
              <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(tx.id)}>×</button>
            </div>
          </div>
        )) : <div className="empty">Sin transacciones para este filtro</div>}
      </div>
    </div>
  )
}
