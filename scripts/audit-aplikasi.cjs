#!/usr/bin/env node
/**
 * Audit menyeluruh lintas peran (F10).
 *
 * Berbeda dari qa-screenshot.cjs yang memeriksa alur satu per satu, skrip ini menyapu
 * SELURUH rute × SETIAP peran dan memeriksa:
 *   1. hak akses benar-benar berlaku pada rute (bukan hanya menu disembunyikan)
 *   2. daftar menu yang tampil sama persis dengan hak peran itu
 *   3. tidak ada teks penanda fase / placeholder di layar mana pun
 *   4. tidak ada tautan mati (href internal yang tidak punya rute)
 *   5. setiap kontrol formulir punya label, setiap tombol ikon punya nama aksesibel
 *   6. tidak ada overflow horizontal di 1440 / 768 / 375
 *   7. konsol bersih dan tidak ada permintaan yang gagal
 *
 * Spesifikasi di bawah ditulis terpisah dari kode aplikasi — justru itu gunanya:
 * kalau kode dan spesifikasi berasal dari sumber yang sama, audit tidak membuktikan apa pun.
 *
 * Hasil: .qa/audit-aplikasi.md (dan exit 1 bila ada temuan)
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const BASE = process.env.QA_BASE || 'http://localhost:4173'
const AKAR = path.join(__dirname, '..')
const OUT = path.join(AKAR, '.qa')
const D = JSON.parse(fs.readFileSync(path.join(AKAR, 'src', 'data', 'dataset.json'), 'utf8'))

/* ------------------------------------------------------------------ *
 * Spesifikasi independen
 * ------------------------------------------------------------------ */

const HAK = {
  OWNER: [
    '/', '/inventory', '/inventory/:id', '/procurement', '/inspeksi', '/reconditioning', '/dokumen',
    '/crm', '/crm/:leadId', '/customer', '/customer/:customerId', '/booking', '/penjualan',
    '/finance', '/biaya', '/laporan', '/performa',
  ],
  ADMIN: [
    '/', '/inventory', '/inventory/:id', '/procurement', '/inspeksi', '/reconditioning', '/dokumen',
    '/crm', '/crm/:leadId', '/customer', '/customer/:customerId', '/booking', '/penjualan',
  ],
  SALES: [
    '/', '/inventory', '/inventory/:id', '/crm', '/crm/:leadId', '/customer', '/customer/:customerId',
    '/booking', '/penjualan',
  ],
}

const MENU = {
  OWNER: ['Dashboard', 'Inventory', 'Procurement', 'Inspeksi', 'Reconditioning', 'Dokumen', 'CRM & Leads',
    'Customer', 'Booking', 'Penjualan', 'Finance', 'Biaya Operasional', 'Laporan', 'Performa Sales'],
  ADMIN: ['Dashboard', 'Inventory', 'Procurement', 'Inspeksi', 'Reconditioning', 'Dokumen', 'CRM & Leads',
    'Customer', 'Booking', 'Penjualan'],
  SALES: ['Dashboard', 'Inventory', 'CRM & Leads', 'Customer', 'Booking', 'Penjualan'],
}

/** Halaman yang sengaja dibatasi — dipakai untuk membuktikan pembatasannya nyata. */
const KONTEN_KHAS = {
  '/finance': 'modal unit terjual',
  '/biaya': 'rata-rata per bulan',
  '/laporan': 'sebaran umur inventory',
  '/performa': 'capaian target',
}

const TEKS_TERLARANG = [
  { pola: /belum dibuat/i, nama: '"belum dibuat"' },
  { pola: /modul berikutnya/i, nama: '"modul berikutnya"' },
  { pola: /dibangun pada f\d/i, nama: 'penanda fase' },
  { pola: /\bTBD\b/, nama: 'TBD' },
  { pola: /lorem ipsum/i, nama: 'lorem ipsum' },
  { pola: /\bTODO\b/, nama: 'TODO' },
  { pola: /coming soon|segera hadir/i, nama: '"coming soon"' },
  { pola: /undefined|null\b/i, nama: 'nilai undefined/null di layar' },
]

const contohIsi = {
  ':id': D.vehicles.find((v) => v.status === 'READY').id,
  ':leadId': D.leads[0].id,
  ':customerId': D.customers[0].id,
}

const ruteStatis = ['/login']
const rutePublik = ['/katalog', '/katalog/:id']
const ruteApp = [...new Set(Object.values(HAK).flat())]

const wujudkan = (pola) => pola.replace(/:[a-zA-Z]+/g, (m) => contohIsi[m] ?? '1')
const semuaJalur = [...ruteStatis, ...rutePublik, ...ruteApp]

const temuan = []
const catat = (kondisi, pesan) => { if (!kondisi) temuan.push(pesan) }
const baris = []
const jumlah = { rute: semuaJalur.length, peran: Object.keys(HAK).length, periksa: 0 }

