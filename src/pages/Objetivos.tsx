import { useState, useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM, prevYM, nextYM, ymLabel } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { CATS, type Budget, type Goal, type Debt } from '../types'

// ─── Presupuestos ─────────────────────────────────────────────────────────────
export function Presupuestos() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget } = useStore()
  const { showToast } = useToast()
  const [ym, setYm] = useState(currentYM())
  const [editing, setEditing] = useState<Budget|null|'new'>(null)

  const txMonth = useMemo(()=>transactions.filter(t=>t.date.startsWith(ym)),[transactions,ym])

  const items = budgets.map(b=>{
    const spent = Math.abs(txMonth.filter(t=>t.cat===b.cat&&t.amount<0).reduce((s,t)=>s+t.amount,0))
    const pct   = b.limit>0 ? Math.min(100,Math.round((spent/b.limit)*100)) : 0
    return { ...b, spent, pct, over: spent>b.limit }
  }).sort((a,b)=>b.pct-a.pct)

  const totalBudget = budgets.reduce((s,b)=>s+b.limit,0)
  const totalSpent  = items.reduce((s,b)=>s+b.spent,0)

  return (
    <div className="page-enter">
      <div className="metrics metrics-3 mb">
        <div className="metric accent"><div className="metric-label">Presupuesto total</div><div className="metric-value">{fmt(totalBudget)}</div></div>
        <div className="metric"><div className="metric-label">Gastado</div><div className="metric-value neg">{fmt(totalSpent)}</div></div>
        <div className="metric"><div className="metric-label">Disponible</div><div className={`metric-value ${totalBudget-totalSpent>=0?'pos':'neg'}`}>{fmt(totalBudget-totalSpent)}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn btn-sm" onClick={()=>setYm(prevYM(ym))}>←</button>
            <span style={{fontSize:13,fontWeight:500}}>{ymLabel(ym)}</span>
            <button className="btn btn-sm" onClick={()=>setYm(nextYM(ym))} disabled={ym>=currentYM()}>→</button>
          </div>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditing('new')}>+ Agregar</button>
        </div>

        {items.map(b=>(
          <div key={b.id} style={{marginBottom:'1rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:13,color:'var(--text-primary)'}}>{b.cat}</span>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:12,fontFamily:'DM Mono,monospace',color:'var(--text-muted)'}}>{fmt(b.spent)} / {fmt(b.limit)}</span>
                {b.over&&<span className="tag tag-neg">Excedido</span>}
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(b)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{ deleteBudget(b.id); showToast('Presupuesto eliminado') }}>×</button>
              </div>
            </div>
            <div className="progress">
              <div className="progress-fill" style={{width:`${b.pct}%`,background:b.over?'var(--neg)':b.pct>75?'var(--warn)':b.color}}/>
            </div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>{b.pct}% utilizado</div>
          </div>
        ))}
        {items.length===0&&<div className="empty">Sin presupuestos configurados</div>}
      </div>

      {editing!==null&&(
        <Modal title={editing==='new'?'Nuevo presupuesto':'Editar presupuesto'} onClose={()=>setEditing(null)}>
          <BudgetForm
            budget={editing==='new'?undefined:editing}
            onSave={(b)=>{ editing==='new'?addBudget(b):updateBudget((editing as Budget).id,b); showToast('Guardado'); setEditing(null) }}
            onClose={()=>setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function BudgetForm({ budget, onSave, onClose }: { budget?:Budget; onSave:(b:Omit<Budget,'id'>)=>void; onClose:()=>void }) {
  const [cat,setCat]=useState(budget?.cat??'Alimentación')
  const [limit,setLimit]=useState(budget?.limit?.toString()??'')
  const [color,setColor]=useState(budget?.color??'#6c8fff')
  return <>
    <div className="form-group"><label className="form-label">Categoría</label>
      <select className="form-select" value={cat} onChange={e=>setCat(e.target.value)}>{CATS.filter(c=>c!=='Ingreso').map(c=><option key={c}>{c}</option>)}</select>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Límite mensual ($)</label><input className="form-input" type="number" step="0.01" value={limit} onChange={e=>setLimit(e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Color</label><input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:'100%',height:36,borderRadius:8,border:'0.5px solid var(--border-mid)',cursor:'pointer'}}/></div>
    </div>
    <div className="form-actions">
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-accent" onClick={()=>onSave({cat,limit:parseFloat(limit)||0,color})}>Guardar</button>
    </div>
  </>
}

// ─── Metas ────────────────────────────────────────────────────────────────────
export function Metas() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Goal|null|'new'>(null)

  const totalTarget = goals.reduce((s,g)=>s+g.target,0)
  const totalSaved  = goals.reduce((s,g)=>s+g.saved,0)
  const completed   = goals.filter(g=>g.saved>=g.target).length

  return (
    <div className="page-enter">
      <div className="metrics metrics-3 mb">
        <div className="metric accent"><div className="metric-label">Total meta</div><div className="metric-value">{fmt(totalTarget)}</div></div>
        <div className="metric"><div className="metric-label">Total ahorrado</div><div className="metric-value pos">{fmt(totalSaved)}</div></div>
        <div className="metric"><div className="metric-label">Metas completadas</div><div className="metric-value">{completed} / {goals.length}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Metas de ahorro</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditing('new')}>+ Nueva meta</button>
        </div>
        {goals.map(g=>{
          const pct = g.target>0?Math.min(100,Math.round((g.saved/g.target)*100)):0
          const remaining = g.target-g.saved
          const days = Math.ceil((new Date(g.deadline).getTime()-Date.now())/(1000*60*60*24))
          return (
            <div key={g.id} style={{padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
                    {g.name}
                    {pct>=100&&<span className="tag tag-pos">Completada</span>}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,fontFamily:'DM Mono,monospace'}}>
                    {fmt(g.saved)} / {fmt(g.target)} · {days>0?`${days} días restantes`:'Vencida'}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:16,fontFamily:'DM Mono,monospace',color:g.color}}>{pct}%</span>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(g)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>{ deleteGoal(g.id); showToast('Meta eliminada') }}>×</button>
                </div>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{width:`${pct}%`,background:g.color}}/>
              </div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>
                {remaining>0?`Faltan ${fmt(remaining)}`:'¡Meta alcanzada!'}
              </div>
            </div>
          )
        })}
        {goals.length===0&&<div className="empty">Sin metas registradas</div>}
      </div>

      {editing!==null&&(
        <Modal title={editing==='new'?'Nueva meta':'Editar meta'} onClose={()=>setEditing(null)}>
          <GoalForm goal={editing==='new'?undefined:editing} onSave={(g)=>{ editing==='new'?addGoal(g):updateGoal((editing as Goal).id,g); showToast('Guardado'); setEditing(null) }} onClose={()=>setEditing(null)}/>
        </Modal>
      )}
    </div>
  )
}

