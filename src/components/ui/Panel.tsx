import type { ReactNode } from 'react'

/**
 * Panel = blok berisi judul + isi, dibatasi hairline — bukan kartu bershadow.
 * Shadow hanya dipakai untuk lapisan terapung (popover, dropdown, drawer).
 */
export function Panel({
  judul,
  keterangan,
  aksi,
  children,
  padat = false,
  className = '',
}: {
  judul?: string
  keterangan?: string
  aksi?: ReactNode
  children: ReactNode
  padat?: boolean
  className?: string
}) {
  return (
    <section className={`border border-hairline bg-panel rounded-panel ${className}`}>
      {(judul || aksi) && (
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-3">
          <div className="min-w-0">
            {judul && <h2 className="text-sm font-semibold tracking-tight text-ink">{judul}</h2>}
            {keterangan && <p className="mt-0.5 text-2xs text-ink-3">{keterangan}</p>}
          </div>
          {aksi && <div className="flex shrink-0 items-center gap-2">{aksi}</div>}
        </header>
      )}
      <div className={padat ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

/** Blok isian kunci–nilai: dipakai sangat sering di halaman detail unit. */
export function Baris({ label, children, tebal = false }: { label: string; children: ReactNode; tebal?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-2xs text-ink-3">{label}</span>
      <span className={`text-xs tnum text-right ${tebal ? 'font-semibold text-ink' : 'text-ink-2'}`}>{children}</span>
    </div>
  )
}
