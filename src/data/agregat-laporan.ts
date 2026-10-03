import { dataset, DEMO_TODAY, bulanIni } from './index'
import { selisihHari, tanggalPendek } from '@/lib/format'

const unitDari = (id: string) => dataset.vehicles.find((v) => v.id === id)
const labelUnit = (id: string) => {
  const u = unitDari(id)
  return u ? `${u.brand} ${u.model}` : id
}

/* ------------------------------------------------------------------ *
 * Inventory aging & perputaran stok
 * ------------------------------------------------------------------ */

export function agingInventori() {
  const belumTerjual = dataset.vehicles.filter((v) => v.status !== 'SOLD')
  const definisi = [
    { label: '0–30 hari', min: 0, max: 30 },
    { label: '31–60 hari', min: 31, max: 60 },
    { label: '61–90 hari', min: 61, max: 90 },
    { label: 'di atas 90 hari', min: 91, max: Number.POSITIVE_INFINITY },
  ]
  const ember = definisi.map((d) => {
    const isi = belumTerjual.filter((v) => v.hariDiInventory >= d.min && v.hariDiInventory <= d.max)
    return {
      label: d.label,
      unit: isi.length,
      modal: isi.reduce((s, v) => s + v.totalCost, 0),
      nilaiListing: isi.reduce((s, v) => s + v.listingPrice, 0),
    }
  })
  const modal = belumTerjual.reduce((s, v) => s + v.totalCost, 0)
  const tertua = belumTerjual.slice().sort((a, b) => b.hariDiInventory - a.hariDiInventory)
  return {
    unit: belumTerjual.length,
    modal,
    nilaiListing: belumTerjual.reduce((s, v) => s + v.listingPrice, 0),
    rataUmur: belumTerjual.length
      ? belumTerjual.reduce((s, v) => s + v.hariDiInventory, 0) / belumTerjual.length
      : 0,
    ember,
    tertua: tertua.slice(0, 6),
    modalTertua: tertua.slice(0, 6).reduce((s, v) => s + v.totalCost, 0),
    menua: belumTerjual.filter((v) => v.hariDiInventory > 90).length,
    // unit yang sudah siap dijual tapi diam terlalu lama: kandidat penurunan harga
    siapTapiLama: belumTerjual
      .filter((v) => v.status === 'READY' && v.hariSejakSiap !== null && v.hariSejakSiap > 60)
      .sort((a, b) => (b.hariSejakSiap ?? 0) - (a.hariSejakSiap ?? 0)),
  }
}

export function perputaranStok() {
  const terjual = dataset.sales.slice().sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
  const tanggalAwal = terjual[0]?.tanggal ?? DEMO_TODAY
  const periodeHari = Math.max(1, selisihHari(tanggalAwal, DEMO_TODAY))
  const tersedia = dataset.vehicles.filter((v) => v.status !== 'SOLD').length
  const hariTerjual = terjual
    .map((s) => {
      const u = unitDari(s.vehicleId)
      return u ? selisihHari(u.tanggalMasuk, s.tanggal) : null
    })
    .filter((x): x is number => x !== null)
  const rataHariTerjual = hariTerjual.length ? hariTerjual.reduce((s, x) => s + x, 0) / hariTerjual.length : 0
  return {
    unitTerjual: terjual.length,
    periodeHari,
    rataHariTerjual,
    rataHariTerjualTercepat: hariTerjual.length ? Math.min(...hariTerjual) : 0,
    rataHariTerjualTerlama: hariTerjual.length ? Math.max(...hariTerjual) : 0,
    // perkiraan: unit terjual pada periode demo, disetahunkan terhadap stok tersedia saat ini
    putaranPerTahun: tersedia ? (terjual.length * 365) / periodeHari / tersedia : 0,
  }
}

/* ------------------------------------------------------------------ *
 * Laporan margin & sumber lead
 * ------------------------------------------------------------------ */

function marginKelompok(kunci: (vehicleId: string) => string) {
  const peta = new Map<string, { label: string; unit: number; nilai: number; modal: number; grossProfit: number }>()
  dataset.sales.forEach((s) => {
    const label = kunci(s.vehicleId)
    const baris = peta.get(label) ?? { label, unit: 0, nilai: 0, modal: 0, grossProfit: 0 }
    baris.unit += 1
    baris.nilai += s.finalPrice
    baris.modal += s.totalModal
    baris.grossProfit += s.grossProfit
    peta.set(label, baris)
  })
  return [...peta.values()]
    .map((b) => ({ ...b, margin: b.modal ? b.grossProfit / b.modal : 0 }))
    .sort((a, b) => b.grossProfit - a.grossProfit)
}

