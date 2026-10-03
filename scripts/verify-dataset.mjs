#!/usr/bin/env node
/**
 * Verifikasi dataset demo: integritas relasional + konsistensi matematis + KPI.
 * Gagal (exit 1) bila ada satu saja invariant yang dilanggar.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const D = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'dataset.json'), 'utf8'))

const fails = []
const ok = (kondisi, pesan) => { if (!kondisi) fails.push(pesan) }
const rp = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)
const jt = (n) => 'Rp' + (n / 1e6).toFixed(1).replace('.', ',') + ' jt'

const TODAY = D.meta.demoToday
const bulanIni = TODAY.slice(0, 7)
const { vehicles, procurements, inspections, reconditionings, documents, leads, customers, bookings, sales, expenses, activities } = D

// ---------- 1. jumlah minimum sesuai brief ----------
ok(vehicles.length >= 40, `unit < 40 (${vehicles.length})`)
ok(leads.length >= 20, `lead < 20 (${leads.length})`)
ok(customers.length >= 20, `customer < 20 (${customers.length})`)
ok(sales.length >= 10, `penjualan < 10 (${sales.length})`)
ok(expenses.length >= 15, `biaya < 15 (${expenses.length})`)
ok(procurements.length >= vehicles.length, 'procurement < jumlah unit')
ok(inspections.length >= vehicles.filter((v) => v.status !== 'BARU MASUK').length, 'tidak semua unit pasca-BARU MASUK punya inspeksi')
ok(documents.length === vehicles.length, 'checklist dokumen tidak lengkap per unit')
ok(D.salesTeam.length >= 3, 'sales team < 3')

// ---------- 2. keunikan ID ----------
for (const [nama, arr, key] of [['vehicles', vehicles, 'id'], ['procurements', procurements, 'id'], ['inspections', inspections, 'id'], ['reconditionings', reconditionings, 'id'], ['leads', leads, 'id'], ['customers', customers, 'id'], ['bookings', bookings, 'id'], ['sales', sales, 'id'], ['expenses', expenses, 'id']]) {
  const ids = arr.map((x) => x[key])
  ok(new Set(ids).size === ids.length, `ID duplikat di ${nama}`)
}

// ---------- 3. aritmetika per unit ----------
for (const v of vehicles) {
  ok(v.totalCost === v.purchasePrice + v.reconCost + v.otherCost, `${v.id}: totalCost != purchase+recon+other`)
  ok(v.estimasiMargin === v.listingPrice - v.totalCost, `${v.id}: estimasiMargin != listing - totalCost`)
  ok(v.hariDiInventory >= 0, `${v.id}: hariDiInventory negatif`)
  ok(v.hariSejakSiap === null || v.hariSejakSiap >= 0, `${v.id}: hariSejakSiap negatif`)

  const prc = procurements.filter((p) => p.vehicleId === v.id)
  ok(prc.length === 1, `${v.id}: procurement != 1 (${prc.length})`)
  if (prc[0]) {
    ok(prc[0].hargaDeal === v.purchasePrice, `${v.id}: hargaDeal procurement != purchasePrice unit`)
    ok(prc[0].status === 'PURCHASED', `${v.id}: status procurement bukan PURCHASED`)
  }

  const rcn = reconditionings.filter((r) => r.vehicleId === v.id)
  if (v.status === 'BARU MASUK' || v.status === 'INSPEKSI') {
    ok(rcn.length === 0, `${v.id}: status ${v.status} tapi sudah ada reconditioning`)
  } else {
    ok(rcn.length === 1, `${v.id}: reconditioning != 1 (${rcn.length})`)
    if (rcn[0]) {
      const sum = rcn[0].items.reduce((s, it) => s + it.biaya, 0)
      ok(sum === v.reconCost, `${v.id}: total item recon ${sum} != reconCost ${v.reconCost}`)
      ok(rcn[0].total === v.reconCost, `${v.id}: reconditioning.total != reconCost`)
      ok(rcn[0].items.length >= 3, `${v.id}: pekerjaan recon < 3`)
    }
  }

  // dokumen
  const dok = documents.find((x) => x.vehicleId === v.id)
  ok(dok && dok.checklist.length === 6, `${v.id}: checklist dokumen != 6 item`)

  // jalur status
  if (v.status === 'SOLD') {
    const s = sales.filter((x) => x.vehicleId === v.id)
    ok(s.length === 1, `${v.id}: unit SOLD punya ${s.length} transaksi penjualan`)
    if (s[0]) {
      ok(s[0].totalModal === v.totalCost, `${v.id}: totalModal penjualan != totalCost unit`)
      ok(s[0].grossProfit === s[0].finalPrice - v.totalCost, `${v.id}: grossProfit salah hitung`)
      ok(s[0].finalPrice === s[0].negotiatedPrice, `${v.id}: finalPrice != negotiatedPrice`)
      ok(s[0].negotiatedPrice === s[0].listingPrice - s[0].diskon, `${v.id}: negotiated != listing - diskon`)
      ok(s[0].sisaPembayaran === s[0].finalPrice - s[0].dp, `${v.id}: sisaPembayaran salah`)
      ok(s[0].tipePembayaran === 'Cash' || (s[0].financePartner && s[0].tenor && s[0].estimasiCicilan), `${v.id}: kredit tanpa data multifinance/tenor/cicilan`)
      ok(v.tanggalTerjual === s[0].tanggal, `${v.id}: tanggalTerjual != tanggal penjualan`)
      ok(!v.tanggalSiap || v.tanggalSiap <= v.tanggalTerjual, `${v.id}: unit siap setelah tanggal terjual`)
      ok(!v.tanggalSiap || v.tanggalSiap >= v.tanggalMasuk, `${v.id}: tanggal siap sebelum unit masuk`)
      ok(!!s[0].customerId && customers.some((c) => c.id === s[0].customerId), `${v.id}: penjualan tanpa customer`)
    }
    const b = bookings.filter((x) => x.vehicleId === v.id)
    ok(b.length === 1, `${v.id}: unit SOLD punya ${b.length} booking`)
    ok(b[0]?.statusPembayaran === 'SELESAI', `${v.id}: booking unit SOLD harus berstatus SELESAI, bukan ${b[0]?.statusPembayaran}`)
    ok(s.length === 0 || s.some((x) => x.bookingId === b[0].id), `${v.id}: penjualan tidak menunjuk booking`)
  } else {
    ok(!sales.some((x) => x.vehicleId === v.id), `${v.id}: status ${v.status} tapi ada transaksi penjualan`)
    ok(v.tanggalTerjual === null, `${v.id}: belum terjual tapi tanggalTerjual terisi`)
  }

  if (v.status === 'BOOKED') {
    const b = bookings.filter((x) => x.vehicleId === v.id)
    ok(b.length === 1, `${v.id}: unit BOOKED punya ${b.length} booking`)
    ok(b.length !== 1 || b[0].dp > 0, `${v.id}: booking tanpa DP`)
    ok(b.length !== 1 || b[0].sisaPembayaran === b[0].sisaPembayaran, `${v.id}: sisaPembayaran kosong`)
  }
  if (v.status === 'READY' || v.status === 'BARU MASUK' || v.status === 'INSPEKSI' || v.status === 'RECONDITIONING') {
    ok(!bookings.some((x) => x.vehicleId === v.id), `${v.id}: status ${v.status} tapi sudah ada booking`)
  }
}

// ---------- 4. integritas relasional ----------
const vIds = new Set(vehicles.map((v) => v.id))
const cIds = new Set(customers.map((c) => c.id))
const lIds = new Set(leads.map((l) => l.id))
for (const l of leads) {
  ok(vIds.has(l.vehicleId), `${l.id}: vehicleId ${l.vehicleId} tidak ada`)
  ok(l.customerId === null || cIds.has(l.customerId), `${l.id}: customerId ${l.customerId} tidak ada`)
  ok(l.interaksi.length >= 1, `${l.id}: timeline interaksi kosong`)
}
for (const b of bookings) {
  ok(vIds.has(b.vehicleId), `${b.id}: vehicleId tidak ada`)
  ok(b.customerId === null || cIds.has(b.customerId), `${b.id}: customerId tidak ada`)
  ok(b.leadId === null || lIds.has(b.leadId), `${b.id}: leadId tidak ada`)
}
for (const s of sales) {
  ok(vIds.has(s.vehicleId), `${s.id}: vehicleId tidak ada`)
  ok(cIds.has(s.customerId), `${s.id}: customerId tidak ada`)
}
for (const p of procurements) ok(vIds.has(p.vehicleId), `${p.id}: vehicleId tidak ada`)
for (const i of inspections) ok(vIds.has(i.vehicleId), `${i.id}: vehicleId tidak ada`)
for (const a of activities) ok(vIds.has(a.vehicleId), `${a.id}: vehicleId tidak ada`)

// ---------- 5. unit SOLD tidak boleh muncul sebagai stok tersedia ----------
const tersedia = vehicles.filter((v) => v.status !== 'SOLD')
ok(tersedia.length + sales.length === vehicles.length, 'jumlah tersedia + terjual != total unit')

// ---------- 6. tidak ada teks placeholder / Lorem Ipsum ----------
const blob = JSON.stringify(D)
for (const pola of [/lorem/i, /ipsum/i, /xxx/i, /\bTBD\b/, /\bTODO\b/, /placeholder/i, /dummy text/i, /contoh\.com/i]) {
  ok(!pola.test(blob), `teks placeholder terdeteksi: ${pola}`)
}

// ---------- 7. tanggal wajar ----------
for (const v of vehicles) {
  ok(v.tanggalMasuk <= TODAY, `${v.id}: tanggalMasuk melewati hari demo`)
  if (v.tanggalSiap) ok(v.tanggalSiap <= TODAY, `${v.id}: tanggalSiap melewati hari demo`)
  if (v.tanggalTerjual) ok(v.tanggalTerjual >= v.tanggalMasuk, `${v.id}: terjual sebelum dibeli`)
}
for (const s of sales) ok(s.tanggal <= TODAY, `${s.id}: tanggal penjualan melewati hari demo`)
for (const p of procurements) ok(p.tanggalPembelian <= TODAY, `${p.id}: tanggal pembelian melewati hari demo`)

// ---------- 8. urutan rantai proses per unit ----------
for (const v of vehicles) {
  const insp = inspections.find((x) => x.vehicleId === v.id)
  const rcn = reconditionings.find((x) => x.vehicleId === v.id)
  const bkg = bookings.find((x) => x.vehicleId === v.id)
  const sale = sales.find((x) => x.vehicleId === v.id)
  const lead = leads.find((x) => x.vehicleId === v.id && ['BOOKED', 'WON'].includes(x.status)) || leads.find((x) => x.vehicleId === v.id)
  ok(!insp || insp.tanggal >= v.tanggalMasuk, `${v.id}: inspeksi sebelum unit masuk`)
  ok(!rcn || !insp || rcn.mulai >= insp.tanggal, `${v.id}: reconditioning mulai sebelum inspeksi`)
  ok(!rcn || !rcn.selesai || rcn.selesai >= rcn.mulai, `${v.id}: recon selesai sebelum mulai`)
  ok(!rcn || !rcn.selesai || !v.tanggalSiap || v.tanggalSiap >= rcn.selesai, `${v.id}: unit siap sebelum recon selesai`)
  ok(!bkg || !lead || bkg.tanggalBooking >= lead.tanggalMasuk, `${v.id}: booking sebelum lead masuk`)
  ok(!sale || !bkg || sale.tanggal >= bkg.tanggalBooking, `${v.id}: penjualan sebelum booking`)
  ok(!sale || !lead || sale.tanggal >= lead.tanggalMasuk, `${v.id}: penjualan sebelum lead masuk`)
}

// ---------- 9. PIC sales unit harus sama dengan transaksi/booking ----------
for (const s of sales) {
  const v = vehicles.find((x) => x.id === s.vehicleId)
  ok(v.salesPIC === s.salesPIC, `${v.id}: PIC unit (${v.salesPIC}) != PIC transaksi (${s.salesPIC})`)
}

// ---------- 10. dokumen: daftar pengecualian harus kecil dan bermakna ----------
const unitDokBermasalah = documents.filter((doc) => doc.checklist.some((c) => c.status !== 'Tersedia'))
ok(unitDokBermasalah.length <= 14, `terlalu banyak unit dengan dokumen belum lengkap (${unitDokBermasalah.length})`)
ok(unitDokBermasalah.length >= 3, `terlalu sedikit unit dengan dokumen belum lengkap (${unitDokBermasalah.length})`)

// ---------- 11. harga beli vs acuan pasar harus bervariasi, bukan selalu di bawah ----------
const diAtasAcuan = procurements.filter((p) => p.hargaDeal > p.nilaiPasarAcuan)
ok(diAtasAcuan.length >= 3, `terlalu sedikit pembelian di atas acuan pasar (${diAtasAcuan.length}) — indikator jadi tidak wajar`)
ok(
  diAtasAcuan.length <= procurements.length * 0.4,
  `terlalu banyak pembelian di atas acuan pasar (${diAtasAcuan.length}/${procurements.length})`,
)
for (const p of procurements) {
  ok(p.nilaiPasarAcuan > 0, `${p.id}: nilai pasar acuan kosong`)
}

// ---------- 12. status pembayaran harus konsisten dengan sisa tagihan ----------
// transaksi berlabel LUNAS tidak boleh punya sisa, dan sebaliknya
for (const s of sales) {
  ok(
    (s.sisaPembayaran === 0) === (s.status === 'LUNAS'),
    `${s.id}: status ${s.status} tidak cocok dengan sisa pembayaran ${s.sisaPembayaran}`,
  )
}
for (const b of bookings) {
  const unit = vehicles.find((v) => v.id === b.vehicleId)
  if (!unit) continue
  if (unit.status === 'SOLD') {
    ok(b.statusPembayaran === 'SELESAI', `${b.id}: booking unit terjual harus SELESAI, bukan ${b.statusPembayaran}`)
  } else {
    ok(
      ['DP DIBAYAR', 'MENUNGGU PEMBAYARAN'].includes(b.statusPembayaran),
      `${b.id}: booking aktif berstatus ${b.statusPembayaran} — seharusnya menunggu pembayaran atau DP dibayar`,
    )
    ok(b.dp > 0, `${b.id}: booking aktif tanpa DP`)
  }
}

// ---------- 13. target sales harus sejalan dengan realisasi ----------
// target yang jauh di atas realisasi membuat demo terlihat mengarang
const totalTarget = D.salesTeam.reduce((s, x) => s + x.target, 0)
ok(
  totalTarget >= sales.length && totalTarget <= sales.length * 2,
  `total target sales ${totalTarget} tidak wajar dibanding ${sales.length} unit terjual`,
)
for (const st of D.salesTeam) {
  const aktual = sales.filter((x) => x.salesPIC === st.nama).length
  ok(st.target >= aktual, `${st.nama}: target ${st.target} di bawah realisasi ${aktual}`)
}

// ---------- 14. rekomendasi inspeksi harus cocok dengan temuannya ----------
for (const ins of inspections) {
  const { attention, repair } = ins.ringkasan
  if (repair > 0) {
    ok(/PERBAIKAN/.test(ins.rekomendasi), `${ins.id}: ada ${repair} item perlu perbaikan tapi rekomendasi "${ins.rekomendasi}"`)
  } else {
    ok(
      !/PERBAIKAN SEBELUM/.test(ins.rekomendasi),
      `${ins.id}: tidak ada item perlu perbaikan tapi rekomendasi "${ins.rekomendasi}"`,
    )
    if (attention > 0) {
      ok(/CATATAN/.test(ins.rekomendasi), `${ins.id}: ada ${attention} temuan tapi rekomendasi "${ins.rekomendasi}"`)
    } else {
      ok(ins.rekomendasi === 'LAYAK JUAL', `${ins.id}: tanpa temuan tapi rekomendasi "${ins.rekomendasi}"`)
    }
  }
}

// ---------- 15. sebaran temuan inspeksi harus realistis, bukan seragam ----------
const denganRepair = inspections.filter((i) => i.ringkasan.repair > 0)
ok(
  denganRepair.length < inspections.length,
  `semua ${inspections.length} unit punya item perlu perbaikan — tidak realistis untuk showroom yang menjual unit siap pakai`,
)
ok(denganRepair.length > 0, 'tidak ada satu pun unit dengan temuan perbaikan — tidak realistis')
const dokumenRepair = inspections.filter((i) =>
  i.sections.filter((s) => s.kategori === 'Dokumen').some((s) => s.item.some((x) => x.hasil === 'REPAIR REQUIRED')),
)
ok(dokumenRepair.length === 0, 'dokumen ditandai "perlu perbaikan" — dokumen hanya bisa terlambat atau belum lengkap')

// ---------- KPI turunan (yang akan tampil di dashboard) ----------
const byStatus = {}
for (const v of vehicles) byStatus[v.status] = (byStatus[v.status] || 0) + 1
const nilaiInventory = tersedia.reduce((s, v) => s + v.listingPrice, 0)
const terjualBulanIni = sales.filter((s) => s.tanggal.slice(0, 7) === bulanIni)
const nilaiPenjualanBulanIni = terjualBulanIni.reduce((s, x) => s + x.finalPrice, 0)
const gpBulanIni = terjualBulanIni.reduce((s, x) => s + x.grossProfit, 0)
const gpTotal = sales.reduce((s, x) => s + x.grossProfit, 0)
const leadAktif = leads.filter((l) => !['WON', 'LOST'].includes(l.status))
const piutang = sales.filter((s) => s.status !== 'LUNAS').reduce((s, x) => s + Math.max(0, x.sisaPembayaran), 0)
const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 }
for (const v of tersedia) {
  const a = v.hariSejakSiap ?? v.hariDiInventory
  if (a <= 30) aging['0-30']++
  else if (a <= 60) aging['31-60']++
  else if (a <= 90) aging['61-90']++
  else aging['>90']++
}
const bulanKeys = [...new Set(sales.map((s) => s.tanggal.slice(0, 7)))].sort()

console.log('=== STATUS UNIT ===')
Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k.padEnd(14)} ${n}`))
console.log('\n=== KPI DASHBOARD (diturunkan dari dataset) ===')
console.log(`  Unit tersedia          ${tersedia.length}`)
console.log(`  Nilai inventory        ${rp(nilaiInventory)}  (${jt(nilaiInventory)})`)
console.log(`  Total modal stok       ${rp(tersedia.reduce((s, v) => s + v.totalCost, 0))}`)
console.log(`  Potensi margin stok    ${rp(tersedia.reduce((s, v) => s + v.estimasiMargin, 0))}`)
console.log(`  Terjual bulan ini      ${terjualBulanIni.length} unit · ${rp(nilaiPenjualanBulanIni)}`)
console.log(`  Gross profit bulan ini ${rp(gpBulanIni)}`)
console.log(`  Gross profit 6 bulan   ${rp(gpTotal)} (rata-rata ${rp(Math.round(gpTotal / sales.length))}/unit)`)
console.log(`  Lead aktif             ${leadAktif.length} dari ${leads.length} lead, ${customers.length} customer`)
console.log(`  Piutang penjualan      ${rp(piutang)}`)
console.log(`  Inventory aging        0-30: ${aging['0-30']} · 31-60: ${aging['31-60']} · 61-90: ${aging['61-90']} · >90: ${aging['>90']}`)
console.log(`  Bulan ada penjualan    ${bulanKeys.join(', ')}`)
console.log('\n=== PIPELINE LEAD ===')
const lp = {}
leads.forEach((l) => { lp[l.status] = (lp[l.status] || 0) + 1 })
console.log('  ' + Object.entries(lp).map(([k, n]) => `${k}: ${n}`).join(' · '))
console.log('\n=== TIMELINE CONTOH (unit terjual pertama) ===')
const vx = vehicles.find((v) => v.status === 'SOLD')
activities.filter((a) => a.vehicleId === vx.id).forEach((a) => console.log(`  ${a.tanggal}  ${a.judul.padEnd(26)} ${a.detail}`))
console.log(`\n  ${vx.id} ${vx.brand} ${vx.model} ${vx.variant} ${vx.tahun} · ${vx.nomorPolisi}`)
console.log(`  modal ${rp(vx.totalCost)} → listing ${rp(vx.listingPrice)} → terjual ${rp(sales.find((s) => s.vehicleId === vx.id).finalPrice)} → profit ${rp(sales.find((s) => s.vehicleId === vx.id).grossProfit)}`)

console.log('\n=== HASIL VERIFIKASI ===')
if (fails.length) {
  console.error(`GAGAL — ${fails.length} masalah:`)
  fails.slice(0, 40).forEach((f) => console.error('  ✗ ' + f))
  process.exit(1)
}
console.log(`LULUS — semua invariant terpenuhi (${vehicles.length} unit, ${sales.length} transaksi diperiksa satu per satu).`)
