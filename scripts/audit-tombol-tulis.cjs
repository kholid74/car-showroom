#!/usr/bin/env node
/**
 * Audit tombol tulis: memastikan setiap modul operasional benar-benar punya tombol
 * tambah/ubah yang di dunia nyata dipakai, dan halaman baca-saja menyatakan alasannya.
 *
 * Audit ini sengaja terpisah dari audit lintas peran: yang diperiksa di sini bukan hak akses,
 * melainkan keberadaan permukaan tulis. Tanpa pemeriksaan ini, sebuah refactor bisa menghapus
 * tombol dan seluruh uji lain tetap hijau — persis pertanyaan "kenapa tidak ada tombol?"
 * yang ingin dicegah demo ini.
 */
const { chromium } = require('playwright')
const BASE = process.env.QA_BASE || 'http://localhost:4173'

/** Halaman dengan satu aksi primer di toolbar. */
const AKSI_UTAMA = [
  { jalur: '/inventory', tombol: 'Tambah unit' },
  { jalur: '/procurement', tombol: 'Catat pembelian unit' },
  { jalur: '/crm', tombol: 'Tambah lead' },
  { jalur: '/customer', tombol: 'Tambah customer' },
  { jalur: '/booking', tombol: 'Buat booking' },
  { jalur: '/biaya', tombol: 'Catat biaya' },
]

/** Halaman yang menulis lewat tombol per baris, bukan satu aksi primer. */
const AKSI_BARIS = [
  { jalur: '/dokumen', pola: /^Kelola dokumen/, keterangan: 'kelola kelengkapan dokumen per unit' },
  { jalur: '/inspeksi', pola: /^Isi hasil inspeksi/, keterangan: 'isi hasil inspeksi per titik periksa' },
  { jalur: '/reconditioning', pola: /^Tambah pekerjaan/, keterangan: 'tambah pekerjaan reconditioning' },
]

/** Halaman yang boleh baca-saja, asalkan alasannya tertulis di layar. */
const BACA_SAJA = [
  { jalur: '/laporan', nama: 'Laporan' },
  { jalur: '/performa', nama: 'Performa Sales' },
]

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

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 })

  for (const { jalur, tombol } of AKSI_UTAMA) {
    await page.goto(BASE + jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(650)
    const kendali = page.getByRole('button', { name: tombol })
    const jumlah = await kendali.count()
    catat(jumlah === 1, `${jalur} · tombol "${tombol}" ada tepat satu (ditemukan ${jumlah})`)

    if (jumlah >= 1) {
      // kontrak dialog: terbuka, punya tombol simpan, dan bisa ditutup dengan Esc
      await kendali.first().click()
      await page.waitForTimeout(400)
      const dialog = page.getByRole('dialog')
      const terbuka = (await dialog.count()) === 1
      catat(terbuka, `${jalur} · tombol membuka dialog`)
      if (terbuka) {
        const simpan = await dialog.getByRole('button').filter({ hasText: /Simpan|Catat|Buat|Tambah/ }).count()
        catat(simpan >= 1, `${jalur} · dialog punya tombol simpan`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(350)
        catat((await page.getByRole('dialog').count()) === 0, `${jalur} · Esc menutup dialog`)
      }
      if (await page.getByRole('dialog').count()) {
        await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).first().click().catch(() => {})
        await page.waitForTimeout(300)
      }
    }
  }

  for (const { jalur, pola, keterangan } of AKSI_BARIS) {
    await page.goto(BASE + jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(650)
    const jumlah = await page.locator('main table').first().getByRole('button', { name: pola }).count()
    catat(jumlah >= 1, `${jalur} · ada tombol ${keterangan} pada ${jumlah} baris`)
  }

  for (const { jalur, nama } of BACA_SAJA) {
    await page.goto(BASE + jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(650)
    const teks = await page.locator('main').innerText()
    catat(/sengaja tanpa tombol/.test(teks), `${nama} · menyatakan alasannya baca-saja di layar, bukan halaman belum jadi`)
    const tombolTulis = await page.getByRole('button').filter({ hasText: /^(Tambah|Catat|Buat) / }).count()
    catat(tombolTulis === 0, `${nama} · tidak ada tombol tulis yang menyesatkan`)
  }

  await browser.close()
  console.log('\n=== KONSOL ===')
  console.log(konsol.length ? konsol.join('\n') : '  bersih')
  console.log('\n=== HASIL AUDIT TOMBOL TULIS ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — setiap modul operasional punya permukaan tulis, kontrak dialognya utuh, dan halaman baca-saja menyatakan alasannya.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
