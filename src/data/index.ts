import type {
  Booking,
  Dataset,
  Expense,
  Inspection,
  Lead,
  Procurement,
  Reconditioning,
  Sale,
  Vehicle,
  VehicleDocuments,
} from './types'
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
 * diperbarui, dokumen yang diubah statusnya, lead baru, penjualan yang dicatat,
 * biaya, booking, pekerjaan reconditioning, dan hasil inspeksi.
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

/** Biaya pekerjaan reconditioning yang ditambahkan pengunjung, dipetakan ke unitnya. */
const tambahanRecon = memo<Record<string, number>>(() => {
  const baru = sesi.reconItemBaru ?? {}
  if (!ada(baru)) return {}
  const peta: Record<string, number> = {}
  for (const [reconId, items] of Object.entries(baru)) {
    const rec = dasar.reconditionings.find((r) => r.id === reconId)
    if (!rec) continue
    peta[rec.vehicleId] = (peta[rec.vehicleId] ?? 0) + items.reduce((n, x) => n + x.biaya, 0)
  }
  return peta
})

const kendaraan = memo<Vehicle[]>(() => {
  const unitBaru = sesi.unitBaru ?? []
  const ubah = sesi.ubahUnit ?? {}
  const status = sesi.statusUnit ?? {}
  const reconTambahan = tambahanRecon()
  if (!unitBaru.length && !ada(ubah) && !ada(status) && !ada(reconTambahan)) return dasar.vehicles

  return [...unitBaru, ...dasar.vehicles].map((v) => {
    let unit = ubah[v.id] ? { ...v, ...ubah[v.id] } : v
    // modal selalu dihitung ulang dari komponennya, termasuk pekerjaan recon yang baru ditambahkan
    const tambahan = reconTambahan[unit.id] ?? 0
    const sentuhUang =
      ubah[v.id] !== undefined &&
      ['purchasePrice', 'reconCost', 'otherCost', 'listingPrice'].some((k) => k in ubah[v.id])
    if (tambahan > 0 || sentuhUang) {
      const reconCost = unit.reconCost + tambahan
      const totalCost = unit.purchasePrice + reconCost + unit.otherCost
      unit = { ...unit, reconCost, totalCost, estimasiMargin: unit.listingPrice - totalCost }
    }
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

const pemesanan = memo<Booking[]>(() => {
  const selesai = sesi.bookingSelesai ?? []
  const ubah = sesi.ubahBooking ?? {}
  const batal = sesi.bookingDibatalkan ?? []
  const baru = sesi.bookingBaru ?? []
  if (!selesai.length && !ada(ubah) && !batal.length && !baru.length) return dasar.bookings

  const dasarDisesuaikan = dasar.bookings
    .filter((b) => !batal.includes(b.id))
    .map((b) => {
      let hasil = ubah[b.id] ? { ...b, ...ubah[b.id] } : b
      if (selesai.includes(hasil.id)) hasil = { ...hasil, statusPembayaran: 'SELESAI' }
      return hasil
    })
  const tambahan = baru.filter((b) => !batal.includes(b.id)).map((b) => (ubah[b.id] ? { ...b, ...ubah[b.id] } : b))
  return [...tambahan, ...dasarDisesuaikan]
})

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

const perawatan = memo<Reconditioning[]>(() => {
  const baru = sesi.reconItemBaru ?? {}
  const ubah = sesi.ubahPekerjaan ?? {}
  const selesai = sesi.reconSelesai ?? []
  if (!ada(baru) && !ada(ubah) && !selesai.length) return dasar.reconditionings

  return dasar.reconditionings.map((r) => {
    const items = [...r.items, ...(baru[r.id] ?? [])].map((it) => {
      const ubahan = ubah[`${r.id}::${it.id}`]
      return ubahan ? { ...it, ...ubahan } : it
    })
    const tuntas = selesai.includes(r.id) || (items.length > 0 && items.every((it) => it.status === 'COMPLETED'))
    return {
      ...r,
      items,
      total: items.reduce((n, it) => n + it.biaya, 0),
      status: tuntas ? ('COMPLETED' as const) : r.status,
      selesai: tuntas ? (r.selesai ?? DEMO_TODAY) : r.selesai,
    }
  })
})

const inspeksi = memo<Inspection[]>(() => {
  const baru = sesi.inspeksiBaru ?? []
  if (!baru.length) return dasar.inspections
  // inspeksi terbaru menggantikan inspeksi lama untuk unit yang sama — bukan menumpuk jadi dua baris
  const unitDiinspeksi = new Set(baru.map((i) => i.vehicleId))
  return [...baru, ...dasar.inspections.filter((i) => !unitDiinspeksi.has(i.vehicleId))]
})

const biaya = memo<Expense[]>(() => {
  const baru = sesi.biayaBaru ?? []
  const ubah = sesi.ubahBiaya ?? {}
  const hapus = sesi.biayaDihapus ?? []
  if (!baru.length && !ada(ubah) && !hapus.length) return dasar.expenses

  const dasarDisesuaikan = dasar.expenses
    .filter((e) => !hapus.includes(e.id))
    .map((e) => (ubah[e.id] ? { ...e, ...ubah[e.id] } : e))
  const tambahan = baru.filter((e) => !hapus.includes(e.id)).map((e) => (ubah[e.id] ? { ...e, ...ubah[e.id] } : e))
  return [...tambahan, ...dasarDisesuaikan]
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
  get reconditionings() {
    return perawatan()
  },
  get inspections() {
    return inspeksi()
  },
  get expenses() {
    return biaya()
  },
}

/** Tanggal acuan demo — seluruh perhitungan umur/aging mengacu ke tanggal ini. */
export { DEMO_TODAY, bulanIni }

/** ID tampilan unit, mis. VH-2026-0012 */
export const refUnit = (vehicleId: string) => vehicleId

export * from './types'
