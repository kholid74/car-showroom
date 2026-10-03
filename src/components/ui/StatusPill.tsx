import type { ReactNode } from 'react'

/** Pil status: radius penuh, huruf besar bertracking, warna = makna. */
export function StatusPill({
  label,
  pil,
  dot,
  padat = false,
}: {
  label: string
  pil: string
  dot?: string
  padat?: boolean
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill font-medium uppercase tracking-caps text-2xs',
        padat ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
        pil,
      ].join(' ')}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-pill ${dot}`} aria-hidden />}
      {label}
    </span>
  )
}

/** Chip halus (latar tipis) — untuk filter aktif dan kategori, bukan status utama. */
export function ChipHalus({ label, kelas, children }: { label?: string; kelas: string; children?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-medium ${kelas}`}>
      {children}
      {label}
    </span>
  )
}