function GoalForm({ goal, onSave, onClose }: { goal?:Goal; onSave:(g:Omit<Goal,'id'>)=>void; onClose:()=>void }) {
  const [f,setF]=useState({ name:goal?.name??'', target:goal?.target?.toString()??'', saved:goal?.saved?.toString()??'0', deadline:goal?.deadline??'', color:goal?.color??'#6c8fff' })
  const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}))
  return <>
    <div className="form-group"><label className="form-label">Nombre de la meta</label><input className="form-input" placeholder="Ej: Fondo de emergencia" value={f.name} onChange={e=>s('name',e.target.value)}/></div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Meta ($)</label><input className="form-input" type="number" step="0.01" value={f.target} onChange={e=>s('target',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Ahorrado ($)</label><input className="form-input" type="number" step="0.01" value={f.saved} onChange={e=>s('saved',e.target.value)}/></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Fecha límite</label><input className="form-input" type="date" value={f.deadline} onChange={e=>s('deadline',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Color</label><input type="color" value={f.color} onChange={e=>s('color',e.target.value)} style={{width:'100%',height:36,borderRadius:8,border:'0.5px solid var(--border-mid)',cursor:'pointer'}}/></div>
    </div>
    <div className="form-actions">
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-accent" onClick={()=>onSave({name:f.name,target:parseFloat(f.target)||0,saved:parseFloat(f.saved)||0,deadline:f.deadline,color:f.color})}>Guardar</button>
    </div>
  </>
}

// ─── Deudas ───────────────────────────────────────────────────────────────────
export function Deudas() {
  const { debts, addDebt, updateDebt, deleteDebt } = useStore()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Debt|null|'new'>(null)

  const totalRemaining = debts.reduce((s,d)=>s+d.remaining,0)
  const totalMonthly   = debts.reduce((s,d)=>s+d.monthly,0)
  const monthsFree     = totalMonthly>0?Math.ceil(totalRemaining/totalMonthly):0

  return (
    <div className="page-enter">
      <div className="metrics metrics-3 mb">
        <div className="metric accent"><div className="metric-label">Deuda total</div><div className="metric-value">{fmt(totalRemaining)}</div></div>
        <div className="metric"><div className="metric-label">Pago mensual</div><div className="metric-value neg">{fmt(totalMonthly)}</div></div>
        <div className="metric"><div className="metric-label">Meses para liberarse</div><div className="metric-value">{totalRemaining>0?monthsFree:'0'}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Detalle de deudas</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditing('new')}>+ Agregar deuda</button>
        </div>
        {debts.map(d=>{
          const pct = d.total>0?Math.round(((d.total-d.remaining)/d.total)*100):0
          return (
            <div key={d.id} style={{padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{d.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,display:'flex',gap:12,flexWrap:'wrap'}}>
                    <span>Tasa: {d.rate}% anual</span>
                    <span>Pago mensual: {fmt(d.monthly)}</span>
                    <span className={`tag ${d.type==='credit'?'tag-neg':'tag-purple'}`}>{d.type==='credit'?'Crédito':'Préstamo'}</span>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--neg)'}}>{fmt(d.remaining)}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>de {fmt(d.total)}</div>
                </div>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{width:`${pct}%`,background:d.color}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
                <span style={{fontSize:10,color:'var(--text-muted)'}}>{pct}% pagado</span>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(d)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>{ deleteDebt(d.id); showToast('Deuda eliminada') }}>×</button>
                </div>
              </div>
            </div>
          )
        })}
        {debts.length===0&&<div className="empty">Sin deudas registradas</div>}
      </div>

      {editing!==null&&(
        <Modal title={editing==='new'?'Nueva deuda':'Editar deuda'} onClose={()=>setEditing(null)}>
          <DebtForm debt={editing==='new'?undefined:editing} onSave={(d)=>{ editing==='new'?addDebt(d):updateDebt((editing as Debt).id,d); showToast('Guardado'); setEditing(null) }} onClose={()=>setEditing(null)}/>
        </Modal>
      )}
    </div>
  )
}

function DebtForm({ debt, onSave, onClose }: { debt?:Debt; onSave:(d:Omit<Debt,'id'>)=>void; onClose:()=>void }) {
  const [f,setF]=useState({ name:debt?.name??'', total:debt?.total?.toString()??'', remaining:debt?.remaining?.toString()??'', rate:debt?.rate?.toString()??'0', monthly:debt?.monthly?.toString()??'0', type:debt?.type??'credit' as Debt['type'], color:debt?.color??'#f06060' })
  const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}))
  return <>
    <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" placeholder="Ej: Visa Agrícola" value={f.name} onChange={e=>s('name',e.target.value)}/></div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Monto total ($)</label><input className="form-input" type="number" step="0.01" value={f.total} onChange={e=>s('total',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Saldo restante ($)</label><input className="form-input" type="number" step="0.01" value={f.remaining} onChange={e=>s('remaining',e.target.value)}/></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Tasa anual (%)</label><input className="form-input" type="number" step="0.1" value={f.rate} onChange={e=>s('rate',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Pago mensual ($)</label><input className="form-input" type="number" step="0.01" value={f.monthly} onChange={e=>s('monthly',e.target.value)}/></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Tipo</label>
        <select className="form-select" value={f.type} onChange={e=>s('type',e.target.value)}>
          <option value="credit">Crédito</option><option value="loan">Préstamo</option>
        </select>
      </div>
      <div className="form-group"><label className="form-label">Color</label><input type="color" value={f.color} onChange={e=>s('color',e.target.value)} style={{width:'100%',height:36,borderRadius:8,border:'0.5px solid var(--border-mid)',cursor:'pointer'}}/></div>
    </div>
    <div className="form-actions">
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-accent" onClick={()=>onSave({name:f.name,total:parseFloat(f.total)||0,remaining:parseFloat(f.remaining)||0,rate:parseFloat(f.rate)||0,monthly:parseFloat(f.monthly)||0,type:f.type as Debt['type'],color:f.color})}>Guardar</button>
    </div>
  </>
}