const cocokRute = (href) => {
  const bersih = href.split('?')[0].split('#')[0]
  if (bersih === '/') return true
  return semuaJalur.some((p) => new RegExp(`^${p.replace(/:[a-zA-Z]+/g, '[^/]+')}$`).test(bersih))
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const konteks = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await konteks.newPage()

  const konsol = []
  const gagalMuat = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) konsol.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => konsol.push(`pageerror: ${e.message}`))
  page.on('response', (r) => { if (r.status() >= 400) gagalMuat.push(`${r.status()} ${r.url().replace(BASE, '')}`) })

  const ambil = async (jalur) => {
    await page.goto(BASE + jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(320)
    return {
      teks: await page.locator('main').innerText().catch(() => ''),
      menu: await page.evaluate(() =>
        [...document.querySelectorAll('aside nav a')].map((a) => a.innerText.trim()).filter(Boolean),
      ),
      tautan: await page.evaluate(() => [...document.querySelectorAll('main a[href]')].map((a) => a.getAttribute('href'))),
      kontrol: await page.evaluate(() =>
        [...document.querySelectorAll('main input, main select, main textarea')].map((el) => ({
          tag: el.tagName.toLowerCase(),
          nama: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || '',
          adaLabel: Boolean(el.closest('label')?.innerText?.trim()) || Boolean(el.id && document.querySelector(`label[for="${el.id}"]`)),
          placeholder: el.getAttribute('placeholder') || '',
        })),
      ),
      tombol: await page.evaluate(() =>
        [...document.querySelectorAll('main button, main a')].map((el) => ({
          teks: (el.innerText || '').trim(),
          aria: (el.getAttribute('aria-label') || '').trim(),
          judul: (el.getAttribute('title') || '').trim(),
        })),
      ),
      overflow: await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        klien: document.documentElement.clientWidth,
      })),
      punyaMain: await page.evaluate(() => document.querySelectorAll('main').length),
      jumlahH1: await page.evaluate(() => document.querySelectorAll('h1').length),
    }
  }

  const periksaStruktur = (nama, r) => {
    jumlah.periksa += 2
    catat(r.punyaMain === 1, `${nama}: jumlah elemen <main> = ${r.punyaMain} (harus tepat 1 landmark)`)
    catat(r.jumlahH1 === 1, `${nama}: jumlah <h1> = ${r.jumlahH1} (harus tepat 1 judul utama)`)
  }

  // ---------- 1. halaman publik tanpa login ----------
  for (const pola of [...ruteStatis, ...rutePublik]) {
    const jalur = wujudkan(pola)
    const r = await ambil(jalur)
    jumlah.periksa += TEKS_TERLARANG.length + 2
    periksaStruktur(`publik ${jalur}`, r)
    for (const t of TEKS_TERLARANG) catat(!t.pola.test(r.teks), `publik ${jalur}: memuat ${t.nama}`)
    catat(r.overflow.scroll <= r.overflow.klien + 1, `publik ${jalur}: overflow horizontal ${r.overflow.scroll} > ${r.overflow.klien}`)
    catat(r.teks.trim().length > 40, `publik ${jalur}: halaman hampir kosong`)
  }

  // ---------- 2. tamu yang belum masuk: rute ERP harus dialihkan ke login ----------
  const ruteTerjaga = ['/', '/inventory', '/finance', '/crm', '/laporan']
  for (const jalur of ruteTerjaga) {
    await page.goto(BASE + jalur, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
    jumlah.periksa += 1
    catat(
      page.url().includes('/login'),
      `tamu (belum masuk) membuka ${jalur}: tidak dialihkan ke login (${page.url().replace(BASE, '')})`,
    )
  }

  // ---------- 3. masuk sebagai Owner untuk memulai ----------
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 8000 })
  const pemilihPeran = page.getByTitle('Ganti peran untuk kebutuhan demo')

  // ---------- 4. setiap peran × setiap rute ----------
  for (const peran of Object.keys(HAK)) {
    await pemilihPeran.selectOption(peran)
    await page.waitForTimeout(250)
    const boleh = HAK[peran]

    for (const pola of ruteApp) {
      const jalur = wujudkan(pola)
      const r = await ambil(jalur)
      const ditolak = r.teks.includes('tidak terbuka untuk peran Anda')
      const seharusnyaBoleh = boleh.includes(pola)
      jumlah.periksa += 6 + TEKS_TERLARANG.length

      catat(
        ditolak === !seharusnyaBoleh,
        `${peran} ${jalur}: ${seharusnyaBoleh ? 'seharusnya boleh dibuka tapi ditolak' : 'seharusnya ditolak tapi terbuka'}`,
      )
      if (seharusnyaBoleh) {
        periksaStruktur(`${peran} ${jalur}`, r)
        for (const t of TEKS_TERLARANG) catat(!t.pola.test(r.teks), `${peran} ${jalur}: memuat ${t.nama}`)
        catat(r.teks.trim().length > 80, `${peran} ${jalur}: halaman hampir kosong`)
        const menuHarus = MENU[peran]
        const menuAda = r.menu.filter((m) => menuHarus.includes(m))
        catat(
          menuAda.length === menuHarus.length,
          `${peran} ${jalur}: menu tampil ${menuAda.length} dari ${menuHarus.length} item yang berhak`,
        )
        const menuTerlarang = r.menu.filter((m) => !menuHarus.includes(m))
        catat(menuTerlarang.length === 0, `${peran} ${jalur}: menu memuat item tanpa hak: ${menuTerlarang.join(', ')}`)
        for (const href of r.tautan) {
          if (!href || !href.startsWith('/')) continue
          catat(cocokRute(href), `${peran} ${jalur}: tautan mati ${href}`)
        }
        for (const k of r.kontrol) {
          catat(
            Boolean(k.nama) || k.adaLabel || Boolean(k.placeholder),
            `${peran} ${jalur}: ${k.tag} tanpa label/aria-label/placeholder`,
          )
        }
        for (const b of r.tombol) {
          catat(Boolean(b.teks) || Boolean(b.aria) || Boolean(b.judul), `${peran} ${jalur}: elemen tanpa nama aksesibel`)
        }
      } else {
        // pembatasan harus benar-benar menahan isi halaman, bukan hanya menampilkan pesan
        const khas = KONTEN_KHAS[pola]
        if (khas) catat(!r.teks.toLowerCase().includes(khas), `${peran} ${jalur}: isi halaman tetap terbaca meski dibatasi`)
      }

      baris.push({
        peran,
        jalur,
        status: ditolak ? 'ditolak' : 'dibuka',
        menu: r.menu.length,
      })
    }
  }

  // ---------- 4. penyapuan lebar layar ----------
  await pemilihPeran.selectOption('OWNER')
  await page.waitForTimeout(250)
  for (const [lebar, tinggi] of [[1440, 900], [768, 1024], [375, 812]]) {
    await page.setViewportSize({ width: lebar, height: tinggi })
    for (const pola of [...ruteApp, ...rutePublik]) {
      const jalur = wujudkan(pola)
      const r = await ambil(jalur)
      jumlah.periksa += 1
      catat(
        r.overflow.scroll <= r.overflow.klien + 1,
        `${jalur} @${lebar}px: overflow horizontal ${r.overflow.scroll} > ${r.overflow.klien}`,
      )
    }
  }

  await browser.close()

  // ---------- laporan ----------
  const laporan = [
    '# Audit aplikasi lintas peran',
    '',
    `Dijalankan: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
    `Rute diuji: ${jumlah.rute} · peran: ${jumlah.peran} · pemeriksaan: ±${jumlah.periksa}`,
    '',
    `**Hasil: ${temuan.length === 0 ? 'LULUS — tidak ada temuan' : `GAGAL — ${temuan.length} temuan`}**`,
    '',
    '## Temuan',
    '',
    temuan.length ? temuan.map((t) => `- ${t}`).join('\n') : 'Tidak ada.',
    '',
    '## Matriks peran × rute',
    '',
    '| Peran | Rute | Hasil | Item menu |',
    '|---|---|---|---|',
    ...baris.map((b) => `| ${b.peran} | ${b.jalur} | ${b.status} | ${b.menu} |`),
    '',
    '## Konsol & permintaan gagal',
    '',
    konsol.length ? konsol.map((k) => `- ${k}`).join('\n') : 'Konsol bersih.',
    gagalMuat.length ? gagalMuat.map((g) => `- ${g}`).join('\n') : 'Tidak ada permintaan gagal.',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(OUT, 'audit-aplikasi.md'), laporan)

  console.log('=== AUDIT LINTAS PERAN ===')
  console.log(`rute ${jumlah.rute} · peran ${jumlah.peran} · pemeriksaan ±${jumlah.periksa}`)
  console.log(`konsol: ${konsol.length ? konsol.length + ' masalah' : 'bersih'} | permintaan gagal: ${gagalMuat.length}`)
  console.log(`laporan: .qa/audit-aplikasi.md pada matriks ${baris.length} baris`)
  if (temuan.length) {
    console.error(`\nGAGAL — ${temuan.length} temuan:`)
    temuan.slice(0, 40).forEach((t) => console.error('  ✗ ' + t))
    process.exit(1)
  }
  console.log('\nLULUS — hak akses, menu, teks, tautan, label, dan lebar layar sesuai spesifikasi.')
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
