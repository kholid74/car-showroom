# car-showroom — F0 Design Brief
**Showroom / Used-Car Dealer Management System — showcase frontend untuk Kalsara Digital Studio**
Status: **direvisi 5 Okt 2026 setelah audit dan permintaan pembenahan showcase**.

## Revisi implementasi 5 Oktober 2026

Arah awal di bawah adalah catatan historis. Untuk pengalaman demo, keputusan terbaru memakai navigasi gelap, area kerja terang, judul halaman lebih kuat, foto ilustrasi kendaraan lokal, kartu inventory sebagai tampilan awal, dan CTA dashboard untuk menelusuri satu unit. Aturan lama tanpa fotografi dan placeholder katalog tidak berlaku. Foto bersumber dari Wikimedia Commons; atribusi tersedia pada /photo-credits.html. Data dan komponen existing tetap dipakai.

Skenario regresi utama: katalog satu tab → inquiry → pindah tahap CRM → booking → penjualan, dengan identitas pelanggan, harga kesepakatan, status, dan timeline yang mengikuti perubahan. Jalankan scripts/verify-showcase.cjs dengan Playwright tersedia melalui NODE_PATH.

Skenario proses unit: Baru Masuk → Inspeksi → Perbaikan → Siap Jual dengan gerbang yang menuntut hasil inspeksi dan perbaikan yang selesai (catatan perbaikan dibuat otomatis saat unit masuk tahap Perbaikan), ditambah pelunasan piutang dari halaman Keuangan. Jalankan scripts/uji-alur-proses.cjs dengan cara yang sama.


---

## 1. Brief

| Item | Isi |
|---|---|
| Yang dirancang | Clickable demo ERP showroom mobil bekas + katalog publik, 3 role (Owner / Admin / Sales) |
| Untuk siapa | Calon klien Kalsara: pemilik & manajer showroom mobil bekas Indonesia (demo 5–10 menit, hands-on) |
| Platform | Web, desktop-first (≥1280px), tetap enak di tablet (768px) dan tidak rusak di 375px |
| Tujuan utama | Dalam 5–10 menit, klien paham: "satu unit bisa dilacak dari dibeli sampai terjual, dan semua angka cocok" |
| Objektif yang harus dikalahkan | "Ini cuma template admin / dashboard generik" dan "angka-angkanya pasti karangan" |
| Tone | Operasional-presisi: tenang, padat, tepercaya. Bukan marketing, bukan cyberpunk |
| Must remember | **One unit, one ID, satu jalur data** — `VH-2026-0012` muncul di procurement, inspeksi, recon, inventory, lead, booking, penjualan, finance, laporan |
| Constraint | Tanpa backend/DB. Dataset sintetis di-generate konsisten secara matematis. Bahasa Indonesia. Tanpa Lorem Ipsum |
| Path | Visual exploration: 3 arah terkunci referensi → pilih 1 → direct build |

**Bukan target:** full accounting, tax engine, payment gateway, WhatsApp API, OCR, AI pricing (spec §26).

---

## 2. Riset (referensi nyata, bukan ingatan model)

Refero MCP tidak tersedia di lingkungan ini → riset dilakukan langsung ke HTML/CSS produk nyata
(`/tmp/refprobe.json`, 3 Okt 2026). Empat situs, masing-masing disonde font + warna + radius.

### 2.1 vAuto (Cox Automotive) — **kebenaran domain** (dealer inventory software, pemimpin pasar AS)
- Font aktual: `"gotham", sans-serif` untuk display; Google Fonts **Montserrat** + **Open Sans** dimuat
- Palet: `#fff` / `#f0f0f0` / `#ddd` (kanvas abu netral), `#949494` (teks sekunder), aksen **`#f90`** (oranye) dan `#0757fe` / `#0a7aff` (biru)
- Radius: **`9999px`** (pill, terbanyak) + `4px` untuk kontrol
- Yang diambil: pil status sebagai unit bahasa visual, oranye dipakai **hanya** sebagai penanda perhatian, radius 4px untuk kontrol padat
- Yang **tidak** diambil: estetika enterprise kuno-nya. Ini justru contoh "yang harus dikalahkan" — layoutnya padat tapi tidak premium

