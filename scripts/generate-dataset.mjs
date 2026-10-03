#!/usr/bin/env node
/**
 * Generator dataset demo showroom mobil bekas.
 *
 * Prinsip: SATU sumber data, semua angka diturunkan (derived), bukan ditulis tangan.
 *   totalCost    = purchasePrice + reconCost + otherCost
 *   listingPrice = totalCost * (1 + targetMargin)
 *   grossProfit  = finalPrice - totalCost        (hanya jika unit terjual)
 *
 * Deterministik: PRNG ber-seed tetap + tanggal acuan tetap (DEMO_TODAY), sehingga
 * angka yang dilihat calon klien tidak berubah antar build.
 *
 * Seluruh data sintetis. Tidak ada dokumen, VIN, atau data pribadi yang nyata.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'data', 'dataset.json')

const DEMO_TODAY = '2026-10-03'
const SEED = 20261003

// ---------- PRNG deterministik ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)
const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const pickW = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v }
  return pairs[pairs.length - 1][0]
}
/** pilih dari daftar objek { ..., bobot } secara berbobot */
const pickWObj = (arr) => {
  const total = arr.reduce((s, o) => s + o.bobot, 0)
  let r = rnd() * total
  for (const o of arr) { r -= o.bobot; if (r <= 0) return o }
  return arr[arr.length - 1]
}
const roundTo = (n, unit) => Math.round(n / unit) * unit

/** Format Rupiah untuk teks yang disimpan di dataset (dipakai di lini masa aktivitas). */
const rp = (n) => (n < 0 ? '-Rp' + new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(n))) : 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(n)))

// ---------- tanggal ----------
// Semua tanggal murni diperlakukan sebagai tengah malam UTC agar bolak-balik
// addDays tidak menggeser hari (toISOString mengonversi ke UTC).
const DAY = 86400000
const d = (iso) => new Date(iso + 'T00:00:00Z')
const iso = (date) => date.toISOString().slice(0, 10)
const addDays = (isoStr, n) => iso(new Date(d(isoStr).getTime() + n * DAY))
const daysBetween = (a, b) => Math.round((d(b).getTime() - d(a).getTime()) / DAY)
const monthKey = (isoStr) => isoStr.slice(0, 7)
const minIso = (a, b) => (a < b ? a : b)
const stamp = (isoStr, h, m) => `${isoStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`

// ---------- katalog model (band harga pasar mobil bekas Indonesia, dalam Rupiah) ----------
const MODELS = [
  { brand: 'Toyota', model: 'Fortuner', variants: ['VRZ 2.4 4x2 AT', 'G 2.4 4x2 AT', 'SRZ 2.4 4x4 AT'], fuel: 'Diesel', lo: 380e6, hi: 520e6, cls: 'suv' },
  { brand: 'Toyota', model: 'Innova Zenix', variants: ['Q Hybrid AT', 'V AT', 'G AT'], fuel: 'Bensin', lo: 400e6, hi: 495e6, cls: 'mpv' },
  { brand: 'Toyota', model: 'Alphard', variants: ['2.5 G AT', '2.5 X AT', '2.5 SC AT'], fuel: 'Bensin', lo: 700e6, hi: 980e6, cls: 'mpv' },
  { brand: 'Toyota', model: 'Avanza', variants: ['1.5 G AT', '1.5 G MT', '1.3 E MT'], fuel: 'Bensin', lo: 165e6, hi: 235e6, cls: 'mpv' },
  { brand: 'Toyota', model: 'Rush', variants: ['1.5 GR Sport AT', '1.5 S AT', '1.5 G MT'], fuel: 'Bensin', lo: 150e6, hi: 205e6, cls: 'suv' },
  { brand: 'Toyota', model: 'Calya', variants: ['1.2 G AT', '1.2 E MT'], fuel: 'Bensin', lo: 120e6, hi: 155e6, cls: 'mpv' },
  { brand: 'Honda', model: 'CR-V', variants: ['1.5 Turbo Prestige AT', '1.5 Turbo SE AT', '2.0 RS AT'], fuel: 'Bensin', lo: 330e6, hi: 445e6, cls: 'suv' },
  { brand: 'Honda', model: 'Brio', variants: ['RS CVT', 'Satya E CVT', 'Satya S MT'], fuel: 'Bensin', lo: 128e6, hi: 178e6, cls: 'city' },
  { brand: 'Honda', model: 'HR-V', variants: ['1.5 SE CVT', '1.5 E CVT', '1.8 Prestige CVT'], fuel: 'Bensin', lo: 235e6, hi: 315e6, cls: 'suv' },
  { brand: 'Honda', model: 'Mobilio', variants: ['1.5 E CVT', '1.5 E MT'], fuel: 'Bensin', lo: 118e6, hi: 165e6, cls: 'mpv' },
  { brand: 'Suzuki', model: 'XL7', variants: ['Alpha AT', 'Beta AT', 'Zeta MT'], fuel: 'Bensin', lo: 178e6, hi: 235e6, cls: 'suv' },
  { brand: 'Suzuki', model: 'Ertiga', variants: ['GX AT', 'GX MT', 'GL MT'], fuel: 'Bensin', lo: 148e6, hi: 195e6, cls: 'mpv' },
  { brand: 'Suzuki', model: 'Jimny', variants: ['1.5 Sierra AT', '1.5 Single Tone MT'], fuel: 'Bensin', lo: 330e6, hi: 415e6, cls: 'suv' },
  { brand: 'Mitsubishi', model: 'Pajero Sport', variants: ['Dakar 2.4 AT', 'Exceed 2.4 MT', 'Dakar Ultimate AT'], fuel: 'Diesel', lo: 340e6, hi: 455e6, cls: 'suv' },
  { brand: 'Mitsubishi', model: 'Xpander', variants: ['Ultimate AT', 'Sport AT', 'GLS MT'], fuel: 'Bensin', lo: 188e6, hi: 245e6, cls: 'mpv' },
  { brand: 'Daihatsu', model: 'Terios', variants: ['R AT', 'X AT', 'R MT'], fuel: 'Bensin', lo: 148e6, hi: 195e6, cls: 'suv' },
  { brand: 'Daihatsu', model: 'Rocky', variants: ['1.0 Turbo R AT', '1.0 X MT'], fuel: 'Bensin', lo: 145e6, hi: 190e6, cls: 'suv' },
  { brand: 'Hyundai', model: 'Creta', variants: ['1.5 Prime AT', '1.5 Trend MT', '1.5 Style AT'], fuel: 'Bensin', lo: 248e6, hi: 325e6, cls: 'suv' },
  { brand: 'Hyundai', model: 'Palisade', variants: ['2.2 CRDi Signature AT', '2.2 CRDi Prime AT'], fuel: 'Diesel', lo: 690e6, hi: 880e6, cls: 'suv' },
  { brand: 'BMW', model: 'X1', variants: ['sDrive18i xLine', 'sDrive18d xLine'], fuel: 'Bensin', lo: 395e6, hi: 530e6, cls: 'premium' },
  { brand: 'Mercedes-Benz', model: 'C200', variants: ['AMG Line', 'Avantgarde'], fuel: 'Bensin', lo: 495e6, hi: 715e6, cls: 'premium' },
  { brand: 'Mercedes-Benz', model: 'GLC 200', variants: ['AMG Line', 'Exclusive'], fuel: 'Bensin', lo: 620e6, hi: 850e6, cls: 'premium' },
]
const WARNA = ['Putih Mutiara', 'Hitam Metalik', 'Silver Metalik', 'Abu-abu Titanium', 'Merah Marun', 'Biru Tua', 'Cokelat Bronze', 'Putih']
const KOTA = ['Jakarta Selatan', 'Jakarta Timur', 'Depok', 'Bekasi', 'Tangerang Selatan', 'Bandung', 'Bogor']
const CABANG = ['Jakarta Selatan', 'Bekasi']
const PLAT = { 'Jakarta Selatan': 'B', 'Bekasi': 'B' }
const SALES = [
  { id: 'SLS-01', nama: 'Andi Pratama', jabatan: 'Sales Executive' },
  { id: 'SLS-02', nama: 'Rizky Nugroho', jabatan: 'Sales Executive' },
  { id: 'SLS-03', nama: 'Dimas Saputra', jabatan: 'Sales Executive' },
  { id: 'SLS-04', nama: 'Bagus Wicaksono', jabatan: 'Sales Executive' },
]
const VENDOR_RECON = ['Bengkel Sentra Motor', 'Auto Detailing Prima', 'Karya Mandiri Body Repair', 'Klinik AC Mobil Sejuk', 'Ban & Velg Jaya Abadi', 'Bengkel Spesialis Otomotif DS']
const FINANCE = ['Adira Finance', 'BCA Finance', 'Mandiri Tunas Finance', 'Astra Credit Companies', 'Maybank Finance', 'BNI Multifinance']
const SUMBER_UNIT = [
  { jenis: 'Individu', bobot: 46 },
  { jenis: 'Dealer', bobot: 22 },
  { jenis: 'Lelang', bobot: 20 },
  { jenis: 'Tukar Tambah', bobot: 12 },
]
const SUMBER_LEAD = [
  { jenis: 'WhatsApp', bobot: 26 },
  { jenis: 'Marketplace', bobot: 22 },
  { jenis: 'Instagram', bobot: 18 },
  { jenis: 'Website', bobot: 12 },
  { jenis: 'Facebook Ads', bobot: 10 },
  { jenis: 'Walk-in', bobot: 7 },
  { jenis: 'Referral', bobot: 5 },
]

