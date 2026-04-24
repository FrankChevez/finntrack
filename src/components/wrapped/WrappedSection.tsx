import { useEffect, useRef, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface WrappedSectionProps {
  bgColor: string
  Icon: LucideIcon
  label: string
  children: ReactNode
  onInView?: () => void
}

export function WrappedSection({ bgColor, Icon, label, children, onInView }: WrappedSectionProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            onInView?.()
          }
        })
      },
      { threshold: 0.55 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onInView])

  return (
    <section ref={ref} className="wrapped-section" style={{ background: bgColor }}>
      <div className="wrapped-section-icon wrapped-anim">
        <Icon size={56} strokeWidth={1.75} />
      </div>
      <div className="wrapped-section-label wrapped-anim">{label}</div>
      <div className="wrapped-anim" style={{ display: 'contents' }}>
        {children}
      </div>
    </section>
  )
}
