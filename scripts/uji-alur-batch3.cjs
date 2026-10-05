#!/usr/bin/env node
/**
 * Uji alur tulis-menulis batch 3 (pembelian/unit, customer).
 *
 * Penekanan: pencatatan pembelian baru harus lengkap dalam satu tindakan (unit + pembelian +
 * checklist dokumen), dan mengubah harga deal harus menggeser modal unit — bukan hanya
 * mengubah satu baris di tabel pembelian.
 */
const { chromium } = require('playwright')
const BASE = process.env.QA_BASE || 'http://localhost:4173'

const masalah = []
const catat = (ok, pesan) => {
  if (!ok) masalah.push(pesan)
  console.log(`${ok ? '✓' : '✗'} ${pesan}`)
}
const baris = (page, tabel = 0) =>
  page.evaluate((i) => document.querySelectorAll('main table')[i]?.querySelectorAll('tbody tr').length ?? 0, tabel)
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
  await page.getByRole('button', { name: /Owner & manajemen/ }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 })

  // ================= 1. CATAT PEMBELIAN UNIT =================
  await page.goto(BASE + '/procurement', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const beli0 = await baris(page)
  const deal0 = await rp(await kaki(page))

  await page.getByRole('button', { name: 'Catat pembelian unit' }).click()
  await page.waitForTimeout(400)
  const d = page.getByRole('dialog')
  await d.getByLabel('Merek').fill('Hyundai')
  await d.getByLabel('Model').fill('Creta')
  await d.getByLabel('Varian').fill('1.5 Prime')
  await d.getByLabel('Nomor polisi').fill('B 1234 SES')
  await d.getByLabel('Harga beli (Rp)').fill('300000000')
  await d.getByLabel('Biaya lain (Rp)').fill('10000000')
  await d.getByRole('button', { name: 'Simpan unit baru' }).click()
  await page.waitForTimeout(900)
  catat((await baris(page)) === beli0 + 1, `pembelian bertambah 1 baris (${beli0} → ${await baris(page)})`)
  catat((await rp(await kaki(page))) !== deal0, 'total harga deal di kaki tabel berubah')

  const barisBeli = page.locator('main table tbody tr', { hasText: 'VH-SESI-01' }).first()
  catat((await barisBeli.count()) === 1, 'pembelian menyebut unit yang barusan dibuat (satu tindakan, tiga catatan)')

  // unit + dokumen ikut tercipta, bukan hanya baris pembelian
  await page.goto(BASE + '/dokumen', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat((await utama(page)).includes('VH-SESI-01'), 'checklist dokumen untuk unit baru otomatis ikut dibuat')

  // ================= 2. UBAH HARGA DEAL → MODAL UNIT IKUT BERGESER =================
  await page.goto(BASE + '/procurement', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const barisBeli2 = page.locator('main table tbody tr', { hasText: 'VH-SESI-01' }).first()
  const teksBeliSebelum = await barisBeli2.innerText()
  await barisBeli2.getByRole('button', { name: /^Ubah pembelian/ }).click()
  await page.waitForTimeout(500)
  const dp = page.getByRole('dialog')
  const dealLama = await dp.getByLabel('Harga deal (Rp)').inputValue()
  await dp.getByLabel('Harga deal (Rp)').fill('285000000')
  await dp.getByLabel('Catatan pembelian').fill('Harga deal disesuaikan setelah pemeriksaan fisik.')
  await dp.getByRole('button', { name: 'Simpan pembelian' }).click()
  await page.waitForTimeout(900)
  const teksBeliSesudah = await page.locator('main table tbody tr', { hasText: 'VH-SESI-01' }).first().innerText()
  catat(teksBeliSesudah !== teksBeliSebelum, `harga deal berubah dari ${dealLama} di tabel pembelian`)

  await page.goto(BASE + '/inventory/VH-SESI-01', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  const modal = rp(await page.locator('aside').last().innerText())
  catat(/285\.000\.000/.test(modal), 'modal unit memakai harga deal yang baru (harga beli tersambung ke pembelian)')
  catat(/10\.000\.000/.test(modal), 'biaya lain tetap terhitung di modal unit')
  catat(/295\.000\.000/.test(modal), 'total modal = harga deal baru + biaya lain')

  // ================= 3. TAMBAH & UBAH CUSTOMER =================
  await page.goto(BASE + '/customer', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  const cust0 = await baris(page, 0)

  await page.getByRole('button', { name: 'Tambah customer' }).click()
  await page.waitForTimeout(400)
  const dc = page.getByRole('dialog')
  await dc.getByLabel('Nama lengkap').fill('Siti Nurhaliza')
  await dc.getByLabel('Nomor telepon').fill('081234567890')
  await dc.getByLabel('Email').fill('siti@email.com')
  await dc.getByLabel('Anggaran pembelian (Rp)').fill('320000000')
  await dc.getByRole('button', { name: 'Tambah customer' }).click()
  await page.waitForTimeout(900)
  catat((await baris(page, 0)) === cust0 + 1, `customer bertambah 1 baris (${cust0} → ${await baris(page, 0)})`)
  const barisCust = page.locator('main table tbody tr', { hasText: 'Siti Nurhaliza' }).first()
  catat((await barisCust.count()) === 1, 'customer baru muncul di daftar')

  await barisCust.getByRole('button', { name: /^Ubah customer/ }).click()
  await page.waitForTimeout(500)
  const du = page.getByRole('dialog')
  catat((await du.getByLabel('Nama lengkap').inputValue()) === 'Siti Nurhaliza', 'mode ubah customer terisi data yang dipilih')
  await du.getByLabel('Nomor telepon').fill('081200001111')
  await du.getByLabel('Anggaran pembelian (Rp)').fill('355000000')
  await du.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.waitForTimeout(900)
  const barisCust2 = await page.locator('main table tbody tr', { hasText: 'Siti Nurhaliza' }).first().innerText()
  catat(barisCust2.includes('081200001111'), 'perubahan nomor telepon tampil di daftar customer')

  // pencarian ikut menemukan data yang baru diubah
  await page.goto(BASE + '/customer?q=Siti', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  catat((await utama(page)).includes('Siti Nurhaliza'), 'pencarian menemukan customer yang baru ditambahkan')

  // ================= 4. SPANDUK & RESET =================
  const spanduk = await page.locator('body').innerText()
  catat(/data pembelian diperbarui|pembelian/.test(spanduk), 'spanduk sesi mencatat perubahan pembelian')
  catat(/customer ditambahkan/.test(spanduk), 'spanduk sesi mencatat customer baru')

  await page.getByRole('button', { name: 'Kembalikan ke data demo' }).click()
  await page.waitForTimeout(900)
  await page.goto(BASE + '/procurement', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  catat((await baris(page)) === beli0, `pembelian kembali ke ${beli0} baris setelah reset`)
  catat((await rp(await kaki(page))) === deal0, 'total harga deal kembali ke angka demo setelah reset')
  await page.goto(BASE + '/customer', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  catat((await baris(page, 0)) === cust0, `customer kembali ke ${cust0} baris setelah reset`)
  catat(!(await utama(page)).includes('Siti Nurhaliza'), 'customer sesi hilang setelah reset')

  await browser.close()
  console.log('\n=== KONSOL ===')
  console.log(konsol.length ? konsol.join('\n') : '  bersih')
  console.log('\n=== HASIL UJI BATCH 3 ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — pembelian (catat + ubah harga deal yang menggeser modal unit) dan customer (tambah/ubah) bekerja, dan reset mengembalikan semuanya.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