const NAMA_DEPAN = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Rudi', 'Nur', 'Hendra', 'Rina', 'Agus', 'Maya', 'Taufik', 'Lina', 'Yusuf', 'Wulan', 'Eko', 'Fitri', 'Bambang', 'Anisa', 'Dedi', 'Sari', 'Iwan', 'Ratna', 'Joko', 'Melati', 'Fajar', 'Indah', 'Gunawan', 'Ayu', 'Slamet', 'Ningsih', 'Rizky', 'Cahyo']
const NAMA_BELAKANG = ['Santoso', 'Wijaya', 'Kusuma', 'Halim', 'Setiawan', 'Purnama', 'Hidayat', 'Lestari', 'Firmansyah', 'Anggraini', 'Nugroho', 'Rahayu', 'Saputra', 'Maulana', 'Siregar', 'Pratama']

const nama = () => `${pick(NAMA_DEPAN)} ${pick(NAMA_BELAKANG)}`
const telp = () => pick(['0812', '0813', '0821', '0856', '0878', '0895', '0851']) + String(ri(1000000, 99999999))
const plat = (cabang) => {
  const huruf = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const suf = [0, 1, 2].map(() => huruf[ri(0, huruf.length - 1)]).join('')
  return `${PLAT[cabang] || 'B'} ${ri(1000, 9999)} ${suf}`
}
const vin = (i) => `MHFD3B${String(ri(10, 99))}0N${String(100000 + i * 7).slice(0, 6)}`
const noMesin = (i) => `2GD-FTV-${100000 + i * 137}`

// ---------- unit ----------
const TOTAL_UNIT = 44
const STATUS_PLAN = [
  ...Array(11).fill('SOLD'),           // riwayat lengkap pembelian → terjual
  ...Array(3).fill('BOOKED'),
  ...Array(16).fill('READY'),
  ...Array(5).fill('RECONDITIONING'),
  ...Array(5).fill('INSPEKSI'),
  ...Array(4).fill('BARU MASUK'),
]
// rencana status harus mencakup tepat semua unit — dulu konstanta ini tidak dipakai sama sekali
if (STATUS_PLAN.length !== TOTAL_UNIT) {
  throw new Error(`rencana status ${STATUS_PLAN.length} unit, seharusnya ${TOTAL_UNIT}`)
}

const KATEGORI_INSPEKSI = [
  { kategori: 'Eksterior', item: ['Body & cat', 'Bumper depan', 'Bumper belakang', 'Pintu & kap mesin', 'Kaca & wiper', 'Lampu eksterior'] },
  { kategori: 'Interior', item: ['Jok & upholstery', 'Dashboard', 'Plafon & karpet', 'Panel pintu', 'Audio & head unit'] },
  { kategori: 'Mesin', item: ['Kondisi mesin & idle', 'Kebocoran oli', 'Sistem pendingin', 'Sabuk & pulley', 'Filter udara'] },
  { kategori: 'Transmisi', item: ['Perpindahan gigi', 'Kopling / torque converter', 'Kebocoran transmisi'] },
  { kategori: 'Kaki-kaki', item: ['Shockbreaker', 'Bushing & link', 'Tie rod & ball joint'] },
  { kategori: 'Rem', item: ['Kampas rem depan', 'Kampas rem belakang', 'Cakram & tromol', 'Minyak rem'] },
  { kategori: 'Kelistrikan', item: ['Aki & alternator', 'AC & blower', 'Power window', 'Sensor & ECU (scan)'] },
  { kategori: 'Ban & Velg', item: ['Ban depan', 'Ban belakang', 'Velg & ban cadangan'] },
  { kategori: 'Dokumen', item: ['STNK & pajak', 'BPKB', 'Riwayat servis', 'Riwayat asuransi & klaim'] },
]

