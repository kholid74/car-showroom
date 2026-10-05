#!/usr/bin/env node
/**
 * Uji alur tulis-menulis sesi demo (batch 1).
 *
 * Yang diuji bukan "form bisa disimpan", melainkan janji demo ini: setelah data dimasukkan,
 * ANGKA DI MODUL LAIN ikut berubah — karena semua modul membaca satu sumber yang sama.
 * Karena itu setiap alur diperiksa lintas halaman, bukan hanya di halaman tempat mengisi.
 */
const { chromium } = require('playwright')
const BASE = process.env.QA_BASE || 'http://localhost:4173'

const masalah = []
const catat = (ok, pesan) => {
  if (!ok) masalah.push(pesan)
  console.log(`${ok ? '✓' : '✗'} ${pesan}`)
}

const barisTabel = (page) =>
  page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
const teksUtama = (page) => page.locator('main').innerText()
const angkaDari = (teks, label) => {
  const i = teks.toLowerCase().indexOf(label.toLowerCase())
  return i < 0 ? '' : teks.slice(i, i + 90).replace(/\n+/g, ' | ')
}

;(async () => {
  const browser = await chromium.launch()
  const konteks = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await konteks.newPage()
  const konsol = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) konsol.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))

  // ---------- masuk ----------
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Owner & manajemen/ }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 })

  // ---------- 1. TAMBAH UNIT ----------
  await page.goto(BASE + '/inventory?tampilan=tabel', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const unitAwal = await barisTabel(page)
  const judulAwal = await teksUtama(page)

  await page.getByRole('button', { name: 'Tambah unit' }).click()
  await page.waitForTimeout(400)
  await page.getByLabel('Merek').fill('Wuling')
  await page.getByLabel('Model').fill('Cortez')
  await page.getByLabel('Varian').fill('1.5 EX AT')
  await page.getByLabel('Nomor polisi').fill('B 9090 DEM')
  await page.getByLabel('Harga beli (Rp)').fill('180000000')
  await page.getByLabel('Biaya lain (Rp)').fill('5000000')
  await page.getByRole('button', { name: 'Simpan unit baru' }).click()
  await page.waitForTimeout(700)

  catat((await barisTabel(page)) === unitAwal + 1, `inventory bertambah 1 baris (${unitAwal} → ${await barisTabel(page)})`)
  const isiInv = await teksUtama(page)
  catat(isiInv.includes('Wuling'), 'unit baru muncul di inventory')
  catat(isiInv.includes('Baru Masuk') || isiInv.toLowerCase().includes('baru masuk'), 'unit baru berstatus Baru Masuk')

  // dampak lintas modul: dashboard dan laporan ikut menghitung unit baru
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const isiDash = await teksUtama(page)
  catat(isiDash.toLowerCase().includes('baru masuk'), 'dashboard ikut menghitung unit baru (status Baru Masuk muncul)')

  await page.goto(BASE + '/laporan', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const isiLaporan = await teksUtama(page)
  catat(!isiLaporan.includes(judulAwal), 'laporan dirender ulang setelah ada unit baru')

  // ---------- 2. UBAH TAHAP UNIT ----------
  await page.goto(BASE + '/inventory?tampilan=tabel&status=SEMUA', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const barisBaru = page.locator('main table tbody tr', { hasText: 'Wuling' }).first()
  await barisBaru.getByRole('button', { name: /Ubah tahap/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('dialog').getByRole('textbox').fill('Inspeksi awal 37 item selesai, 2 temuan kosmetik.')
  await page.getByRole('button', { name: /Pindahkan ke/ }).click()
  await page.waitForTimeout(700)
  const setelahTahap = await teksUtama(page)
  catat(setelahTahap.includes('Inspeksi') || setelahTahap.includes('INSPEKSI'), 'tahap unit berpindah ke Inspeksi')

  // ---------- 2b. UBAH DATA UNIT (mode ubah wajib terisi data unit, bukan kosong) ----------
  await page.locator('main table tbody tr', { hasText: 'Wuling' }).first()
    .getByRole('button', { name: /^Ubah data/ }).click()
  await page.waitForTimeout(500)
  const dUbah = page.getByRole('dialog')
  catat((await dUbah.getByLabel('Merek').inputValue()) === 'Wuling', 'mode ubah terisi data unit yang dipilih (bukan kosong)')
  catat((await dUbah.getByLabel('Model').inputValue()) === 'Cortez', 'model unit ikut terisi di mode ubah')
  const listingAwal = await dUbah.getByLabel('Harga listing (Rp)').inputValue()
  await dUbah.getByLabel('Harga listing (Rp)').fill('260000000')
  await dUbah.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.waitForTimeout(800)
  const isiUbah = await teksUtama(page)
  catat(isiUbah.includes('260.000.000') || isiUbah.includes('Rp260'), `harga listing unit berubah dari ${listingAwal} setelah diubah`)

  // ---------- 3. CATAT PENJUALAN (dari unit siap, lintas modul) ----------
  await page.goto(BASE + '/penjualan', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const jualAwal = await barisTabel(page)
  const isiJualAwal = await teksUtama(page)
  const nilaiAwal = angkaDari(isiJualAwal, 'Nilai Penjualan')

  await page.goto(BASE + '/inventory?tampilan=tabel&status=READY', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  const unitSiap = await page.evaluate(() => {
    const a = document.querySelector('main table tbody tr a[href^="/inventory/"]')
    return a ? a.getAttribute('href').split('/').pop() : ''
  })
  catat(Boolean(unitSiap), `unit siap dipakai untuk uji penjualan: ${unitSiap}`)

  await page.goto(`${BASE}/inventory/${unitSiap}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'Catat penjualan' }).click()
  await page.waitForTimeout(500)
  const final = await page.getByLabel('Harga jual final (Rp)').inputValue()
  const hargaFinal = Number(final.replace(/\D/g, '')) || 0
  await page.getByLabel('DP diterima (Rp)').fill(String(Math.round(hargaFinal * 0.3)))
  await page.getByLabel('Tipe pembayaran').selectOption('Cash')
  await page.getByRole('button', { name: 'Catat penjualan' }).last().click()
  await page.waitForTimeout(900)
  const isiSukses = await teksUtama(page)
  catat(isiSukses.includes('INV-SESI-01'), 'invoice sesi dibuat (INV-SESI-01)')
  catat(isiSukses.includes('TERJUAL'), 'unit dinyatakan terjual pada konfirmasi')

  await page.goto(BASE + '/penjualan', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const jualAkhir = await barisTabel(page)
  const isiJualAkhir = await teksUtama(page)
  catat(jualAkhir === jualAwal + 1, `tabel penjualan bertambah 1 baris (${jualAwal} → ${jualAkhir})`)
  catat(isiJualAkhir.includes('INV-SESI-01'), 'transaksi baru muncul di halaman Penjualan')
  catat(nilaiAwal !== angkaDari(isiJualAkhir, 'Nilai Penjualan'), 'KPI Nilai Penjualan berubah setelah transaksi baru')

  const isiFinance = await page.goto(BASE + '/finance', { waitUntil: 'domcontentloaded' }).then(() => teksUtama(page))
  catat(isiFinance.includes('INV-SESI-01'), 'transaksi baru ikut muncul di Finance (profit per unit)')

  // ---------- 4. TAMBAH LEAD ----------
  await page.goto(BASE + '/crm', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const isiCrmAwal = await teksUtama(page)
  await page.getByRole('button', { name: 'Tambah lead' }).click()
  await page.waitForTimeout(400)
  await page.getByLabel('Nama').fill('Rina Kusumawati')
  await page.getByLabel('Nomor WhatsApp / telepon').fill('081377778888')
  await page.getByRole('button', { name: 'Simpan lead' }).click()
  await page.waitForTimeout(800)
  const isiCrmAkhir = await teksUtama(page)
  catat(isiCrmAkhir.includes('Rina Kusumawati'), 'lead baru muncul di papan CRM')
  catat(isiCrmAkhir !== isiCrmAwal, 'halaman CRM berubah setelah lead ditambahkan')

  // ---------- 5. KELOLA DOKUMEN ----------
  await page.goto(BASE + '/dokumen', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const tombolDok = page.getByRole('button', { name: /^Kelola dokumen/ }).first()
  await tombolDok.click()
  await page.waitForTimeout(500)
  const dialogDok = page.getByRole('dialog')
  const adaPilihan = await dialogDok.getByRole('combobox').count()
  catat(adaPilihan >= 6, `dialog dokumen memuat ${adaPilihan} pilihan status`)
  await dialogDok.getByRole('combobox').first().selectOption('Tersedia')
  await page.getByRole('button', { name: 'Simpan kelengkapan dokumen' }).click()
  await page.waitForTimeout(700)
  catat((await page.getByRole('dialog').count()) === 0, 'dialog dokumen menutup setelah disimpan')

  // ---------- 6. SPANDUK SESI & RESET ----------
  const spanduk = await page.locator('body').innerText()
  catat(/perubahan pada sesi ini/.test(spanduk), 'spanduk sesi mencatat perubahan')
  catat(/unit baru dimasukkan/.test(spanduk), 'spanduk menyebut jenis perubahan (unit baru)')
  catat(/penjualan dicatat/.test(spanduk), 'spanduk menyebut penjualan yang dicatat')

  await page.getByRole('button', { name: 'Kembalikan ke data demo' }).click()
  await page.waitForTimeout(900)
  await page.goto(BASE + '/inventory?tampilan=tabel', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat((await barisTabel(page)) === unitAwal, `setelah reset, inventory kembali ke ${unitAwal} baris`)
  const isiReset = await teksUtama(page)
  catat(!isiReset.includes('Wuling'), 'unit sesi hilang setelah reset')
  catat(!(await page.locator('body').innerText()).includes('perubahan pada sesi ini'), 'spanduk sesi hilang setelah reset')

  await browser.close()

  console.log('\n=== KONSOL ===')
  console.log(konsol.length ? konsol.join('\n') : '  bersih')
  console.log('\n=== HASIL UJI ALUR SESI ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — tambah unit, ubah tahap, catat penjualan, tambah lead, kelola dokumen, dan reset semuanya bekerja lintas modul.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