### 2.2 Mercury — **polish editorial di atas data** (banking untuk startup)
- Font aktual: `arcadia` / `arcadiaDisplay` (sans, custom) sebagai body+display; `tiempos` / `tiemposHeadline` / `tiempos-fine` (serif) untuk aksen teks; **IBM Plex Mono** untuk mono
- Palet: kanvas `#fbfcfd` (nyaris putih, dingin), permukaan `#f5f4fd` (lavender sangat tipis), ink `#363644` / `#535461`, garis `#dddde5`, aksen **`#4d68eb`**
- Radius: berbasis token (`--radius-xl`, `--radius-4xl`) + `12px`
- Yang diambil: kanvas nyaris-putih dingin dengan *hairline* (bukan drop shadow), uang selalu angka tabular berukuran besar, aksen sangat hemat
- Yang **tidak** diambil: serif display. Untuk ERP, serif berisiko jatuh ke "calm editorial" — itu salah satu tell AI yang paling kentara

### 2.3 Attio — **CRM data-native**
- Palet: satu set aksen dekoratif (`#febe8e`, `#f9d671`, `#85abf6`, `#7debbc`, `#ffa09f`) + biru fungsional `#266df0`; ink `#000`
- Radius: `12px` + `4px`
- Yang diambil: warna dekoratif terang **hanya** untuk objek/avatar (manusia & unit), tidak pernah untuk chrome UI atau status
- Yang **tidak** diambil: kanvas `#000` dan keragaman warna sebagai bahasa utama — di ERP, warna harus berarti

### 2.4 carwow — **katalog mobil konsumen**
- Arsitektur token nyata: `--font-family-headlines`, `--heading-1..4-font-family`, `--border-radius-small/medium`, `--heading-text-transform: uppercase`
- Palet: hitam `#000` dominan, red `#d02e26`, green `#42944a` / `#6aac46`, lime `#cad444`, yellow `#fcee50`, orange `#dc6e2d` — sinyal otomotif, saturasi tinggi, dipakai hemat
- Yang diambil (untuk **katalog publik**, F9): heading uppercase bertracking, kartu dipimpin foto, radius medium, warna status penjualan yang tegas
- Yang **tidak** diambil: saturasi tinggi itu untuk ERP internal — akan jadi bising di tabel 40 baris

### 2.5 Pola produk yang layak ditiru dari literatur desain (2026)
- **Tabel adalah produknya.** Investasi terbesar di densitas baris, inline action, dan keterbacaan kolom angka (Attio/Retool/Twenty-style)
- **Progressive disclosure.** Linear menghapus chart dari tampilan utama. Setiap metrik di dashboard harus menjawab keputusan showroom, bukan menghias
- **Empty state sebagai onboarding**, bukan kotak kosong
- **Kartu KPI: satu angka bernilai tinggi per kartu**, detail di balik drawer/interaksi (studi kasus CRM 360.Agency untuk dealer)
- Studi kasus dealer nyata: manajer **menolak grafik rumit** → dahulukan angka + status, bukan visualisasi berat. Ini bukti langsung untuk keputusan kita di §7

---

## 3. Konsekuensi desain untuk produk ini