const PEKERJAAN_RECON = [
  { job: 'Body repair & cat bumper', lo: 1200000, hi: 4500000 },
  { job: 'Poles & coating bodi', lo: 550000, hi: 1500000 },
  { job: 'Servis berkala & ganti oli', lo: 850000, hi: 2200000 },
  { job: 'Ganti kampas rem', lo: 700000, hi: 1900000 },
  { job: 'Interior detailing', lo: 450000, hi: 1100000 },
  { job: 'Ganti aki', lo: 750000, hi: 1400000 },
  { job: 'Servis AC & isi freon', lo: 500000, hi: 1600000 },
  { job: 'Ganti ban (2 pcs)', lo: 1600000, hi: 4200000 },
  { job: 'Perbaikan kaki-kaki', lo: 900000, hi: 3200000 },
  { job: 'Ganti kaca film', lo: 450000, hi: 1300000 },
  { job: 'Tune up mesin', lo: 800000, hi: 2500000 },
  { job: 'Ganti lampu & kelistrikan', lo: 350000, hi: 1200000 },
]

const DOKUMEN_TEMPLATE = [
  'STNK', 'BPKB', 'Faktur', 'Kwitansi Pembelian', 'Dokumen Inspeksi', 'Perjanjian Jual Beli',
]

// Rentang hari unit masuk, per status. Rantai proses terpanjang ≈ 32 hari
// (inspeksi 1–4 hari + sampai 8 pekerjaan recon × 1–3 hari), jadi unit yang
// sudah READY harus masuk setidaknya ~40 hari lalu agar tanggal siapnya tidak
// melewati hari demo.
const RENTANG_MASUK = {
  READY: [42, 165],
  RECONDITIONING: [16, 48],
  INSPEKSI: [2, 12],
  'BARU MASUK': [1, 7],
}

const JADWAL_JUAL = [
  '2026-05-18', '2026-06-14', '2026-07-09', '2026-07-27', '2026-08-06',
  '2026-08-22', '2026-09-11', '2026-09-24', '2026-10-01', '2026-10-02', '2026-10-03',
]
const jadwalJualMap = new Map()
const jadwalBookingMap = new Map()
let soldSeq = 0

const vehicles = []
const procurements = []
const inspections = []
const reconditionings = []
const documents = []
const activities = []

