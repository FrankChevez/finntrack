import { useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { fmt, currentYM, prevYM, ymLabel } from '../lib/utils'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const CAT_COLORS = ['#cc004a','#1A4FB8','#5B3FA8','#157A45','#9A5A00','#6898FF','#30D47A','#F5A623']

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { transactions, accounts, cards, theme } = useStore()
  const ym  = currentYM()
  const pym = prevYM(ym)

  const thisTx = useMemo(() => transactions.filter(t => t.date.startsWith(ym)),  [transactions, ym])
  const prevTx = useMemo(() => transactions.filter(t => t.date.startsWith(pym)), [transactions, pym])

  const income  = useMemo(() => thisTx.filter(t => t.amount > 0).reduce((s,t) => s+t.amount, 0), [thisTx])
  const expense = useMemo(() => Math.abs(thisTx.filter(t => t.amount < 0).reduce((s,t) => s+t.amount, 0)), [thisTx])
  const savings = income - expense
  const savingsRate = income > 0 ? Math.round((savings/income)*100) : 0

  const prevIncome  = prevTx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const prevExpense = Math.abs(prevTx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))
  const incomeDelta  = prevIncome  > 0 ? ((income -prevIncome) /prevIncome *100).toFixed(1) : null
  const expenseDelta = prevExpense > 0 ? ((expense-prevExpense)/prevExpense*100).toFixed(1) : null

  const totalBalance = useMemo(() =>
    accounts.reduce((s,a)=>s+a.balance,0) - cards.reduce((s,c)=>s+c.balance,0),
    [accounts, cards])

  const catData = useMemo(() => {
    const map: Record<string,number> = {}
    thisTx.filter(t=>t.amount<0).forEach(t=>{ map[t.cat]=(map[t.cat]||0)+Math.abs(t.amount) })
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([name,value])=>({ name, value: parseFloat(value.toFixed(2)) }))
  }, [thisTx])

  const barData = useMemo(() => Array.from({length:5},(_,i)=>{
    const d = new Date(ym+'-01'); d.setMonth(d.getMonth()-(4-i))
    const month = d.toISOString().slice(0,7)
    const mtx = transactions.filter(t=>t.date.startsWith(month))
    return {
      name: ymLabel(month).slice(0,3),
      Ingresos: parseFloat(mtx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0).toFixed(2)),
      Gastos:   parseFloat(Math.abs(mtx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)).toFixed(2)),
    }
  }), [transactions, ym])

  const recent = useMemo(() =>
    [...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7),
    [transactions])

  const isDark = theme === 'dark'
  const axisColor = isDark ? '#4A4070' : '#8078A8'
  const gridColor = isDark ? 'rgba(204,0,74,0.08)' : 'rgba(18,14,31,0.06)'

  return (
    <div className="page-enter">
      <div className="metrics metrics-4 mb">
        <div className="metric accent">
          <div className="metric-label">Balance neto</div>
          <div className="metric-value">{fmt(totalBalance)}</div>
          <div className="metric-sub">activos − tarjetas</div>
          <div className="metric-bar"><div className="metric-bar-fill" style={{width:'100%',background:'rgba(255,255,255,0.5)'}}/></div>
        </div>
        <div className="metric dark">
          <div className="metric-label">Ingresos del mes</div>
          <div className="metric-value">{fmt(income)}</div>
          <div className="metric-sub">
            {incomeDelta
              ? <span style={{color:parseFloat(incomeDelta)>=0?'var(--pos)':'var(--neg)'}}>
                  {parseFloat(incomeDelta)>=0?'▲':'▼'} {Math.abs(parseFloat(incomeDelta))}% vs {ymLabel(pym).split(' ')[0]}
                </span>
              : <span>—</span>}
          </div>
          <div className="metric-bar"><div className="metric-bar-fill" style={{width:'80%',background:'rgba(255,255,255,0.3)'}}/></div>
        </div>
        <div className="metric">
          <div className="metric-label">Gastos del mes</div>
          <div className="metric-value neg">{fmt(expense)}</div>
          <div className="metric-sub">
            {expenseDelta
              ? <span style={{color:parseFloat(expenseDelta)<=0?'var(--pos)':'var(--neg)'}}>
                  {parseFloat(expenseDelta)>=0?'▲':'▼'} {Math.abs(parseFloat(expenseDelta))}% vs {ymLabel(pym).split(' ')[0]}
                </span>
              : <span>—</span>}
          </div>
          <div className="metric-bar"><div className="metric-bar-fill" style={{width:`${Math.min(100,(expense/(income||1))*100)}%`,background:'var(--neg)'}}/></div>
        </div>
        <div className="metric">
          <div className="metric-label">Ahorro neto</div>
          <div className={`metric-value ${savings>=0?'pos':'neg'}`}>{fmt(savings)}</div>
          <div className="metric-sub" style={{color:savingsRate>=20?'var(--pos)':'var(--warn)'}}>
            {savingsRate}% del ingreso {savingsRate>=20?'· Excelente':'· Meta: 20%'}
          </div>
          <div className="metric-bar"><div className="metric-bar-fill" style={{width:`${Math.min(100,savingsRate*2)}%`,background:'var(--purple)'}}/></div>
        </div>
      </div>

      <div className="grid2 mb">
        <div className="card">
          <div className="card-header"><span className="card-title">Gastos por categoría — {ymLabel(ym)}</span></div>
          {catData.length > 0 ? <>
            <div className="chart-wrap" style={{height:180}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2} dataKey="value">
                    {catData.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>[fmt(Number(v)),'']} contentStyle={{background:isDark?'#120E1F':'#fff',border:'0.5px solid var(--border-mid)',borderRadius:8,fontSize:12}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {catData.map((d,i)=>(
                <div key={d.name} className="chart-legend-item">
                  <div className="chart-legend-dot" style={{background:CAT_COLORS[i%CAT_COLORS.length]}}/>
                  {d.name}
                </div>
              ))}
            </div>
          </> : <div className="empty">Sin gastos este mes</div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Flujo últimos 5 meses</span></div>
          <div className="chart-wrap" style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={12} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:axisColor}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:axisColor}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={(v)=>[fmt(Number(v)),'']} contentStyle={{background:isDark?'#120E1F':'#fff',border:'0.5px solid var(--border-mid)',borderRadius:8,fontSize:12}}/>
                <Bar dataKey="Ingresos" fill="var(--pos)" radius={[3,3,0,0]}/>
                <Bar dataKey="Gastos"   fill="var(--neg)" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{background:'var(--pos)'}}/> Ingresos</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{background:'var(--neg)'}}/> Gastos</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Transacciones recientes</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate('gastos')}>Ver todas →</button>
        </div>
        {recent.length>0 ? recent.map(tx=>(
          <div key={tx.id} className="row">
            <div>
              <div className="row-main">{tx.desc}</div>
              <div className="row-sub">{tx.cat} · {tx.account} · {tx.date}</div>
            </div>
            <div className="row-right">
              <div className={`amount ${tx.amount>0?'pos':'neg'}`}>{tx.amount>0?'+':''}{fmt(tx.amount)}</div>
            </div>
          </div>
        )) : <div className="empty">Sin transacciones registradas</div>}
      </div>
    </div>
  )
}
