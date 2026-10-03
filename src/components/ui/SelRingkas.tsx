import type { ReactNode } from 'react'

/**
 * Sel ringkasan (KPI) — satu-satunya definisi di aplikasi.
 * Tinggi label dikunci agar sel tetap rata walau labelnya membungkus di layar sempit.
 */
export function SelRingkas({
  label,
  nilai,
  catatan,
}: {
  label: string
  nilai: ReactNode
  catatan: string
}) {
  return (
    <div className="px-4 py-3">
      <p className="label-caps block min-h-8">{label}</p>
      <p className="mt-1.5">{nilai}</p>
      <p className="mt-1 truncate text-2xs text-ink-3" title={catatan}>
        {catatan}
      </p>
    </div>
  )
}

/** Baris ringkasan untuk strip KPI: dipakai bersama SelRingkas. */
export function StripRingkas({ kolom, children }: { kolom: 3 | 4 | 5 | 6; children: ReactNode }) {
  const kelas = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'xl:grid-cols-5 md:grid-cols-3',
    6: 'xl:grid-cols-6 md:grid-cols-3',
  }[kolom]
  return (
    <section className={`grid grid-cols-2 divide-hairline border border-hairline bg-panel md:divide-x ${kelas}`}>
      {children}
    </section>
  )
}
