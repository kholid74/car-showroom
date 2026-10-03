import type { Dataset, Lead, Sale, Vehicle } from './types'
import raw from './dataset.json'
import { useSesi } from '@/store/sesi'
import { DEMO_TODAY, bulanIni } from './meta'
import { selisihHari } from '@/lib/format'

/**
 * SATU sumber data untuk seluruh aplikasi.
 *
 * `dataset` di bawah ini bukan salinan JSON apa adanya, melainkan tampilan **langsung**
 * (live view): data dasar dari scripts/generate-dataset.mjs digabung dengan apa pun yang
 * dibuat atau diubah pengunjung pada sesi ini — penjualan yang dicatat, lead yang
 * ditambahkan, tahap yang dipindahkan, status unit yang diubah.
 *
 * Kenapa getter, bukan salinan: supaya SETIAP modul (dashboard, finance, laporan, aging)
 * otomatis melihat angka yang sama begitu ada data baru, tanpa perlu tiap halaman
 * mengingat untuk menggabungkan data sesi sendiri. Kalau penggabungan diserahkan ke
 * masing-masing halaman, cepat atau lambat ada satu halaman yang lupa dan angkanya
 * menyimpang — persis hal yang demo ini janjikan tidak terjadi.
 */
const dasar = raw as unknown as Dataset

let sesi = useSesi.getState()
useSesi.subscribe((s) => {
  sesi = s
})

/** Hitung ulang hanya ketika state sesi berubah — identitas array tetap stabil di antaranya. */
function memo<T>(hitung: () => T): () => T {
  let kunci: unknown = null
  let nilai: T
  return () => {
    if (kunci !== sesi) {
      nilai = hitung()
      kunci = sesi
    }
    return nilai
  }
}

const kendaraan = memo<Vehicle[]>(() =>
  sesi.statusUnit && Object.keys(sesi.statusUnit).length
    ? dasar.vehicles.map((v) => {
        const status = sesi.statusUnit[v.id]
        if (!status) return v
        const siap = sesi.tanggalSiap?.[v.id] ?? v.tanggalSiap
        return {
          ...v,
          status,
          tanggalSiap: siap,
          hariSejakSiap: siap ? Math.max(0, selisihHari(siap, DEMO_TODAY)) : v.hariSejakSiap,
        }
      })
    : dasar.vehicles,
)

const lead = memo<Lead[]>(() => {
  const dasarDenganTahap = Object.keys(sesi.tahapLead ?? {}).length
    ? dasar.leads.map((l) => {
        const tahap = sesi.tahapLead[l.id]
        return tahap ? { ...l, status: tahap } : l
      })
    : dasar.leads
  const tambahan = [...(sesi.leadBaru ?? []), ...(sesi.leadKatalog ?? [])]
  return tambahan.length ? [...tambahan, ...dasarDenganTahap] : dasarDenganTahap
})

const penjualan = memo<Sale[]>(() =>
  (sesi.penjualanBaru ?? []).length ? [...sesi.penjualanBaru, ...dasar.sales] : dasar.sales,
)

const pemesanan = memo(() =>
  (sesi.bookingSelesai ?? []).length
    ? dasar.bookings.map((b) =>
        sesi.bookingSelesai.includes(b.id) ? { ...b, statusPembayaran: 'SELESAI' } : b,
      )
    : dasar.bookings,
)

export const dataset: Dataset = {
  ...dasar,
  get vehicles() {
    return kendaraan()
  },
  get leads() {
    return lead()
  },
  get sales() {
    return penjualan()
  },
  get bookings() {
    return pemesanan()
  },
}

/** Tanggal acuan demo — seluruh perhitungan umur/aging mengacu ke tanggal ini. */
export { DEMO_TODAY, bulanIni }

/** ID tampilan unit, mis. VH-2026-0012 */
export const refUnit = (vehicleId: string) => vehicleId

export * from './types'
