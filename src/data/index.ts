import type { Dataset, Lead, Procurement, Sale, Vehicle, VehicleDocuments } from './types'
import raw from './dataset.json'
import { useSesi } from '@/store/sesi'
import { DEMO_TODAY, bulanIni } from './meta'
import { selisihHari } from '@/lib/format'

/**
 * SATU sumber data untuk seluruh aplikasi.
 *
 * `dataset` di bawah ini bukan salinan JSON apa adanya, melainkan tampilan **langsung**
 * (live view): data dasar dari scripts/generate-dataset.mjs digabung dengan apa pun yang
 * dibuat atau diubah pengunjung pada sesi ini — unit yang dimasukkan, data unit yang
 * diperbarui, dokumen yang diubah statusnya, lead baru, penjualan yang dicatat.
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

const ada = (o: Record<string, unknown> | undefined) => Boolean(o && Object.keys(o).length)

const kendaraan = memo<Vehicle[]>(() => {
  const unitBaru = sesi.unitBaru ?? []
  const ubah = sesi.ubahUnit ?? {}
  const status = sesi.statusUnit ?? {}
  if (!unitBaru.length && !ada(ubah) && !ada(status)) return dasar.vehicles

  return [...unitBaru, ...dasar.vehicles].map((v) => {
    let unit = ubah[v.id] ? { ...v, ...ubah[v.id] } : v
    const statusBaru = status[unit.id]
    if (statusBaru) {
      const siap = sesi.tanggalSiap?.[unit.id] ?? unit.tanggalSiap
      unit = {
        ...unit,
        status: statusBaru,
        tanggalSiap: siap,
        hariSejakSiap: siap ? Math.max(0, selisihHari(siap, DEMO_TODAY)) : unit.hariSejakSiap,
      }
    }
    return unit
  })
})

const lead = memo<Lead[]>(() => {
  const ubah = sesi.ubahLead ?? {}
  const tahap = sesi.tahapLead ?? {}
  const dasarDisesuaikan =
    ada(ubah) || ada(tahap)
      ? dasar.leads.map((l) => {
          let hasil = ubah[l.id] ? { ...l, ...ubah[l.id] } : l
          const tahapBaru = tahap[hasil.id]
          if (tahapBaru) hasil = { ...hasil, status: tahapBaru }
          return hasil
        })
      : dasar.leads

  const tambahan = [...(sesi.leadBaru ?? []), ...(sesi.leadKatalog ?? [])].map((l) =>
    ubah[l.id] ? { ...l, ...ubah[l.id] } : l,
  )
  return tambahan.length ? [...tambahan, ...dasarDisesuaikan] : dasarDisesuaikan
})

const penjualan = memo<Sale[]>(() =>
  (sesi.penjualanBaru ?? []).length ? [...sesi.penjualanBaru, ...dasar.sales] : dasar.sales,
)

const pemesanan = memo(() =>
  (sesi.bookingSelesai ?? []).length
    ? dasar.bookings.map((b) => (sesi.bookingSelesai.includes(b.id) ? { ...b, statusPembayaran: 'SELESAI' } : b))
    : dasar.bookings,
)

const dokumen = memo<VehicleDocuments[]>(() => {
  const perubahan = sesi.ubahDokumen ?? {}
  const baru = sesi.dokumenBaru ?? []
  if (!ada(perubahan) && !baru.length) return dasar.documents

  const dasarDisesuaikan = dasar.documents.map((d) => {
    const ubahan = perubahan[d.vehicleId]
    if (!ubahan) return d
    return {
      ...d,
      checklist: d.checklist.map((c) =>
        ubahan[c.nama] ? { ...c, status: ubahan[c.nama].status as typeof c.status, nomor: ubahan[c.nama].nomor } : c,
      ),
    }
  })
  return [...baru, ...dasarDisesuaikan]
})

const pengadaan = memo<Procurement[]>(() =>
  (sesi.procurementBaru ?? []).length ? [...sesi.procurementBaru, ...dasar.procurements] : dasar.procurements,
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
  get documents() {
    return dokumen()
  },
  get procurements() {
    return pengadaan()
  },
}

/** Tanggal acuan demo — seluruh perhitungan umur/aging mengacu ke tanggal ini. */
export { DEMO_TODAY, bulanIni }

/** ID tampilan unit, mis. VH-2026-0012 */
export const refUnit = (vehicleId: string) => vehicleId

export * from './types'
