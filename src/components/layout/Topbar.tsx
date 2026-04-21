import { useRef } from 'react'
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
  const { exportJSON, importJSON } = useStore()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
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
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          Importar JSON
        </button>
        <button className="btn btn-ghost" onClick={() => { exportJSON(); showToast('Backup exportado') }}>
          Exportar JSON
        </button>
        {onAdd && (
          <button className="btn btn-accent" onClick={onAdd}>{addLabel}</button>
        )}
      </div>
    </div>
  )
}
