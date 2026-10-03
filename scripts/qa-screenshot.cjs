#!/usr/bin/env node
/**
 * QA visual + fungsional dengan Playwright (Chromium lokal).
 * Menguji: alur login, navigasi peran, konsol error, dan overflow horizontal
 * pada 1440 / 768 / 375 px. Screenshot disimpan ke .qa/
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const BASE = process.env.QA_BASE || 'http://localhost:4173'
const OUT = path.join(__dirname, '..', '.qa')

// nilai harapan diambil dari dataset, bukan ditulis tangan di skrip uji
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'dataset.json'), 'utf8'))
const jumlahUnit = DATA.vehicles.length
const siapHitung = (s) => DATA.vehicles.filter((v) => v.status === s).length
const unitListingTertinggi = DATA.vehicles.reduce((a, b) => (b.listingPrice > a.listingPrice ? b : a))

async function tungguServer(page, percobaan = 30) {
  for (let i = 0; i < percobaan; i++) {
    try {
      const res = await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 4000 })
      if (res && res.ok()) return true
    } catch { /* server belum siap */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('server tidak merespons di ' + BASE)
}

const masalah = []
const catat = (kondisi, pesan) => { if (!kondisi) masalah.push(pesan) }

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const konteks = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await konteks.newPage()

  const konsol = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') konsol.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))

  await tungguServer(page)

  // ---------- 1. halaman login ----------
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, '01-login-1440.png'), fullPage: true })

  // ---------- 2. login sebagai Owner ----------
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 8000 })
  await page.waitForTimeout(600)
  catat(page.url().includes('localhost:4173'), 'login gagal berpindah dari halaman masuk')
  await page.screenshot({ path: path.join(OUT, '02-dashboard-owner-1440.png'), fullPage: true })

  // teks kunci harus benar-benar muncul (label memakai uppercase, jadi bandingkan huruf kecil)
  const isiDashboard = (await page.locator('main').innerText()).toLowerCase()
  for (const t of ['unit tersedia', 'nilai inventory', 'gross profit bulan ini', 'perlu perhatian hari ini', 'inventory aging', 'pipeline lead aktif']) {
    catat(isiDashboard.includes(t), `dashboard Owner tidak menampilkan "${t}"`)
  }

  // ---------- 3b. pil status tidak boleh meluber keluar wadahnya ----------
  // diperiksa dua tingkat: pil terhadap kotaknya sendiri, dan pil terhadap kolom induknya
  const pilMeluber = await page.evaluate(() => {
    const hasil = []
    document.querySelectorAll('span').forEach((s) => {
      if (!s.className.includes('rounded-pill')) return
      const kotak = s.getBoundingClientRect()
      if (s.scrollWidth > s.clientWidth + 1) hasil.push(`isi pil meluber: ${s.textContent}`)
      const induk = s.parentElement?.getBoundingClientRect()
      if (induk && kotak.width > induk.width + 1) hasil.push(`pil lebih lebar dari kolomnya: ${s.textContent}`)
    })
    return hasil
  })
  catat(pilMeluber.length === 0, pilMeluber.join(' | '))

  // ukur pil terlebar supaya lebar kolom label di dashboard ditetapkan dari data, bukan tebakan
  const pilTerlebar = await page.evaluate(() =>
    [...document.querySelectorAll('span')]
      .filter((s) => s.className.includes('rounded-pill') && s.textContent.trim().length > 0)
      .map((s) => ({ teks: s.textContent, lebar: Math.round(s.getBoundingClientRect().width) }))
      .sort((a, b) => b.lebar - a.lebar)
      .slice(0, 3),
  )

  // ---------- 3. ganti peran ke Sales ----------
  await page.getByTitle('Ganti peran untuk kebutuhan demo').selectOption('SALES')
  await page.waitForTimeout(600)
  const isiSales = (await page.locator('main').innerText()).toLowerCase()
  for (const t of ['lead aktif saya', 'jatuh tempo follow-up', 'pipeline saya']) {
    catat(isiSales.includes(t), `dashboard Sales tidak menampilkan "${t}"`)
  }
  await page.screenshot({ path: path.join(OUT, '03-dashboard-sales-1440.png'), fullPage: true })

  // ---------- 4. ganti peran ke Admin, cek navigasi tersaring ----------
  await page.getByTitle('Ganti peran untuk kebutuhan demo').selectOption('ADMIN')
  await page.waitForTimeout(400)
  const nav = await page.locator('aside nav').innerText()
  catat(!nav.includes('Finance'), 'Admin masih melihat menu Finance (seharusnya hanya Owner)')
  catat(nav.includes('Procurement'), 'Admin tidak melihat menu Procurement')

  // ---------- 5. Inventory: pencarian, filter, urut, tampilan kartu ----------
  await page.getByRole('link', { name: 'Inventory', exact: true }).first().click()
  await page.waitForURL(/\/inventory$/, { timeout: 8000 })
  await page.waitForTimeout(400)

  const barisTabel = () => page.evaluate(() => document.querySelectorAll('main table tbody tr').length)
  const teksUtama = async () => (await page.locator('main').innerText()).toLowerCase()

  let baris = await barisTabel()
  catat(baris === jumlahUnit, `inventory menampilkan ${baris} baris, seharusnya ${jumlahUnit}`)
  let isi = await teksUtama()
  catat(isi.includes(`${jumlahUnit} unit`), `judul inventory tidak menyebut ${jumlahUnit} unit`)
  catat(isi.includes('total modal') && isi.includes('potensi margin'), 'ringkasan hasil saring tidak lengkap')

  // kepadatan tabel: baris harus rapat (alat kerja 8 jam, bukan halaman pemasaran)
  const tinggiBaris = await page.evaluate(() => {
    const t = [...document.querySelectorAll('main table tbody tr')].map((b) => Math.round(b.getBoundingClientRect().height))
    t.sort((a, b) => a - b)
    return { min: t[0], median: t[Math.floor(t.length / 2)], maks: t[t.length - 1] }
  })
  catat(tinggiBaris.median <= 72, `baris tabel inventory terlalu tinggi: median ${tinggiBaris.median}px (target <= 72px)`)

  await page.screenshot({ path: path.join(OUT, '05-inventory-tabel-1440.png'), fullPage: true })

  // filter status
  const jumlahReady = siapHitung('READY')
  await page.getByRole('button', { name: /^Ready\b/ }).click()
  await page.waitForTimeout(350)
  catat(page.url().includes('status=READY'), 'filter status tidak tercatat di URL (tautan dalam jadi tidak bisa dibagikan)')
  baris = await barisTabel()
  catat(baris === jumlahReady, `filter Ready menampilkan ${baris} baris, seharusnya ${jumlahReady}`)
  await page.screenshot({ path: path.join(OUT, '06-inventory-filter-ready-1440.png'), fullPage: true })

  // pencarian digabung dengan filter aktif
  await page.getByLabel('Cari unit').fill('fortuner')
  await page.waitForTimeout(350)
  const jumlahFortuner = DATA.vehicles.filter(
    (v) => v.status === 'READY' && /fortuner/i.test(`${v.brand} ${v.model}`),
  ).length
  baris = await barisTabel()
  catat(baris === jumlahFortuner, `pencarian "fortuner" + filter Ready: ${baris} baris, seharusnya ${jumlahFortuner}`)

  // pencarian tanpa hasil harus memunculkan keadaan kosong yang menjelaskan
  await page.getByLabel('Cari unit').fill('zzzz')
  await page.waitForTimeout(300)
  isi = await teksUtama()
  catat(isi.includes('tidak ada unit yang cocok'), 'keadaan kosong tidak muncul saat pencarian tanpa hasil')

  await page.getByRole('button', { name: 'Bersihkan filter' }).click()
  await page.waitForTimeout(350)
  baris = await barisTabel()
  catat(baris === jumlahUnit, `membersihkan filter tidak mengembalikan seluruh unit (${baris})`)

  // urut berdasarkan harga listing — baris teratas harus unit termahal
  await page.getByRole('button', { name: /Harga Listing/ }).click()
  await page.waitForTimeout(350)
  const barisPertama = await page.locator('main table tbody tr').first().innerText()
  catat(
    barisPertama.includes(unitListingTertinggi.id),
    `urut harga listing: baris pertama bukan ${unitListingTertinggi.id} (${unitListingTertinggi.listingPrice})`,
  )

  // tampilan kartu
  await page.getByRole('button', { name: 'Kartu' }).click()
  await page.waitForTimeout(350)
  const jumlahKartu = await page.evaluate(() => document.querySelectorAll('main article').length)
  catat(jumlahKartu === jumlahUnit, `tampilan kartu menampilkan ${jumlahKartu} kartu, seharusnya ${jumlahUnit}`)
  await page.screenshot({ path: path.join(OUT, '07-inventory-kartu-1440.png'), fullPage: true })

  await page.getByRole('button', { name: 'Tabel' }).click()
  await page.waitForTimeout(250)

  // modul penanda fase sudah tidak ada: seluruh rute kini punya antarmuka nyata
  // (diperiksa di bagian 5f di bawah, yang juga memastikan tidak ada layar kosong)

  // ---------- 5b. Vehicle Detail: satu unit dilacak dari pembelian sampai terjual ----------
  const rp = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(n))
  const unitTerjual = DATA.vehicles.find((v) => v.status === 'SOLD')
  const penjualanUnit = DATA.sales.find((s) => s.vehicleId === unitTerjual.id)
  const inspeksiUnit = DATA.inspections.find((i) => i.vehicleId === unitTerjual.id)
  const reconUnit = DATA.reconditionings.find((r) => r.vehicleId === unitTerjual.id)
  const leadUnit = DATA.leads.find((l) => l.vehicleId === unitTerjual.id && l.status === 'WON')
  const dokUnit = DATA.documents.find((d) => d.vehicleId === unitTerjual.id)
  const aktivitasUnit = DATA.activities.filter((a) => a.vehicleId === unitTerjual.id)

  await page.goto(`${BASE}/inventory/${unitTerjual.id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)

  const jumlahTab = await page.evaluate(() => document.querySelectorAll('main [role="tab"]').length)
  catat(jumlahTab === 9, `detail unit punya ${jumlahTab} tab, seharusnya 9`)

  // rel modal harus memuat angka yang sama persis dengan dataset
  const relModal = await page.locator('main aside').first().innerText()
  const angkaWajib = {
    'harga beli': unitTerjual.purchasePrice,
    'reconditioning': unitTerjual.reconCost,
    'biaya lain': unitTerjual.otherCost,
    'total modal': unitTerjual.totalCost,
    'harga listing': unitTerjual.listingPrice,
    'harga final': penjualanUnit.finalPrice,
    'gross profit': penjualanUnit.grossProfit,
  }
  // perbandingan selalu tanpa peka huruf: label UI memakai text-transform uppercase dari CSS
  const ada = (teks, cari) => teks.toLowerCase().includes(cari.toLowerCase())

  for (const [nama, nilai] of Object.entries(angkaWajib)) {
    catat(ada(relModal, rp(nilai)), `rel modal tidak memuat ${nama} (${rp(nilai)})`)
  }
  catat(ada(relModal, 'Gross profit tercatat'), 'rel modal unit terjual tidak menandai laba tercatat')
  await page.screenshot({ path: path.join(OUT, '09-detail-ringkasan-1440.png'), fullPage: true })

  // tiap tab harus benar-benar berisi, bukan kosong
  const tabUji = [
    ['Procurement', [DATA.procurements.find((p) => p.vehicleId === unitTerjual.id).namaSeller, 'Negosiasi harga']],
    ['Inspeksi', [inspeksiUnit.inspektur, 'Skor kelayakan', inspeksiUnit.sections[0].kategori]],
    ['Reconditioning', [reconUnit.items[0].job, reconUnit.items[0].vendor]],
    ['Biaya', ['Total modal', 'Gross profit']],
    ['Lead', [leadUnit.nama, leadUnit.id]],
    ['Penjualan', [penjualanUnit.id, penjualanUnit.customerNama]],
    ['Dokumen', dokUnit.checklist.map((c) => c.nama)],
  ]
  for (const [nama, penanda] of tabUji) {
    await page.getByRole('tab', { name: new RegExp(`^${nama}`) }).click()
    await page.waitForTimeout(300)
    // label di UI memakai huruf besar lewat CSS, jadi bandingkan tanpa peka huruf
    const isiTab = (await page.locator('main [role="tabpanel"]').innerText()).toLowerCase()
    for (const t of penanda) {
      catat(isiTab.includes(t.toLowerCase()), `tab ${nama} tidak memuat "${t}"`)
    }
    catat(page.url().includes(`tab=`), `tab ${nama} tidak tercatat di URL`)
  }

  // lini masa harus lengkap dan terurut
  await page.getByRole('tab', { name: /^Aktivitas/ }).click()
  await page.waitForTimeout(350)
  const jumlahPeristiwa = await page.evaluate(() => document.querySelectorAll('main [role="tabpanel"] ol > li').length)
  catat(
    jumlahPeristiwa === aktivitasUnit.length,
    `lini masa menampilkan ${jumlahPeristiwa} peristiwa, dataset punya ${aktivitasUnit.length}`,
  )
  const teksLiniMasa = await page.locator('main [role="tabpanel"]').innerText()
  catat(teksLiniMasa.includes(aktivitasUnit[0].judul), `lini masa tidak memuat peristiwa pertama (${aktivitasUnit[0].judul})`)
  catat(teksLiniMasa.includes(aktivitasUnit[aktivitasUnit.length - 1].judul), 'lini masa tidak memuat peristiwa terakhir')
  await page.screenshot({ path: path.join(OUT, '10-detail-aktivitas-1440.png'), fullPage: true })

  // unit yang belum terjual: rel modal harus menyebut potensi margin, bukan laba tercatat
  const unitSiap = DATA.vehicles.find((v) => v.status === 'READY')
  await page.goto(`${BASE}/inventory/${unitSiap.id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  const relSiap = await page.locator('main aside').first().innerText()
  catat(ada(relSiap, 'Potensi margin'), 'rel modal unit READY tidak menyebut potensi margin')
  catat(!ada(relSiap, 'Gross profit tercatat'), 'rel modal unit READY keliru menampilkan laba tercatat')
  await page.getByRole('tab', { name: /^Penjualan/ }).click()
  await page.waitForTimeout(300)
  const tabJualKosong = await page.locator('main [role="tabpanel"]').innerText()
  catat(ada(tabJualKosong, 'belum terjual'), 'tab Penjualan unit READY tidak menjelaskan bahwa unit belum terjual')
  await page.screenshot({ path: path.join(OUT, '11-detail-unit-ready-1440.png'), fullPage: true })

  // ID unit yang tidak ada harus ditangani, bukan layar rusak
  await page.goto(`${BASE}/inventory/VH-2026-9999`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  const isiSalah = await teksUtama()
  catat(isiSalah.includes('tidak ditemukan'), 'ID unit yang salah tidak memunculkan pesan yang jelas')

  // ---------- 5c. halaman operasional: procurement, inspeksi, reconditioning, dokumen ----------
  const halamanOperasional = [
    {
      jalur: '/procurement',
      nama: 'Procurement',
      baris: DATA.procurements.length,
      chip: { label: 'Dealer', harap: DATA.procurements.filter((p) => p.sumber === 'Dealer').length },
      screenshot: '12-procurement-1440.png',
    },
    {
      jalur: '/inspeksi',
      nama: 'Inspeksi',
      baris: DATA.inspections.length,
      chip: {
        // diambil dari data: istilah rekomendasi bisa berubah, asersi uji tidak boleh ikut rapuh
        label: (() => {
          const hitung = {}
          DATA.inspections.forEach((i) => { hitung[i.rekomendasi] = (hitung[i.rekomendasi] ?? 0) + 1 })
          return Object.entries(hitung).sort((a, b) => b[1] - a[1])[0][0]
        })(),
        harap: (() => {
          const hitung = {}
          DATA.inspections.forEach((i) => { hitung[i.rekomendasi] = (hitung[i.rekomendasi] ?? 0) + 1 })
          const teratas = Object.entries(hitung).sort((a, b) => b[1] - a[1])[0]
          return teratas[1]
        })(),
      },
      screenshot: '13-inspeksi-1440.png',
    },
    {
      jalur: '/reconditioning',
      nama: 'Reconditioning',
      baris: DATA.reconditionings.length,
      chip: {
        label: 'Masih dikerjakan',
        harap: DATA.reconditionings.filter(
          (r) => DATA.vehicles.find((v) => v.id === r.vehicleId)?.status === 'RECONDITIONING',
        ).length,
      },
      screenshot: '14-reconditioning-1440.png',
    },
    {
      jalur: '/dokumen',
      nama: 'Dokumen',
      baris: DATA.documents.filter((d) => d.checklist.some((c) => c.status !== 'Tersedia')).length,
      chip: null,
      screenshot: '15-dokumen-1440.png',
    },
  ]

  for (const h of halamanOperasional) {
    await page.goto(BASE + h.jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(450)

    // hitung hanya tabel pertama: sebagian halaman punya tabel ringkasan di kolom kanan
    let barisHalaman = await page.evaluate(
      () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
    )
    catat(barisHalaman === h.baris, `${h.nama}: ${barisHalaman} baris, seharusnya ${h.baris}`)

    // setiap halaman operasional harus menautkan ke detail unit (ketertelusuran)
    const tautanUnit = await page.evaluate(
      () => [...document.querySelectorAll('main a[href*="/inventory/VH-"]')].length,
    )
    catat(tautanUnit > 0, `${h.nama}: tidak ada tautan ke detail unit`)

    if (h.chip) {
      await page.getByRole('button', { name: new RegExp(`^${h.chip.label}`) }).click()
      await page.waitForTimeout(350)
      barisHalaman = await page.evaluate(
        () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
      )
      catat(
        barisHalaman === h.chip.harap,
        `${h.nama}: filter "${h.chip.label}" menampilkan ${barisHalaman} baris, seharusnya ${h.chip.harap}`,
      )
      catat(page.url().includes('='), `${h.nama}: filter tidak tercatat di URL`)
    }

    // tabel utama harus muat di panelnya pada lebar desktop — kolom terpotong terlihat belum jadi
    await periksaMuatTabel(h.nama)

    await page.screenshot({ path: path.join(OUT, h.screenshot), fullPage: true })
  }

  // ---------- 5d. CRM: papan pipeline, ubah tahap, lead detail, customer ----------
  const leadAktif = DATA.leads.filter((l) => !['WON', 'LOST'].includes(l.status))

  await page.goto(`${BASE}/crm`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)

  const kartuPapan = await page.evaluate(() => document.querySelectorAll('main a[href^="/crm/LD-"]').length)
  catat(kartuPapan === leadAktif.length, `papan CRM menampilkan ${kartuPapan} kartu, seharusnya ${leadAktif.length}`)

  const isiCrm = (await page.locator('main').innerText()).toLowerCase()
  for (const t of ['lead aktif', 'nilai pipeline', 'jatuh tempo follow-up', 'sudah selesai', 'efektivitas sumber lead', 'beban kerja sales']) {
    catat(isiCrm.includes(t), `halaman CRM tidak memuat "${t}"`)
  }
  // penanda follow-up harus membedakan yang akan datang dari yang sudah terlambat (warna = makna)
  const warnaBadge = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('main a[href^="/crm/LD-"] span')]
    const ambil = (cocok) => {
      const el = spans.find((s) => cocok.test(s.textContent.trim()))
      return el ? getComputedStyle(el).color : null
    }
    return {
      akanDatang: ambil(/^(besok|\d+ hari lagi)$/),
      terlambat: ambil(/^(kemarin|\d+ hari lalu)$/),
    }
  })
  catat(
    Boolean(warnaBadge.akanDatang) &&
      Boolean(warnaBadge.terlambat) &&
      warnaBadge.akanDatang !== warnaBadge.terlambat,
    `penanda follow-up tidak membedakan warna: akan datang ${warnaBadge.akanDatang} vs terlambat ${warnaBadge.terlambat}`,
  )

  await page.screenshot({ path: path.join(OUT, '16-crm-papan-1440.png'), fullPage: true })

  // tampilan tabel harus memuat semua lead, termasuk yang sudah menang dan batal
  await page.getByRole('button', { name: 'Tabel' }).click()
  await page.waitForTimeout(400)
  const barisCrm = await page.evaluate(
    () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
  )
  catat(barisCrm === DATA.leads.length, `tabel CRM menampilkan ${barisCrm} baris, seharusnya ${DATA.leads.length}`)
  await page.screenshot({ path: path.join(OUT, '17-crm-tabel-1440.png'), fullPage: true })
  await page.getByRole('button', { name: 'Papan' }).click()
  await page.waitForTimeout(300)

  // lead detail: riwayat interaksi harus lengkap
  const leadUji = leadAktif.find((l) => l.interaksi.length >= 2)
  await page.goto(`${BASE}/crm/${leadUji.id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  const interaksiTerlihat = await page.evaluate(
    () => document.querySelectorAll('main ol > li').length,
  )
  catat(
    interaksiTerlihat === leadUji.interaksi.length,
    `lead detail menampilkan ${interaksiTerlihat} interaksi, dataset punya ${leadUji.interaksi.length}`,
  )
  const isiLead = (await page.locator('main').innerText()).toLowerCase()
  catat(isiLead.includes(leadUji.vehicleLabel.toLowerCase().split(' ')[0]), 'lead detail tidak menyebut unit yang diminati')
  catat(isiLead.includes('budget customer'), 'lead detail tidak membandingkan budget dengan harga listing')
  await page.screenshot({ path: path.join(OUT, '18-lead-detail-1440.png'), fullPage: true })

  // ubah tahap lead → kartu berpindah kolom + muncul pemberitahuan bahwa perubahan tidak tersimpan
  await page.getByLabel('Ubah tahap lead').selectOption('WON')
  await page.waitForTimeout(300)
  // navigasi di dalam aplikasi: memuat ulang halaman memang akan mengembalikan data demo
  await page.getByRole('link', { name: /Kembali ke CRM/ }).click()
  await page.waitForTimeout(600)
  // spanduk sesi sekarang satu tempat di shell (di luar <main>), jadi dibaca dari body
  const isiSetelah = (await page.locator('body').innerText()).toLowerCase()
  catat(isiSetelah.includes('perubahan pada sesi ini'), 'spanduk sesi tidak muncul setelah tahap lead diubah')
  catat(isiSetelah.includes('tahap lead dipindahkan'), 'spanduk sesi tidak menyebut jenis perubahan yang terjadi')
  const kartuSetelah = await page.evaluate(() => document.querySelectorAll('main a[href^="/crm/LD-"]').length)
  catat(
    kartuSetelah === leadAktif.length - 1,
    `setelah lead dipindah ke Menang, papan menampilkan ${kartuSetelah} kartu, seharusnya ${leadAktif.length - 1}`,
  )
  await page.screenshot({ path: path.join(OUT, '18b-crm-setelah-ubah-tahap-1440.png'), fullPage: true })
  await page.getByRole('button', { name: 'Kembalikan ke data demo' }).click()
  await page.waitForTimeout(400)
  const kartuReset = await page.evaluate(() => document.querySelectorAll('main a[href^="/crm/LD-"]').length)
  catat(kartuReset === leadAktif.length, `setelah dikembalikan, papan menampilkan ${kartuReset} kartu, seharusnya ${leadAktif.length}`)

  // customer
  await page.goto(`${BASE}/customer`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  const barisCustomer = await page.evaluate(
    () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
  )
  catat(barisCustomer === DATA.customers.length, `daftar customer menampilkan ${barisCustomer} baris, seharusnya ${DATA.customers.length}`)

  const customerTransaksi = DATA.customers.filter((c) => DATA.sales.some((s) => s.customerId === c.id))
  await page.getByRole('button', { name: /^Sudah transaksi/ }).click()
  await page.waitForTimeout(350)
  const barisCustomerFilter = await page.evaluate(
    () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
  )
  catat(
    barisCustomerFilter === customerTransaksi.length,
    `filter "sudah transaksi" menampilkan ${barisCustomerFilter} baris, seharusnya ${customerTransaksi.length}`,
  )
  await page.screenshot({ path: path.join(OUT, '19-customer-1440.png'), fullPage: true })

  // customer detail: lead + transaksi harus terkumpul dari satu ID customer
  const custUji = customerTransaksi[0]
  await page.goto(`${BASE}/customer/${custUji.id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  const isiCust = await page.locator('main').innerText()
  catat(isiCust.includes(custUji.nama), 'customer detail tidak menampilkan nama customer')
  const leadCust = DATA.leads.filter((l) => l.customerId === custUji.id)
  for (const l of leadCust.slice(0, 3)) {
    catat(isiCust.includes(l.id), `customer detail tidak menampilkan lead ${l.id}`)
  }
  const saleCust = DATA.sales.filter((s) => s.customerId === custUji.id)
  for (const s of saleCust) {
    catat(isiCust.includes(s.id), `customer detail tidak menampilkan transaksi ${s.id}`)
  }
  const tautanJejak = await page.evaluate(
    () => [...document.querySelectorAll('main a[href*="/inventory/VH-"], main a[href^="/crm/LD-"]')].length,
  )
  catat(tautanJejak > 0, 'customer detail tidak menautkan ke unit maupun lead')
  await page.screenshot({ path: path.join(OUT, '20-customer-detail-1440.png'), fullPage: true })

  // ---------- 5e. penjualan & keuangan: booking, penjualan, finance, biaya ----------
  // Finance dan Biaya Operasional kini dijaga di tingkat rute untuk Owner, jadi peran
  // dikembalikan ke Owner lebih dulu (uji penolakan aksesnya ada di audit-aplikasi.cjs).
  await page.getByTitle('Ganti peran untuk kebutuhan demo').selectOption('OWNER')
  await page.waitForTimeout(350)

  // nama kategori/merek berasal dari data: escape sebelum dipakai sebagai pola pencarian
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // tabel utama tidak boleh terpotong di dalam panelnya pada 1440px (kolom terpotong = terlihat belum jadi)
  async function periksaMuatTabel(nama) {
    const muat = await page.evaluate(() => {
      const t = document.querySelector('main table')
      const wadah = t?.parentElement
      if (!t || !wadah) return null
      return { tabel: Math.round(t.getBoundingClientRect().width), wadah: Math.round(wadah.getBoundingClientRect().width) }
    })
    catat(
      muat !== null && muat.tabel <= muat.wadah + 1,
      `${nama}: tabel (${muat?.tabel}px) terpotong di wadahnya (${muat?.wadah}px) pada 1440px`,
    )
  }

  const totalBiaya = DATA.expenses.reduce((s, e) => s + e.jumlah, 0)
  const gpTotal = DATA.sales.reduce((s, x) => s + x.grossProfit, 0)
  const piutangData = DATA.sales.filter((s) => s.sisaPembayaran > 0)

  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  let barisF7 = await page.evaluate(
    () => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0,
  )
  catat(barisF7 === DATA.bookings.length, `Booking: ${barisF7} baris, seharusnya ${DATA.bookings.length}`)
  await periksaMuatTabel('Booking')
  const bookingSelesai = DATA.bookings.filter((b) => b.statusPembayaran === 'SELESAI').length
  await page.getByRole('button', { name: /^Selesai/ }).click()
  await page.waitForTimeout(350)
  barisF7 = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisF7 === bookingSelesai, `Booking filter Selesai: ${barisF7} baris, seharusnya ${bookingSelesai}`)
  await page.screenshot({ path: path.join(OUT, '21-booking-1440.png'), fullPage: true })

  await page.goto(`${BASE}/penjualan`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  barisF7 = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisF7 === DATA.sales.length, `Penjualan: ${barisF7} baris, seharusnya ${DATA.sales.length}`)
  await periksaMuatTabel('Penjualan')
  const penjualanKredit = DATA.sales.filter((s) => s.tipePembayaran === 'Kredit').length
  await page.getByRole('button', { name: /^Kredit/ }).click()
  await page.waitForTimeout(350)
  barisF7 = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisF7 === penjualanKredit, `Penjualan filter Kredit: ${barisF7} baris, seharusnya ${penjualanKredit}`)
  const isiPenjualan = (await page.locator('main').innerText()).toLowerCase()
  catat(isiPenjualan.includes('gross profit'), 'halaman Penjualan tidak menampilkan gross profit')
  catat(isiPenjualan.includes('diskon terdalam'), 'halaman Penjualan tidak menampilkan panel diskon')
  await page.getByRole('button', { name: 'Bersihkan' }).click()
  await page.waitForTimeout(350)
  await page.screenshot({ path: path.join(OUT, '22-penjualan-1440.png'), fullPage: true })

  await page.goto(`${BASE}/finance`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  const isiFinance = (await page.locator('main').innerText()).toLowerCase()
  const rpF7 = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(n))
  const angkaFinance = {
    'nilai penjualan': DATA.sales.reduce((s, x) => s + x.finalPrice, 0),
    'total modal': DATA.sales.reduce((s, x) => s + x.totalModal, 0),
    'gross profit total': gpTotal,
  }
  for (const [nama, nilai] of Object.entries(angkaFinance)) {
    catat(ada(isiFinance, rpF7(nilai)), `Finance tidak memuat ${nama} (${rpF7(nilai)})`)
  }
  for (const s of piutangData) {
    catat(ada(isiFinance, s.id), `Finance tidak menampilkan piutang ${s.id}`)
  }
  catat(ada(isiFinance, 'setelah biaya operasional'), 'Finance tidak memuat ringkasan setelah biaya operasional')
  const barisFinance = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisFinance === DATA.sales.length, `Finance: ${barisFinance} baris profit per unit, seharusnya ${DATA.sales.length}`)
  await periksaMuatTabel('Finance')
  await page.screenshot({ path: path.join(OUT, '23-finance-1440.png'), fullPage: true })

  await page.goto(`${BASE}/biaya`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(450)
  barisF7 = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisF7 === DATA.expenses.length, `Biaya: ${barisF7} baris, seharusnya ${DATA.expenses.length}`)
  await periksaMuatTabel('Biaya')
  const isiBiaya = await page.locator('main').innerText()
  catat(ada(isiBiaya, rpF7(totalBiaya)), `Biaya tidak menampilkan total ${rpF7(totalBiaya)}`)
  const kategoriTerbesar = [...DATA.expenses.reduce((m, e) => m.set(e.kategori, (m.get(e.kategori) ?? 0) + e.jumlah), new Map())].sort((a, b) => b[1] - a[1])[0]
  const jumlahKategoriTerbesar = DATA.expenses.filter((e) => e.kategori === kategoriTerbesar[0]).length
  await page.getByRole('button', { name: new RegExp(`^${esc(kategoriTerbesar[0])}`) }).click()
  await page.waitForTimeout(350)
  barisF7 = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(
    barisF7 === jumlahKategoriTerbesar,
    `Biaya filter ${kategoriTerbesar[0]}: ${barisF7} baris, seharusnya ${jumlahKategoriTerbesar}`,
  )
  await page.screenshot({ path: path.join(OUT, '24-biaya-1440.png'), fullPage: true })

  // ---------- 5f. laporan, performa sales, notifikasi, pencarian global (F8) ----------
  await page.getByTitle('Ganti peran untuk kebutuhan demo').selectOption('OWNER')
  await page.waitForTimeout(350)

  const hariTerlambat = DATA.leads.filter(
    (l) => l.nextFollowUp && l.nextFollowUp < DATA.meta.demoToday && !['WON', 'LOST'].includes(l.status),
  ).length
  const dokumenKurang = DATA.documents.filter((d) => d.checklist.some((c) => c.status !== 'Tersedia')).length
  const unitMenua = DATA.vehicles.filter((v) => v.status !== 'SOLD' && v.hariDiInventory > 90).length
  const modalTersimpan = DATA.vehicles.filter((v) => v.status !== 'SOLD').reduce((s, v) => s + v.totalCost, 0)
  const unitTertua = DATA.vehicles
    .filter((v) => v.status !== 'SOLD')
    .slice()
    .sort((a, b) => b.hariDiInventory - a.hariDiInventory)[0]

  await page.goto(`${BASE}/laporan`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(550)
  const isiLaporan = (await page.locator('main').innerText()).toLowerCase()
  for (const t of ['modal terikat', 'sebaran umur inventory', 'margin per merek', 'efektivitas sumber lead', 'perbandingan 30 hari']) {
    catat(isiLaporan.includes(t), `Laporan tidak memuat bagian "${t}"`)
  }
  const barisAging = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisAging === 4, `Laporan: ${barisAging} kelompok umur, seharusnya 4`)
  catat(ada(isiLaporan, unitTertua.id), `Laporan tidak menampilkan unit tertua ${unitTertua.id}`)
  catat(ada(isiLaporan, rpF7(modalTersimpan)), `Laporan tidak menampilkan modal terikat ${rpF7(modalTersimpan)}`)
  await periksaMuatTabel('Laporan')
  catat(!/\d{4}-\d{2}-\d{2}/.test(isiLaporan), 'Laporan menampilkan tanggal mentah (format ISO)')
  await page.screenshot({ path: path.join(OUT, '25-laporan-1440.png'), fullPage: true })

  await page.goto(`${BASE}/performa`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(550)
  const barisSales = await page.evaluate(() => document.querySelectorAll('main table')[0]?.querySelectorAll('tbody tr').length ?? 0)
  catat(barisSales === DATA.salesTeam.length, `Performa: ${barisSales} baris sales, seharusnya ${DATA.salesTeam.length}`)
  const totalTarget = DATA.salesTeam.reduce((s, x) => s + x.target, 0)
  const isiPerforma = await page.locator('main').innerText()
  catat(ada(isiPerforma, `Target tim ${totalTarget} unit`), `Performa tidak menampilkan target tim ${totalTarget}`)
  const barisTerlambat = await page.evaluate(() => {
    const t = document.querySelectorAll('main table')[1]
    return t ? t.querySelectorAll('tbody tr').length : 0
  })
  catat(
    barisTerlambat === Math.min(8, hariTerlambat),
    `Performa: ${barisTerlambat} baris follow-up terlambat, seharusnya ${Math.min(8, hariTerlambat)}`,
  )
  await periksaMuatTabel('Performa')
  catat(!/\d{4}-\d{2}-\d{2}/.test(isiPerforma), 'Performa menampilkan tanggal mentah (format ISO)')
  await page.screenshot({ path: path.join(OUT, '26-performa-1440.png'), fullPage: true })

  // ---------- 5g. notifikasi: jumlah di lonceng harus sama dengan isinya ----------
  const tombolLonceng = page.getByRole('button', { name: /^Notifikasi:/ })
  const labelLonceng = (await tombolLonceng.getAttribute('aria-label')) ?? ''
  await tombolLonceng.click()
  await page.waitForTimeout(350)
  const panelNotifikasi = await page.locator('div.z-40').first().innerText()
  const jumlahLonceng = Number(labelLonceng.replace(/\D+/g, ''))
  for (const [teks, jumlah] of [
    ['follow-up lead terlambat', hariTerlambat],
    ['unit dokumennya belum lengkap', dokumenKurang],
    ['unit diam lebih dari 90 hari', unitMenua],
  ]) {
    catat(ada(panelNotifikasi, `${jumlah} ${teks}`), `notifikasi tidak memuat "${jumlah} ${teks}"`)
  }
  catat(jumlahLonceng > 0, 'lonceng notifikasi tidak menunjukkan jumlah')
  catat(/perlu ditindak/i.test(panelNotifikasi), 'panel notifikasi tidak menjelaskan tujuannya')
  catat(!/\d{4}-\d{2}-\d{2}/.test(panelNotifikasi), 'notifikasi menampilkan tanggal mentah (format ISO)')
  await page.screenshot({ path: path.join(OUT, '28-notifikasi-1440.png') })

  // klik notifikasi harus membawa ke halaman yang benar
  await page.getByRole('link', { name: /follow-up lead terlambat/ }).first().click()
  await page.waitForTimeout(450)
  catat(page.url().includes('/crm'), `klik notifikasi tidak menuju CRM (${page.url()})`)

  // ---------- 5h. pencarian global: Ctrl+K, hasil, navigasi, dan pesan kosong ----------
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(400)
  const dialog = page.getByRole('dialog', { name: 'Pencarian global' })
  catat(await dialog.count() === 1, 'Ctrl+K tidak membuka pencarian global')
  catat(
    ada(await dialog.innerText(), 'unit, lead, customer, invoice, booking, dan biaya'),
    'pencarian tidak menjelaskan cakupannya',
  )
  await page.getByRole('textbox', { name: 'Kata kunci pencarian' }).fill('VH-2026-0001')
  await page.waitForTimeout(350)
  catat(ada(await dialog.innerText(), 'VH-2026-0001'), 'pencarian tidak menemukan unit VH-2026-0001')
  await page.screenshot({ path: path.join(OUT, '27-pencarian-1440.png') })
  await dialog.getByRole('button').filter({ hasText: 'VH-2026-0001' }).first().click()
  await page.waitForTimeout(450)
  catat(page.url().includes('/inventory/VH-2026-0001'), `hasil pencarian tidak membuka unit (${page.url()})`)

  await page.keyboard.press('Control+k')
  await page.waitForTimeout(400)
  await page.getByRole('textbox', { name: 'Kata kunci pencarian' }).fill('zzzz-tidak-ada')
  await page.waitForTimeout(350)
  catat(ada(await dialog.innerText(), 'tidak ada yang cocok'), 'pencarian tidak memberi pesan saat hasil kosong')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(350)
  catat(await dialog.count() === 0, 'Esc tidak menutup pencarian global')

  // ---------- 5i. katalog publik: tanpa login, minat masuk ke CRM (F9) ----------
  const konteks2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page2 = await konteks2.newPage()
  const konsolPublik = []
  page2.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') konsolPublik.push(`${m.type()}: ${m.text()}`) })
  page2.on('pageerror', (e) => konsolPublik.push(`pageerror: ${e.message}`))
  const isiKatalog = async () => (await page2.locator('main').innerText()).toLowerCase()

  const ready = DATA.vehicles.filter((v) => v.status === 'READY')
  const merekUji = [...new Set(ready.map((v) => v.brand))].sort()[0]
  const termahal = ready.slice().sort((a, b) => b.listingPrice - a.listingPrice)[0]
  const termurah = ready.slice().sort((a, b) => a.listingPrice - b.listingPrice)[0]
  const kartuKatalog = () =>
    page2.evaluate(() => document.querySelectorAll('main ul.grid > li').length)

  await page2.goto(`${BASE}/katalog`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(700)
  catat(page2.url().includes('/katalog'), `katalog publik dialihkan ke login (${page2.url()})`)
  catat(
    ada(await isiKatalog(), `${ready.length} unit siap dilihat`),
    `judul katalog tidak menyebut ${ready.length} unit siap dilihat`,
  )
  catat((await kartuKatalog()) === ready.length, `katalog: ${await kartuKatalog()} kartu, seharusnya ${ready.length}`)
  catat(
    ada(await isiKatalog(), 'berkas tidak disertakan'),
    'katalog tidak menyatakan secara terbuka bahwa berkas foto tidak disertakan',
  )

  // saring per merek
  await page2.getByRole('button', { name: merekUji, exact: true }).click()
  await page2.waitForTimeout(400)
  const jumlahMerek = ready.filter((v) => v.brand === merekUji).length
  catat((await kartuKatalog()) === jumlahMerek, `katalog filter ${merekUji}: ${await kartuKatalog()} kartu, seharusnya ${jumlahMerek}`)
  await page2.getByRole('button', { name: 'Semua merek' }).click()
  await page2.waitForTimeout(400)

  // urutkan harga tertinggi
  await page2.getByLabel('Urutkan').selectOption('termahal')
  await page2.waitForTimeout(400)
  const kartuPertama = await page2.evaluate(
    () => document.querySelector('main ul.grid > li')?.innerText.toLowerCase() ?? '',
  )
  catat(
    kartuPertama.includes(termahal.brand.toLowerCase()) && kartuPertama.includes(termahal.model.toLowerCase()),
    `urutan termahal tidak menempatkan ${termahal.id} di kartu pertama`,
  )
  await page2.screenshot({ path: path.join(OUT, '29-katalog-1440.png'), fullPage: true })

  // pesan kosong harus jelas, bukan layar hampa
  await page2.getByLabel('Cari unit').fill('zzz-tidak-ada')
  await page2.waitForTimeout(400)
  catat(ada(await isiKatalog(), 'belum ada unit yang cocok'), 'katalog tidak memberi pesan saat hasil kosong')
  await page2.getByRole('button', { name: 'Bersihkan' }).click()
  await page2.waitForTimeout(400)

  // detail unit termurah
  await page2.goto(`${BASE}/katalog/${termurah.id}`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(700)
  const isiDetail = await isiKatalog()
  for (const bagian of ['spesifikasi unit', 'hasil inspeksi saat unit masuk', 'pekerjaan yang sudah dikerjakan', 'kelengkapan dokumen']) {
    catat(isiDetail.includes(bagian), `katalog detail tidak memuat bagian "${bagian}"`)
  }
  catat(
    ada(isiDetail, 'sudah ditangani pada tahap reconditioning'),
    'katalog detail tidak menjelaskan bahwa temuan inspeksi sudah ditangani',
  )
  catat(ada(isiDetail, rpF7(termurah.listingPrice)), `katalog detail tidak menampilkan harga ${rpF7(termurah.listingPrice)}`)
  catat(ada(isiDetail, 'rincian biaya perbaikan tidak ditampilkan'), 'katalog detail tidak menjelaskan kenapa biaya perbaikan tidak tampil')
  await page2.screenshot({ path: path.join(OUT, '30-katalog-detail-1440.png'), fullPage: true })

  // validasi form: tidak boleh ada lead terbuat dari isian kosong
  await page2.getByRole('button', { name: 'Ajukan minat pada unit ini' }).click()
  await page2.waitForTimeout(400)
  catat(ada(await isiKatalog(), 'nama minimal 2 huruf'), 'form katalog tidak menolak nama kosong')
  catat(ada(await isiKatalog(), 'nomor telepon minimal 9 angka'), 'form katalog tidak menolak telepon kosong')

  await page2.getByLabel('Nama').fill('Sari Wulandari')
  await page2.getByLabel('Nomor telepon').fill('081234567890')
  await page2.getByLabel('Rencana pembayaran').selectOption('Kredit')
  await page2.getByLabel('Pesan').fill('Ingin melihat unit Sabtu pagi, siap DP 20%.')
  await page2.getByRole('button', { name: 'Ajukan minat pada unit ini' }).click()
  await page2.waitForTimeout(500)
  const isiSukses = await isiKatalog()
  catat(ada(isiSukses, 'minat anda sudah masuk'), 'form katalog tidak menampilkan konfirmasi setelah dikirim')
  catat(ada(isiSukses, 'LD-KATALOG-01'), 'lead dari katalog tidak diberi nomor yang jelas')
  await page2.getByRole('button', { name: 'Hubungi via WhatsApp' }).click()
  await page2.waitForTimeout(300)
  catat(
    ada(await isiKatalog(), 'nomor whatsapp showroom sengaja tidak diisi'),
    'tombol WhatsApp tidak menjelaskan bahwa nomornya memang kosong di demo',
  )
  await page2.screenshot({ path: path.join(OUT, '31-katalog-minat-1440.png'), fullPage: true })

  // minat itu harus muncul di CRM pada sesi yang sama
  await page2.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(500)
  await page2.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page2.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 8000 })
  await page2.goto(`${BASE}/crm`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(700)
  const isiCrmKatalog = await page2.locator('main').innerText()
  const spandukKatalog = await page2.locator('body').innerText()
  catat(ada(isiCrmKatalog, 'Sari Wulandari'), 'lead dari katalog tidak muncul di CRM')
  catat(ada(spandukKatalog, '1 lead baru dari katalog publik'), 'CRM tidak memberi tahu ada lead baru dari katalog')
  const chipDariKatalog = await page2.evaluate(() =>
    [...document.querySelectorAll('main a')].some((a) => a.innerText.includes('Sari Wulandari')),
  )
  catat(chipDariKatalog, 'lead dari katalog tidak bisa diklik dari papannya')
  await page2.screenshot({ path: path.join(OUT, '32-crm-lead-katalog-1440.png'), fullPage: true })

  console.log('\n=== KONSOL HALAMAN PUBLIK ===')
  console.log(konsolPublik.length ? konsolPublik.join('\n  ') : '  bersih: tidak ada error maupun warning')

  // ---------- 6. uji lebar kecil: tidak boleh ada scroll horizontal ----------
  for (const [lebar, tinggi, nama] of [[768, 1024, '768'], [375, 812, '375']]) {
    await page.setViewportSize({ width: lebar, height: tinggi })
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      klien: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }))
    catat(overflow.scroll <= overflow.klien + 1, `overflow horizontal di ${nama}px (scroll ${overflow.scroll} > klien ${overflow.klien})`)

    // tabel lebar harus benar-benar bisa di-scroll di dalam wadahnya, bukan menyusut
    const tabel = await page.evaluate(() =>
      [...document.querySelectorAll('table')].map((t) => ({
        lebar: Math.round(t.getBoundingClientRect().width),
        minW: parseFloat(getComputedStyle(t).minWidth) || 0,
        scroll: t.parentElement.scrollWidth,
        klien: t.parentElement.clientWidth,
      })),
    )
    tabel.forEach((t) => {
      catat(t.lebar >= t.minW - 1, `tabel di ${nama}px menyusut di bawah min-width (${t.lebar} < ${t.minW})`)
      catat(t.minW <= t.klien || t.scroll > t.klien, `wadah tabel di ${nama}px tidak bisa di-scroll`)
    })
    await page.screenshot({ path: path.join(OUT, `04-dashboard-${nama}.png`), fullPage: true })

    // halaman inventory juga harus bersih dari overflow di layar sempit
    await page.goto(BASE + '/inventory', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
    const overflowInv = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      klien: document.documentElement.clientWidth,
    }))
    catat(overflowInv.scroll <= overflowInv.klien + 1, `overflow horizontal di inventory ${nama}px (${overflowInv.scroll} > ${overflowInv.klien})`)
    await page.screenshot({ path: path.join(OUT, `08-inventory-${nama}.png`), fullPage: true })

    // katalog publik juga harus bersih di layar sempit (dibuka tanpa login)
    await page2.setViewportSize({ width: lebar, height: tinggi })
    await page2.goto(BASE + '/katalog', { waitUntil: 'domcontentloaded' })
    await page2.waitForTimeout(500)
    const overflowKat = await page2.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      klien: document.documentElement.clientWidth,
    }))
    catat(overflowKat.scroll <= overflowKat.klien + 1, `overflow horizontal di katalog ${nama}px (${overflowKat.scroll} > ${overflowKat.klien})`)
    await page2.screenshot({ path: path.join(OUT, `29b-katalog-${nama}.png`), fullPage: true })
  }

  // ---------- 7. tema dasar benar-benar terpasang ----------
  const gaya = await page.evaluate(() => {
    const b = getComputedStyle(document.body)
    return { latar: b.backgroundColor, font: b.fontFamily, ukuran: b.fontSize }
  })
  catat(/IBM Plex Sans/.test(gaya.font), `font body bukan IBM Plex Sans: ${gaya.font}`)
  catat(gaya.latar !== 'rgba(0, 0, 0, 0)', 'latar kanvas tidak terpasang (masih transparan)')

  await browser.close()

  console.log('=== GAYA TERHITUNG ===')
  console.log(JSON.stringify(gaya, null, 2))
  console.log('=== PIL TERLEBAR ===')
  pilTerlebar.forEach((p) => console.log(`  ${p.lebar}px  ${p.teks}`))

  console.log('\n=== KEPADATAN TABEL INVENTORY ===')
  console.log(`  tinggi baris: min ${tinggiBaris.min}px · median ${tinggiBaris.median}px · maks ${tinggiBaris.maks}px`)

  console.log('\n=== WARNA PENANDA FOLLOW-UP (CRM) ===')
  console.log(`  akan datang: ${warnaBadge.akanDatang} · terlambat: ${warnaBadge.terlambat}`)

  console.log('\n=== KONSOL BROWSER ===')
  if (konsol.length === 0) console.log('  bersih: tidak ada error maupun warning')
  else konsol.slice(0, 20).forEach((k) => console.log('  ' + k))

  console.log('\n=== SCREENSHOT ===')
  fs.readdirSync(OUT).sort().forEach((f) => {
    const s = fs.statSync(path.join(OUT, f))
    console.log(`  ${f}  ${(s.size / 1024).toFixed(0)} KB`)
  })

  console.log('\n=== HASIL QA ===')
  if (masalah.length) {
    console.error(`GAGAL — ${masalah.length} masalah:`)
    masalah.forEach((m) => console.error('  ✗ ' + m))
    process.exit(1)
  }
  console.log('LULUS — login, penyaringan peran, render dashboard, dan responsivitas OK.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
