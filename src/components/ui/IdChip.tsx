import { Link } from 'react-router-dom'

/**
 * ID unit/invoice sebagai jangkar visual: mono + tracking.
 * Bisa diklik agar keterkaitan antar modul terasa nyata saat demo.
 */
export function IdChip({
  nilai,
  ke,
  judul,
  tebal = false,
}: {
  nilai: string
  ke?: string
  judul?: string
  tebal?: boolean
}) {
  const kelas = [
    'id-chip inline-flex items-center rounded-control px-1.5 py-0.5',
    tebal ? 'bg-sunken text-ink' : 'text-ink-2',
    ke ? 'hover:bg-accent-soft hover:text-accent' : '',
  ].join(' ')

  if (ke) {
    return (
      <Link to={ke} className={kelas} title={judul ?? nilai}>
        {nilai}
      </Link>
    )
  }
  return (
    <span className={kelas} title={judul ?? nilai}>
      {nilai}
    </span>
  )
}
