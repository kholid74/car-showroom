import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CircleAlert, Info } from 'lucide-react'
import { notifikasiHariIni } from '@/data/agregat-laporan'
import { usePermintaanStore } from '@/store/inquiry'
import { tanggalPanjang } from '@/lib/format'
import { dataset } from '@/data'

export function LoncengNotifikasi() {
  const [terbuka, setTerbuka] = useState(false)
  const kotakRef = useRef<HTMLDivElement>(null)
  const dariKatalog = usePermintaanStore((s) => s.masuk)
  const daftar = useMemo(() => {
    const dasar = notifikasiHariIni()
    if (dariKatalog.length === 0) return dasar
    // lead yang baru masuk dari katalog publik juga perlu ditindak
    return [
      {
        id: 'katalog',
        kategori: 'CRM',
        judul: `${dariKatalog.length} lead baru dari katalog publik`,
        detail: `${dariKatalog.map((l) => l.nama).join(', ')} — belum dihubungi, sumber Website`,
        ke: '/crm',
        jumlah: dariKatalog.length,
        nada: 'info' as const,
      },
      ...dasar,
    ]
  }, [dariKatalog])
  const jumlah = daftar.reduce((s, n) => s + n.jumlah, 0)

  useEffect(() => {
    if (!terbuka) return
    const klikLuar = (e: MouseEvent) => {
      if (kotakRef.current && !kotakRef.current.contains(e.target as Node)) setTerbuka(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTerbuka(false)
    }
    document.addEventListener('mousedown', klikLuar)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', klikLuar)
      document.removeEventListener('keydown', esc)
    }
  }, [terbuka])

  return (
    <div ref={kotakRef} className="relative">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-label={`Notifikasi: ${jumlah} hal perlu ditindak`}
        aria-expanded={terbuka}
        title="Hal yang perlu ditindak hari ini"
        className="relative inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-2xs text-ink-2 hover:bg-sunken hover:text-ink"
      >
        <Bell size={15} />
        <span className="hidden sm:inline">Notifikasi</span>
        {jumlah > 0 && (
          <span className="tnum inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-danger px-1 text-2xs font-semibold text-white">
            {jumlah}
          </span>
        )}
      </button>

      {terbuka && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-panel border border-hairline-strong bg-panel shadow-lg">
          <div className="flex items-baseline justify-between gap-2 border-b border-hairline px-3 py-2.5">
            <p className="text-xs font-semibold tracking-tight text-ink">Perlu ditindak</p>
            <p className="text-2xs text-ink-3">{jumlah} hal</p>
          </div>

          <ul className="max-h-80 divide-y divide-hairline overflow-y-auto">
            {daftar.map((n) => (
              <li key={n.id}>
                <Link to={n.ke} onClick={() => setTerbuka(false)} className="block px-3 py-2.5 hover:bg-sunken">
                  <div className="flex items-start gap-2">
                    {n.nada === 'perhatian' ? (
                      <CircleAlert size={14} className="mt-0.5 shrink-0 text-attention" />
                    ) : (
                      <Info size={14} className="mt-0.5 shrink-0 text-ink-3" />
                    )}
                    <div className="min-w-0">
                      <p className="text-2xs text-ink-3">{n.kategori}</p>
                      <p className="mt-0.5 text-xs text-ink">{n.judul}</p>
                      <p className="mt-0.5 text-2xs leading-relaxed text-ink-3">{n.detail}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <p className="border-t border-hairline px-3 py-2 text-2xs leading-relaxed text-ink-3">
            Dihitung otomatis dari data demo per {tanggalPanjang(dataset.meta.demoToday)} — bukan notifikasi yang
            diketik manual.
          </p>
        </div>
      )}
    </div>
  )
}
