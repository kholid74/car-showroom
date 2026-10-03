import { dataset, DEMO_TODAY } from './index'
import type { Lead, LeadStatus } from './types'

/**
 * Lead yang dipakai seluruh agregasi = lead hasil katalog publik (masuk saat sesi berjalan)
 * digabung dengan lead di dataset. Tanpa ini, angka CRM tidak akan cocok dengan isi papannya
 * begitu ada minat baru dari katalog.
 */
const semuaLead = (ekstra: Lead[] = []) => (ekstra.length ? [...ekstra, ...dataset.leads] : dataset.leads)

/** Ringkasan pipeline lead — dipakai dashboard, CRM, dan laporan. */
export function ringkasanLead(ekstra: Lead[] = []) {
  const semua = semuaLead(ekstra)
  const aktif = semua.filter((l) => !['WON', 'LOST'].includes(l.status))
  const menang = semua.filter((l) => l.status === 'WON')
  const jatuhTempo = aktif.filter((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY)
  const tanpaJadwal = aktif.filter((l) => !l.nextFollowUp)
  return {
    total: semua.length,
    aktif: aktif.length,
    nilaiPipeline: aktif.reduce((s, l) => s + l.budget, 0),
    menang: menang.length,
    nilaiMenang: menang.reduce((s, l) => s + l.budget, 0),
    batal: semua.filter((l) => l.status === 'LOST').length,
    konversi: semua.length ? menang.length / semua.length : 0,
    jatuhTempo: jatuhTempo.length,
    tanpaJadwal: tanpaJadwal.length,
    rataBudget: aktif.length ? aktif.reduce((s, l) => s + l.budget, 0) / aktif.length : 0,
  }
}

/** Jumlah dan nilai lead per tahap (memakai tahap apa adanya dari data demo). */
export function leadPerTahap(tahap: LeadStatus[], ekstra: Lead[] = []) {
  const semua = semuaLead(ekstra)
  return tahap.map((t) => {
    const daftar = semua.filter((l) => l.status === t)
    return { tahap: t, daftar, jumlah: daftar.length, nilai: daftar.reduce((s, l) => s + l.budget, 0) }
  })
}

/** Efektivitas sumber lead: mana yang menghasilkan closing, bukan sekadar banyak lead. */
export function leadPerSumber(ekstra: Lead[] = []) {
  const semua = semuaLead(ekstra)
  return dataset.sumberLeadMaster
    .map((sumber) => {
      const daftar = semua.filter((l) => l.sumber === sumber)
      const menang = daftar.filter((l) => l.status === 'WON')
      return {
        sumber,
        jumlah: daftar.length,
        nilai: daftar.reduce((s, l) => s + l.budget, 0),
        menang: menang.length,
        konversi: daftar.length ? menang.length / daftar.length : 0,
      }
    })
    .filter((s) => s.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah)
}

/** Beban kerja per sales: lead aktif dan yang sudah jatuh tempo. */
export function bebanSales(ekstra: Lead[] = []) {
  const semua = semuaLead(ekstra)
  return dataset.salesTeam.map((s) => {
    const lead = semua.filter((l) => l.salesPIC === s.nama)
    const aktif = lead.filter((l) => !['WON', 'LOST'].includes(l.status))
    return {
      sales: s.nama,
      aktif: aktif.length,
      jatuhTempo: aktif.filter((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY).length,
      menang: lead.filter((l) => l.status === 'WON').length,
      nilaiAktif: aktif.reduce((a, l) => a + l.budget, 0),
    }
  })
}

/** Lead yang perlu ditindak hari ini, terurut dari yang paling terlambat. */
export function leadJatuhTempo(ekstra: Lead[] = []): Lead[] {
  return semuaLead(ekstra)
    .filter((l) => !['WON', 'LOST'].includes(l.status) && l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY)
    .sort((a, b) => (a.nextFollowUp! < b.nextFollowUp! ? -1 : 1))
}

/* ------------------------------------------------------------------ *
 * Customer
 * ------------------------------------------------------------------ */
export function ringkasanCustomer() {
  return {
    total: dataset.customers.length,
    denganLead: dataset.customers.length,
    berulang: 0,
    sumberUnik: new Set(dataset.customers.map((c) => c.sumberLead)).size,
  }
}

/** Customer lengkap dengan lead, booking, dan transaksinya. */
export function bundelCustomer(customerId: string) {
  const customer = dataset.customers.find((c) => c.id === customerId)
  if (!customer) return null
  const leads = dataset.leads.filter((l) => l.customerId === customerId)
  const booking = dataset.bookings.filter((b) => b.customerId === customerId)
  const penjualan = dataset.sales.filter((s) => s.customerId === customerId)
  const kendaraan = [
    ...new Set([
      ...leads.map((l) => l.vehicleId),
      ...booking.map((b) => b.vehicleId),
      ...penjualan.map((s) => s.vehicleId),
    ]),
  ]
    .map((id) => dataset.vehicles.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
  return { customer, leads, booking, penjualan, kendaraan }
}

/** Semua customer, ringkas untuk tabel daftar. */
export function daftarCustomer() {
  return dataset.customers.map((c) => {
    const leads = dataset.leads.filter((l) => l.customerId === c.id)
    const penjualan = dataset.sales.filter((s) => s.customerId === c.id)
    return {
      ...c,
      jumlahLead: leads.length,
      leadTerakhir: leads.sort((a, b) => (a.tanggalMasuk < b.tanggalMasuk ? 1 : -1))[0],
      jumlahTransaksi: penjualan.length,
      nilaiTransaksi: penjualan.reduce((s, x) => s + x.finalPrice, 0),
      labaTransaksi: penjualan.reduce((s, x) => s + x.grossProfit, 0),
    }
  })
}