export const marginPerMerek = () =>
  marginKelompok((id) => unitDari(id)?.brand ?? 'Tidak diketahui')

export const marginPerKelas = () =>
  marginKelompok((id) => unitDari(id)?.kelas ?? 'Tidak diketahui')

/** Efektivitas tiap sumber lead: berapa yang masuk, berapa jadi penjualan, berapa labanya. */
export function sumberLeadEfektif() {
  const sumber = dataset.sumberLeadMaster.map((s) => {
    const leads = dataset.leads.filter((l) => l.sumber === s)
    const won = leads.filter((l) => l.status === 'WON')
    const lost = leads.filter((l) => l.status === 'LOST')
    const aktif = leads.filter((l) => !['WON', 'LOST'].includes(l.status))
    // nilai penjualan yang bisa dilacak ke lead ini: penjualan -> booking -> lead
    const penjualan = dataset.sales.filter((sl) => {
      const bkg = dataset.bookings.find((b) => b.id === sl.bookingId)
      const lead = leads.find((l) => l.id === bkg?.leadId)
      return Boolean(lead)
    })
    return {
      sumber: s,
      lead: leads.length,
      won: won.length,
      lost: lost.length,
      aktif: aktif.length,
      konversi: leads.length ? won.length / leads.length : 0,
      nilai: penjualan.reduce((a, x) => a + x.finalPrice, 0),
      grossProfit: penjualan.reduce((a, x) => a + x.grossProfit, 0),
    }
  })
  return sumber.sort((a, b) => b.lead - a.lead)
}

/* ------------------------------------------------------------------ *
 * Performa sales
 * ------------------------------------------------------------------ */

export function performaSales() {
  return dataset.salesTeam
    .map((orang) => {
      const leads = dataset.leads.filter((l) => l.salesPIC === orang.nama)
      const won = leads.filter((l) => l.status === 'WON')
      const aktif = leads.filter((l) => !['WON', 'LOST'].includes(l.status))
      const terlambat = aktif.filter((l) => l.nextFollowUp !== null && l.nextFollowUp < DEMO_TODAY)
      const penjualan = dataset.sales.filter((s) => s.salesPIC === orang.nama)
      const hariClosing = won
        .map((l) => {
          const jual = dataset.sales.find((s) => {
            const bkg = dataset.bookings.find((b) => b.id === s.bookingId)
            return bkg?.leadId === l.id
          })
          return jual ? selisihHari(l.tanggalMasuk, jual.tanggal) : null
        })
        .filter((x): x is number => x !== null)
      return {
        ...orang,
        lead: leads.length,
        aktif: aktif.length,
        won: won.length,
        lost: leads.filter((l) => l.status === 'LOST').length,
        konversi: leads.length ? won.length / leads.length : 0,
        terlambat: terlambat.length,
        unit: penjualan.length,
        nilai: penjualan.reduce((s, x) => s + x.finalPrice, 0),
        grossProfit: penjualan.reduce((s, x) => s + x.grossProfit, 0),
        rataClosing: hariClosing.length ? hariClosing.reduce((s, x) => s + x, 0) / hariClosing.length : 0,
        capaianTarget: orang.target ? penjualan.length / orang.target : 0,
      }
    })
    .sort((a, b) => b.unit - a.unit || b.grossProfit - a.grossProfit)
}

/* ------------------------------------------------------------------ *
 * Perbandingan periode
 * ------------------------------------------------------------------ */

export function bandingkanPeriode(hari = 30) {
  const geser = (tanggal: string, jumlahHari: number) => {
    const d = new Date(tanggal + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + jumlahHari)
    return d.toISOString().slice(0, 10)
  }
  const batasBaru = geser(DEMO_TODAY, -hari)
  const batasLama = geser(DEMO_TODAY, -hari * 2)

  const hitung = (dari: string, sampai: string) => {
    const penjualan = dataset.sales.filter((s) => s.tanggal > dari && s.tanggal <= sampai)
    const lead = dataset.leads.filter((l) => l.tanggalMasuk > dari && l.tanggalMasuk <= sampai)
    return {
      unit: penjualan.length,
      nilai: penjualan.reduce((s, x) => s + x.finalPrice, 0),
      grossProfit: penjualan.reduce((s, x) => s + x.grossProfit, 0),
      lead: lead.length,
      leadMasuk: lead.length,
    }
  }
  const kini = hitung(batasBaru, DEMO_TODAY)
  const sebelumnya = hitung(batasLama, batasBaru)
  const selisih = (a: number, b: number) => (b ? (a - b) / b : a > 0 ? 1 : 0)
  return {
    hari,
    dari: batasBaru,
    sampai: DEMO_TODAY,
    dariSebelumnya: batasLama,
    sampaiSebelumnya: batasBaru,
    kini,
    sebelumnya,
    delta: {
      unit: selisih(kini.unit, sebelumnya.unit),
      nilai: selisih(kini.nilai, sebelumnya.nilai),
      grossProfit: selisih(kini.grossProfit, sebelumnya.grossProfit),
      lead: selisih(kini.lead, sebelumnya.lead),
    },
  }
}

