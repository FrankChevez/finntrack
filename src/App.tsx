import { useState, useEffect } from 'react'
import { useStore } from './stores/useStore'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { BottomNav } from './components/layout/BottomNav'
import { ToastProvider } from './components/ui/Toast'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Reporte from './pages/Reporte'
import { Cuentas } from './pages/Cuentas'
import { Presupuestos, Metas, Deudas } from './pages/Objetivos'
import { Transferencias, Recurrentes, Cuotas } from './pages/Herramientas'
import './styles/globals.css'

type Page = 'dashboard'|'cuentas'|'gastos'|'presupuestos'|'metas'|'deudas'|'transferencias'|'recurrentes'|'cuotas'|'reporte'

const ADD_LABELS: Partial<Record<Page,string>> = {
  gastos:       '+ Transacción',
  cuentas:      '+ Cuenta',
  presupuestos: '+ Presupuesto',
  metas:        '+ Meta',
  deudas:       '+ Deuda',
  recurrentes:  '+ Recurrente',
  cuotas:       '+ Compra',
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const theme = useStore(s => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ToastProvider>
      <div className="layout">
        <Sidebar current={page} onChange={(p) => setPage(p as Page)} />
        <div className="main-content">
          <Topbar page={page} addLabel={ADD_LABELS[page]} />
          <div className="page-scroll">
            {page === 'dashboard'      && <Dashboard onNavigate={(p) => setPage(p as Page)} />}
            {page === 'cuentas'        && <Cuentas />}
            {page === 'gastos'         && <Gastos />}
            {page === 'presupuestos'   && <Presupuestos />}
            {page === 'metas'          && <Metas />}
            {page === 'deudas'         && <Deudas />}
            {page === 'transferencias' && <Transferencias />}
            {page === 'recurrentes'    && <Recurrentes />}
            {page === 'cuotas'         && <Cuotas />}
            {page === 'reporte'        && <Reporte />}
          </div>
        </div>
        <BottomNav current={page} onChange={(p) => setPage(p as Page)} />
      </div>
    </ToastProvider>
  )
}