1. **Kepadatan menang atas udara.** Baris tabel 40–44px, font tabel 13px, angka tabular. Ini alat kerja 8 jam, bukan landing page.
2. **Warna harus berarti.** 6 status unit + 8 tahap pipeline + 3 tingkat inspeksi = 17 nilai semantik. Warna dekoratif dilarang masuk ke area ini.
3. **ID adalah jangkar visual.** `VH-2026-0012` / `INV-2026-00921` ditampilkan mono + tracking, bisa diklik lintas modul. Ini yang membuktikan integrasi data dalam 3 detik pertama.
4. **Uang dalam Rupiah = angka tabular, satuan lebih kecil dari nilai.** `Rp449.000.000` dengan `tabular-nums`; satuan jt/M untuk KPI ringkas.
5. **Kartu bukan default.** Pemisah hairline dan kolom lebih sering dipakai daripada kotak bershadow. Kartu hanya kalau memang unit interaksi (kartu lead, kartu unit) — sesuai anti-pattern #2.
6. **Dua permukaan, satu sistem token.** ERP (F2–F8) utilitarian; katalog publik (F9) boleh fotogenik. Token warna/tipe sama, densitas dan treatment media berbeda. Inilah yang membuat "public website dan ERP terasa satu ekosistem" (spec §22) secara visual, bukan cuma di narasi.

---

## 4. Sistem status semantik (dihitung, bukan dikira-kira)

Kontras dihitung WCAG. Semua lolos ≥ 4,5:1 untuk teks putih di atas pil terisi.

| Status unit | Hex | OKLCH | Putih di atasnya |
|---|---|---|---|
| BARU MASUK | `#5B6672` | `oklch(50.5% 0.023 250.6)` | 5,85:1 |
| INSPEKSI | `#0F6E8C` | `oklch(50.2% 0.092 226.1)` | 5,79:1 |
| RECONDITIONING | `#9A5B06` | `oklch(53.1% 0.118 64.4)` | 5,42:1 |
| READY | `#1E7A46` | `oklch(51.4% 0.117 153.6)` | 5,35:1 |
| BOOKED | `#7A3E9D` | `oklch(48.3% 0.155 311.1)` | 6,99:1 |
| SOLD | `#3A4550` | `oklch(38.5% 0.024 248.4)` | 9,78:1 |

Inspeksi: GOOD `#1E7A46` · ATTENTION `#9A5B06` · REPAIR REQUIRED `#B3261E` (6,54:1 putih di atasnya).