STATUS_PLAN.forEach((status, idx) => {
  const spec = MODELS[idx % MODELS.length]
  const tahun = ri(2018, 2024)
  const umur = 2026 - tahun
  const km = roundTo(umur * ri(11000, 21000) + ri(500, 9000), 500)
  const cabang = idx % 4 === 0 ? CABANG[1] : CABANG[0]
  const vehicleIdEarly = `VH-2026-${String(idx + 1).padStart(4, '0')}`
  let arrivalDate
  if (status === 'SOLD') {
    const jual = JADWAL_JUAL[soldSeq++]
    jadwalJualMap.set(vehicleIdEarly, jual)
    // buffer harus lebih besar dari rantai terpanjang (inspeksi 1–4 hari +
    // sampai 8 pekerjaan reconditioning × 1–3 hari ≈ 28 hari) agar unit
    // benar-benar sudah READY sebelum booking/terjual.
    arrivalDate = addDays(jual, -ri(46, 92))
  } else if (status === 'BOOKED') {
    const bkg = addDays(DEMO_TODAY, -ri(1, 12))
    jadwalBookingMap.set(vehicleIdEarly, bkg)
    arrivalDate = addDays(bkg, -ri(46, 95))
  } else {
    const [lo, hi] = RENTANG_MASUK[status] ?? [3, 60]
    arrivalDate = addDays(DEMO_TODAY, -ri(lo, hi))
  }

  // harga pasar model: makin tua & makin tinggi km → makin murah
  const depresiasi = 1 - Math.min(0.42, umur * 0.075) - Math.min(0.08, km / 1600000)
  const nilaiPasar = roundTo((spec.lo + (spec.hi - spec.lo) * rnd()) * depresiasi, 1000000)
  // harga beli: sebagian besar di bawah acuan pasar, sebagian kecil ditebus di atas
  // (realistis: unit incaran yang harus ditebus lebih tinggi agar tidak lepas)
  const premiBeli = rnd() < 0.18
  const purchasePrice = roundTo(nilaiPasar * (premiBeli ? 0.97 + rnd() * 0.09 : 0.84 + rnd() * 0.06), 1000000)

  // kondisi menentukan biaya reconditioning
  const kondisi = pickW([['sangat baik', 20], ['baik', 42], ['cukup', 28], ['perlu banyak', 10]])
  const reconBias = { 'sangat baik': 0.35, baik: 0.7, cukup: 1.15, 'perlu banyak': 1.9 }[kondisi]
  const otherCost = roundTo(pick([1200000, 1500000, 1800000, 2200000, 2500000, 3000000, 3500000, 4200000]), 100000)
  const skala = Math.max(0.5, Math.min(2.6, purchasePrice / 300e6))

  // item reconditioning
  const items = []
  const jumlahItem = kondisi === 'sangat baik' ? ri(3, 4) : kondisi === 'baik' ? ri(4, 6) : kondisi === 'cukup' ? ri(5, 7) : ri(6, 8)
  const dipakai = new Set()
  for (let k = 0; k < jumlahItem; k++) {
    let p, guard = 0
    do { p = pick(PEKERJAAN_RECON); guard++ } while (dipakai.has(p.job) && guard < 20)
    dipakai.add(p.job)
    items.push({
      vendor: pick(VENDOR_RECON),
      job: p.job,
      biaya: roundTo((p.lo + (p.hi - p.lo) * rnd()) * reconBias * skala, 50000),
    })
  }
  const reconCost = items.reduce((s, it) => s + it.biaya, 0)
  const totalCost = purchasePrice + reconCost + otherCost
  const marginTarget = purchasePrice > 400e6 ? 0.045 + rnd() * 0.03 : purchasePrice > 200e6 ? 0.065 + rnd() * 0.035 : 0.075 + rnd() * 0.045
  const listingPrice = roundTo(totalCost * (1 + marginTarget), 1000000)

  const vehicleId = `VH-2026-${String(idx + 1).padStart(4, '0')}`
  const salesPic = SALES[idx % SALES.length]

  // ---------- procurement ----------
  const jenisSumber = pickWObj(SUMBER_UNIT)
  const hariNegosiasi = ri(2, 12)
  const offerDate = addDays(arrivalDate, -hariNegosiasi - ri(1, 6))
  const sellerName = jenisSumber.jenis === 'Dealer' ? `${pick(['CV', 'PT', 'UD'])} ${pick(['Maju', 'Berkah', 'Sentosa', 'Jaya', 'Anugerah'])} ${pick(['Motor', 'Mobil', 'Otomotif'])}` : nama()
  procurements.push({
    id: `PRC-2026-${String(idx + 1).padStart(4, '0')}`,
    vehicleId,
    sumber: jenisSumber.jenis,
    namaSeller: sellerName,
    kontakSeller: telp(),
    kotaSeller: pick(KOTA),
    hargaPenawaran: roundTo(purchasePrice * (1.05 + rnd() * 0.09), 1000000),
    hargaDeal: purchasePrice,
    tanggalPenawaran: offerDate,
    tanggalPembelian: arrivalDate,
    metodePembayaran: pickW([['Transfer bank', 72], ['Tunai', 22], ['Virtual account', 6]]),
    pic: pick(['Yuni Astari', 'Bayu Setiawan', 'Hendra Gunawan']),
    status: 'PURCHASED',
    dokumenDiterima: ['BPKB', 'STNK', 'Faktur', 'Kuitansi', 'KTP pemilik'],
    catatan: `Unit ${kondisi}. ${pick([
      'Servis rutin lengkap di bengkel resmi, buku servis tersedia.',
      'Pemakaian pribadi, bukan unit rental.',
      'Pajak baru diperpanjang, plat ganjil.',
      'Ada riwayat klaim asuransi ringan di bumper belakang, sudah diperbaiki.',
      'Ban masih tebal, tinggal poles bodi.',
      'Satu pemilik, kunci lengkap dua.',
    ])}`,
    nilaiPasarAcuan: nilaiPasar,
  })

  // ---------- inspeksi (unit yang sudah lewat tahap BARU MASUK) ----------
  const sudahInspeksi = status !== 'BARU MASUK'
  const inspectionDate = minIso(addDays(arrivalDate, ri(1, 4)), DEMO_TODAY)
  if (sudahInspeksi) {
    const sections = KATEGORI_INSPEKSI.map((s, si) => ({
      kategori: s.kategori,
      item: s.item.map((it) => {
        // Temuan biasa (ATTENTION) dan temuan yang butuh perbaikan nyata (REPAIR REQUIRED)
        // punya peluang terpisah. Semula keduanya digabung, akibatnya hampir semua unit
        // selalu punya item perbaikan dan tidak ada satu pun unit yang benar-benar sehat.
        const peluangTemuan =
          kondisi === 'perlu banyak' ? 0.34 : kondisi === 'cukup' ? 0.26 : kondisi === 'baik' ? 0.18 : 0.12
        const peluangRepair =
          kondisi === 'perlu banyak' ? 0.09 : kondisi === 'cukup' ? 0.05 : kondisi === 'baik' ? 0.03 : 0.02
        // dokumen tidak pernah "perlu perbaikan" — hanya sering terlambat
        const tambahanAtensi = (s.kategori === 'Dokumen' ? 0.16 : 0) + (si === 0 ? 0.06 : 0)
        let hasil = 'GOOD'
        if (s.kategori !== 'Dokumen' && rnd() < peluangRepair) hasil = 'REPAIR REQUIRED'
        else if (rnd() < peluangTemuan + tambahanAtensi) hasil = 'ATTENTION'
        return {
          item: it,
          hasil,
          catatan: hasil === 'GOOD' ? '' : pick([
            'Perlu pengecekan lanjutan sebelum dijual.',
            'Sudah masuk rencana reconditioning.',
            'Aman dipakai, pantau saat servis berikutnya.',
            'Ganti part, sudah dianggarkan.',
            'Tidak memengaruhi harga jual, informasikan ke pembeli.',
          ]),
        }
      }),
    }))
    const semuaItem = sections.flatMap((s) => s.item)
    const ringkasan = {
      good: semuaItem.filter((i) => i.hasil === 'GOOD').length,
      attention: semuaItem.filter((i) => i.hasil === 'ATTENTION').length,
      repair: semuaItem.filter((i) => i.hasil === 'REPAIR REQUIRED').length,
    }
    const skor = Math.round((ringkasan.good / semuaItem.length) * 100)
    inspections.push({
      id: `INSP-2026-${String(idx + 1).padStart(4, '0')}`,
      vehicleId,
      tanggal: inspectionDate,
      inspektur: pick(['Hendra Gunawan', 'Slamet Riyadi', 'Agus Firmansyah']),
      skor,
      // rekomendasi diturunkan dari temuan nyata, bukan dari skor saja: unit tanpa item
      // REPAIR REQUIRED tidak boleh berbunyi "dengan perbaikan"
      rekomendasi:
        ringkasan.repair > 0
          ? 'PERLU PERBAIKAN SEBELUM DIJUAL'
          : ringkasan.attention > 0
            ? 'LAYAK JUAL DENGAN CATATAN'
            : 'LAYAK JUAL',
      ringkasan,
      sections,
      catatan:
        ringkasan.repair > 0
          ? 'Unit secara umum sehat. Fokus perbaikan pada item bertanda REPAIR REQUIRED.'
          : pick([
              'Tidak ada temuan yang menghalangi penjualan; sisanya perawatan berkala.',
              'Riwayat servis jelas. Temuan yang ada bersifat kosmetik ringan.',
              'Kondisi mesin dan transmisi baik, sesuai hasil scan ECU.',
              'Temuan yang tercatat sudah ditangani pada tahap reconditioning.',
            ]),
    })
  }

  // ---------- reconditioning ----------
  const selesaiRecon = status === 'READY' || status === 'BOOKED' || status === 'SOLD'
  const mulaiRecon = selesaiRecon || status === 'RECONDITIONING'
  if (mulaiRecon) {
    const start = addDays(inspectionDate, ri(0, 2))
    let cursor = start
    const recondItems = items.map((it) => {
      const durasi = ri(1, 3)
      const mulai = cursor
      const selesai = addDays(mulai, durasi)
      cursor = selesai
      return {
        id: `RCN-ITEM-${vehicleId.slice(-4)}-${it.job.slice(0, 3).toUpperCase().replace(/\s/g, '')}`,
        vendor: it.vendor,
        job: it.job,
        biaya: it.biaya,
        mulai,
        selesai,
        status: selesaiRecon ? 'COMPLETED' : pickW([['IN PROGRESS', 55], ['PLANNED', 30], ['COMPLETED', 15]]),
        catatan: pick(['Sesuai estimasi.', 'Sempat menunggu part, selesai sesuai jadwal baru.', 'Dikerjakan sesuai permintaan.', 'Ada tambahan biaya kecil, sudah disetujui PIC.']),
      }
    })
    reconditionings.push({
      id: `RCN-2026-${String(idx + 1).padStart(4, '0')}`,
      vehicleId,
      vendorUtama: recondItems[0]?.vendor ?? VENDOR_RECON[0],
      pic: pick(['Yuni Astari', 'Bayu Setiawan']),
      mulai: start,
      selesai: selesaiRecon ? cursor : null,
      status: selesaiRecon ? 'COMPLETED' : 'IN PROGRESS',
      total: reconCost,
      items: recondItems,
    })
  }

  // ---------- dokumen ----------
  // Sebagian besar unit dokumennya lengkap; hanya sebagian kecil punya temuan,
  // supaya daftar "dokumen belum lengkap" jadi daftar pengecualian yang bermakna.
  const masalahDokumen = rnd() < (status === 'SOLD' ? 0.12 : 0.22)
  const dokBermasalah = new Set()
  if (masalahDokumen) {
    const kandidat = ['Perjanjian Jual Beli', 'Dokumen Inspeksi', 'Faktur', 'BPKB']
    dokBermasalah.add(kandidat[ri(0, 1)])
    if (rnd() < 0.35) dokBermasalah.add(kandidat[ri(2, 3)])
  }
  const dokStatus = DOKUMEN_TEMPLATE.map((nama) => {
    const st = dokBermasalah.has(nama) ? (rnd() < 0.65 ? 'Menunggu' : 'Belum Ada') : 'Tersedia'
    return {
      nama,
      status: st,
      nomor: st === 'Belum Ada' ? null : `${nama.slice(0, 3).toUpperCase()}-${ri(10000, 99999)}`,
      catatan: st === 'Tersedia' ? '' : st === 'Menunggu' ? 'Berkas sedang diurus ke pemilik sebelumnya.' : 'Belum diterima dari penjual.',
    }
  })
  documents.push({ vehicleId, checklist: dokStatus })

  // ---------- status & tanggal jadi ----------
  const reconFinish = recondItemsSafe(reconditionings, vehicleId)
  const readyDate = selesaiRecon ? (reconFinish ?? addDays(inspectionDate, 5)) : null

  vehicles.push({
    id: vehicleId,
    brand: spec.brand,
    model: spec.model,
    variant: pick(spec.variants),
    tahun,
    warna: pick(WARNA),
    transmisi: pickW([['AT', 78], ['MT', 22]]),
    bahanBakar: spec.fuel,
    kelas: spec.cls,
    kilometer: km,
    nomorPolisi: plat(cabang),
    vin: vin(idx),
    nomorMesin: noMesin(idx),
    kondisiMasuk: kondisi,
    cabang,
    status,
    lokasi: cabang,
    purchasePrice,
    reconCost,
    otherCost,
    totalCost,
    listingPrice,
    estimasiMargin: listingPrice - totalCost,
    tanggalMasuk: arrivalDate,
    tanggalSiap: readyDate,
    tanggalTerjual: null,
    umurInventaris: daysBetween(arrivalDate, DEMO_TODAY),
    salesPIC: salesPic.nama,
    catatan: pick([
      'Unit paling cepat laku di kelasnya.',
      'Diminati karena warna netral dan km rendah.',
      'Perlu waktu lebih lama karena harga di atas pasar.',
      'Sudah banyak yang bertanya, belum ada yang serius.',
      'Cocok untuk keluarga, riwayat servis lengkap.',
    ]),
    foto: {
      // asset placeholder berarahan — bukan foto klien/properti nyata
      ref: `${spec.brand.toLowerCase().replace(/[^a-z]/g, '')}-${spec.model.toLowerCase().replace(/[^a-z]/g, '')}`,
      jumlahTersedia: ri(4, 12),
    },
  })
})

