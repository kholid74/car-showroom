import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, Car, ChevronRight, Fuel, Gauge, Search, Settings2, X } from 'lucide-react'
import { dataset } from '@/data'
import { Money } from '@/components/ui/Money'
import { Button } from '@/components/ui/Button'
import { angka, rupiahRingkas } from '@/lib/format'

const RENTANG = [
  { label: 'Semua harga', min: 0, max: Number.POSITIVE_INFINITY },
  { label: 'Di bawah Rp150 jt', min: 0, max: 150_000_000 },
  { label: 'Rp150–300 jt', min: 150_000_000, max: 300_000_000 },
  { label: 'Rp300–500 jt', min: 300_000_000, max: 500_000_000 },
  { label: 'Di atas Rp500 jt', min: 500_000_000, max: Number.POSITIVE_INFINITY },
]

const URUT = [
  { kunci: 'termurah', label: 'Harga terendah' },
  { kunci: 'termahal', label: 'Harga tertinggi' },
  { kunci: 'terbaru', label: 'Tahun terbaru' },
  { kunci: 'km', label: 'KM terendah' },
]

/** Slot foto: demo ini tidak memuat berkas foto, dan itu dinyatakan terbuka. */
export function SlotFoto({ unit, tinggi = 'aspect-[4/3]' }: { unit: { foto: { ref: string; jumlahTersedia: number } }; tinggi?: string }) {
  return (
    <div className={`relative flex ${tinggi} w-full items-center justify-center overflow-hidden bg-sunken`}>
      <span className="absolute inset-3 rounded-control border border-dashed border-hairline-strong" aria-hidden />
      <span className="relative flex flex-col items-center gap-1.5 px-4 text-center">
        <Car size={26} className="text-ink-3" />
        <span className="inline-flex items-center gap-1 text-2xs font-medium text-ink-3">
          <Camera size={12} />
          Slot foto unit
        </span>
        <span className="text-2xs text-ink-3">
          {unit.foto.jumlahTersedia} foto tersedia di sistem · berkas tidak disertakan pada demo
        </span>
      </span>
    </div>
  )
}