**Catatan aturan token (anti-pattern #8):** ungu di sini **hanya** berarti "unit terkunci oleh booking". Ungu tidak boleh jadi warna brand, tombol, atau dekorasi. Kalau aturan ini dilanggar, sistem status kehilangan artinya — dan itu penyebab utama dasbor ERP terasa generik.

---

## 5. Tiga arah visual (pilih satu)

### Arah A — "Meja Kerja" · utilitarian-presisi, kanvas terang
Dasar: **Mercury** (kanvas dingin nyaris-putih + hairline + angka besar) · serapan: **vAuto** (pil status, radius 4px kontrol, oranye sebagai penanda perhatian saja)

- Kanvas `#F7F8FA` `oklch(97.9% 0.003 264.5)` · panel `#FFFFFF` · sunken `#EFF2F5`
- Ink `#15181D` (16,7:1) · sekunder `#4C545E` (7,2:1) · tersier `#67707B` (4,73:1, sudah diperbaiki dari 3,67:1 yang gagal AA)
- Aksen aksi primer **petrol blue `#0E4F7C`** `oklch(41.3% 0.097 245.3)` · hover `#0A3D62` — **hanya** untuk tombol primer, nav aktif, dan focus ring
- Semantik uang: margin positif `#0B5F3F`, perhatian `#9A5B06` — tidak pernah untuk dekorasi
- Hairline `#E2E6EB`; radius 4px kontrol, 6px panel; **tanpa** drop shadow kecuali popover/drawer
- Tipe: satu keluarga sans untuk UI (Geist/Inter) + mono untuk ID, plat, VIN. Skala minor-third (11/13/16/19/23/28/33), tabel 13px
- **Signature move:** *money rail* sticky di kanan Vehicle Detail — Total Modal → Harga Listing → Potensi Margin bertumpuk vertikal dengan angka tabular besar; setiap baris bisa diklik ke sumbernya (biaya recon → daftar pekerjaan)
- Risiko yang saya terima: paling "tenang" dari ketiganya; keunggulannya baru terasa saat data sudah padat

### Arah B — "Ruang Pamer" · otomotif-premium
Dasar: **carwow** (heading uppercase bertracking, kartu dipimpin foto, warna otomotif tegas) · serapan: chrome gelap ala Linear hanya untuk rail navigasi

- Kanvas `#FFFFFF` + netral hangat `#F6F4F1` · chrome/rail `#15171C`
- Aksen **merah otomotif `#C7362C`** `oklch(55.3% 0.184 28.6)` — tombol primer "Booking"/"Jual" saja; sukses `#2E7D4F`
- Label uppercase + `letter-spacing: 0.08em` untuk grup nav & label KPI; radius medium (8px)
- **Signature move:** kartu unit dengan pita status di tepi atas + foto; unit SOLD diberi cap miring "TERJUAL" — bahasa visual yang sama dipakai di katalog publik
- Risiko: paling cepat "terasa" saat demo, tapi densitas tabel lebih lemah; uppercase berlebihan cepat terasa seperti template

### Arah C — "Pit Stop" · gelap-first, keyboard-first
Dasar: **Linear** (chrome tenang, densitas tinggi, keyboard-first)

- Kanvas `#0E1013` `oklch(17.2% 0.007 258.4)` · panel `#171A1F` · ink `#F2F4F6` · aksen lime `#D8F26B`
- **Signature move:** command palette (⌘K) sebagai jalan utama antar modul; baris tabel dipimpin ID mono
- Risiko: anti-pattern #3 menyebut gelap-sebagai-default itu tell AI; untuk demo tatap muka di ruangan terang, dasbor gelap juga lebih sulit dibaca. Saya **tidak** merekomendasikan ini sebagai arah utama

---

## 6. Rekomendasi

**Arah A sebagai fondasi ERP**, dengan **satu serapan terbatas dari Arah B untuk katalog publik (F9)**: kartu dipimpin foto, label uppercase bertracking, radius medium. Gagasan intinya: satu sistem token, dua tingkat kepadatan.

Alasan:
1. Beban utama demo adalah tabel + angka uang; Arah A mengoptimalkannya, dan setiap token sudah terbukti lolos kontras
2. Berbasis Mercury (produk yang secara konsisten diakui sebagai paling premium untuk data finansial) tanpa menyalin serif-nya
3. Arah B lebih cepat memukau di 30 detik pertama tapi lebih cepat terasa seperti template di menit ke-7, saat klien mulai menyaring tabel — dan demo ini dinilai pada menit ke-5 sampai 10
4. Arah C bertentangan dengan temuan anti-pattern dan kondisi ruangan demo

---

## 7. Rencana token (dipakai mulai F1/F2)

- **Warna:** kanvas / panel / sunken / hairline / ink 3 tingkat / aksen 2 tingkat / 6 status + 3 inspeksi + 8 tahap pipeline (tahap pipeline memakai keluarga warna status, dibedakan lewat bobot & bentuk ikon, bukan hue baru)
- **Tipe:** 1 keluarga UI + 1 mono. Skala 11/13/16/19/23/28/33 (maks 8 ukuran). Berat 400/500/600 saja. `tabular-nums` wajib di semua angka uang, counter, tanggal kolom
- **Spasi:** basis 4pt, semantik `--space-1..12`; ritme baris tabel 40px / 44px
- **Radius:** 4px kontrol · 6px panel/kartu · 999px pil status
- **Elevasi:** hairline sebagai default; shadow hanya untuk popover, dropdown, drawer
- **Motion:** 120–180ms, hanya `transform` + `opacity`, easing bernama; hormati `prefers-reduced-motion`
- **Guardrail khusus proyek ini:**
  - Tidak ada emoji sebagai ikon (Lucide)
  - Tidak ada indigo/violet sebagai warna brand (ungu hanya status BOOKED)
  - Tidak ada kartu dekoratif, tidak ada accent stripe kiri kecuali berarti status
  - Tidak ada grafik yang tidak menjawab keputusan showroom
  - Angka mati (aging 18/12/8/4 unit, dst) dihitung dari dataset, bukan ditulis tangan

---

## 9. KEPUTUSAN TERKUNCI (3 Okt 2026)

| Keputusan | Nilai | Catatan |
|---|---|---|
| Arah visual ERP | **Arah A — "Meja Kerja"** | Utilitarian-presisi, kanvas dingin nyaris-putih, hairline bukan shadow |
| Arah visual katalog publik (F9) | **Serapan terbatas Arah B** | Kartu dipimpin foto + label uppercase bertracking, radius medium; token warna/tipe sama |
| Keluarga font | **IBM Plex Sans** (UI) + **IBM Plex Mono** (ID, plat, VIN, angka teknis) | Satu superfamily — konsisten, berkarakter teknik/industri, di-self-host lewat `@fontsource` |
| Framework CSS/components | **Tailwind v4 + komponen tulis sendiri** | **shadcn/ui DITOLAK** — tampilan defaultnya justru generik; brief §23 melarangnya |
| State management | Zustand + satu dataset bertipe sebagai sumber tunggal | Tidak ada fetch, tidak ada DB |

### Reference lock

```
Primary reference : Mercury — kanvas oklch(97.9% 0.003 264.5), hairline, angka uang besar
Preserve          : kanvas dingin nyaris-putih · pemisah hairline (bukan shadow) · aksen sangat hemat · densitas tabel tinggi
Borrow only       : vAuto — pil status radius 999px + radius 4px untuk kontrol padat + oranye khusus penanda perhatian
Reject            : serif display Mercury (risiko "calm editorial") · estetika enterprise-kuno vAuto ·
                    kanvas hitam + warna dekoratif Attio sebagai bahasa utama · saturasi carwow untuk tabel ERP
Media strategy    : tidak ada fotografi di ERP. Katalog publik (F9): slot foto beraspek tetap dengan placeholder
                    berarahan (bukan karangan). Tidak ada CSS-art palsu untuk meniru foto
```

### Decision ledger

| Keputusan | Sumber | Aturan peran yang dijaga | Alasan |
|---|---|---|---|
| Kanvas `#F7F8FA` + hairline `#E2E6EB` | Mercury (probe CSS) | Kanvas dingin, tanpa shadow | Data finansial butuh bidang tenang; hairline menjaga densitas tanpa bising |
| Aksen `#0E4F7C` hanya untuk aksi primer/nav aktif/focus | Mercury (aksen hemat) + vAuto (peran oranye) | Aksen tidak boleh jadi latar/badge/dekorasi | Aturan peran token; mencegah aksen kehilangan makna |
| 6 warna status + 3 inspeksi, kontras terhitung | vAuto (pil status) + kebutuhan domain | Warna = makna, tidak pernah dekorasi | 17 nilai semantik harus terbaca sekilas di tabel |
| Ungu hanya untuk BOOKED | temuan sendiri, dikunci sebagai aturan | Bukan warna brand | Status "terkunci booking" perlu terpisah dari kategori lain |
| Radius 4px kontrol / 999px pil | vAuto probe (`9999px`, `4px`) | Kontrol padat vs penanda status | Pil = status; radius persegi kecil = presisi alat |
| IBM Plex Sans + Mono | refero typography (Finance/Enterprise) | 1 keluarga UI + 1 mono | Menghindari Inter-generik; mono menautkan ID sebagai jangkar visual |
| Tanpa shadcn/ui | anti-ai-slop #2 + brief §23 | — | Tampilan default shadcn adalah wajah generik yang harus dikalahkan |
| `tabular-nums` pada semua uang/angka kolom | refero typography | — | Kolom Rupiah harus rata dan bisa dibandingkan vertikal |
| Dashboard tanpa grafik yang tidak menjawab keputusan | studi kasus CRM dealer (manajer menolak grafik rumit) | — | Menit ke-5–10 demo dinilai pada tabel, bukan hiasan |

Dokumen ini adalah target terkunci. Implementasi yang menyimpang dari lock ini harus dikoreksi, bukan dilunakkan.

