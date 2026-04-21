# Fintrack 💰

App de finanzas personales — 100% local, sin servidor, sin internet requerido.

## Stack
- **Vite + React + TypeScript**
- **Zustand** — estado persistido en `localStorage` (clave `misfinanzas_v1`)
- **Recharts** — gráficas de barras, donut y proyección lineal
- **vite-plugin-pwa** — PWA con Service Worker

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy — GitHub Pages

1. Subir el repo a GitHub
2. En Settings → Pages → Source: **GitHub Actions**
3. Cada `git push` a `main` despliega automáticamente via `.github/workflows/deploy.yml`

## Importar datos del app HTML anterior

Los datos se migran **automáticamente** si el navegador ya tenía el app HTML abierto
(misma clave de `localStorage`: `misfinanzas_v1`).

Para migrar desde otro navegador o dispositivo:
1. En el app HTML viejo: botón **Exportar JSON**
2. En Fintrack: botón **Importar JSON** en el topbar
3. El archivo `misfinanzas_backup_YYYY-MM-DD.json` es compatible directamente

## Estructura del proyecto

```
src/
├── types/          # Tipos TS (Account, Card, Transaction, etc.)
├── lib/            # utils.ts — fmt, uid, validateAndMigrateDB
├── stores/         # useStore.ts — Zustand store completo
├── components/
│   ├── layout/     # Sidebar, Topbar, BottomNav
│   └── ui/         # Modal, Toast
├── pages/
│   ├── Dashboard.tsx
│   ├── Gastos.tsx
│   ├── Reporte.tsx    ← proyección 6 meses + salud financiera
│   ├── Cuentas.tsx
│   ├── Objetivos.tsx  ← Presupuestos, Metas, Deudas
│   └── Herramientas.tsx ← Transferencias, Recurrentes, Cuotas
└── styles/
    └── globals.css  ← Paleta Republicode + dark/light mode
```

## Paleta de colores

Basada en (`rgb(204,0,74)`) + navy profundo (`#120E1F`).
Toggle de tema en la esquina del sidebar.
