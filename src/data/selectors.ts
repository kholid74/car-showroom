import { dataset, DEMO_TODAY, bulanIni } from './index'
import type {
  Activity, Booking, Inspection, Lead, Procurement, Reconditioning, Sale, UnitStatus, Vehicle, VehicleDocuments,
} from './types'
import { selisihHari } from '@/lib/format'

/* ------------------------------------------------------------------ *
 * Pencarian dasar
 * ------------------------------------------------------------------ */
export const unitById = (id: string) => dataset.vehicles.find((v) => v.id === id)
export const customerById = (id: string | null) => (id ? dataset.customers.find((c) => c.id === id) : undefined)

export const leadByUnit = (vehicleId: string) => dataset.leads.filter((l) => l.vehicleId === vehicleId)
export const saleByUnit = (vehicleId: string) => dataset.sales.find((s) => s.vehicleId === vehicleId)
export const bookingByUnit = (vehicleId: string) => dataset.bookings.find((b) => b.vehicleId === vehicleId)
export const reconByUnit = (vehicleId: string) => dataset.reconditionings.find((r) => r.vehicleId === vehicleId)
export const inspeksiByUnit = (vehicleId: string) => dataset.inspections.find((i) => i.vehicleId === vehicleId)
export const dokumenByUnit = (vehicleId: string) => dataset.documents.find((d) => d.vehicleId === vehicleId)
export const procurementByUnit = (vehicleId: string) => dataset.procurements.find((p) => p.vehicleId === vehicleId)
export const aktivitasByUnit = (vehicleId: string) =>
  dataset.activities.filter((a) => a.vehicleId === vehicleId).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))

/** Semua yang diketahui sistem tentang satu unit — dipakai Vehicle Detail. */
export interface BundelUnit {
  unit: Vehicle
  procurement?: Procurement
  inspeksi?: Inspection
  recon?: Reconditioning
  dokumen?: VehicleDocuments
  leads: Lead[]
  booking?: Booking
  penjualan?: Sale
  aktivitas: Activity[]
}

export function bundelUnit(vehicleId: string): BundelUnit | null {
  const unit = unitById(vehicleId)
  if (!unit) return null
  return {
    unit,
    procurement: procurementByUnit(vehicleId),
    inspeksi: inspeksiByUnit(vehicleId),
    recon: reconByUnit(vehicleId),
    dokumen: dokumenByUnit(vehicleId),
    leads: leadByUnit(vehicleId),
    booking: bookingByUnit(vehicleId),
    penjualan: saleByUnit(vehicleId),
    aktivitas: aktivitasByUnit(vehicleId),
  }
}

/* ------------------------------------------------------------------ *
 * Dashboard & laporan — semuanya diturunkan, tidak ada angka hardcode
 * ------------------------------------------------------------------ */
export const unitTersedia = () => dataset.vehicles.filter((v) => v.status !== 'SOLD')

export function hitungPerStatus(): Record<UnitStatus, number> {
  const hasil = { 'BARU MASUK': 0, INSPEKSI: 0, RECONDITIONING: 0, READY: 0, BOOKED: 0, SOLD: 0 } as Record<UnitStatus, number>
  dataset.vehicles.forEach((v) => { hasil[v.status] += 1 })
  return hasil
}

export interface Kpi {
  unitTersedia: number
  nilaiInventory: number
  totalModalStok: number
  potensiMarginStok: number
  unitTerjualBulanIni: number
  nilaiPenjualanBulanIni: number
  grossProfitBulanIni: number
  grossProfitTotal: number
  leadAktif: number
  totalLead: number
  piutang: number
  rataRataHariTerjual: number
  marginRataRata: number
}