// helper: tanggal selesai recon
function recondItemsSafe(list, vehicleId) {
  const r = list.find((x) => x.vehicleId === vehicleId)
  return r?.selesai ?? null
}

// ---------- biaya operasional ----------
const EXPENSE_KATEGORI = [
  { kategori: 'Marketing', item: ['Iklan marketplace', 'Instagram Ads', 'Facebook Ads', 'Cetak banner & brosur'], lo: 1500000, hi: 9000000 },
  { kategori: 'Office', item: ['Listrik & air', 'Internet & telepon', 'ATK & operasional', 'Sewa kantor'], lo: 800000, hi: 7500000 },
  { kategori: 'Vehicle Transport', item: ['Angkut unit antar kota', 'Bensin & tol survey unit', 'Jasa ekspedisi dokumen'], lo: 600000, hi: 4500000 },
  { kategori: 'Maintenance', item: ['Servis mobil operasional', 'Cuci & kebersihan showroom', 'Perbaikan peralatan'], lo: 400000, hi: 3200000 },
]
const expenses = []
let expSeq = 0
for (let bulanKe = 5; bulanKe >= 0; bulanKe--) {
  const tanggalDasar = addDays(DEMO_TODAY, -(bulanKe * 30) - 12)
  for (const k of EXPENSE_KATEGORI) {
    if (rnd() < 0.18) continue
    expSeq++
    const tgl = addDays(tanggalDasar, ri(0, 20))
    expenses.push({
      id: `EXP-2026-${String(expSeq).padStart(4, '0')}`,
      tanggal: tgl <= DEMO_TODAY ? tgl : DEMO_TODAY,
      kategori: k.kategori,
      item: pick(k.item),
      jumlah: roundTo(k.lo + (k.hi - k.lo) * rnd(), 100000),
      metode: pick(['Transfer', 'Tunai', 'Kartu perusahaan']),
      vendor: pick(['Vendor Digital Nusantara', 'PT Sarana Kantor', 'CV Transport Jaya', 'Bengkel Operasional Mandiri', 'Percetakan Sinar']),
      pic: pick(['Yuni Astari', 'Bayu Setiawan', 'Ratna Wulandari']),
      bulan: monthKey(tgl),
    })
  }
}

// ---------- lead, customer, booking, penjualan ----------
const leads = []
const customers = []
const bookings = []
const sales = []

const leadStatusPlan = [
  ...Array(5).fill('NEW'),
  ...Array(5).fill('CONTACTED'),
  ...Array(4).fill('INTERESTED'),
  ...Array(4).fill('TEST DRIVE'),
  ...Array(4).fill('NEGOTIATION'),
  ...Array(3).fill('BOOKED'),   // cocok dengan unit BOOKED
  ...Array(11).fill('WON'),     // cocok dengan unit SOLD
  ...Array(3).fill('LOST'),
]

