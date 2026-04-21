interface Props {
  current: string
  onChange: (id: string) => void
}

const items = [
  { id: 'dashboard',    label: 'Inicio',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
  { id: 'cuentas',      label: 'Cuentas',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="10" rx="1.5"/><path d="M1 8h14"/></svg> },
  { id: 'gastos',       label: 'Gastos',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h12M2 12h7"/></svg> },
  { id: 'presupuestos', label: 'Presup.',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2.5 2.5-5L14 8"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg> },
  { id: 'metas',        label: 'Metas',     icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/></svg> },
  { id: 'deudas',       label: 'Deudas',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M5.5 4h4a2 2 0 0 1 0 4H5.5m0 0H10a2 2 0 0 1 0 4H5.5"/></svg> },
  { id: 'transferencias',label: 'Transfer.', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3"/></svg> },
  { id: 'recurrentes',  label: 'Recurr.',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8a6 6 0 1 0 6-6"/><path d="M8 2v3l2 1"/></svg> },
  { id: 'cuotas',       label: 'Cuotas',    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 7h14M4 10.5h2M8 10.5h2"/></svg> },
  { id: 'reporte',      label: 'Reporte',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/></svg> },
]

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bottom-nav-item${current === item.id ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  )
}
