#!/usr/bin/env node
/**
 * Uji alur tulis-menulis batch 2 (biaya, booking, reconditioning, inspeksi).
 *
 * Sama seperti uji batch 1: yang diperiksa bukan "form bisa disimpan", melainkan
 * apakah angka turunan di tempat lain ikut bergerak — dan apakah reset benar-benar
 * mengembalikan semuanya.
 */
const { chromium } = require('playwright')
const BASE = process.env.QA_BASE || 'http://localhost:4173'

const masalah = []
const catat = (ok, pesan) => {
  if (!ok) masalah.push(pesan)
  console.log(`${ok ? '✓' : '✗'} ${pesan}`)
}
const baris = (page) => page.evaluate(() => document.querySelectorAll('main table tbody tr').length)
const utama = (page) => page.locator('main').innerText()
const kaki = (page) => page.evaluate(() => document.querySelector('main table tfoot')?.innerText ?? '')
const rp = (t) => t.replace(/\s+/g, ' ').trim()

;(async () => {
  const browser = await chromium.launch()
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage()
  const konsol = []
  page.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 })

  // ================= 1. BIAYA: tambah, ubah, hapus =================
  await page.goto(BASE + '/biaya', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const biaya0 = await baris(page)
  const total0 = await rp(await kaki(page))

  await page.getByRole('button', { name: 'Catat biaya' }).first().click()
  await page.waitForTimeout(400)
  const d1 = page.getByRole('dialog')
  await d1.getByLabel('Keterangan').fill('Iklan Instagram Oktober')
  await d1.getByLabel('Jumlah (Rp)').fill('7500000')
  await d1.getByRole('button', { name: 'Catat biaya' }).click()
  await page.waitForTimeout(800)
  catat((await baris(page)) === biaya0 + 1, `biaya bertambah 1 baris (${biaya0} → ${await baris(page)})`)
  const total1 = await rp(await kaki(page))
  catat(total1 !== total0, 'total biaya berubah setelah pencatatan')
  catat((await utama(page)).includes('Iklan Instagram Oktober'), 'baris biaya baru tampil di tabel')

  const barisBaru = page.locator('main table tbody tr', { hasText: 'Iklan Instagram Oktober' }).first()
  await barisBaru.getByRole('button', { name: /^Ubah biaya/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('dialog').getByLabel('Jumlah (Rp)').fill('15000000')
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.waitForTimeout(800)
  const total2 = await rp(await kaki(page))
  catat(total2 !== total1, 'total biaya berubah lagi setelah nominal diubah')

  await page.locator('main table tbody tr', { hasText: 'Iklan Instagram Oktober' }).first()
    .getByRole('button', { name: /^Ubah biaya/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus biaya' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('dialog').getByRole('button', { name: 'Ya, hapus permanen' }).click()
  await page.waitForTimeout(800)
  catat((await baris(page)) === biaya0, `biaya terhapus, kembali ke ${biaya0} baris`)
  catat((await rp(await kaki(page))) === total0, 'total biaya kembali seperti semula setelah dihapus')

  // ================= 2. BOOKING: buat, ubah DP, batalkan =================
  await page.goto(BASE + '/booking', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const book0 = await baris(page)

  await page.getByRole('button', { name: 'Buat booking' }).first().click()
  await page.waitForTimeout(500)
  const db = page.getByRole('dialog')
  const unitDipilih = await db.getByLabel('Unit').inputValue()
  await db.getByLabel('Nama pemesan').fill('Bambang Setiadi')
  await db.getByLabel('DP diterima (Rp)').fill('10000000')
  await db.getByRole('button', { name: 'Buat booking' }).click()
  await page.waitForTimeout(900)
  catat((await baris(page)) === book0 + 1, `booking bertambah 1 baris (${book0} → ${await baris(page)})`)

  await page.goto(BASE + '/inventory?status=BOOKED', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat((await utama(page)).includes(unitDipilih), `unit ${unitDipilih} otomatis keluar dari stok siap jual (status Booked)`)

  await page.goto(BASE + '/booking', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const barisBooking = page.locator('main table tbody tr', { hasText: 'Bambang Setiadi' }).first()
  await barisBooking.getByRole('button', { name: /^Ubah DP booking/ }).click()
  await page.waitForTimeout(500)
  const sebelumDp = await rp(await page.getByRole('dialog').innerText()).match(/sisa Rp[\d.]+/)?.[0] ?? ''
  await page.getByRole('dialog').getByLabel('DP diterima (Rp)').fill('25000000')
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan perubahan DP' }).click()
  await page.waitForTimeout(900)
  const isiBooking = await utama(page)
  catat(isiBooking.includes('Bambang Setiadi'), 'booking masih tampil setelah DP diubah')
  catat(sebelumDp !== '', `sisa pembayaran terhitung saat booking (${sebelumDp})`)

  await page.locator('main table tbody tr', { hasText: 'Bambang Setiadi' }).first()
    .getByRole('button', { name: /^Ubah DP booking/ }).click()
  await page.waitForTimeout(500)
  await page.getByRole('dialog').getByRole('button', { name: 'Batalkan booking' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('dialog').getByRole('button', { name: 'Ya, batalkan booking' }).click()
  await page.waitForTimeout(900)
  catat((await baris(page)) === book0, `booking dibatalkan, kembali ke ${book0} baris`)
  await page.goto(BASE + '/inventory?status=READY', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  catat((await utama(page)).includes(unitDipilih), `unit ${unitDipilih} kembali ke stok Ready setelah booking batal`)

  // ================= 3. RECONDITIONING: tambah pekerjaan =================
  await page.goto(BASE + '/reconditioning', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const totalRecon0 = await rp(await kaki(page))
  const tombolPekerjaan = page.locator('main table tbody tr').first().getByRole('button', { name: /^Tambah pekerjaan/ })
  const idRecon = await page.locator('main table tbody tr').first()
    .getByRole('link', { name: /^Buka detail/ }).getAttribute('href')
  const idUnit = (idRecon ?? '').split('/').pop()?.split('?')[0] ?? ''

  await page.goto(`${BASE}/inventory/${idUnit}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const modalSebelum = await rp(await page.locator('aside').last().innerText())

  await page.goto(BASE + '/reconditioning', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  await tombolPekerjaan.click()
  await page.waitForTimeout(500)
  const dr = page.getByRole('dialog')
  await dr.getByLabel('Pekerjaan').fill('Ketok & cat ulang pintu kanan depan')
  await dr.getByLabel('Biaya (Rp)').fill('3500000')
  await dr.getByRole('button', { name: 'Tambah pekerjaan' }).click()
  await page.waitForTimeout(900)
  const totalRecon1 = await rp(await kaki(page))
  catat(totalRecon1 !== totalRecon0, 'total biaya reconditioning bertambah setelah pekerjaan ditambahkan')

  await page.goto(`${BASE}/inventory/${idUnit}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const modalSesudah = await rp(await page.locator('aside').last().innerText())
  catat(modalSesudah !== modalSebelum, `modal unit ${idUnit} ikut naik karena biaya pekerjaan`)

  // ================= 4. INSPEKSI: isi hasil =================
  await page.goto(BASE + '/inspeksi', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const barisPertama = page.locator('main table tbody tr').first()
  const idInspeksi =
    ((await barisPertama.getByRole('link', { name: /^Buka detail/ }).getAttribute('href')) ?? '')
      .split('/').pop().split('?')[0]
  const skor0 = await barisPertama.innerText()

  await page.locator('main table tbody tr').first().getByRole('button', { name: /^Isi hasil inspeksi/ }).click()
  await page.waitForTimeout(600)
  const di = page.getByRole('dialog')
  const jumlahPilihan = await di.getByRole('combobox').count()
  catat(jumlahPilihan >= 10, `form inspeksi memuat ${jumlahPilihan} kendali hasil/titik periksa`)
  await di.getByRole('combobox').nth(1).selectOption('REPAIR REQUIRED')
  await page.waitForTimeout(300)
  const pratinjau = rp(await di.innerText())
  catat(/LAYAK JUAL DENGAN PERBAIKAN/.test(pratinjau), 'pratinjau penilaian berubah begitu ada temuan perbaikan')
  catat(/perlu perbaikan/i.test(pratinjau), 'ringkasan temuan menampilkan jumlah item perlu perbaikan')
  await di.getByRole('button', { name: 'Simpan hasil inspeksi' }).click()
  await page.waitForTimeout(900)
  const skor1 = await page.locator('main table tbody tr', { hasText: idInspeksi }).first().innerText()
  catat(skor1 !== skor0, `baris inspeksi ${idInspeksi} berubah setelah hasil baru disimpan`)
  catat(/LAYAK JUAL DENGAN PERBAIKAN/.test(skor1), 'rekomendasi turun menjadi "layak jual dengan perbaikan"')

  // ================= 5. RESET =================
  const spanduk = await page.locator('body').innerText()
  catat(/pekerjaan reconditioning ditambahkan/.test(spanduk), 'spanduk sesi mencatat pekerjaan reconditioning')
  catat(/hasil inspeksi dicatat/.test(spanduk), 'spanduk sesi mencatat hasil inspeksi')

  await page.getByRole('button', { name: 'Kembalikan ke data demo' }).click()
  await page.waitForTimeout(900)
  await page.goto(BASE + '/reconditioning', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat((await rp(await kaki(page))) === totalRecon0, 'total reconditioning kembali ke angka demo setelah reset')
  await page.goto(BASE + '/inspeksi', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat(
    (await page.locator('main table tbody tr', { hasText: idInspeksi }).first().innerText()) === skor0,
    'baris inspeksi kembali ke data demo setelah reset',
  )

  await browser.close()
  console.log('\n=== KONSOL ===')
  console.log(konsol.length ? konsol.join('\n') : '  bersih')
  console.log('\n=== HASIL UJI BATCH 2 ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — biaya (tambah/ubah/hapus), booking (buat/ubah DP/batal), reconditioning, dan inspeksi bekerja dengan angka turunan yang ikut bergerak.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