export function KatalogPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const merek = params.get('merek') ?? 'SEMUA'
  const kelas = params.get('kelas') ?? 'SEMUA'
  const transmisi = params.get('transmisi') ?? 'SEMUA'
  const harga = params.get('harga') ?? 'Semua harga'
  const urut = params.get('urut') ?? 'termurah'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA' || nilai === 'Semua harga') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  // hanya unit yang benar-benar siap dijual yang tampil di katalog publik
  const tersedia = useMemo(() => dataset.vehicles.filter((v) => v.status === 'READY'), [])
  const daftarMerek = useMemo(() => [...new Set(tersedia.map((v) => v.brand))].sort(), [tersedia])
  const daftarKelas = useMemo(() => [...new Set(tersedia.map((v) => v.kelas))].sort(), [tersedia])

  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase()
    const rentang = RENTANG.find((r) => r.label === harga) ?? RENTANG[0]
    const disaring = tersedia.filter((v) => {
      if (merek !== 'SEMUA' && v.brand !== merek) return false
      if (kelas !== 'SEMUA' && v.kelas !== kelas) return false
      if (transmisi !== 'SEMUA' && v.transmisi !== transmisi) return false
      if (v.listingPrice < rentang.min || v.listingPrice >= rentang.max) return false
      if (!kata) return true
      return [v.brand, v.model, v.variant, v.kelas, v.warna, v.nomorPolisi]
        .join(' ')
        .toLowerCase()
        .includes(kata)
    })
    const urutan: Record<string, (a: typeof disaring[number], b: typeof disaring[number]) => number> = {
      termurah: (a, b) => a.listingPrice - b.listingPrice,
      termahal: (a, b) => b.listingPrice - a.listingPrice,
      terbaru: (a, b) => b.tahun - a.tahun,
      km: (a, b) => a.kilometer - b.kilometer,
    }
    return disaring.slice().sort(urutan[urut] ?? urutan.termurah)
  }, [tersedia, q, merek, kelas, transmisi, harga, urut])

  const adaFilter = q !== '' || merek !== 'SEMUA' || kelas !== 'SEMUA' || transmisi !== 'SEMUA' || harga !== 'Semua harga'
  const termurah = Math.min(...hasil.map((v) => v.listingPrice), 0)

  return (
    <div className="space-y-5">
      <div>
        <p className="label-caps">Katalog unit</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {hasil.length} unit siap dilihat
        </h1>
        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-ink-2">
          Semua unit di halaman ini sudah melewati inspeksi dan reconditioning, dan statusnya siap dijual di sistem
          internal showroom. Harga yang tampil adalah harga penawaran, bukan harga akhir setelah negosiasi.
          {hasil.length > 0 && <> Termurah saat ini {rupiahRingkas(termurah)}.</>}
        </p>
      </div>

      <div className="rounded-panel border border-hairline bg-pub-panel">
        <div className="flex flex-wrap items-center gap-2 px-3 py-3">
          <label className="relative flex h-8 min-w-56 flex-1 items-center md:max-w-80">
            <Search size={14} className="pointer-events-none absolute left-2.5 text-ink-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => atur('q', e.target.value)}
              placeholder="Cari merek, model, atau warna…"
              aria-label="Cari unit"
              className="h-8 w-full rounded-control border border-hairline-strong bg-panel pl-8 pr-2 text-xs text-ink placeholder:text-ink-3 focus-visible:bg-panel"
            />
          </label>

          <label className="flex items-center gap-1.5 text-2xs text-ink-3">
            Transmisi
            <select
              value={transmisi}
              onChange={(e) => atur('transmisi', e.target.value)}
              aria-label="Transmisi"
              className="h-8 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2"
            >
              <option value="SEMUA">Semua</option>
              <option value="AT">Matic (AT)</option>
              <option value="MT">Manual (MT)</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-2xs text-ink-3">
            Harga
            <select
              value={harga}
              onChange={(e) => atur('harga', e.target.value)}
              aria-label="Rentang harga"
              className="h-8 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2"
            >
              {RENTANG.map((r) => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-2xs text-ink-3">
            Urutkan
            <select
              value={urut}
              onChange={(e) => atur('urut', e.target.value)}
              aria-label="Urutkan"
              className="h-8 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2"
            >
              {URUT.map((u) => (
                <option key={u.kunci} value={u.kunci}>{u.label}</option>
              ))}
            </select>
          </label>

          {adaFilter && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setParams(new URLSearchParams(), { replace: true })} ikon={<X size={13} />}>
              Bersihkan
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2.5">
          <span className="label-caps">Merek</span>
          {['SEMUA', ...daftarMerek].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => atur('merek', m)}
              className={`rounded-pill border px-2.5 py-1 text-2xs transition-colors duration-[var(--dur-fast)] ${
                merek === m
                  ? 'border-accent bg-accent text-white'
                  : 'border-hairline-strong text-ink-2 hover:bg-sunken hover:text-ink'
              }`}
            >
              {m === 'SEMUA' ? 'Semua merek' : m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2.5">
          <span className="label-caps">Kelas</span>
          {['SEMUA', ...daftarKelas].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => atur('kelas', k)}
              className={`rounded-pill border px-2.5 py-1 text-2xs capitalize transition-colors duration-[var(--dur-fast)] ${
                kelas === k
                  ? 'border-accent bg-accent text-white'
                  : 'border-hairline-strong text-ink-2 hover:bg-sunken hover:text-ink'
              }`}
            >
              {k === 'SEMUA' ? 'Semua kelas' : k}
            </button>
          ))}
        </div>
      </div>

      {hasil.length === 0 ? (
        <div className="rounded-panel border border-hairline bg-pub-panel px-5 py-12 text-center">
          <p className="text-sm text-ink-2">Belum ada unit yang cocok dengan pilihan itu.</p>
          <p className="mt-1 text-2xs text-ink-3">
            Coba longgarkan rentang harga atau pilih merek lain — stok berubah setiap hari.
          </p>
          <Button className="mt-4" variant="secondary" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Lihat semua unit
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hasil.map((v) => (
            <li key={v.id}>
              <Link
                to={`/katalog/${v.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-panel border border-hairline bg-pub-panel transition-colors duration-[var(--dur-fast)] hover:border-hairline-strong"
              >
                <SlotFoto unit={v} />
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="text-2xs text-ink-3">
                    {v.tahun} · {v.kelas} · {v.warna}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-ink group-hover:text-accent">
                    {v.brand} {v.model}
                  </h2>
                  <p className="mt-0.5 truncate text-2xs text-ink-2">{v.variant}</p>

                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
                    <div>
                      <dt className="flex items-center gap-1 text-2xs text-ink-3"><Gauge size={11} /> KM</dt>
                      <dd className="tnum mt-0.5 text-2xs text-ink-2">{angka(v.kilometer)}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-2xs text-ink-3"><Settings2 size={11} /> Transmisi</dt>
                      <dd className="mt-0.5 text-2xs text-ink-2">{v.transmisi}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-2xs text-ink-3"><Fuel size={11} /> Bahan Bakar</dt>
                      <dd className="mt-0.5 text-2xs text-ink-2">{v.bahanBakar}</dd>
                    </div>
                  </dl>

                  <div className="mt-3.5 flex items-end justify-between gap-3 border-t border-hairline pt-3">
                    <span>
                      <span className="block text-2xs text-ink-3">Harga penawaran</span>
                      <Money nilai={v.listingPrice} ukuran="lg" nada="kuat" />
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-accent">
                      Lihat detail
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
