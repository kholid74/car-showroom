import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Dialog untuk semua alur tambah/ubah. Satu komponen, supaya perilakunya konsisten:
 * Esc menutup, klik latar menutup, halaman di belakang tidak ikut ter-scroll, fokus pindah
 * ke isian pertama saat dibuka, dan peran dialog dinyatakan untuk pembaca layar.
 */
export function Dialog({
  judul,
  keterangan,
  terbuka,
  onTutup,
  children,
  lebar = 'max-w-lg',
  catatanBawah,
}: {
  judul: string
  keterangan?: string
  terbuka: boolean
  onTutup: () => void
  children: ReactNode
  lebar?: string
  catatanBawah?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!terbuka) return
    const padaTombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTutup()
    }
    document.addEventListener('keydown', padaTombol)
    const overflowAsli = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const fokus = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    }, 40)
    return () => {
      document.removeEventListener('keydown', padaTombol)
      document.body.style.overflow = overflowAsli
      window.clearTimeout(fokus)
    }
  }, [terbuka, onTutup])

  if (!terbuka) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      onClick={onTutup}
    >
      <div
        ref={panelRef}
        className={`max-h-[92vh] w-full ${lebar} overflow-y-auto rounded-t-panel border border-hairline-strong bg-panel shadow-drawer sm:rounded-panel`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold tracking-tight text-ink">{judul}</h2>
            {keterangan && <p className="mt-0.5 text-2xs leading-relaxed text-ink-3">{keterangan}</p>}
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup dialog"
            className="shrink-0 rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        {children}

        {catatanBawah && (
          <p className="border-t border-hairline bg-sunken px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
            {catatanBawah}
          </p>
        )}
      </div>
    </div>
  )
}
