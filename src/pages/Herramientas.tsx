import { useState, useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { CATS, type RecurringItem, type Installment } from '../types'

// ─── Transferencias ───────────────────────────────────────────────────────────
export function Transferencias() {
  const { accounts, cards, transfers, addTransfer, deleteTransfer } = useStore()
  const { showToast } = useToast()
  const allAccounts = [...accounts.map(a=>a.name), ...cards.map(c=>c.name)]
  const [from,setFrom]=useState(allAccounts[0]??'')
  const [to,setTo]=useState(allAccounts[1]??'')
  const [amount,setAmount]=useState('')
  const [date,setDate]=useState(new Date().toISOString().slice(0,10))
  const [note,setNote]=useState('')

  const save = () => {
    if (!from||!to||!amount||from===to) { showToast('Completa los campos correctamente'); return }
    addTransfer({ from,to,amount:parseFloat(amount),date,note })
    showToast('Transferencia registrada')
    setAmount(''); setNote('')
  }

  return (
    <div className="page-enter">
      <div className="grid2 mb">
        <div className="card">
          <div className="card-header"><span className="card-title">Nueva transferencia</span></div>
          <div className="form-group"><label className="form-label">Desde</label>
            <select className="form-select" value={from} onChange={e=>setFrom(e.target.value)}>{allAccounts.map(a=><option key={a}>{a}</option>)}</select>
          </div>
          <div className="form-group"><label className="form-label">Hacia</label>
            <select className="form-select" value={to} onChange={e=>setTo(e.target.value)}>{allAccounts.map(a=><option key={a}>{a}</option>)}</select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Monto ($)</label><input className="form-input" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Nota (opcional)</label><input className="form-input" placeholder="Ej: Pago tarjeta" value={note} onChange={e=>setNote(e.target.value)}/></div>
          <button className="btn btn-accent" style={{width:'100%'}} onClick={save}>Registrar transferencia</button>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Historial</span></div>
          {transfers.length>0 ? [...transfers].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
            <div key={t.id} className="row">
              <div>
                <div className="row-main">{t.from} → {t.to}</div>
                <div className="row-sub">{t.date}{t.note?` · ${t.note}`:''}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span className="amount">{fmt(t.amount)}</span>
                <button className="btn btn-danger btn-sm" onClick={()=>{ deleteTransfer(t.id); showToast('Transferencia eliminada') }}>×</button>
              </div>
            </div>
          )) : <div className="empty">Sin transferencias</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Recurrentes ──────────────────────────────────────────────────────────────
export function Recurrentes() {
  const { recurring, addRecurring, updateRecurring, deleteRecurring, payRecurring, accounts, cards } = useStore()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<RecurringItem|null|'new'>(null)
  const ym = currentYM()

  const allAccounts = [...accounts.map(a=>a.name), ...cards.map(c=>c.name)]
  const totalMonthly = recurring.reduce((s,r)=>s+r.amount,0)

  const dueThisMonth = useMemo(()=>
    recurring.filter(r=>r.lastPaid!==ym),
    [recurring, ym])

  return (
    <div className="page-enter">
      <div className="metrics metrics-2 mb">
        <div className="metric accent"><div className="metric-label">Total mensual</div><div className="metric-value">{fmt(totalMonthly)}</div></div>
        <div className="metric"><div className="metric-label">Pendientes este mes</div><div className="metric-value neg">{dueThisMonth.length}</div></div>
      </div>

      {dueThisMonth.length>0&&(
        <div className="card mb">
          <div className="card-header"><span className="card-title">Vencen este mes</span></div>
          {dueThisMonth.map(r=>(
            <div key={r.id} className="row">
              <div><div className="row-main">{r.desc}</div><div className="row-sub">{r.cat} · Día {r.day}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="amount neg">{fmt(r.amount)}</span>
                <button className="btn btn-accent btn-sm" onClick={()=>{ payRecurring(r.id); showToast('Pago registrado') }}>Pagar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Gastos recurrentes ({recurring.length})</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditing('new')}>+ Agregar</button>
        </div>
        {recurring.map(r=>(
          <div key={r.id} className="row">
            <div>
              <div className="row-main">{r.desc} {r.lastPaid===ym&&<span className="tag tag-pos" style={{marginLeft:6}}>Pagado</span>}</div>
              <div className="row-sub">{r.cat} · {r.account} · Día {r.day} de cada mes</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span className="amount neg">{fmt(r.amount)}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(r)}>Editar</button>
              <button className="btn btn-danger btn-sm" onClick={()=>{ deleteRecurring(r.id); showToast('Eliminado') }}>×</button>
            </div>
          </div>
        ))}
        {recurring.length===0&&<div className="empty">Sin gastos recurrentes</div>}
      </div>

      {editing!==null&&(
        <Modal title={editing==='new'?'Nuevo recurrente':'Editar recurrente'} onClose={()=>setEditing(null)}>
          <RecurringForm
            item={editing==='new'?undefined:editing}
            accounts={allAccounts}
            onSave={(r)=>{ editing==='new'?addRecurring(r):updateRecurring((editing as RecurringItem).id,r); showToast('Guardado'); setEditing(null) }}
            onClose={()=>setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function RecurringForm({ item, accounts, onSave, onClose }: { item?:RecurringItem; accounts:string[]; onSave:(r:Omit<RecurringItem,'id'>)=>void; onClose:()=>void }) {
  const [f,setF]=useState({ desc:item?.desc??'', amount:item?.amount?.toString()??'', day:item?.day?.toString()??'1', cat:item?.cat??'Servicios', account:item?.account??(accounts[0]??'') })
  const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}))
  return <>
    <div className="form-group"><label className="form-label">Descripción</label><input className="form-input" placeholder="Ej: Netflix" value={f.desc} onChange={e=>s('desc',e.target.value)}/></div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Monto ($)</label><input className="form-input" type="number" step="0.01" value={f.amount} onChange={e=>s('amount',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Día del mes</label><input className="form-input" type="number" min="1" max="31" value={f.day} onChange={e=>s('day',e.target.value)}/></div>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Categoría</label>
        <select className="form-select" value={f.cat} onChange={e=>s('cat',e.target.value)}>{CATS.filter(c=>c!=='Ingreso').map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <div className="form-group"><label className="form-label">Cuenta / Tarjeta</label>
        <select className="form-select" value={f.account} onChange={e=>s('account',e.target.value)}>{accounts.map(a=><option key={a}>{a}</option>)}</select>
      </div>
    </div>
    <div className="form-actions">
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-accent" onClick={()=>onSave({desc:f.desc,amount:parseFloat(f.amount)||0,day:parseInt(f.day)||1,cat:f.cat,account:f.account})}>Guardar</button>
    </div>
  </>
}

// ─── Cuotas ───────────────────────────────────────────────────────────────────
export function Cuotas() {
  const { installments, addInstallment, updateInstallment, deleteInstallment, payInstallment, cards } = useStore()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Installment|null|'new'>(null)
  const ym = currentYM()

  const active = installments.filter(i=>i.paid<i.cuotas)
  const totalMonthly = active.reduce((s,i)=>s+i.cuotaAmt,0)
  const totalRemaining = active.reduce((s,i)=>s+((i.cuotas-i.paid)*i.cuotaAmt),0)

  const dueThisMonth = useMemo(()=>active.filter(i=>{
    const start = new Date(i.startDate)
    const startYM = start.toISOString().slice(0,7)
    const [sy,sm] = startYM.split('-').map(Number)
    const [cy,cm] = ym.split('-').map(Number)
    const elapsed = (cy-sy)*12+(cm-sm)
    return elapsed>=i.paid && elapsed<i.cuotas
  }), [active, ym])

  return (
    <div className="page-enter">
      <div className="metrics metrics-3 mb">
        <div className="metric accent"><div className="metric-label">Cuota mensual total</div><div className="metric-value">{fmt(totalMonthly)}</div></div>
        <div className="metric"><div className="metric-label">Compras activas</div><div className="metric-value">{active.length}</div></div>
        <div className="metric"><div className="metric-label">Total restante</div><div className="metric-value neg">{fmt(totalRemaining)}</div></div>
      </div>

      {dueThisMonth.length>0&&(
        <div className="card mb">
          <div className="card-header"><span className="card-title">Cuotas que vencen este mes</span></div>
          {dueThisMonth.map(i=>(
            <div key={i.id} className="row">
              <div><div className="row-main">{i.desc}</div><div className="row-sub">{i.card} · Cuota {i.paid+1} de {i.cuotas}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="amount neg">{fmt(i.cuotaAmt)}</span>
                <button className="btn btn-accent btn-sm" onClick={()=>{ payInstallment(i.id); showToast('Cuota registrada') }}>Pagar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Compras a cuotas activas</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditing('new')}>+ Nueva compra</button>
        </div>
        {active.map(i=>{
          const pct = Math.round((i.paid/i.cuotas)*100)
          return (
            <div key={i.id} style={{padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{i.desc}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{i.card} · {i.paid}/{i.cuotas} cuotas · {fmt(i.cuotaAmt)}/mes</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(i)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>{ deleteInstallment(i.id); showToast('Eliminado') }}>×</button>
                </div>
              </div>
              <div className="progress"><div className="progress-fill" style={{width:`${pct}%`,background:'var(--accent)'}}/></div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>{pct}% pagado · faltan {fmt((i.cuotas-i.paid)*i.cuotaAmt)}</div>
            </div>
          )
        })}
        {active.length===0&&<div className="empty">Sin compras a cuotas activas</div>}
      </div>

      {editing!==null&&(
        <Modal title={editing==='new'?'Nueva compra a cuotas':'Editar compra'} onClose={()=>setEditing(null)}>
          <InstallmentForm
            inst={editing==='new'?undefined:editing}
            cardNames={cards.map(c=>c.name)}
            onSave={(i)=>{ editing==='new'?addInstallment(i):updateInstallment((editing as Installment).id,i); showToast('Guardado'); setEditing(null) }}
            onClose={()=>setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function InstallmentForm({ inst, cardNames, onSave, onClose }: { inst?:Installment; cardNames:string[]; onSave:(i:Omit<Installment,'id'>)=>void; onClose:()=>void }) {
  const [f,setF]=useState({ desc:inst?.desc??'', total:inst?.total?.toString()??'', cuotas:inst?.cuotas?.toString()??'', cuotaAmt:inst?.cuotaAmt?.toString()??'', card:inst?.card??(cardNames[0]??''), cat:inst?.cat??'Tecnología', startDate:inst?.startDate??new Date().toISOString().slice(0,10), paid:inst?.paid?.toString()??'0' })
  const s=(k:string,v:string)=>setF(p=>({...p,[k]:v}))
  const calcCuota=()=>{ const t=parseFloat(f.total),c=parseInt(f.cuotas); if(t>0&&c>0) s('cuotaAmt',(t/c).toFixed(2)) }
  return <>
    <div className="form-group"><label className="form-label">Descripción</label><input className="form-input" placeholder="Ej: Televisor LG" value={f.desc} onChange={e=>s('desc',e.target.value)}/></div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Monto total ($)</label><input className="form-input" type="number" step="0.01" value={f.total} onChange={e=>{ s('total',e.target.value); setTimeout(calcCuota,0) }}/></div>
      <div className="form-group"><label className="form-label">Número de cuotas</label><input className="form-input" type="number" min="1" value={f.cuotas} onChange={e=>{ s('cuotas',e.target.value); setTimeout(calcCuota,0) }}/></div>
    </div>
    <div className="form-group"><label className="form-label">Cuota mensual ($)</label><input className="form-input" type="number" step="0.01" value={f.cuotaAmt} onChange={e=>s('cuotaAmt',e.target.value)}/></div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Tarjeta</label>
        <select className="form-select" value={f.card} onChange={e=>s('card',e.target.value)}>{cardNames.map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <div className="form-group"><label className="form-label">Categoría</label>
        <select className="form-select" value={f.cat} onChange={e=>s('cat',e.target.value)}>{CATS.filter(c=>c!=='Ingreso').map(c=><option key={c}>{c}</option>)}</select>
      </div>
    </div>
    <div className="form-row">
      <div className="form-group"><label className="form-label">Fecha inicio</label><input className="form-input" type="date" value={f.startDate} onChange={e=>s('startDate',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Cuotas ya pagadas</label><input className="form-input" type="number" min="0" value={f.paid} onChange={e=>s('paid',e.target.value)}/></div>
    </div>
    <div className="form-actions">
      <button className="btn" onClick={onClose}>Cancelar</button>
      <button className="btn btn-accent" onClick={()=>onSave({desc:f.desc,total:parseFloat(f.total)||0,cuotas:parseInt(f.cuotas)||0,cuotaAmt:parseFloat(f.cuotaAmt)||0,card:f.card,cat:f.cat,startDate:f.startDate,paid:parseInt(f.paid)||0})}>Guardar</button>
    </div>
  </>
}
