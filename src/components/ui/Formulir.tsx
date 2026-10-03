import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

/** Kolom isian: label eksplisit + petunjuk + ruang galat, agar tidak ada isian tanpa label. */
export function Kolom({
  label,
  petunjuk,
  galat,
  children,
  lebar = 'penuh',
}: {
  label: string
  petunjuk?: string
  galat?: string
  children: ReactNode
  lebar?: 'penuh' | 'separuh'
}) {
  return (
    <label className={`block ${lebar === 'separuh' ? 'sm:col-span-1 col-span-2' : 'col-span-2'}`}>
      <span className="text-2xs text-ink-2">{label}</span>
      {children}
      {petunjuk && !galat && <span className="mt-1 block text-2xs leading-relaxed text-ink-3">{petunjuk}</span>}
      {galat && <span className="mt-1 block text-2xs text-danger">{galat}</span>}
    </label>
  )
}

const GAYA_ISIAN =
  'mt-1 w-full rounded-control border border-hairline-strong bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel'

export function Masukan(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${GAYA_ISIAN} ${props.className ?? ''}`} />
}

export function Pilihan(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${GAYA_ISIAN} ${props.className ?? ''}`} />
}

export function TeksPanjang(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${GAYA_ISIAN} ${props.className ?? ''}`} />
}

/** Daftar galat validasi: disebut satu per satu, bukan hanya "form tidak valid". */
export function DaftarGalat({ galat }: { galat: string[] }) {
  if (galat.length === 0) return null
  return (
    <ul className="col-span-2 space-y-1 rounded-control border border-danger/30 bg-danger/5 p-2">
      {galat.map((g) => (
        <li key={g} className="flex items-start gap-1.5 text-2xs text-danger">
          <CircleAlert size={12} className="mt-0.5 shrink-0" />
          <span>{g}</span>
        </li>
      ))}
    </ul>
  )
}

/** Badan dialog: grid dua kolom di layar lebar, satu kolom di ponsel. */
export function BadanDialog({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 px-4 py-4">{children}</div>
}

export function AksiDialog({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline bg-sunken px-4 py-3">
      {children}
    </div>
  )
}