export function kpi(): Kpi {
  const tersedia = unitTersedia()
  const terjualBulanIni = dataset.sales.filter((s) => s.tanggal.slice(0, 7) === bulanIni)
  const gpTotal = dataset.sales.reduce((s, x) => s + x.grossProfit, 0)
  const totalModalTerjual = dataset.sales.reduce((s, x) => s + x.totalModal, 0)
  return {
    unitTersedia: tersedia.length,
    nilaiInventory: tersedia.reduce((s, v) => s + v.listingPrice, 0),
    totalModalStok: tersedia.reduce((s, v) => s + v.totalCost, 0),
    potensiMarginStok: tersedia.reduce((s, v) => s + v.estimasiMargin, 0),
    unitTerjualBulanIni: terjualBulanIni.length,
    nilaiPenjualanBulanIni: terjualBulanIni.reduce((s, x) => s + x.finalPrice, 0),
    grossProfitBulanIni: terjualBulanIni.reduce((s, x) => s + x.grossProfit, 0),
    grossProfitTotal: gpTotal,
    leadAktif: dataset.leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length,
    totalLead: dataset.leads.length,
    piutang: dataset.sales.reduce((s, x) => s + Math.max(0, x.sisaPembayaran), 0),
    rataRataHariTerjual: Math.round(
      dataset.vehicles.filter((v) => v.status === 'SOLD').reduce((s, v) => s + v.hariDiInventory, 0) /
        Math.max(1, dataset.vehicles.filter((v) => v.status === 'SOLD').length),
    ),
    marginRataRata: totalModalTerjual ? gpTotal / totalModalTerjual : 0,
  }
}

