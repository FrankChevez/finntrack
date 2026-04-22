import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../stores/useStore'
import { useToast } from '../ui/Toast'

const PAGE_LABELS: Record<string, [string, string]> = {
  dashboard:      ['Dashboard', 'resumen general'],
  cuentas:        ['Cuentas', 'bancos y tarjetas'],
  gastos:         ['Transacciones', 'ingresos y gastos'],
  presupuestos:   ['Presupuestos', 'límites por categoría'],
  metas:          ['Metas de ahorro', 'objetivos financieros'],
  deudas:         ['Deudas', 'préstamos y créditos'],
  transferencias: ['Transferencias', 'mover dinero entre cuentas'],
  recurrentes:    ['Gastos recurrentes', 'pagos fijos mensuales'],
  cuotas:         ['Compras a cuotas', 'pagos en cuotas'],
  reporte:        ['Reporte mensual', 'análisis y proyecciones'],
}

interface Props {
  page: string
  onAdd?: () => void
  addLabel?: string
}

export function Topbar({ page, onAdd, addLabel = '+ Agregar' }: Props) {
  const { exportJSON, importJSON, theme, toggleTheme } = useStore()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { setMenuOpen(false) }, [page])
  const [title, sub] = PAGE_LABELS[page] ?? ['', '']

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        importJSON(json)
        showToast('Datos importados correctamente')
      } catch {
        showToast('Error: JSON inválido')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  const handleExport = () => {
    exportJSON()
    showToast('Backup exportado')
    setMenuOpen(false)
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="page-title">{title}</div>
        <div className="page-sub">{sub}</div>
      </div>

      <div className="topbar-right">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        {/* Desktop: full text buttons */}
        <button type="button" className="btn btn-ghost desktop-only" onClick={() => fileRef.current?.click()}>
          Importar JSON
        </button>
        <button type="button" className="btn btn-ghost desktop-only" onClick={handleExport}>
          Exportar JSON
        </button>

        {/* Mobile: theme toggle */}
        <button type="button" className="theme-btn mobile-only" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'light'
            ? <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="3.2"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"/></svg>
            : <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12 8A4 4 0 0 1 5.3 4.7 6 6 0 1 0 11.3 10.7 4 4 0 0 1 12 8Z"/></svg>
          }
        </button>

        {/* Mobile: kebab menu */}
        <div className="topbar-menu-wrap mobile-only">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '7px 10px' }}
            onClick={() => setMenuOpen(v => !v)}
            title="Más opciones"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3.5"  r="1.3"/>
              <circle cx="8" cy="8"    r="1.3"/>
              <circle cx="8" cy="12.5" r="1.3"/>
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="topbar-menu-overlay" onClick={() => setMenuOpen(false)} />
              <div className="topbar-menu">
                <button type="button" className="topbar-menu-item" onClick={() => fileRef.current?.click()}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2v9M4 7l4 4 4-4"/><path d="M2 13h12"/>
                  </svg>
                  Importar JSON
                </button>
                <button type="button" className="topbar-menu-item" onClick={handleExport}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 14V5M4 9l4-4 4 4"/><path d="M2 3h12"/>
                  </svg>
                  Exportar JSON
                </button>
              </div>
            </>
          )}
        </div>

        {onAdd && (
          <button type="button" className="btn btn-accent" onClick={onAdd}>{addLabel}</button>
        )}
      </div>
    </div>
  )
}
