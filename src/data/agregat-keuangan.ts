import { dataset, DEMO_TODAY, bulanIni } from './index'
import { selisihHari, bulanLabel } from '@/lib/format'

/** Booking aktif (unit masih berstatus Booked) vs booking yang sudah menjadi penjualan. */
export function ringkasanBooking() {
  const denganUnit = dataset.bookings.map((b) => ({
    booking: b,
    unit: dataset.vehicles.find((v) => v.id === b.vehicleId),
  }))
  const aktif = denganUnit.filter((x) => x.unit?.status === 'BOOKED')
  const selesai = denganUnit.filter((x) => x.unit?.status === 'SOLD')
  const segera = aktif.filter((x) => selisihHari(DEMO_TODAY, x.booking.kadaluarsa) <= 5)
  const lewat = aktif.filter((x) => x.booking.kadaluarsa < DEMO_TODAY)
  return {
    total: dataset.bookings.length,
    aktif: aktif.length,
    selesai: selesai.length,
    nilaiDpAktif: aktif.reduce((s, x) => s + x.booking.dp, 0),
    sisaDpAktif: aktif.reduce((s, x) => s + x.booking.sisaPembayaran, 0),
    segera: segera.length,
    lewat: lewat.length,
    konversi: denganUnit.length ? selesai.length / denganUnit.length : 0,
    daftarAktif: aktif,
    daftarSelesai: selesai,
  }
}

/** Ringkasan transaksi penjualan. */
export function ringkasanPenjualan() {
  const daftar = dataset.sales
  const nilai = daftar.reduce((s, x) => s + x.finalPrice, 0)
  const modal = daftar.reduce((s, x) => s + x.totalModal, 0)
  const gp = daftar.reduce((s, x) => s + x.grossProfit, 0)
  const kas = daftar.filter((x) => x.tipePembayaran === 'Cash')
  const kredit = daftar.filter((x) => x.tipePembayaran === 'Kredit')
  return {
    jumlah: daftar.length,
    nilai,
    nilaiListing: daftar.reduce((s, x) => s + x.listingPrice, 0),
    diskonTotal: daftar.reduce((s, x) => s + x.diskon, 0),
    hargaRataRata: daftar.length ? nilai / daftar.length : 0,
    modal,
    grossProfit: gp,
    margin: modal ? gp / modal : 0,
    kas: { jumlah: kas.length, nilai: kas.reduce((s, x) => s + x.finalPrice, 0) },
    kredit: { jumlah: kredit.length, nilai: kredit.reduce((s, x) => s + x.finalPrice, 0) },
    bulanIni: daftar.filter((x) => x.tanggal.slice(0, 7) === bulanIni).length,
  }
}

/** Diskon per unit terjual — untuk melihat seberapa dalam potongan yang diberikan. */
export function diskonPerPenjualan() {
  return dataset.sales
    .map((s) => ({
      sale: s,
      unit: dataset.vehicles.find((v) => v.id === s.vehicleId),
      persenDiskon: s.listingPrice ? s.diskon / s.listingPrice : 0,
    }))
    .sort((a, b) => b.persenDiskon - a.persenDiskon)
}

/** Piutang: transaksi yang belum lunas. */
export function piutangPenjualan() {
  return dataset.sales
    .filter((s) => s.sisaPembayaran > 0)
    .map((s) => ({
      sale: s,
      unit: dataset.vehicles.find((v) => v.id === s.vehicleId),
      umurHari: selisihHari(s.tanggal, DEMO_TODAY),
    }))
    .sort((a, b) => b.sale.sisaPembayaran - a.sale.sisaPembayaran)
}

/** Profit per bulan (unit, penjualan, modal, gross profit, margin). */
export function profitPerBulan() {
  const bulan = [...new Set(dataset.sales.map((s) => s.tanggal.slice(0, 7)))].sort()
  return bulan.map((b) => {
    const daftar = dataset.sales.filter((s) => s.tanggal.slice(0, 7) === b)
    const modal = daftar.reduce((s, x) => s + x.totalModal, 0)
    const gp = daftar.reduce((s, x) => s + x.grossProfit, 0)
    return {
      bulan: b,
      label: bulanLabel(b),
      unit: daftar.length,
      nilai: daftar.reduce((s, x) => s + x.finalPrice, 0),
      modal,
      grossProfit: gp,
      margin: modal ? gp / modal : 0,
    }
  })
}

