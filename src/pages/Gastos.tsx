import { useMemo, useState } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM, ymLabel } from '../lib/utils'
import { TransactionModal } from '../components/ui/TransactionModal'
import { useToast } from '../components/ui/Toast'
import { CATS, type Transaction } from '../types'
import { Search, X } from 'lucide-react'

export default function Gastos() {
  const { transactions, deleteTransaction } = useStore()
  const { showToast } = useToast()
  const [filterMonth, setFilterMonth] = useState(() =>
    transactions.some(t => t.date.startsWith(currentYM())) ? currentYM() : ''
  )
  const [filterCat, setFilterCat] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [adding, setAdding] = useState(false)

  const months = useMemo(() => {
    const set = new Set(transactions.map(t=>t.date.slice(0,7)))
    return [...set].sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    const search = filterSearch.trim().toLowerCase()
    return transactions.filter(t =>
      (filterMonth ? t.date.startsWith(filterMonth) : true) &&
      (filterCat   ? t.cat === filterCat             : true) &&
      (search      ? t.desc.toLowerCase().includes(search) : true)
    ).sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, filterMonth, filterCat, filterSearch])

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
          <button className="btn btn-accent btn-sm" onClick={()=>setAdding(true)}>+ Agregar</button>
        </div>

        <div className="gastos-filters-row">
          <div className="search-input-wrap">
            <Search size={14} strokeWidth={1.8} className="search-input-icon" />
            <input
              className="form-input search-input"
              type="text"
              placeholder="Buscar por descripción..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              aria-label="Buscar transacciones"
            />
            {filterSearch && (
              <button
                type="button"
                className="search-input-clear"
                onClick={() => setFilterSearch('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
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