const unitBooked = vehicles.filter((v) => v.status === 'BOOKED')
const unitSold = vehicles.filter((v) => v.status === 'SOLD')
const unitTersediaUntukkLead = vehicles.filter((v) => v.status === 'READY')

let leadSeq = 1000
let custSeq = 0
let wonIdx = 0
let bookedIdx = 0
leadStatusPlan.forEach((status, i) => {
  leadSeq++
  let vehicle
  let custId = null
  if (status === 'BOOKED') vehicle = unitBooked[bookedIdx++]
  else if (status === 'WON') vehicle = unitSold[wonIdx++]
  else vehicle = unitTersediaUntukkLead[i % unitTersediaUntukkLead.length]

  const leadId = `LD-${leadSeq}`
  const salesPic = SALES[i % SALES.length]
  const namaLead = nama()
  const sumberLead = pickWObj(SUMBER_LEAD).jenis
  const acuanJual = jadwalJualMap.get(vehicle.id)
  const acuanBooking = jadwalBookingMap.get(vehicle.id)
  const tanggalMasuk = acuanJual
    ? addDays(acuanJual, -ri(6, 26))
    : acuanBooking
      ? addDays(acuanBooking, -ri(4, 20))
      : addDays(DEMO_TODAY, -ri(1, 95))
  const paymentPreference = pickW([['Kredit', 62], ['Cash', 38]])
  const budget = roundTo(vehicle.listingPrice * (0.9 + rnd() * 0.16), 1000000)

  const tahapanMenengah = ['CONTACTED', 'INTERESTED', 'TEST DRIVE', 'NEGOTIATION', 'BOOKED', 'WON'].includes(status)
  const sudahTestDrive = ['TEST DRIVE', 'NEGOTIATION', 'BOOKED', 'WON'].includes(status)
  const nextFollowUp = status === 'WON' || status === 'LOST' ? null : addDays(DEMO_TODAY, ri(-4, 9))

  // interacton timeline
  const interaksi = [{ waktu: stamp(tanggalMasuk, ri(8, 17), ri(0, 59)), tipe: 'Lead masuk', oleh: 'Sistem', catatan: `Lead masuk dari ${sumberLead}.` }]
  if (tahapanMenengah) {
    interaksi.push({ waktu: stamp(addDays(tanggalMasuk, ri(0, 1)), ri(9, 17), ri(0, 59)), tipe: 'Dihubungi', oleh: salesPic.nama, catatan: pick(['Menanyakan kondisi unit dan riwayat servis.', 'Minta foto tambahan bagian interior.', 'Menanyakan simulasi kredit.', 'Sudah dijelaskan harga dan kondisi apa adanya.']) })
  }
  if (sudahTestDrive) {
    interaksi.push({ waktu: stamp(addDays(tanggalMasuk, ri(2, 5)), ri(9, 16), ri(0, 59)), tipe: 'Test drive', oleh: salesPic.nama, catatan: pick(['Test drive di sekitar showroom, 8 km.', 'Test drive bersama pasangan, fokus kenyamanan kabin.', 'Test drive, minta cek kaki-kaki ulang.']) })
  }
  if (['NEGOTIATION', 'BOOKED', 'WON'].includes(status)) {
    interaksi.push({ waktu: stamp(addDays(tanggalMasuk, ri(5, 9)), ri(13, 17), ri(0, 59)), tipe: 'Negosiasi', oleh: salesPic.nama, catatan: pick(['Minta potong harga, dibahas ke manajer.', 'Sepakat setelah penyesuaian harga dan bonus perawatan.', 'Menunggu persetujuan harga dari pemilik.']) })
  }
  if (status === 'WON' || status === 'LOST') {
    interaksi.push({ waktu: stamp(addDays(tanggalMasuk, ri(9, 14)), ri(10, 16), ri(0, 59)), tipe: status === 'WON' ? 'Closing' : 'Batal', oleh: salesPic.nama, catatan: status === 'WON' ? 'Deal disetujui, lanjut proses pembayaran.' : pick(['Memilih unit lain karena jarak.', 'Batal karena kondisi keuangan.', 'Tidak ada respons setelah beberapa kali follow-up.']) })
  }

  // customer untuk lead yang sudah maju
  if (sudahTestDrive || ['BOOKED', 'WON'].includes(status)) {
    custSeq++
    custId = `CST-${String(custSeq).padStart(3, '0')}`
    customers.push({
      id: custId,
      nama: namaLead,
      telepon: telp(),
      email: `${namaLead.split(' ')[0].toLowerCase()}${ri(10, 99)}@email.com`,
      kota: pick(KOTA),
      alamat: `Jl. ${pick(['Merdeka', 'Sudirman', 'Melati', 'Kenanga', 'Cempaka', 'Palmerah', 'Anggrek'])} No. ${ri(1, 120)}, ${pick(KOTA)}`,
      sumberLead: pick(SUMBER_LEAD).jenis,
      salesPIC: salesPic.nama,
      budget,
      preferensiPembayaran: paymentPreference,
      pekerjaan: pick(['Karyawan swasta', 'Wiraswasta', 'PNS', 'Dokter', 'Kontraktor', 'Ibu rumah tangga', 'Manajer perusahaan']),
      sejak: tanggalMasuk,
      catatan: pick(['Sudah punya kendaraan lain, unit ini untuk istri.', 'Butuh unit keluarga 7 penumpang.', 'Prioritas perawatan mudah dan biaya servis wajar.', 'Pembeli serius, sudah siap dana.']),
      kreditAktif: [],
    })
  }

  leads.push({
    id: leadId,
    customerId: custId,
    nama: namaLead,
    telepon: telp(),
    sumber: sumberLead,
    vehicleId: vehicle.id,
    vehicleLabel: `${vehicle.brand} ${vehicle.model}`,
    salesPIC: salesPic.nama,
    budget,
    preferensiPembayaran: paymentPreference,
    status,
    tanggalMasuk,
    interaksiTerakhir: interaksi[interaksi.length - 1].waktu,
    nextFollowUp,
    catatan: pick(['Minta dihubungi setelah jam kerja.', 'Bandingkan dengan unit lain di showroom sebelah.', 'Menunggu jadwal test drive akhir pekan.', 'Sudah pernah lihat unit langsung.', 'Butuh simulasi kredit 3 tenor.']),
    interaksi,
  })
})