/* ------------------------------------------------------------------ *
 * Notifikasi: daftar hal yang perlu ditindak hari ini
 * ------------------------------------------------------------------ */

export interface Notifikasi {
  id: string
  kategori: string
  judul: string
  detail: string
  ke: string
  jumlah: number
  nada: 'perhatian' | 'info'
}

export function notifikasiHariIni(): Notifikasi[] {
  const hasil: Notifikasi[] = []

  const followUp = dataset.leads.filter(
    (l) => l.nextFollowUp !== null && l.nextFollowUp < DEMO_TODAY && !['WON', 'LOST'].includes(l.status),
  )
  if (followUp.length) {
    const palingLama = followUp
      .slice()
      .sort((a, b) => (a.nextFollowUp! < b.nextFollowUp! ? -1 : 1))[0]
    hasil.push({
      id: 'follow-up',
      kategori: 'CRM',
      judul: `${followUp.length} follow-up lead terlambat`,
      detail: `Terlama: ${palingLama.nama} (${labelUnit(palingLama.vehicleId)}) sejak ${tanggalPendek(palingLama.nextFollowUp!)}`,
      ke: '/crm',
      jumlah: followUp.length,
      nada: 'perhatian',
    })
  }

  const dokumen = dataset.documents.filter((d) => d.checklist.some((c) => c.status !== 'Tersedia'))
  if (dokumen.length) {
    const belumAda = dokumen.reduce(
      (s, d) => s + d.checklist.filter((c) => c.status === 'Belum Ada').length,
      0,
    )
    hasil.push({
      id: 'dokumen',
      kategori: 'Dokumen',
      judul: `${dokumen.length} unit dokumennya belum lengkap`,
      detail: `${belumAda} dokumen berstatus "Belum Ada" — menghambat proses balik nama`,
      ke: '/dokumen',
      jumlah: dokumen.length,
      nada: 'perhatian',
    })
  }

  const menua = agingInventori().menua
  if (menua) {
    hasil.push({
      id: 'aging',
      kategori: 'Inventory',
      judul: `${menua} unit diam lebih dari 90 hari`,
      detail: 'Modal terikat dan biaya penyimpanan terus berjalan tanpa penjualan',
      ke: '/laporan',
      jumlah: menua,
      nada: 'perhatian',
    })
  }

  const segera = dataset.bookings.filter((b) => {
    const u = unitDari(b.vehicleId)
    if (u?.status !== 'BOOKED') return false
    const sisa = selisihHari(DEMO_TODAY, b.kadaluarsa)
    return sisa >= 0 && sisa <= 7
  })
  if (segera.length) {
    hasil.push({
      id: 'booking',
      kategori: 'Booking',
      judul: `${segera.length} booking mendekati kadaluarsa`,
      detail: `Unit terkunci maksimal 7 hari lagi — perlu konfirmasi pelunasan atau dilepas kembali`,
      ke: '/booking',
      jumlah: segera.length,
      nada: 'perhatian',
    })
  }

  const piutangTua = dataset.sales.filter((s) => s.sisaPembayaran > 0 && selisihHari(s.tanggal, DEMO_TODAY) > 45)
  if (piutangTua.length) {
    hasil.push({
      id: 'piutang',
      kategori: 'Keuangan',
      judul: `${piutangTua.length} piutang lewat 45 hari`,
      detail: 'Umumnya menunggu pencairan multifinance — perlu ditagih ulang',
      ke: '/finance',
      jumlah: piutangTua.length,
      nada: 'perhatian',
    })
  }

  const stokBulanIni = dataset.vehicles.filter((v) => v.tanggalMasuk.slice(0, 7) === bulanIni).length
  if (stokBulanIni) {
    hasil.push({
      id: 'masuk-bulan-ini',
      kategori: 'Inventory',
      judul: `${stokBulanIni} unit masuk bulan ini`,
      detail: 'Perlu dijadwalkan inspeksi dan reconditioning agar cepat siap dijual',
      ke: '/procurement',
      jumlah: stokBulanIni,
      nada: 'info',
    })
  }

  return hasil
}

