# car-showroom

Demo **sistem manajemen showroom mobil bekas** (ERP) + katalog publik, dibangun sebagai *showcase* untuk
Kalsara Digital Studio.

Inti demo ini satu kalimat: **satu unit kendaraan bisa dilacak dari dibeli sampai terjual, dan seluruh angkanya
konsisten di semua modul.** Setiap halaman membaca satu dataset yang sama — tidak ada data terpisah per halaman.

---

## Menjalankan

```bash
npm install
npm run dev            # pengembangan
npm run build          # cek tipe + build produksi
npm run preview        # menyajikan hasil build (dipakai untuk pengujian)
```

Akun demo (juga tersedia tombol masuk cepat di halaman login):

| Peran | Email | Kata sandi |
|---|---|---|
| Owner / Management | `owner@showroom.demo` | `demo123` |
| Admin Operational | `admin@showroom.demo` | `demo123` |
| Sales | `sales@showroom.demo` | `demo123` |

Peran menyaring navigasi dan tampilan. Seluruh logika bisnis tetap membaca dataset yang sama, sehingga
menambah akun demo baru tidak menyentuh logika aplikasi. Selain menyembunyikan menu, setiap halaman sensitif
juga dijaga pada tingkat rute: membuka `/finance` sebagai Sales menampilkan penjelasan, bukan datanya — karena
menyembunyikan menu saja bukan pembatasan.

| Peran | Menu | Halaman yang tidak terbuka |
|---|---|---|
| Owner / Management | 14 menu (semua) | — |
| Admin Operational | 10 menu | Finance, Biaya, Laporan, Performa |
| Sales | 6 menu | Procurement, Inspeksi, Reconditioning, Dokumen, Finance, Biaya, Laporan, Performa |

Katalog publik (`/katalog`) tidak butuh login sama sekali — itu sisi yang dilihat calon pembeli.

## Perintah data & pengujian

```bash
npm run data:generate                       # menulis ulang src/data/dataset.json (deterministik)
node scripts/verify-dataset.mjs             # memeriksa invariant dataset (wajib lulus sebelum push)
node scripts/tokens.py                      # menghitung ulang kontras token warna (WCAG)
npm run lint                                # oxlint: variabel mati, kode berbau salah, dsb.
NODE_PATH=$(npm root -g) node scripts/qa-screenshot.cjs     # QA alur per modul (Playwright)
NODE_PATH=$(npm root -g) node scripts/audit-aplikasi.cjs    # audit lintas peran + laporan .qa/
```

`scripts/audit-aplikasi.cjs` menyapu **setiap rute × setiap peran** dan memeriksa: hak akses benar-benar
berlaku pada rute (bukan hanya menunya disembunyikan), daftar menu yang tampil sama persis dengan hak peran,
tidak ada teks penanda fase atau placeholder, tidak ada tautan mati, setiap kontrol punya label, tepat satu
`<main>` dan satu `<h1>` per halaman, dan tidak ada overflow horizontal di 1440/768/375. Spesifikasi hak akses
ditulis terpisah di dalam skrip audit — kalau spesifikasi dan kode berasal dari sumber yang sama, audit tidak
membuktikan apa pun. Hasilnya ditulis ke `.qa/audit-aplikasi.md`.

`scripts/qa-screenshot.cjs` menjalankan aplikasi hasil build di browser sungguhan: memeriksa alur login,
penyaringan menu per peran, jumlah baris tiap halaman terhadap dataset, filter, ketertelusuran antar modul,
kepadatan tabel, notifikasi (jumlah di lonceng harus sama dengan isinya), pencarian global termasuk navigasi
hasilnya, overflow horizontal pada 768/375 px, dan konsol browser — lalu menyimpan screenshot ke `.qa/`.
Saat terakhir dijalankan: 89 asersi, semuanya lulus.

## Struktur

```
scripts/     generator dataset, verifier invariant, QA Playwright, kalkulator kontras token
src/data/    dataset.json (dihasilkan), tipe, selector turunan, agregasi lintas modul
src/styles/  token desain (warna, tipografi, radius, gerak)
src/components/ui/    primitif: Panel, Money, StatusPill, IdChip, Table, FilterChip, SelRingkas
src/components/app/   pencarian global (Ctrl+K) dan lonceng notifikasi
src/routes/  dashboard, inventory, detail unit, procurement, inspeksi, reconditioning, dokumen,
             CRM, lead, customer, booking, penjualan, finance, biaya, laporan, performa sales
src/routes/public/   katalog publik: daftar unit siap jual + halaman detail + form minat
src/store/   sesi demo (peran), perubahan tahap lead, dan minat dari katalog (sessionStorage)
docs/        riset desain + reference lock + decision ledger (F0)
```

## Data

Seluruh data **sintetis** dan dibuat otomatis (`scripts/generate-dataset.mjs`) secara deterministik:
44 unit, 44 pembelian, 40 inspeksi, 35 reconditioning, 39 lead, 22 customer, 14 booking, 11 transaksi penjualan,
dan 20 biaya operasional. Tidak ada data pelanggan, dokumen, atau kendaraan yang nyata pada demo ini.

Semua nilai uang **diturunkan**, bukan ditulis tangan:

```
total modal   = harga beli + biaya reconditioning + biaya lain
gross profit  = harga jual final − total modal
hari di inventory / aging  = dihitung dari tanggal unit masuk dan tanggal siap
```

`scripts/verify-dataset.mjs` memeriksa hal ini per unit dan per transaksi, termasuk urutan rantai proses
(beli → inspeksi → reconditioning → ready → lead → booking → terjual), integritas relasional antar ID,
konsistensi status pembayaran dengan sisa tagihan, kewajaran target sales terhadap realisasi, daftar
pengecualian dokumen, dan larangan teks placeholder — 13 kelompok invariant.