/** Penjualan & gross profit per bulan (n bulan terakhir, termasuk bulan berjalan). */
export function penjualanPerBulan(jumlahBulan = 6) {
  const urut: string[] = []
  const dasar = new Date(`${bulanIni}-01T00:00:00Z`)
  for (let i = jumlahBulan - 1; i >= 0; i--) {
    const t = new Date(Date.UTC(dasar.getUTCFullYear(), dasar.getUTCMonth() - i, 1))
    urut.push(`${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return urut.map((bulan) => {
    const transaksi = dataset.sales.filter((s) => s.tanggal.slice(0, 7) === bulan)
    return {
      bulan,
      unit: transaksi.length,
      nilai: transaksi.reduce((s, x) => s + x.finalPrice, 0),
      grossProfit: transaksi.reduce((s, x) => s + x.grossProfit, 0),
      modal: transaksi.reduce((s, x) => s + x.totalModal, 0),
    }
  })
}

export function pipelineLead() {
  const tahap = ['NEW', 'CONTACTED', 'INTERESTED', 'TEST DRIVE', 'NEGOTIATION', 'BOOKED', 'WON', 'LOST'] as const
  return tahap.map((t) => {
    const daftar = dataset.leads.filter((l) => l.status === t)
    return {
      tahap: t,
      jumlah: daftar.length,
      nilai: daftar.reduce((s, l) => s + l.budget, 0),
      daftar,
    }
  })
}

export function performaSales() {
  return dataset.salesTeam
    .map((s) => {
      const penjualan = dataset.sales.filter((x) => x.salesPIC === s.nama)
      const lead = dataset.leads.filter((l) => l.salesPIC === s.nama)
      const menang = lead.filter((l) => l.status === 'WON').length
      return {
        ...s,
        unitTerjual: penjualan.length,
        nilaiPenjualan: penjualan.reduce((a, x) => a + x.finalPrice, 0),
        grossProfit: penjualan.reduce((a, x) => a + x.grossProfit, 0),
        leadDitangani: lead.length,
        leadMenang: menang,
        konversi: lead.length ? menang / lead.length : 0,
      }
    })
    .sort((a, b) => b.grossProfit - a.grossProfit)
}

export interface BucketAging {
  label: string
  jumlah: number
  unit: Vehicle[]
}

export function agingInventaris(): BucketAging[] {
  const buckets: BucketAging[] = [
    { label: '0–30 hari', jumlah: 0, unit: [] },
    { label: '31–60 hari', jumlah: 0, unit: [] },
    { label: '61–90 hari', jumlah: 0, unit: [] },
    { label: '> 90 hari', jumlah: 0, unit: [] },
  ]
  unitTersedia().forEach((v) => {
    const umur = v.hariSejakSiap ?? v.hariDiInventory
    const idx = umur <= 30 ? 0 : umur <= 60 ? 1 : umur <= 90 ? 2 : 3
    buckets[idx].jumlah += 1
    buckets[idx].unit.push(v)
  })
  buckets.forEach((b) => b.unit.sort((a, z) => (z.hariSejakSiap ?? z.hariDiInventory) - (a.hariSejakSiap ?? a.hariDiInventory)))
  return buckets
}

export interface Notifikasi {
  id: string
  tipe: 'FOLLOW_UP' | 'RECON' | 'BOOKING' | 'DOKUMEN' | 'AGING'
  judul: string
  keterangan: string
  jumlah: number
  tautan: string
  tingkat: 'perhatian' | 'info' | 'bahaya'
}

export function notifikasi(): Notifikasi[] {
  const hasil: Notifikasi[] = []

  const followUp = dataset.leads.filter((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY && !['WON', 'LOST'].includes(l.status))
  if (followUp.length) {
    hasil.push({
      id: 'follow-up',
      tipe: 'FOLLOW_UP',
      judul: `${followUp.length} follow-up jatuh tempo`,
      keterangan: followUp.slice(0, 2).map((l) => `${l.nama} · ${l.vehicleLabel}`).join(' · ') + (followUp.length > 2 ? ` · +${followUp.length - 2} lagi` : ''),
      jumlah: followUp.length,
      tautan: '/crm',
      tingkat: 'perhatian',
    })
  }

  const reconSelesai = dataset.reconditionings.filter((r) => r.status === 'COMPLETED' && r.selesai && selisihHari(r.selesai, DEMO_TODAY) <= 3)
  if (reconSelesai.length) {
    hasil.push({
      id: 'recon',
      tipe: 'RECON',
      judul: `${reconSelesai.length} unit selesai reconditioning`,
      keterangan: 'Siap diverifikasi dan ditayangkan di katalog.',
      jumlah: reconSelesai.length,
      tautan: '/reconditioning',
      tingkat: 'info',
    })
  }

  const bookingSegera = dataset.bookings.filter(
    (b) => b.statusPembayaran !== 'LUNAS' && selisihHari(DEMO_TODAY, b.kadaluarsa) <= 5,
  )
  if (bookingSegera.length) {
    hasil.push({
      id: 'booking',
      tipe: 'BOOKING',
      judul: `${bookingSegera.length} booking mendekati kadaluarsa`,
      keterangan: bookingSegera.map((b) => `${b.customerNama} · ${b.id}`).join(' · '),
      jumlah: bookingSegera.length,
      tautan: '/penjualan',
      tingkat: 'perhatian',
    })
  }

  const dokBermasalah = dataset.documents.filter((d) => d.checklist.some((c) => c.status !== 'Tersedia'))
  if (dokBermasalah.length) {
    hasil.push({
      id: 'dokumen',
      tipe: 'DOKUMEN',
      judul: `${dokBermasalah.length} unit dokumennya belum lengkap`,
      keterangan: 'Menghambat proses balik nama dan serah terima.',
      jumlah: dokBermasalah.length,
      tautan: '/dokumen',
      tingkat: 'bahaya',
    })
  }

  const aging = agingInventaris()[3]
  if (aging.jumlah) {
    hasil.push({
      id: 'aging',
      tipe: 'AGING',
      judul: `${aging.jumlah} unit di inventory lebih dari 90 hari`,
      keterangan: 'Pertimbangkan penyesuaian harga atau lelang.',
      jumlah: aging.jumlah,
      tautan: '/laporan',
      tingkat: 'bahaya',
    })
  }

  return hasil
}

/** Nilai persediaan per cabang — untuk pemecahan laporan. */
export function inventoryPerCabang() {
  return dataset.meta.cabang.map((cabang) => {
    const unit = unitTersedia().filter((v) => v.cabang === cabang)
    return {
      cabang,
      unit: unit.length,
      modal: unit.reduce((s, v) => s + v.totalCost, 0),
      nilai: unit.reduce((s, v) => s + v.listingPrice, 0),
    }
  })
}