/* ------------------------------------------------------------------ *
 * Pencarian global
 * ------------------------------------------------------------------ */

export interface HasilCari {
  tipe: 'Unit' | 'Lead' | 'Customer' | 'Invoice' | 'Booking' | 'Biaya'
  id: string
  judul: string
  keterangan: string
  ke: string
}

export function cariGlobal(kata: string, batas = 6): HasilCari[] {
  const q = kata.trim().toLowerCase()
  if (q.length < 2) return []
  const cocok = (...kolom: (string | null | undefined)[]) =>
    kolom.some((k) => (k ?? '').toLowerCase().includes(q))

  const hasil: HasilCari[] = []

  dataset.vehicles
    .filter((v) => cocok(v.id, v.brand, v.model, v.variant, v.nomorPolisi, v.vin, v.kelas))
    .slice(0, batas)
    .forEach((v) =>
      hasil.push({
        tipe: 'Unit',
        id: v.id,
        judul: `${v.brand} ${v.model} ${v.variant}`,
        keterangan: `${v.id} · ${v.nomorPolisi} · ${v.status}`,
        ke: `/inventory/${v.id}`,
      }),
    )

  dataset.leads
    .filter((l) => cocok(l.id, l.nama, l.telepon, l.vehicleLabel, l.sumber))
    .slice(0, batas)
    .forEach((l) =>
      hasil.push({
        tipe: 'Lead',
        id: l.id,
        judul: `${l.nama} · ${l.vehicleLabel}`,
        keterangan: `${l.id} · ${l.status} · ${l.salesPIC}`,
        ke: `/crm/${l.id}`,
      }),
    )

  dataset.customers
    .filter((c) => cocok(c.id, c.nama, c.telepon, c.kota, c.email))
    .slice(0, batas)
    .forEach((c) =>
      hasil.push({
        tipe: 'Customer',
        id: c.id,
        judul: c.nama,
        keterangan: `${c.id} · ${c.kota} · ${c.salesPIC}`,
        ke: `/customer/${c.id}`,
      }),
    )

  dataset.sales
    .filter((s) => cocok(s.id, s.customerNama, s.vehicleId, s.financePartner))
    .slice(0, batas)
    .forEach((s) =>
      hasil.push({
        tipe: 'Invoice',
        id: s.id,
        judul: `${s.id} · ${labelUnit(s.vehicleId)}`,
        keterangan: `${s.customerNama} · ${s.status} · ${s.tipePembayaran}`,
        ke: `/penjualan?q=${encodeURIComponent(s.id)}`,
      }),
    )

  dataset.bookings
    .filter((b) => cocok(b.id, b.customerNama, b.vehicleId))
    .slice(0, batas)
    .forEach((b) =>
      hasil.push({
        tipe: 'Booking',
        id: b.id,
        judul: `${b.id} · ${labelUnit(b.vehicleId)}`,
        keterangan: `${b.customerNama} · ${b.statusPembayaran}`,
        ke: `/booking?q=${encodeURIComponent(b.id)}`,
      }),
    )

  dataset.expenses
    .filter((e) => cocok(e.id, e.item, e.vendor, e.kategori, e.pic))
    .slice(0, batas)
    .forEach((e) =>
      hasil.push({
        tipe: 'Biaya',
        id: e.id,
        judul: e.item,
        keterangan: `${e.id} · ${e.kategori} · ${e.vendor}`,
        ke: `/biaya?q=${encodeURIComponent(e.id)}`,
      }),
    )

  return hasil
}

/** Contoh kata kunci nyata dari dataset — dipakai sebagai petunjuk di kotak pencarian. */
export function contohPencarian() {
  const unit = dataset.vehicles.slice().sort((a, b) => b.totalCost - a.totalCost)[0]
  const invoice = dataset.sales[0]
  return [
    { label: unit ? `${unit.brand} ${unit.model}` : 'unit termahal', q: unit?.id ?? '' },
    { label: invoice?.customerNama ?? 'nama customer', q: invoice?.customerNama ?? '' },
    { label: 'cari dokumen', q: 'B 1234' },
  ].filter((x) => x.q)
}

export { labelUnit }
