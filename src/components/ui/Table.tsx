import type { ReactNode } from 'react'

/** Primitif tabel: header sunken, baris 40px, hairline antar baris, angka rata kanan. */
export function Table({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-sunken">{children}</tr>
    </thead>
  )
}

export function Th({
  children,
  align = 'left',
  lebar,
  className = '',
  ariaSort,
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  lebar?: number | string
  className?: string
  ariaSort?: 'ascending' | 'descending' | 'none'
}) {
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      style={lebar ? { width: typeof lebar === 'number' ? `${lebar}px` : lebar } : undefined}
      className={[
        'whitespace-nowrap px-3 py-2 text-2xs font-medium uppercase tracking-caps text-ink-3',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className,
      ].join(' ')}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  tebal = false,
  padat = false,
  className = '',
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  tebal?: boolean
  padat?: boolean
  className?: string
}) {
  return (
    <td
      className={[
        padat ? 'px-3 py-1.5' : 'px-3 py-2',
        'align-top text-xs',
        tebal ? 'font-semibold text-ink' : 'text-ink-2',
        align === 'right' ? 'text-right tnum' : align === 'center' ? 'text-center' : 'text-left',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  )
}

export function Baris({ children, aktif = false }: { children: ReactNode; aktif?: boolean }) {
  return <tr className={`border-t border-hairline ${aktif ? 'bg-accent-soft' : 'hover:bg-sunken/60'}`}>{children}</tr>
}

/** Sel kosong dengan makna — bukan teks "TBD" (brief melarang placeholder) */
export function Kosong({ pesan = '—', lebar = 48 }: { pesan?: string; lebar?: number }) {
  return (
    <span className="inline-block text-2xs text-ink-3" style={{ minWidth: lebar }}>
      {pesan}
    </span>
  )
}
