import type { ReactNode } from 'react'

/**
 * Chip filter. Dipakai untuk menyaring daftar; jumlah selalu ditampilkan
 * supaya pengguna tahu berapa data yang akan tersisa sebelum mengklik.
 */
export function FilterChip({
  aktif,
  onClick,
  children,
  jumlah,
  warnaDot,
}: {
  aktif: boolean
  onClick: () => void
  children: ReactNode
  jumlah?: number
  warnaDot?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={[
        'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 text-2xs font-medium',
        'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        aktif
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-hairline-strong bg-panel text-ink-2 hover:bg-sunken hover:text-ink',
      ].join(' ')}
    >
      {warnaDot && <span className={`h-1.5 w-1.5 rounded-pill ${warnaDot}`} aria-hidden />}
      {children}
      {jumlah !== undefined && (
        <span className={`tnum text-2xs ${aktif ? 'text-accent' : 'text-ink-3'}`}>{jumlah}</span>
      )}
    </button>
  )
}

/** Sakelar tampilan tabel/kartu — memakai satu bahasa visual dengan filter chip. */
export function SakelarTampilan<T extends string>({
  nilai,
  opsi,
  onChange,
}: {
  nilai: T
  opsi: { nilai: T; label: string; ikon?: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex h-7 items-center gap-0.5 rounded-control border border-hairline-strong bg-panel p-0.5">
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="button"
          onClick={() => onChange(o.nilai)}
          aria-pressed={nilai === o.nilai}
          title={o.label}
          className={[
            'inline-flex h-6 items-center gap-1.5 rounded-[3px] px-2 text-2xs font-medium',
            nilai === o.nilai ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-sunken hover:text-ink',
          ].join(' ')}
        >
          {o.ikon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
