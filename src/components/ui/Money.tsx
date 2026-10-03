import { rupiah, rupiahRingkas } from '@/lib/format'

type Ukuran = 'xl' | 'lg' | 'md' | 'sm'
type Nada = 'default' | 'kuat' | 'muted' | 'positif' | 'perhatian' | 'bahaya'

const UKURAN: Record<Ukuran, string> = {
  xl: 'text-2xl font-semibold tracking-tight',
  lg: 'text-lg font-semibold tracking-tight',
  md: 'text-xs',
  sm: 'text-2xs',
}

const NADA: Record<Nada, string> = {
  default: 'text-ink',
  kuat: 'text-ink font-semibold',
  muted: 'text-ink-3',
  positif: 'text-money-pos font-medium',
  perhatian: 'text-attention font-medium',
  bahaya: 'text-danger font-medium',
}

/** Angka uang — selalu angka tabular agar kolom Rupiah rata dan bisa dibandingkan. */
export function Money({
  nilai,
  ukuran = 'md',
  nada = 'default',
  ringkas = false,
  className = '',
}: {
  nilai: number
  ukuran?: Ukuran
  nada?: Nada
  ringkas?: boolean
  className?: string
}) {
  return (
    <span className={`tnum ${UKURAN[ukuran]} ${NADA[nada]} ${className}`}>
      {ringkas ? rupiahRingkas(nilai) : rupiah(nilai)}
    </span>
  )
}

export function Angka({
  nilai,
  ukuran = 'md',
  nada = 'default',
  suffix,
  className = '',
}: {
  nilai: number
  ukuran?: Ukuran
  nada?: Nada
  suffix?: string
  className?: string
}) {
  return (
    <span className={`tnum ${UKURAN[ukuran]} ${NADA[nada]} ${className}`}>
      {new Intl.NumberFormat('id-ID').format(nilai)}
      {suffix ? (
        <span className={`${suffix === '%' ? '' : 'ml-1 '}text-2xs font-normal text-ink-3`}>{suffix}</span>
      ) : null}
    </span>
  )
}
