import { useMemo, useState } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM, prevYM, nextYM, ymLabel, addMonths } from '../lib/utils'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function Reporte() {
  const { transactions, accounts, cards, debts, goals, budgets, theme } = useStore()
  const [ym, setYm] = useState(currentYM())

  const isDark = theme === 'dark'
  const axisColor  = isDark ? '#4A4070' : '#8078A8'
  const gridColor  = isDark ? 'rgba(204,0,74,0.08)' : 'rgba(18,14,31,0.06)'
  const ttBg       = isDark ? '#120E1F' : '#fff'

  // ─── Month stats ────────────────────────────────────────────────────────────
  const thisTx = useMemo(() => transactions.filter(t=>t.date.startsWith(ym)), [transactions, ym])
  const prevTx = useMemo(() => transactions.filter(t=>t.date.startsWith(prevYM(ym))), [transactions, ym])

  const income  = thisTx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const expense = Math.abs(thisTx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))
  const net     = income - expense
  const savingsRate = income > 0 ? Math.round((net/income)*100) : 0
  const dailyAvg    = parseFloat((expense / 30).toFixed(2))

  const prevIncome  = prevTx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const prevExpense = Math.abs(prevTx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))
  const incomeDelta  = prevIncome  > 0 ? ((income -prevIncome) /prevIncome *100) : 0
  const expenseDelta = prevExpense > 0 ? ((expense-prevExpense)/prevExpense*100) : 0

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: string[] = []
    budgets.forEach(b => {
      const spent = Math.abs(thisTx.filter(t=>t.cat===b.cat&&t.amount<0).reduce((s,t)=>s+t.amount,0))
      if (spent > b.limit) list.push(`${b.cat} superó el presupuesto un ${Math.round((spent/b.limit-1)*100)}%`)
    })
    cards.forEach(c => {
      const util = c.limit > 0 ? Math.round((c.balance/c.limit)*100) : 0
      if (util > 70) list.push(`Tarjeta ${c.name} al ${util}% de utilización`)
    })
    return list
  }, [thisTx, budgets, cards])

  // ─── Category variation ────────────────────────────────────────────────────
  const catVariation = useMemo(() => {
    const cur: Record<string,number>  = {}
    const prev: Record<string,number> = {}
    thisTx.filter(t=>t.amount<0).forEach(t=>{ cur[t.cat]=(cur[t.cat]||0)+Math.abs(t.amount) })
    prevTx.filter(t=>t.amount<0).forEach(t=>{ prev[t.cat]=(prev[t.cat]||0)+Math.abs(t.amount) })
    const entries = Object.entries(cur).map(([cat,val])=>{
      const pval = prev[cat] || 0
      const pct  = pval > 0 ? ((val-pval)/pval*100) : 0
      return { cat, val, pct }
    }).sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct))
    return entries[0] ?? null
  }, [thisTx, prevTx])

  // ─── Best / worst months ───────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const map: Record<string,number> = {}
    transactions.forEach(t => {
      const m = t.date.slice(0,7)
      map[m] = (map[m]||0) + t.amount
    })
    const entries = Object.entries(map)
    if (entries.length < 2) return { best: null, worst: null }
    const sorted = entries.sort((a,b)=>b[1]-a[1])
    return { best: sorted[0], worst: sorted[sorted.length-1] }
  }, [transactions])

  // ─── Day of week ───────────────────────────────────────────────────────────
  const dowData = useMemo(() => {
    const totals = [0,0,0,0,0,0,0]
    const counts = [0,0,0,0,0,0,0]
    thisTx.filter(t=>t.amount<0).forEach(t=>{
      const d = new Date(t.date+'T12:00:00').getDay()
      totals[d] += Math.abs(t.amount)
      counts[d]++
    })
    return DOW.map((name,i)=>({ name, avg: counts[i]>0 ? parseFloat((totals[i]/counts[i]).toFixed(2)) : 0 }))
  }, [thisTx])

  const maxDow    = Math.max(...dowData.map(d=>d.avg), 1)
  const busyDay   = dowData.reduce((a,b)=>a.avg>b.avg?a:b, dowData[0])

  // ─── Top 5 expenses ────────────────────────────────────────────────────────
  const top5 = useMemo(() =>
    [...thisTx].filter(t=>t.amount<0).sort((a,b)=>a.amount-b.amount).slice(0,5),
    [thisTx])

  // ─── Card utilization ─────────────────────────────────────────────────────
  const avgUtil = cards.length > 0
    ? Math.round(cards.reduce((s,c)=>s+(c.limit>0?c.balance/c.limit:0),0)/cards.length*100) : 0

  // ─── Emergency fund ────────────────────────────────────────────────────────
  const emergAccounts = accounts.filter(a => a.emergencyFund)
  const totalSaved = emergAccounts.length > 0
    ? emergAccounts.reduce((s, a) => s + a.balance * ((a.emergencyPct ?? 100) / 100), 0)
    : accounts.reduce((s, a) => s + a.balance, 0)
  const monthlyExp   = expense || 1
  const emergMonths  = parseFloat((totalSaved/monthlyExp).toFixed(1))

  // ─── Debt projection ──────────────────────────────────────────────────────
  const totalDebt    = debts.reduce((s,d)=>s+d.remaining,0)
  const monthlyDebt  = debts.reduce((s,d)=>s+d.monthly,0)
  const debtMonths   = monthlyDebt > 0 ? Math.ceil(totalDebt/monthlyDebt) : 0
  const debtFreeDate = (() => {
    if (!debtMonths) return null
    const d = new Date(); d.setMonth(d.getMonth()+debtMonths)
    return d.toLocaleDateString('es-SV',{month:'short',year:'numeric'})
  })()

  // ─── 6-month projection (line chart) ──────────────────────────────────────
  // Compute avg income/expense from last 3 months
  const avgData = useMemo(() => {
    const months3 = [0,1,2].map(i=>{ const d=new Date(ym+'-01'); d.setMonth(d.getMonth()-i); return d.toISOString().slice(0,7) })
    const inc3 = months3.map(m=>transactions.filter(t=>t.date.startsWith(m)&&t.amount>0).reduce((s,t)=>s+t.amount,0))
    const exp3 = months3.map(m=>Math.abs(transactions.filter(t=>t.date.startsWith(m)&&t.amount<0).reduce((s,t)=>s+t.amount,0)))
    const avgInc = inc3.reduce((s,v)=>s+v,0) / 3
    const avgExp = exp3.reduce((s,v)=>s+v,0) / 3
    return { avgInc, avgExp, avgSav: avgInc - avgExp }
  }, [transactions, ym])

  const projData = useMemo(() => {
    const { avgInc, avgExp, avgSav } = avgData
    const startBalance = accounts.reduce((s,a)=>s+a.balance,0) - cards.reduce((s,c)=>s+c.balance,0)
    return Array.from({length:8},(_,i)=>{
      const month  = i===0 ? ym : addMonths(ym,i)
      const isProj = i > 0
      const balance = parseFloat((startBalance + avgSav * i).toFixed(2))
      return {
        name:    ymLabel(month).slice(0,3)+' '+(new Date(month+'-01').getFullYear()+'').slice(2),
        Balance: balance,
        Ingresos: isProj ? parseFloat(avgInc.toFixed(2)) : income,
        Gastos:   isProj ? parseFloat(avgExp.toFixed(2)) : expense,
        isProj,
      }
    })
  }, [avgData, ym, accounts, cards, income, expense])

  const balanceOct   = projData[projData.length-1]?.Balance ?? 0
  const totalDebtIn6 = Math.min(totalDebt, monthlyDebt * 6)

  // Goal ETAs
  const goalEtas = useMemo(() => {
    if (avgData.avgSav <= 0) return []
    return goals.filter(g=>g.saved<g.target).map(g=>{
      const needed = g.target - g.saved
      const months = Math.ceil(needed / avgData.avgSav)
      const d = new Date(); d.setMonth(d.getMonth()+months)
      return { ...g, months, eta: d.toLocaleDateString('es-SV',{month:'short',year:'numeric'}) }
    }).sort((a,b)=>a.months-b.months)
  }, [goals, avgData])

  const nearestGoal = goalEtas[0]

  return (
    <div className="page-enter">
      {/* Month nav */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.25rem',flexWrap:'wrap'}}>
        <button className="btn" onClick={()=>setYm(prevYM(ym))}>← Anterior</button>
        <span style={{fontSize:16,fontWeight:500,letterSpacing:'-0.01em'}}>{ymLabel(ym)}</span>
        <button className="btn" onClick={()=>setYm(nextYM(ym))} disabled={ym>=currentYM()}>Siguiente →</button>
        <button className="btn" style={{marginLeft:'auto'}} onClick={()=>window.print()}>Imprimir / PDF</button>
      </div>

      {/* Alerts */}
      {alerts.map((a,i)=>(
        <div key={i} className="alert-strip alert-danger mb">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 1L1 12h12L7 1z"/><path d="M7 5v3M7 9.5v.5"/></svg>
          {a}
        </div>
      ))}

      {/* KPIs */}
      <div className="metrics metrics-4 mb">
        <div className="metric accent">
          <div className="metric-label">Ingresos</div>
          <div className="metric-value">{fmt(income)}</div>
          <div className="metric-sub" style={{color:incomeDelta>=0?'rgba(255,255,255,0.8)':'rgba(255,200,200,0.8)'}}>
            {incomeDelta!==0 ? `${incomeDelta>=0?'▲':'▼'} ${Math.abs(incomeDelta).toFixed(1)}% vs ${ymLabel(prevYM(ym)).split(' ')[0]}` : '—'}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Gastos</div>
          <div className="metric-value neg">{fmt(expense)}</div>
          <div className="metric-sub" style={{color:expenseDelta<=0?'var(--pos)':'var(--neg)'}}>
            {expenseDelta!==0 ? `${expenseDelta>=0?'▲':'▼'} ${Math.abs(expenseDelta).toFixed(1)}% vs ${ymLabel(prevYM(ym)).split(' ')[0]}` : '—'}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Ahorro neto</div>
          <div className={`metric-value ${net>=0?'pos':'neg'}`}>{fmt(net)}</div>
          <div className="metric-sub">{savingsRate}% del ingreso</div>
        </div>
        <div className="metric">
          <div className="metric-label">Gasto diario prom.</div>
          <div className="metric-value">{fmt(dailyAvg)}</div>
          <div className="metric-sub" style={{color:'var(--text-muted)'}}>estimado mensual</div>
        </div>
      </div>

      {/* Health + Trends */}
      <div className="grid2-wide mb">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Salud financiera</span>
            <span className="tag" style={{
              background: savingsRate>=20&&avgUtil<30 ? 'var(--pos-bg)' : 'var(--warn-bg)',
              color:      savingsRate>=20&&avgUtil<30 ? 'var(--pos)'    : 'var(--warn)',
            }}>
              {savingsRate>=20&&avgUtil<30 ? 'Buena' : 'Mejorable'}
            </span>
          </div>
          <div className="health-grid">
            {[
              { label:'Ratio ahorro / ingreso', val:`${savingsRate}%`, hint:`Meta: 20% · ${savingsRate>=20?'Excelente':'Por debajo de la meta'}`, pct:Math.min(100,savingsRate*2), color:savingsRate>=20?'var(--pos)':'var(--warn)' },
              { label:'Utilización de tarjetas', val:`${avgUtil}%`, hint:`Meta: <30% · ${avgUtil<=30?'Dentro del rango':'Reducir antes del cierre'}`, pct:Math.min(100,avgUtil), color:avgUtil<=30?'var(--pos)':avgUtil<=60?'var(--warn)':'var(--neg)' },
              { label:'Fondo de emergencia', val:`${emergMonths} meses`, hint:`Meta: 6 meses · ${emergMonths>=6?'Completado':'Faltan '+Math.max(0,(6-emergMonths)).toFixed(1)+' meses de gastos'}`, pct:Math.min(100,(emergMonths/6)*100), color:emergMonths>=6?'var(--pos)':'var(--blue)' },
              { label:'Proyección libre de deuda', val:debtFreeDate??'Sin deudas', hint:`${totalDebt>0?`$${totalDebt.toLocaleString()} restante · ${debtMonths} meses aprox.`:'¡Sin deudas pendientes!'}`, pct:totalDebt>0?Math.min(100,(1-totalDebt/debts.reduce((s,d)=>s+d.total,1))*100):100, color:'var(--purple)' },
            ].map((h,i)=>(
              <div key={i} className="health-item">
                <div className="health-row">
                  <span className="health-name">{h.label}</span>
                  <span className="health-val" style={{color:h.color}}>{h.val}</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{width:`${h.pct}%`,background:h.color}}/></div>
                <div className="health-hint">{h.hint}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Análisis de tendencias</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              { label:'Mayor variación de categoría', value:catVariation?.cat??'—', delta:catVariation?`${catVariation.pct>=0?'+':''}${catVariation.pct.toFixed(0)}%`:null, color:catVariation&&catVariation.pct>0?'var(--neg)':'var(--pos)' },
              { label:'Mejor mes del año', value:monthStats.best?ymLabel(monthStats.best[0]):'—', delta:monthStats.best?fmt(monthStats.best[1]):null, color:'var(--pos)' },
              { label:'Peor mes del año', value:monthStats.worst?ymLabel(monthStats.worst[0]):'—', delta:monthStats.worst?fmt(monthStats.worst[1]):null, color:'var(--neg)' },
              { label:'Día con más gasto', value:busyDay?.avg>0?busyDay.name:'—', delta:busyDay?.avg>0?`${fmt(busyDay.avg)} prom.`:null, color:'var(--blue)' },
            ].map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px',background:'var(--bg-elevated)',borderRadius:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{t.label}</div>
                  <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{t.value}</div>
                </div>
                {t.delta && <div style={{fontSize:11,fontWeight:500,color:t.color,flexShrink:0}}>{t.delta}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day of week + Top 5 */}
      <div className="grid2 mb">
        <div className="card">
          <div className="card-header"><span className="card-title">Gasto promedio por día de semana</span></div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,marginBottom:8}}>
            {dowData.map((d)=>(
              <div key={d.name} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{
                  width:'100%',
                  height:`${maxDow>0?Math.max(4,(d.avg/maxDow)*64):4}px`,
                  background:d.name===busyDay?.name?'var(--neg)':'var(--blue-bg)',
                  borderRadius:'3px 3px 0 0',
                  transition:'height 0.3s',
                  border: d.name===busyDay?.name ? 'none' : '0.5px solid var(--border)',
                }}/>
                <span style={{fontSize:9,color:d.name===busyDay?.name?'var(--neg)':'var(--text-muted)',fontWeight:d.name===busyDay?.name?500:400}}>{d.name}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-muted)'}}>
            <span>Prom. diario: <strong style={{color:'var(--text-primary)'}}>{fmt(dailyAvg)}</strong></span>
            <span>{busyDay?.avg>0?`${busyDay.name}: `:''}
              {busyDay?.avg>0?<strong style={{color:'var(--neg)'}}>{fmt(busyDay.avg)}</strong>:null}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top 5 gastos del mes</span></div>
          {top5.length > 0 ? top5.map((tx,i)=>(
            <div key={tx.id} className="row">
              <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                <span style={{fontSize:11,color:'var(--text-muted)',width:14,flexShrink:0}}>{i+1}</span>
                <div style={{minWidth:0}}>
                  <div className="row-main" style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.desc}</div>
                  <div className="row-sub">{tx.cat}</div>
                </div>
              </div>
              <span className="amount neg" style={{flexShrink:0}}>{fmt(tx.amount)}</span>
            </div>
          )) : <div className="empty">Sin gastos registrados</div>}
        </div>
      </div>

      {/* 6-month projection */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Proyección a 6 meses</span>
          <span className="tag tag-blue">Basado en promedio últimos 3 meses</span>
        </div>

        <div className="metrics metrics-3" style={{marginBottom:'1rem'}}>
          <div className="proj-stat">
            <div className="proj-stat-label">Balance en {ymLabel(addMonths(ym,6)).split(' ').join(' ')}</div>
            <div className="proj-stat-val" style={{color:'var(--pos)'}}>{fmt(balanceOct)}</div>
            <div className="proj-stat-sub">Ahorrando ~{fmt(avgData.avgSav)}/mes</div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-label">Meta más cercana</div>
            <div className="proj-stat-val" style={{color:'var(--blue)',fontSize:14}}>{nearestGoal?.name??'—'}</div>
            <div className="proj-stat-sub" style={{color: nearestGoal?.months<=6?'var(--pos)':'var(--text-muted)'}}>
              {nearestGoal ? `Alcanzada en ~${nearestGoal.months} meses · ${nearestGoal.eta}` : 'Sin metas activas'}
            </div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-label">Deuda pagada en 6 meses</div>
            <div className="proj-stat-val" style={{color:'var(--purple)'}}>{fmt(totalDebtIn6)}</div>
            <div className="proj-stat-sub">De {fmt(totalDebt)} totales</div>
          </div>
        </div>

        <div style={{height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projData} margin={{top:10,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:axisColor}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:axisColor}} axisLine={false} tickLine={false}
                tickFormatter={v=>Math.abs(v)>=1000?`$${(v/1000).toFixed(1)}k`:`$${Math.round(v)}`}/>
              <Tooltip
                formatter={(v, name)=>[fmt(Number(v)), String(name)]}
                contentStyle={{background:ttBg,border:'0.5px solid var(--border-mid)',borderRadius:8,fontSize:12}}
                labelStyle={{color:'var(--text-primary)',fontWeight:500}}
              />
              <ReferenceLine x={ymLabel(ym).slice(0,3)+' '+(new Date(ym+'-01').getFullYear()+'').slice(2)}
                stroke={axisColor} strokeDasharray="4 3"
                label={{value:'Hoy',position:'insideTopRight',fontSize:9,fill:axisColor}}/>
              <Line type="monotone" dataKey="Balance"  stroke="var(--purple)" strokeWidth={2}
                dot={(p)=><circle key={p.index} cx={p.cx} cy={p.cy} r={p.index===0||p.index===projData.length-1?5:3} fill={p.index===projData.length-1?'var(--pos)':'var(--purple)'} stroke="#fff" strokeWidth={1.5}/>}
                activeDot={{r:5}}/>
              <Line type="monotone" dataKey="Ingresos" stroke="var(--pos)" strokeWidth={1.5}
                strokeDasharray="5 4" dot={{r:2,fill:'var(--pos)'}} activeDot={{r:4}}/>
              <Line type="monotone" dataKey="Gastos"   stroke="var(--neg)" strokeWidth={1.5}
                strokeDasharray="5 4" dot={{r:2,fill:'var(--neg)'}} activeDot={{r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goal ETAs */}
        {goalEtas.length > 0 && (
          <div style={{marginTop:'1rem'}}>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>
              Estimaciones de metas
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {goalEtas.slice(0,3).map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',background:'var(--bg-elevated)',borderRadius:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:g.color,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:12,color:'var(--text-secondary)'}}>{g.name}</span>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>{fmt(g.target-g.saved)} restante</span>
                  <span className={`tag ${g.months<=6?'tag-pos':'tag-blue'}`}>{g.eta}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop:12,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:8,fontSize:11,color:'var(--text-muted)',lineHeight:1.6}}>
          Ingreso prom. <strong style={{color:'var(--text-primary)'}}>{fmt(avgData.avgInc)}/mes</strong> · Gasto prom.{' '}
          <strong style={{color:'var(--text-primary)'}}>{fmt(avgData.avgExp)}/mes</strong> · Ahorro estimado{' '}
          <strong style={{color:'var(--pos)'}}>{fmt(avgData.avgSav)}/mes</strong>. No incluye imprevistos ni variaciones estacionales.
        </div>
      </div>
    </div>
  )
}
