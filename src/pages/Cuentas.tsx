// ─── Cuentas ──────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useStore } from '../stores/useStore'
import { fmt } from '../lib/utils'
import { Modal } from '../components/ui/Modal'
import { PayModal } from '../components/ui/PayModal'
import { useToast } from '../components/ui/Toast'
import type { Account, Card } from '../types'

export function Cuentas() {
  const { accounts, cards, addAccount, updateAccount, deleteAccount, addCard, updateCard, deleteCard, payCard } = useStore()
  const { showToast } = useToast()
  const [editAcc, setEditAcc] = useState<Account|null|'new'>(null)
  const [editCard, setEditCard] = useState<Card|null|'new'>(null)
  const [payingCard, setPayingCard] = useState<Card|null>(null)

  const totalBanks = accounts.reduce((s,a)=>s+a.balance,0)
  const totalDebt  = cards.reduce((s,c)=>s+c.balance,0)
  const totalLimit = cards.reduce((s,c)=>s+c.limit,0)

  return (
    <div className="page-enter">
      <div className="metrics metrics-3 mb">
        <div className="metric accent">
          <div className="metric-label">Total en cuentas</div>
          <div className="metric-value">{fmt(totalBanks)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Deuda en tarjetas</div>
          <div className="metric-value neg">{fmt(totalDebt)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Crédito disponible</div>
          <div className="metric-value pos">{fmt(totalLimit-totalDebt)}</div>
        </div>
      </div>

      {/* Bank accounts */}
      <div className="section-label">Cuentas bancarias</div>
      <div className="card mb">
        <div className="card-header">
          <span className="card-title">Cuentas ({accounts.length})</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditAcc('new')}>+ Agregar</button>
        </div>
        {accounts.map(a=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
            <div className="account-icon" style={{background:a.color+'22'}}>
              <svg viewBox="0 0 16 16" fill="none" stroke={a.color} strokeWidth="1.4"><rect x="1" y="4" width="14" height="10" rx="1.5"/><path d="M1 8h14M5 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{a.name}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{a.type==='savings'?'Ahorro':a.type==='checking'?'Corriente':'Efectivo'}</div>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:15,color:a.balance<0?'var(--neg)':'var(--text-primary)'}}>{fmt(a.balance)}</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setEditAcc(a)}>Editar</button>
            <button className="btn btn-danger btn-sm" onClick={()=>{ deleteAccount(a.id); showToast('Cuenta eliminada') }}>×</button>
          </div>
        ))}
        {accounts.length===0&&<div className="empty">Sin cuentas registradas</div>}
      </div>

      {/* Credit cards */}
      <div className="section-label">Tarjetas de crédito</div>
      <div className="card mb">
        <div className="card-header">
          <span className="card-title">Tarjetas ({cards.length})</span>
          <button className="btn btn-accent btn-sm" onClick={()=>setEditCard('new')}>+ Agregar</button>
        </div>
        {cards.map(c=>{
          const util = c.limit>0?Math.round((c.balance/c.limit)*100):0
          return (
            <div key={c.id} style={{padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                <div className="account-icon" style={{background:c.color+'22'}}>
                  <svg viewBox="0 0 16 16" fill="none" stroke={c.color} strokeWidth="1.4"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 7h14M4 10.5h2M8 10.5h2"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{c.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>Cierre día {c.closeDay}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--neg)'}}>{fmt(c.balance)}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>de {fmt(c.limit)}</div>
                </div>
                <button type="button" className="btn btn-accent btn-sm" onClick={() => setPayingCard(c)}>Pagar</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setEditCard(c)}>Editar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={()=>{ deleteCard(c.id); showToast('Tarjeta eliminada') }}>×</button>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{width:`${util}%`,background:util>80?'var(--neg)':util>50?'var(--warn)':'var(--pos)'}}/>
              </div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>{util}% utilizado</div>
            </div>
          )
        })}
        {cards.length===0&&<div className="empty">Sin tarjetas registradas</div>}
      </div>

      {/* Account Modal */}
      {editAcc!==null && (
        <AccountModal
          acc={editAcc==='new'?undefined:editAcc}
          onClose={()=>setEditAcc(null)}
          onSave={(a)=>{ editAcc==='new'?addAccount(a):updateAccount((editAcc as Account).id,a); showToast('Guardado'); setEditAcc(null) }}
        />
      )}

      {/* Card Modal */}
      {editCard!==null && (
        <CardModal
          card={editCard==='new'?undefined:editCard}
          onClose={()=>setEditCard(null)}
          onSave={(c)=>{ editCard==='new'?addCard(c):updateCard((editCard as Card).id,c); showToast('Guardado'); setEditCard(null) }}
        />
      )}

      {payingCard && (
        <PayModal
          title={`Pagar ${payingCard.name}`}
          maxAmount={payingCard.balance}
          accounts={accounts}
          onConfirm={(amount, accountName) => {
            payCard(payingCard.id, amount, accountName)
            showToast(`Pago de ${payingCard.name} registrado`)
            setPayingCard(null)
          }}
          onClose={() => setPayingCard(null)}
        />
      )}
    </div>
  )
}

