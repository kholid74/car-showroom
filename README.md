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

Peran hanya menyaring navigasi dan tampilan. Seluruh logika bisnis tetap membaca dataset yang sama, sehingga
menambah akun demo baru tidak menyentuh logika aplikasi.

## Perintah data & pengujian

```bash
npm run data:generate                       # menulis ulang src/data/dataset.json (deterministik)
node scripts/verify-dataset.mjs             # memeriksa invariant dataset (wajib lulus sebelum push)
node scripts/tokens.py                      # menghitung ulang kontras token warna (WCAG)
NODE_PATH=$(npm root -g) node scripts/qa-screenshot.cjs   # QA visual + fungsional (Playwright)
```

`scripts/qa-screenshot.cjs` menjalankan aplikasi hasil build di browser sungguhan: memeriksa alur login,
penyaringan menu per peran, jumlah baris tiap halaman terhadap dataset, filter, ketertelusuran antar modul,
kepadatan tabel, overflow horizontal pada 768/375 px, dan konsol browser — lalu menyimpan screenshot ke `.qa/`.

## Struktur

```
scripts/     generator dataset, verifier invariant, QA Playwright, kalkulator kontras token
src/data/    dataset.json (dihasilkan), tipe, selector turunan, agregasi lintas modul
src/styles/  token desain (warna, tipografi, radius, gerak)
src/components/ui/   primitif: Panel, Money, StatusPill, IdChip, Table, FilterChip, SelRingkas
src/routes/  halaman: dashboard, inventory, detail unit, procurement, inspeksi,
             reconditioning, dokumen, CRM, lead, customer
src/store/   sesi demo (peran) dan perubahan tahap lead selama sesi
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
daftar pengecualian dokumen, dan larangan teks placeholder.

## Batasan yang disengaja

- **Tanpa backend.** Perubahan tahap lead pada halaman CRM hanya berlaku selama sesi dan kembali setelah halaman
  dimuat ulang; antarmuka menyatakan hal ini secara terbuka.
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
F3 inventory · F4 detail unit · F5 procurement/inspeksi/reconditioning/dokumen · F6 CRM & customer.
Berikutnya: F7 penjualan & keuangan, F8 laporan, F9 katalog publik, F10 QA menyeluruh, F11 deploy.
