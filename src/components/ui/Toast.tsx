import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastCtx { showToast: (msg: string) => void }
const Ctx = createContext<ToastCtx>({ showToast: () => {} })
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  const showToast = useCallback((m: string) => {
    setMsg(m)
    setKey((k) => k + 1)
    setTimeout(() => setMsg(null), 2900)
  }, [])

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {msg && <div key={key} className="toast">{msg}</div>}
    </Ctx.Provider>
  )
}