/** Margin menurut tipe pembayaran — untuk melihat apakah kredit lebih menguntungkan. */
export function marginPerTipePembayaran() {
  return (['Cash', 'Kredit'] as const).map((tipe) => {
    const daftar = dataset.sales.filter((s) => s.tipePembayaran === tipe)
    const modal = daftar.reduce((s, x) => s + x.totalModal, 0)
    const gp = daftar.reduce((s, x) => s + x.grossProfit, 0)
    return {
      tipe,
      unit: daftar.length,
      nilai: daftar.reduce((s, x) => s + x.finalPrice, 0),
      grossProfit: gp,
      rataGp: daftar.length ? gp / daftar.length : 0,
      margin: modal ? gp / modal : 0,
    }
  })
}

/* ------------------------------------------------------------------ *
 * Biaya operasional
 * ------------------------------------------------------------------ */
export function ringkasanBiaya() {
  const daftar = dataset.expenses
  const total = daftar.reduce((s, x) => s + x.jumlah, 0)
  const bulan = [...new Set(daftar.map((x) => x.bulan))]
  const perKategori = biayaPerKategori()
  return {
    jumlah: daftar.length,
    total,
    bulanTercatat: bulan.length,
    rataPerBulan: bulan.length ? total / bulan.length : 0,
    kategoriTerbesar: perKategori[0],
    terbesar: daftar.slice().sort((a, b) => b.jumlah - a.jumlah)[0],
  }
}

export function biayaPerKategori() {
  const peta = new Map<string, { kategori: string; jumlah: number; transaksi: number }>()
  dataset.expenses.forEach((e) => {
    const baris = peta.get(e.kategori) ?? { kategori: e.kategori, jumlah: 0, transaksi: 0 }
    baris.jumlah += e.jumlah
    baris.transaksi += 1
    peta.set(e.kategori, baris)
  })
  return [...peta.values()].sort((a, b) => b.jumlah - a.jumlah)
}

export function biayaPerBulan() {
  const bulan = [...new Set(dataset.expenses.map((e) => e.bulan))].sort().slice(-6)
  return bulan.map((b) => {
    const daftar = dataset.expenses.filter((e) => e.bulan === b)
    return {
      bulan: b,
      label: bulanLabel(b),
      jumlah: daftar.length,
      total: daftar.reduce((s, x) => s + x.jumlah, 0),
      perKategori: biayaKategoriBulan(b),
    }
  })
}

function biayaKategoriBulan(bulan: string) {
  const peta = new Map<string, number>()
  dataset.expenses
    .filter((e) => e.bulan === bulan)
    .forEach((e) => peta.set(e.kategori, (peta.get(e.kategori) ?? 0) + e.jumlah))
  return [...peta.entries()].map(([kategori, jumlah]) => ({ kategori, jumlah }))
}

/** Laba bersih sederhana: gross profit unit terjual dikurangi biaya operasional. */
export function labaOperasional() {
  const gp = dataset.sales.reduce((s, x) => s + x.grossProfit, 0)
  const biaya = dataset.expenses.reduce((s, x) => s + x.jumlah, 0)
  return {
    grossProfit: gp,
    biayaOperasional: biaya,
    labaBersih: gp - biaya,
    rasioBiaya: gp ? biaya / gp : 0,
  }
}

/** Biaya per cabang — semua biaya demo tercatat pada satu entitas, jadi ini informasi eksplisit. */
export function catatanBiaya() {
  return {
    jumlahKategori: biayaPerKategori().length,
    vendorTerbanyak: [...dataset.expenses.reduce((m, e) => m.set(e.vendor, (m.get(e.vendor) ?? 0) + 1), new Map<string, number>())]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  }
}