// booking untuk unit BOOKED
unitBooked.forEach((v, i) => {
  const lead = leads.find((l) => l.vehicleId === v.id && l.status === 'BOOKED')
  const cust = customers.find((c) => c.id === lead?.customerId)
  const bookingDate = jadwalBookingMap.get(v.id)
  const dp = roundTo(v.listingPrice * (0.05 + rnd() * 0.05), 1000000)
  bookings.push({
    id: `BKG-2026-${String(i + 1).padStart(3, '0')}`,
    vehicleId: v.id,
    leadId: lead?.id ?? null,
    customerId: cust?.id ?? null,
    customerNama: cust?.nama ?? lead?.nama ?? 'Customer',
    salesPIC: lead?.salesPIC ?? v.salesPIC,
    tanggalBooking: bookingDate,
    kadaluarsa: addDays(bookingDate, 14),
    dp,
    sisaPembayaran: v.listingPrice - dp,
    statusPembayaran: pickW([['DP DIBAYAR', 70], ['MENUNGGU PEMBAYARAN', 30]]),
    tipePembayaran: lead?.preferensiPembayaran ?? 'Kredit',
    catatan: pick(['Menunggu proses kredit dari multifinance.', 'Customer minta unit disiapkan sebelum diambil.', 'DP sudah masuk, sisa saat serah terima.']),
  })
})
bookings.forEach((b) => {
  const v = vehicles.find((x) => x.id === b.vehicleId)
  if (v) v.bookingId = b.id
})

// penjualan untuk unit SOLD
unitSold.forEach((v, i) => {
  const lead = leads.find((l) => l.vehicleId === v.id && l.status === 'WON')
  const cust = customers.find((c) => c.id === lead?.customerId)
  const saleDate = jadwalJualMap.get(v.id)
  const discount = roundTo(pick([0, 0, 3000000, 5000000, 7000000, 8500000, 12000000, 15000000]) * (v.listingPrice > 400e6 ? 1.6 : 1), 1000000)
  const negotiatedPrice = roundTo(v.listingPrice - discount, 1000000)
  const finalPrice = negotiatedPrice
  const paymentType = lead?.preferensiPembayaran ?? 'Kredit'
  const dp = paymentType === 'Kredit' ? roundTo(finalPrice * (0.2 + rnd() * 0.15), 1000000) : finalPrice
  const tenor = paymentType === 'Kredit' ? pick([12, 24, 36, 48, 60]) : null
  const finance = paymentType === 'Kredit' ? pick(FINANCE) : null
  const sisaPembayaran = finalPrice - dp
  const cicilan = tenor ? roundTo(((finalPrice - dp) * (1 + 0.11 * (tenor / 12))) / tenor, 100000) : null
  // booking harus setelah lead masuk dan sebelum tanggal terjual
  const leadDate = lead?.tanggalMasuk ?? null
  let bookingDate = addDays(saleDate, -ri(3, 12))
  if (leadDate && bookingDate <= leadDate) bookingDate = addDays(leadDate, ri(1, 3))
  if (bookingDate >= saleDate) bookingDate = addDays(saleDate, -1)
  const bookingId = `BKG-2026-${String(bookings.length + 1).padStart(3, '0')}`

  bookings.push({
    id: bookingId,
    vehicleId: v.id,
    leadId: lead?.id ?? null,
    customerId: cust?.id ?? null,
    customerNama: cust?.nama ?? lead?.nama ?? 'Customer',
    salesPIC: lead?.salesPIC ?? v.salesPIC,
    tanggalBooking: bookingDate,
    kadaluarsa: addDays(bookingDate, 14),
    dp: roundTo(finalPrice * 0.05, 1000000),
    sisaPembayaran: finalPrice - roundTo(finalPrice * 0.05, 1000000),
    statusPembayaran: 'SELESAI',
    tipePembayaran: paymentType,
    catatan: 'Booking berlanjut ke penjualan.',
  })
  v.bookingId = bookingId

  sales.push({
    id: `INV-2026-${String(10000 + i * 7).padStart(5, '0')}`,
    vehicleId: v.id,
    customerId: cust?.id ?? null,
    customerNama: cust?.nama ?? lead?.nama ?? 'Customer',
    salesPIC: lead?.salesPIC ?? v.salesPIC,
    tanggal: saleDate,
    listingPrice: v.listingPrice,
    negotiatedPrice,
    diskon: discount,
    finalPrice,
    tipePembayaran: paymentType,
    dp,
    sisaPembayaran,
    financePartner: finance,
    tenor,
    estimasiCicilan: cicilan,
    // status pembayaran diturunkan dari sisa pembayaran, bukan diacak, agar tidak
    // pernah muncul transaksi berlabel LUNAS yang masih punya sisa tagihan
    status: sisaPembayaran === 0 ? 'LUNAS' : 'DIBAYAR SEBAGIAN',
    totalModal: v.totalCost,
    grossProfit: finalPrice - v.totalCost,
    bookingId,
    serahTerima: paymentType === 'Cash' ? addDays(saleDate, ri(0, 3)) : addDays(saleDate, ri(3, 14)),
    catatan: pick(['Unit diserahkan lengkap dengan dokumen.', 'Menunggu proses balik nama.', 'Kredit disetujui, unit sudah diambil.', 'Bonus perawatan 3 bulan diberikan.']),
  })
  v.tanggalTerjual = saleDate
  v.umurInventaris = daysBetween(v.tanggalMasuk, saleDate)
})

// ---------- PIC sales unit disinkronkan dengan transaksi/booking nyata ----------
// supaya laporan performa sales dihitung dari penjualan yang benar-benar terjadi
vehicles.forEach((v) => {
  const s = sales.find((x) => x.vehicleId === v.id)
  if (s) { v.salesPIC = s.salesPIC; return }
  const b = bookings.find((x) => x.vehicleId === v.id)
  if (b) { v.salesPIC = b.salesPIC; return }
  const l = leads.find((x) => x.vehicleId === v.id)
  if (l) v.salesPIC = l.salesPIC
})

// ---------- umur inventaris & lama sejak siap (untuk aging) ----------
vehicles.forEach((v) => {
  v.hariDiInventory = daysBetween(v.tanggalMasuk, v.tanggalTerjual ?? DEMO_TODAY)
  v.hariSejakSiap = v.tanggalSiap ? daysBetween(v.tanggalSiap, v.tanggalTerjual ?? DEMO_TODAY) : null
})