Target penjualan tiap sales **diturunkan dari realisasi** (unit terjual + 1), bukan angka yang dikarang: pada
demo dengan 11 penjualan, target 12 unit per orang per bulan akan langsung terlihat palsu.

## Batasan yang disengaja

- **Tanpa backend.** Perubahan tersimpan di sessionStorage selama tab terbuka, termasuk tahap lead. Navigasi katalog menggunakan tab yang sama agar inquiry dan ERP membaca sesi yang sama.
- **Foto ilustrasi model.** Katalog, inventory, dan detail memakai asset lokal dari Wikimedia Commons. Tahun, warna, dan varian foto dapat berbeda dari data contoh. Atribusi ada di /photo-credits.html. Tombol WhatsApp menampilkan pratinjau pesan; tidak mengirim pesan sungguhan.
- **Minat dari katalog** masuk ke CRM sebagai lead bersumber Website, ditugaskan ke sales dengan lead aktif paling
  sedikit, dan disimpan di `sessionStorage` — bertahan saat halaman dimuat ulang, hilang saat tab ditutup, tidak
  dikirim ke server mana pun.
- **Autentikasi demo**, bukan sistem keamanan. Kata sandi disimpan apa adanya di dataset demo.
- **Dokumen hanya metadata.** Tidak ada berkas STNK/BPKB maupun data pribadi.
- Di luar cakupan (sesuai brief): pembukuan penuh, mesin pajak, rekonsiliasi bank, payment gateway,
  integrasi multifinance, API marketplace, WhatsApp API, OCR dokumen, dan integrasi pemerintah.

## Desain

Arah visual dan tokennya dikunci dari riset produk nyata (vAuto/Cox Automotive, Mercury, Attio, carwow) dan
didokumentasikan di [`docs/DESIGN-BRIEF-F0.md`](docs/DESIGN-BRIEF-F0.md), termasuk *reference lock* dan
*decision ledger*. Seluruh nilai kontras token dihitung, bukan diperkirakan.

Prinsip yang dipegang: alat kerja 8 jam, bukan halaman pemasaran. Pemisah hairline alih-alih kartu bershadow,
angka tabular untuk semua nilai uang, dan warna yang selalu berarti (status, peringatan, laba) — tidak pernah
sebagai dekorasi.

## Status

Dibangun bertahap dengan pemeriksaan di setiap fase: F0 riset desain · F1 kerangka + dataset · F2 dashboard ·
F3 inventory · F4 detail unit · F5 procurement/inspeksi/reconditioning/dokumen · F6 CRM & customer ·
F7 booking/penjualan/finance/biaya · F8 laporan, performa sales, notifikasi, pencarian global ·
F9 katalog publik + minat masuk CRM · F10 audit lintas peran (hak akses, teks, tautan, label, lebar layar).
Berikutnya: F11 deploy ke Vercel.

Pemeriksaan yang dijalankan saat ini: verifier dataset 15 kelompok invariant · lint bersih ·
QA alur 109 asersi · audit lintas peran ±890 pemeriksaan pada 20 rute × 3 peran + tamu + publik.

---

## Cakupan tombol tambah / ubah / hapus

Demo ini bukan layar baca-saja. Setiap modul operasional punya tombol yang di dunia nyata memang dipakai,
dan semua tulisan melewati **satu lapisan sesi** (`src/store/sesi.ts`) sehingga angka turunan ikut berubah.

| Modul | Tombol yang tersedia |
|---|---|
| Inventory | Tambah unit · Ubah data unit · Ubah tahap (gerbang proses: wajib catatan, dan tahap Perbaikan/Siap Jual hanya terbuka setelah inspeksi tercatat dan perbaikan selesai) |
| Pembelian | Catat pembelian unit · Ubah harga penawaran/deal · Tandai dokumen penjual diterima |
| Inspeksi | Isi hasil inspeksi per titik periksa (skor & rekomendasi diturunkan dari temuan) · Antrean unit yang menunggu inspeksi |
| Reconditioning | Catatan perbaikan dibuat otomatis saat unit masuk tahap Perbaikan · Tambah pekerjaan (menambah modal unit) · Selesaikan per pekerjaan · Tandai selesai |
| Dokumen | Kelola kelengkapan enam berkas per unit |
| CRM | Tambah lead · Ubah lead · Pindah tahap |
| Customer | Tambah customer · Ubah customer |
| Booking | Buat booking · Ubah DP · Batalkan booking |
| Penjualan | Catat penjualan · Tandai serah terima |
| Keuangan | Tandai lunas piutang transaksi yang belum dibayar penuh |
| Biaya | Catat biaya · Ubah · Hapus |

**Baca-saja dengan alasan tertulis di layar:** Laporan dan Performa Sales — halaman laporan tidak diisi
manual, dan layarnya menyatakan itu supaya tidak terbaca sebagai halaman yang belum jadi.

**Batas yang disengaja:** unit yang belum lolos inspeksi/reconditioning tidak punya tombol catat penjualan,
tahap unit hanya bisa maju satu langkah dan menuntut bukti kerjanya (hasil inspeksi sebelum Perbaikan,
perbaikan selesai sebelum Siap Jual), dan pembelian yang sudah tercatat tidak bisa "dibatalkan" begitu saja —
membatalkan pembelian unit yang sudah ada di inventory akan menciptakan keadaan yang mustahil. Batas ini
ditegakkan, bukan dihilangkan.

Semua perubahan hidup di tab ini (sessionStorage), tampil di spanduk sesi di atas setiap halaman, dan bisa
dikembalikan dengan satu tombol **Kembalikan ke data demo**.