function AccountModal({ acc, onClose, onSave }: { acc?: Account; onClose:()=>void; onSave:(a:Omit<Account,'id'>)=>void }) {
  const [form,setForm]=useState({ name:acc?.name??'', type:acc?.type??'savings' as Account['type'], balance:acc?.balance?.toString()??'0', color:acc?.color??'#6c8fff', emergencyFund:acc?.emergencyFund??false, emergencyPct:acc?.emergencyPct?.toString()??'100' })
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  return (
    <Modal title={acc?'Editar cuenta':'Nueva cuenta'} onClose={onClose}>
      <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" value={form.name} onChange={e=>s('name',e.target.value)}/></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Tipo</label>
          <select className="form-select" value={form.type} onChange={e=>s('type',e.target.value)}>
            <option value="savings">Ahorro</option><option value="checking">Corriente</option><option value="cash">Efectivo</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Balance ($)</label><input className="form-input" type="number" step="0.01" value={form.balance} onChange={e=>s('balance',e.target.value)}/></div>
      </div>
      <div className="form-group"><label className="form-label">Color</label><input type="color" value={form.color} onChange={e=>s('color',e.target.value)} style={{width:'100%',height:36,borderRadius:8,border:'0.5px solid var(--border-mid)',cursor:'pointer'}}/></div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.emergencyFund}
            onChange={e => setForm(f => ({ ...f, emergencyFund: e.target.checked }))}
          />
          <span className="form-label" style={{ margin: 0 }}>Fondo de emergencia</span>
        </label>
      </div>
      {form.emergencyFund && (
        <div className="form-group">
          <label className="form-label">% que cuenta como fondo (1–100)</label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="100"
            value={form.emergencyPct}
            onChange={e => setForm(f => ({ ...f, emergencyPct: e.target.value }))}
          />
        </div>
      )}
      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-accent" onClick={()=>onSave({name:form.name,type:form.type as Account['type'],balance:parseFloat(form.balance)||0,color:form.color,emergencyFund:form.emergencyFund||undefined,emergencyPct:form.emergencyFund?(parseInt(form.emergencyPct)||100):undefined})}>Guardar</button>
      </div>
    </Modal>
  )
}

function CardModal({ card, onClose, onSave }: { card?: Card; onClose:()=>void; onSave:(c:Omit<Card,'id'>)=>void }) {
  const [form,setForm]=useState({ name:card?.name??'', limit:card?.limit?.toString()??'', balance:card?.balance?.toString()??'0', closeDay:card?.closeDay?.toString()??'20', color:card?.color??'#f06060' })
  const s=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  return (
    <Modal title={card?'Editar tarjeta':'Nueva tarjeta'} onClose={onClose}>
      <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" placeholder="Visa Agrícola" value={form.name} onChange={e=>s('name',e.target.value)}/></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Límite ($)</label><input className="form-input" type="number" step="0.01" value={form.limit} onChange={e=>s('limit',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Saldo usado ($)</label><input className="form-input" type="number" step="0.01" value={form.balance} onChange={e=>s('balance',e.target.value)}/></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Día de cierre</label><input className="form-input" type="number" min="1" max="31" value={form.closeDay} onChange={e=>s('closeDay',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Color</label><input type="color" value={form.color} onChange={e=>s('color',e.target.value)} style={{width:'100%',height:36,borderRadius:8,border:'0.5px solid var(--border-mid)',cursor:'pointer'}}/></div>
      </div>
      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-accent" onClick={()=>onSave({name:form.name,limit:parseFloat(form.limit)||0,balance:parseFloat(form.balance)||0,closeDay:parseInt(form.closeDay)||20,color:form.color})}>Guardar</button>
      </div>
    </Modal>
  )
}