// ---------- timeline aktivitas per unit (satu jalur: beli → jual) ----------
vehicles.forEach((v) => {
  const prc = procurements.find((p) => p.vehicleId === v.id)
  const insp = inspections.find((x) => x.vehicleId === v.id)
  const rcn = reconditionings.find((x) => x.vehicleId === v.id)
  const lead = leads.find((l) => l.vehicleId === v.id && ['TEST DRIVE', 'NEGOTIATION', 'BOOKED', 'WON'].includes(l.status))
  const bkg = bookings.find((b) => b.vehicleId === v.id)
  const sale = sales.find((s) => s.vehicleId === v.id)
  const push = (tanggal, tipe, judul, detail, oleh) => activities.push({ id: `ACT-${v.id}-${activities.length}`, vehicleId: v.id, tanggal, tipe, judul, detail, oleh })

  push(prc.tanggalPenawaran, 'PROCUREMENT', 'Penawaran unit diajukan', `${prc.sumber} · penawaran ${rp(prc.hargaPenawaran)}`, prc.pic)
  push(v.tanggalMasuk, 'PROCUREMENT', 'Unit dibeli', `Harga deal ${rp(prc.hargaDeal)} · ${prc.sumber}`, prc.pic)
  if (insp) push(insp.tanggal, 'INSPECTION', 'Inspeksi selesai', `Skor ${insp.skor} · ${insp.rekomendasi}`, insp.inspektur)
  if (rcn) {
    push(rcn.mulai, 'RECONDITIONING', 'Masuk reconditioning', `${rcn.items.length} pekerjaan · estimasi ${rp(rcn.total)}`, rcn.pic)
    if (rcn.selesai) push(rcn.selesai, 'RECONDITIONING', 'Reconditioning selesai', `Total biaya ${rp(rcn.total)}`, rcn.pic)
  }
  if (v.tanggalSiap) push(v.tanggalSiap, 'INVENTORY', 'Ready for sale', 'Unit siap dipasarkan', 'Sistem')
  if (v.tanggalSiap) push(addDays(v.tanggalSiap, 1), 'MERCHANDISING', 'Listing dipublikasikan', `Tayang di katalog publik pada harga ${rp(v.listingPrice)}`, 'Admin Operational')
  if (lead) {
    push(lead.tanggalMasuk, 'CRM', 'Lead masuk', `${lead.sumber} · ${lead.nama}`, 'Sistem')
    lead.interaksi.filter((x) => x.tipe === 'Test drive').forEach((x) => push(x.waktu.slice(0, 10), 'CRM', 'Test drive', `${lead.nama} test drive unit ini`, lead.salesPIC))
  }
  if (bkg) push(bkg.tanggalBooking, 'SALES', 'Booking / DP', `${bkg.customerNama} · DP ${rp(bkg.dp)}`, bkg.salesPIC)
  if (sale) {
    push(sale.tanggal, 'SALES', 'Terjual', `${sale.customerNama} · ${sale.tipePembayaran} · ${rp(sale.finalPrice)}`, sale.salesPIC)
    push(sale.serahTerima, 'FINANCE', 'Pembayaran & serah terima', `Unit diserahkan · sisa pembayaran ${rp(sale.sisaPembayaran)}`, 'Admin Operational')
  }
})
activities.sort((a, b) => (a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0))

// ---------- notifikasi turunan ----------
const belumLengkap = documents.filter((doc) => doc.checklist.some((c) => c.status !== 'Tersedia'))
const agingOver90 = vehicles.filter((v) => !['SOLD'].includes(v.status) && v.umurInventaris > 90)

const dataset = {
  meta: {
    namaShowroom: 'Showroom Kalsara Motor',
    cabang: CABANG,
    demoToday: DEMO_TODAY,
    seed: SEED,
    catatan: 'Seluruh data pada demo ini sintetis dan dibuat otomatis. Tidak ada data pelanggan, dokumen, atau kendaraan yang nyata.',
  },
  users: [
    { id: 'USR-01', nama: 'Kholid Abdillah', email: 'owner@showroom.demo', password: 'demo123', role: 'OWNER', jabatan: 'Owner / Management', cabang: 'Jakarta Selatan' },
    { id: 'USR-02', nama: 'Yuni Astari', email: 'admin@showroom.demo', password: 'demo123', role: 'ADMIN', jabatan: 'Admin Operational', cabang: 'Jakarta Selatan' },
    { id: 'USR-03', nama: 'Andi Pratama', email: 'sales@showroom.demo', password: 'demo123', role: 'SALES', jabatan: 'Sales Executive', cabang: 'Jakarta Selatan' },
  ],
  // Target sales diturunkan dari realisasi, bukan ditulis tangan: target periode demo =
  // unit yang benar-benar terjual oleh orang itu + 1 unit ruang perbaikan. Angka target
  // yang dikarang bebas (mis. 12 unit/orang per bulan) akan membuat demo tidak masuk akal.
  salesTeam: SALES.map((s) => ({
    ...s,
    target: sales.filter((x) => x.salesPIC === s.nama).length + 1,
  })),
  vehicles,
  procurements,
  inspections,
  reconditionings,
  documents,
  leads,
  customers,
  bookings,
  sales,
  expenses,
  activities,
  financePartners: FINANCE,
  vendors: VENDOR_RECON,
  sumberLeadMaster: SUMBER_LEAD.map((s) => s.jenis),
  sumberUnitMaster: SUMBER_UNIT.map((s) => s.jenis),
}

// ---------- pengawasan ringan saat generate ----------
const errors = []
vehicles.forEach((v) => {
  if (v.totalCost !== v.purchasePrice + v.reconCost + v.otherCost) errors.push(`${v.id}: totalCost tidak konsisten`)
  if (v.estimasiMargin !== v.listingPrice - v.totalCost) errors.push(`${v.id}: estimasiMargin tidak konsisten`)
  const rcn = reconditionings.find((r) => r.vehicleId === v.id)
  if (rcn) {
    const sum = rcn.items.reduce((s, it) => s + it.biaya, 0)
    if (sum !== v.reconCost) errors.push(`${v.id}: item recon ${sum} != reconCost ${v.reconCost}`)
  }
})
if (errors.length) {
  console.error('GAGAL: dataset tidak konsisten:')
  errors.forEach((e) => console.error(' -', e))
  process.exit(1)
}

mkdirSync(join(__dirname, '..', 'src', 'data'), { recursive: true })
writeFileSync(OUT, JSON.stringify(dataset, null, 1))
console.log(`dataset.json ditulis: ${OUT}`)
console.log(`  unit ${vehicles.length} · procurement ${procurements.length} · inspeksi ${inspections.length} · recon ${reconditionings.length}`)
console.log(`  lead ${leads.length} · customer ${customers.length} · booking ${bookings.length} · penjualan ${sales.length}`)
console.log(`  biaya ${expenses.length} · aktivitas ${activities.length} · dokumen belum lengkap ${belumLengkap.length} · aging >90hr ${agingOver90.length}`)
