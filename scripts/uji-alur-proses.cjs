#!/usr/bin/env node
/**
 * Uji alur proses unit: gerbang tahap Inspeksi → Perbaikan → Siap Jual, dan pelunasan piutang.
 *
 * Penekanan: tahap unit bukan sekadar urutan. Masuk Perbaikan menuntut hasil inspeksi yang sudah
 * dicatat (dan record perbaikan dibuat otomatis), Siap Jual menuntut pekerjaan perbaikan selesai,
 * dan piutang yang sudah dibayar penuh harus bisa ditutup dari modul Keuangan.
 *
 * Jalankan: npm run preview lalu `node scripts/uji-alur-proses.cjs` (atau QA_BASE ke dev server).
 */
const { chromium } = require('playwright')
const data = require('../src/data/dataset.json')
const BASE = process.env.QA_BASE || 'http://localhost:4173'

const masalah = []
const catat = (ok, pesan) => {
  if (!ok) masalah.push(pesan)
  console.log(`${ok ? '✓' : '✗'} ${pesan}`)
}

;(async () => {
  const browser = await chromium.launch()
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage()
  const konsol = []
  page.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))
  page.setDefaultTimeout(15000)

  await page.goto(BASE + '/login')
  await page.getByRole('button', { name: /Owner & manajemen/ }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'))

  const unit = data.vehicles.find((v) => v.status === 'BARU MASUK')
  const tabel = `${BASE}/inventory?tampilan=tabel&q=${unit.id}`

  // ================= 1. BARU MASUK → INSPEKSI (tanpa syarat) =================
  await page.goto(tabel)
  await page.getByRole('button', { name: `Ubah tahap ${unit.id}` }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('Unit masuk, siap diperiksa tim inspeksi.')
  await dialog.getByRole('button', { name: /Pindahkan ke Inspeksi/ }).click()
  await page.waitForTimeout(600)
  catat((await page.locator('main').innerText()).includes('Inspeksi'), 'unit naik dari Baru Masuk ke Inspeksi')

  // ================= 2. Inspeksi → Perbaikan DITOLAK tanpa hasil inspeksi =================
  await page.getByRole('button', { name: `Ubah tahap ${unit.id}` }).click()
  const isiBlokir = await dialog.innerText()
  catat(isiBlokir.includes('Belum ada hasil inspeksi'), 'tahap Perbaikan diblokir selama belum ada hasil inspeksi')
  catat(
    await dialog.getByRole('button', { name: /Pindahkan ke Perbaikan/ }).isDisabled(),
    'tombol pindah tahap nonaktif selama syaratnya belum lengkap',
  )
  await page.screenshot({ path: '.qa/uji-proses-blokir-tahap.png' })
  await dialog.getByRole('button', { name: 'Batal' }).click()

  // ================= 3. Isi inspeksi dari antrean modul Inspeksi =================
  await page.goto(BASE + '/inspeksi')
  const antre = page.locator('section').filter({ has: page.getByRole('heading', { name: /menunggu inspeksi/ }) })
  catat((await antre.innerText()).includes(unit.id), 'unit muncul di antrean menunggu inspeksi')
  await antre.locator('li').filter({ hasText: unit.id }).getByRole('button', { name: 'Isi hasil inspeksi' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan hasil inspeksi' }).click()
  await page.waitForTimeout(700)
  catat((await page.locator('main').innerText()).includes(unit.id), 'hasil inspeksi tersimpan dan muncul di daftar')

  // ================= 4. Inspeksi → Perbaikan lolos, record perbaikan dibuat otomatis =================
  await page.goto(tabel)
  await page.getByRole('button', { name: `Ubah tahap ${unit.id}` }).click()
  catat(!(await dialog.innerText()).includes('Belum ada hasil inspeksi'), 'blokir inspeksi hilang setelah hasilnya dicatat')
  await dialog.getByRole('textbox').fill('Inspeksi selesai, lanjut ke perbaikan.')
  await dialog.getByRole('button', { name: /Pindahkan ke Perbaikan/ }).click()
  await page.waitForTimeout(700)

  await page.goto(BASE + '/reconditioning')
  await page.getByPlaceholder('Cari unit, vendor, atau PIC…').fill(unit.id)
  await page.waitForTimeout(500)
  catat(
    (await page.locator('main').innerText()).includes('RCN-SESI-'),
    'catatan perbaikan unit baru dibuat otomatis dan tampil di modul Perbaikan',
  )

  // ================= 5. Tambah pekerjaan dari tab Perbaikan unit =================
  await page.goto(`${BASE}/inventory/${unit.id}?tab=reconditioning`)
  catat((await page.locator('main').innerText()).includes('Belum ada pekerjaan yang dicatat'), 'tab Perbaikan menjelaskan langkah berikutnya')
  await page.getByRole('button', { name: 'Tambah pekerjaan' }).first().click()
  const dialogKerja = page.getByRole('dialog')
  await dialogKerja.getByRole('textbox').nth(0).fill('Servis rutin dan ganti oli')
  await dialogKerja.getByRole('textbox').nth(1).fill('1500000')
  await dialogKerja.getByRole('button', { name: 'Tambah pekerjaan' }).click()
  await page.waitForTimeout(700)
  const isiRecon = await page.locator('main').innerText()
  catat(isiRecon.includes('Servis rutin dan ganti oli'), 'pekerjaan perbaikan tercatat pada unit')
  catat(isiRecon.includes('1.500.000'), 'biaya pekerjaan ikut terhitung pada unit')
  await page.screenshot({ path: '.qa/uji-proses-tab-perbaikan.png' })

  // ================= 6. Siap Jual DITOLAK selama pekerjaan belum selesai =================
  await page.goto(tabel)
  await page.getByRole('button', { name: `Ubah tahap ${unit.id}` }).click()
  catat((await dialog.innerText()).includes('belum selesai'), 'tahap Siap Jual diblokir selama pekerjaan perbaikan belum selesai')
  catat(
    await dialog.getByRole('button', { name: /Pindahkan ke Siap Jual/ }).isDisabled(),
    'tombol Siap Jual nonaktif selama perbaikan belum ditutup',
  )
  await dialog.getByRole('button', { name: 'Batal' }).click()

  // ================= 7. Selesaikan pekerjaan → Siap Jual lolos =================
  await page.goto(`${BASE}/inventory/${unit.id}?tab=reconditioning`)
  await page.getByRole('button', { name: 'Selesaikan' }).first().click()
  await page.waitForTimeout(700)
  await page.goto(tabel)
  await page.getByRole('button', { name: `Ubah tahap ${unit.id}` }).click()
  await dialog.getByRole('textbox').fill('Perbaikan selesai, unit siap tayang.')
  await dialog.getByRole('button', { name: /Pindahkan ke Siap Jual/ }).click()
  await page.waitForTimeout(700)
  catat((await page.locator('main').innerText()).includes('Siap Jual'), 'unit berpindah ke Siap Jual setelah perbaikan selesai')

  // ================= 8. Pelunasan piutang dari modul Keuangan =================
  await page.goto(BASE + '/finance')
  const panelPiutang = () => page.locator('section').filter({ has: page.getByRole('heading', { name: 'Piutang penjualan' }) })
  const jumlahAwal = await panelPiutang().locator('li').count()
  catat(jumlahAwal > 0, `daftar piutang terisi (${jumlahAwal} transaksi)`)
  const sisaAwal = await panelPiutang().innerText()
  await panelPiutang().getByRole('button', { name: 'Tandai lunas' }).first().click()
  await page.waitForTimeout(700)
  const jumlahSetelah = await panelPiutang().locator('li').count()
  catat(jumlahSetelah === jumlahAwal - 1, `piutang berkurang satu baris (${jumlahAwal} → ${jumlahSetelah})`)
  catat(await page.getByText(/transaksi dilunasi/).count() > 0, 'spanduk sesi mencatat pelunasan')
  const lunas = await page.evaluate(() =>
    Object.values(JSON.parse(sessionStorage.getItem('car-showroom-sesi-demo')).state.ubahPenjualan),
  )
  catat(
    lunas.length === 1 && lunas[0].status === 'LUNAS' && lunas[0].sisaPembayaran === 0,
    'transaksi tersimpan lunas (sisa 0) di sesi',
  )

  await page.screenshot({ path: '.qa/uji-proses-finance.png' })
  console.log(`Sisa piutang sebelum pelunasan: ${sisaAwal.split('\n').slice(0, 2).join(' · ')}`)

  await browser.close()
  console.log('\n=== KONSOL ===')
  console.log(konsol.length ? konsol.join('\n') : '  bersih')
  console.log('\n=== HASIL UJI ALUR PROSES ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — gerbang tahap unit (inspeksi → perbaikan → siap jual), record perbaikan otomatis, dan pelunasan piutang bekerja.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
