import { Bot, Sparkles } from 'lucide-react'
import { useStore } from '../../stores/useStore'

const pages = [
  { section: 'Principal' },
  { id: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg> },
  { section: 'Dinero' },
  { id: 'cuentas', label: 'Cuentas', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="10" rx="1.5"/><path d="M5 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M1 8h14"/></svg> },
  { id: 'gastos', label: 'Transacciones', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h12M2 12h7"/></svg> },
  { id: 'presupuestos', label: 'Presupuestos', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2.5 2.5-5L14 8"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg> },
  { section: 'Objetivos' },
  { id: 'metas', label: 'Metas de ahorro', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/></svg> },
  { id: 'deudas', label: 'Deudas', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M5.5 4h4a2 2 0 0 1 0 4H5.5m0 0H10a2 2 0 0 1 0 4H5.5"/></svg> },
  { section: 'Herramientas' },
  { id: 'transferencias', label: 'Transferencias', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3"/></svg> },
  { id: 'recurrentes', label: 'Recurrentes', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8a6 6 0 1 0 6-6"/><path d="M8 2v3l2 1"/></svg> },
  { id: 'cuotas', label: 'Compras a cuotas', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 7h14M4 10.5h2M8 10.5h2"/></svg> },
  { id: 'reporte', label: 'Reporte mensual', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/></svg> },
  { id: 'estados', label: 'Estados de cuenta', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 7h14M4 10.5h2M8 10.5h2"/><path d="M4 5h3M10 5h2"/></svg> },
  { section: 'Extras' },
  { id: 'asistente', label: 'Asistente', icon: <Bot size={16} strokeWidth={1.5} /> },
  { id: 'wrapped', label: 'Wrapped', icon: <Sparkles size={16} strokeWidth={1.5} /> },
] as const

interface Props {
  current: string
  onChange: (id: string) => void
}

export function Sidebar({ current, onChange }: Props) {
  const { theme, toggleTheme } = useStore()

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div>
          <div className="logo-name">
            <span className="logo-dot" />
            Fintrack
          </div>
          <div className="logo-sub">100% local · privado</div>
        </div>
        <button className="theme-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'light'
            ? <svg viewBox="0 0 16 16" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="3.2"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"/></svg>
            : <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12 8A4 4 0 0 1 5.3 4.7 6 6 0 1 0 11.3 10.7 4 4 0 0 1 12 8Z"/></svg>
          }
        </button>
      </div>

      <div className="nav">
        {pages.map((p, i) => {
          if ('section' in p) return <div key={i} className="nav-section">{p.section}</div>
          return (
            <div
              key={p.id}
              className={`nav-item${current === p.id ? ' active' : ''}`}
              onClick={() => onChange(p.id)}
            >
              {p.icon}
              <span>{p.label}</span>
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <span>Sin internet · Sin servidor</span>
      </div>
    </nav>
  )
}
