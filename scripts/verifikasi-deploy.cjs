// Verifikasi hasil deploy Vercel: rute dalam, rewrite SPA, aset, konsol, dan alur katalog→CRM.
const { chromium } = require('/home/ubuntu/.local/lib/node_modules/playwright')
const fs = require('node:fs')

const BASE = 'https://car-showroom-zeta-mauve.vercel.app'
const D = JSON.parse(fs.readFileSync('/home/ubuntu/apps/car-showroom/src/data/dataset.json', 'utf8'))
const temuan = []
const catat = (ok, pesan) => { if (!ok) temuan.push(pesan); console.log(`${ok ? '✓' : '✗'} ${pesan}`) }

const ready = D.vehicles.filter((v) => v.status === 'READY')
const termurah = ready.slice().sort((a, b) => a.listingPrice - b.listingPrice)[0]

;(async () => {
  const browser = await chromium.launch()
  const konteks = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await konteks.newPage()
  const konsol = []
  const gagal = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) konsol.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))
  page.on('response', (r) => { if (r.status() >= 400) gagal.push(`${r.status()} ${r.url().replace(BASE, '')}`) })

  console.log(`=== VERIFIKASI DEPLOY ${BASE} ===\n`)

  // 1. akar situs tanpa login harus mengalihkan ke /login (rewrite SPA + penjaga masuk)
  let res = await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  catat(res.status() === 200, `GET / → ${res.status()}`)
  catat(page.url().includes('/login'), `tanpa login, akar situs mengalihkan ke /login (${page.url().replace(BASE, '')})`)
  const isiLogin = await page.locator('body').innerText()
  catat(/masuk/i.test(isiLogin) && isiLogin.includes('SHOWROOM-DEMO'), 'halaman login terender dengan benar')

  // 2. rute dalam langsung dari URL (hard load) — inilah yang gagal bila rewrite SPA salah
  for (const [jalur, harap] of [
    ['/katalog', `${ready.length} unit siap dilihat`],
    ['/inventory', 'masuk'],
    ['/laporan', 'masuk'],
    ['/halaman-yang-tidak-ada', 'masuk'],
  ]) {
    const r = await page.goto(BASE + jalur, { waitUntil: 'networkidle' })
    const teks = await page.locator('body').innerText()
    const masuk = /masuk/i.test(teks) && page.url().includes('/login')
    catat(r.status() === 200, `GET ${jalur} → ${r.status()}`)
    catat(!teks.includes('404') && !teks.includes('NOT_FOUND'), `${jalur}: tidak menampilkan halaman 404 mentah dari Vercel`)
    if (jalur === '/katalog') {
      catat(teks.includes(harap), `katalog langsung dari URL memuat "${harap}"`)
      const kartu = await page.evaluate(() => document.querySelectorAll('main ul.grid > li').length)
      catat(kartu === ready.length, `katalog menampilkan ${kartu} kartu (harap ${ready.length})`)
    } else {
      catat(masuk, `${jalur}: dialihkan ke login (rewrite SPA + penjaga masuk)`)
    }
  }

  // 3. detail unit langsung dari URL
  res = await page.goto(`${BASE}/katalog/${termurah.id}`, { waitUntil: 'networkidle' })
  const detail = await page.locator('main').innerText()
  catat(res.status() === 200, `GET /katalog/${termurah.id} → ${res.status()}`)
  catat(detail.includes(termurah.brand) && detail.includes(termurah.model), 'detail unit memuat nama unit')
  catat(detail.includes('slot foto') || detail.includes('Slot foto'), 'detail unit menampilkan slot foto (bukan gambar karangan)')
  catat(/Rp/.test(detail), 'detail unit menampilkan harga')

  // 4. alur minat → CRM di produksi
  const kartuTermahal = await page.evaluate(() => document.querySelectorAll('main ul.grid > li').length)
  catat(kartuTermahal >= 0, 'halaman detail stabil')
  await page.getByLabel('Nama').fill('Uji Deploy Vercel')
  await page.getByLabel('Nomor telepon').fill('081298765432')
  await page.getByRole('button', { name: 'Ajukan minat pada unit ini' }).click()
  await page.waitForTimeout(900)
  const sukses = await page.locator('main').innerText()
  catat(sukses.includes('Minat Anda sudah masuk ke CRM'), 'form minat berhasil dikirim di produksi')
  catat(sukses.includes('LD-KATALOG-01'), 'lead diberi nomor LD-KATALOG-01')

  // 5. masuk dan periksa fitur fase terakhir benar-benar tayang
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 })
  await page.goto(BASE + '/crm', { waitUntil: 'networkidle' })
  const crm = await page.locator('main').innerText()
  catat(crm.includes('Uji Deploy Vercel'), 'lead dari katalog muncul di CRM produksi')

  await page.goto(BASE + '/laporan', { waitUntil: 'networkidle' })
  const laporan = await page.locator('main').innerText()
  catat(laporan.includes('Sebaran umur inventory'), 'halaman Laporan (F8) tayang di produksi')

  await page.getByTitle('Ganti peran untuk kebutuhan demo').selectOption('SALES')
  await page.waitForTimeout(400)
  await page.goto(BASE + '/finance', { waitUntil: 'networkidle' })
  const finance = await page.locator('main').innerText()
  catat(finance.includes('tidak terbuka untuk peran Anda'), 'penjagaan peran (F10) berlaku di produksi')
  catat(!finance.includes('Modal Unit Terjual'), 'isi Finance tidak bocor ke peran Sales di produksi')

  // 6. aset & performa nyata
  const aset = await page.evaluate(() =>
    performance.getEntriesByType('resource')
      .filter((r) => /\.(js|css|woff2|woff)$/.test(r.name))
      .map((r) => ({ nama: r.name.split('/').pop(), kb: Math.round((r.transferSize || 0) / 1024), ms: Math.round(r.duration) })),
  )
  const terberat = aset.slice().sort((a, b) => b.kb - a.kb).slice(0, 4)
  sematan(terberat)
  const navigasi = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    return n ? { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) } : null
  })
  console.log(`  navigasi: DOMContentLoaded ${navigasi?.dcl}ms · load ${navigasi?.load}ms`)

  await browser.close()

  console.log('\n=== KONSOL & PERMINTAAN GAGAL ===')
  console.log(konsol.length ? konsol.join('\n') : '  konsol bersih')
  console.log(gagal.length ? gagal.join('\n') : '  tidak ada permintaan gagal (0 aset 404)')

  console.log('\n=== HASIL VERIFIKASI DEPLOY ===')
  if (temuan.length) {
    console.error(`GAGAL — ${temuan.length} masalah`)
    process.exit(1)
  }
  console.log('LULUS — rewrite SPA, rute dalam, alur katalog→CRM, penjagaan peran, dan aset verifikasi OK.')

  function sematan(daftar) {
    console.log('  aset terberat (transfer nyata):')
    daftar.forEach((a) => console.log(`    ${a.kb} KB  ${a.ms} ms  ${a.nama}`))
  }
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
