# Audit kesesuaian brief, visual, dan pengalaman demo

Tanggal: 5 Oktober 2026. Acuan utama: `brief.md`. Objek: codebase lokal dan https://car-showroom.demo.kalsara.id/.

**Kesimpulan: cakupan modul dan fondasi data sudah kuat, tetapi kualitas presentasi dan kesinambungan interaksi belum memenuhi tujuan showcase premium yang bisa dicoba mandiri dalam 5–10 menit.**

Ini penilaian desain oleh reviewer dan pemeriksaan teknis, bukan hasil usability testing dengan calon klien sungguhan. Tidak ada perubahan kode aplikasi atau deployment pada audit ini.

## Metode dan batas pemeriksaan

- Membaca brief, keputusan desain F0, komponen UI, routing, dataset, selector, dan mutasi sesi.
- Membuka demo live dengan Chromium pada desktop 1440×900: login, dashboard Owner, inventory tabel/kartu, detail kendaraan, CRM, finance, katalog, dan detail katalog.
- Memeriksa dashboard, detail kendaraan, dan katalog pada viewport 375×812. Tidak ditemukan overflow horizontal dokumen pada sampel tersebut; ini tidak membuktikan seluruh konten tabel terlihat sekaligus.
- Mencoba alur inquiry katalog → CRM → pindah tahap, termasuk katalog yang dibuka lewat tautan sidebar ERP.
- Build lokal, lint, dan verifier dataset lulus. Build memberi peringatan satu JS chunk sekitar 966 kB sebelum gzip (192 kB gzip); ini belum merupakan bukti masalah performa di perangkat pengguna.
- Tidak ada exception JavaScript melalui event `pageerror` pada kunjungan halaman yang disampel. Tidak menjalankan ulang seluruh suite audit lintas role.
- Screenshot dan hasil browser tersimpan di `.qa/live-*.png`, `.qa/live-review.json`, `.qa/live-flow.json` (direktori diabaikan Git).

## Kesesuaian terhadap brief

| Area brief | Penilaian | Bukti / batas |
|---|---|---|
| Demo frontend tanpa backend, tiga role (§2,25,26) | Fondasi sesuai | React, TypeScript, Vite, React Router, Zustand; login cepat dan pergantian role tersedia. |
| Dataset bersama dan volume dummy (§20,21) | Sebagian besar tersedia | 44 kendaraan, 39 lead, 22 customer, 11 transaksi; selector menghitung modal/profit dari sumber bersama. Konsistensi tindakan baru masih bermasalah. |
| Dashboard (§3) | Ada, visual parsial | KPI dan perhatian operasional relevan; tren penjualan berupa tabel, belum memberi pembacaan visual cepat. |
| Inventory (§4) | Fungsional, media kurang | Search, filter, sort, tabel/kartu tersedia; foto kendaraan tidak ditampilkan. |
| Vehicle Detail (§5) | Struktur kuat, presentasi parsial | Sembilan tab, rincian modal/profit, riwayat; tanpa foto dan timeline tidak memasukkan perubahan sesi. |
| Procurement → inspection → recon (§6–8) | Bisa ditelusuri pada data bawaan; alur baru parsial | Form dan checklist ada; prospect pembelian dan pembuatan recon unit baru belum utuh. |
| CRM, customer, booking, sales (§9–12) | Ada, hubungan tindakan baru parsial | Kanban dan formulir tersedia; lead baru gagal pindah tahap, identitas customer/booking belum konsisten diteruskan. |
| Finance, expense, dokumen, reports, performance (§13–17) | Cakupan tersedia | Agregasi dan drill-down berguna; pembayaran lanjutan dan perubahan dokumen unit baru belum utuh. |
| Global search / notifikasi (§18–19) | Ada | Notifikasi booking memasukkan transaksi selesai. |
| Katalog → inquiry → CRM (§22) | Integrasi parsial | Form membuat lead lokal; tab katalog terpisah dari ERP; WhatsApp hanya penjelasan, request test drive belum khusus. |
| Visual premium dan Bahasa Indonesia (§23,27) | Belum memenuhi | Placeholder foto dominan, hierarki kecil, banyak label Inggris, identitas otomotif lemah. |
| Cerita demo mandiri 5–10 menit (§24) | Belum diarahkan | Pengunjung memilih sendiri dari 14 menu; tidak ada jalur utama untuk mengikuti satu kendaraan dari pembelian ke profit. |

## Mengapa visualnya terasa kurang menarik

### 1. Kendaraan tidak hadir sebagai objek visual — prioritas tinggi

Katalog dan detail katalog memakai blok abu-abu bertuliskan “Slot foto unit”; inventory kartu juga hanya teks. Halaman-halaman yang disampel tidak memiliki elemen gambar kendaraan. Dalam demo showroom, foto membantu mengenali unit, membedakan kartu, dan membangun kepercayaan terhadap kualitas produk.

Ini gap eksplisit terhadap foto pada §4/22 dan larangan placeholder unfinished pada §27, bukan sekadar preferensi selera. Implementasi: `src/routes/public/KatalogPage.tsx:25`. Screenshot: `../.qa/live-catalog.png`, `../.qa/live-catalog-detail.png`, `../.qa/live-inventory-grid.png`.

Usulan: asset foto contoh yang sesuai model/varian, komposisi dan rasio konsisten, gallery pada detail, thumbnail inventory. Satu keterangan ringkas bahwa stok merupakan demo sudah cukup; tidak perlu mengulang alasan ketiadaan asset pada setiap kartu.

### 2. Hierarki terlalu rata — prioritas tinggi

Judul halaman global memakai 13 px (`src/app/AppShell.tsx:204`); label dan banyak metadata 11 px (`src/styles/tokens.css:50`). Panel berulang memakai pola judul kecil, garis, dan teks padat. Dashboard dimulai dengan enam KPI berbobot hampir setara, disusul banyak daftar/tabel.

Efeknya: rapi dan konsisten, tetapi pengunjung harus membaca banyak bagian sebelum menemukan apa yang paling penting. Pada inventory desktop, kolom kanan membutuhkan scroll internal; hilangnya overflow halaman bukan berarti tabel langsung mudah dipindai.

Usulan: judul halaman 24–28 px, body utama 14 px, angka utama 30–36 px sebagai titik awal evaluasi; gunakan ukuran kecil hanya untuk metadata. Pertahankan tabel padat pada halaman operasional, beri lebih banyak ruang pada ringkasan dan detail. Tiga atau empat metrik utama bisa diutamakan, sisanya menjadi informasi sekunder. Jangan memperbesar semuanya seragam.

### 3. Login belum membangun ketertarikan — prioritas tinggi

Layar 1440 px berisi form sempit di tengah dengan area kosong luas. Login cepat sudah membantu, tetapi diletakkan di bawah email/kata sandi. Branding masih teks kecil `SHOWROOM-DEMO`. Implementasi: `src/routes/LoginPage.tsx:35`. Screenshot: `../.qa/live-login.png`.

Usulan: pembuka yang memperlihatkan konteks showroom dan manfaat “Dari unit masuk sampai untung terhitung”; jadikan pemilihan Owner/Admin/Sales aksi utama, jelaskan tugas yang bisa dicoba per role. Sertakan preview kendaraan atau tampilan produk, tanpa menambah onboarding panjang.

### 4. Dashboard dan detail belum mengarahkan cerita — prioritas tinggi

Dashboard menampilkan angka tetapi belum mengantar pengunjung ke satu contoh kendaraan lengkap. Tabel “Penjualan 6 bulan terakhir” membutuhkan pembacaan setiap baris untuk menangkap tren. Vehicle Detail memiliki rincian modal/profit yang bagus, tetapi tab membungkus menjadi dua baris di desktop dan tiga di mobile. Ringkasan timeline hanya mengambil enam aktivitas terakhir (`src/routes/VehicleDetailPage.tsx:1141`), sehingga contoh Fortuner langsung dimulai dari listing, bukan pembelian.

Usulan: satu chart penjualan/profit yang bermakna, prioritas tindakan harian, dan CTA “Telusuri perjalanan unit”. Di detail, tampilkan foto, identitas unit, tahap proses, dan modal → harga jual → profit dalam hierarki yang jelas. Pertahankan rincian sembilan area lewat progressive disclosure. Pada mobile, ringkasan uang harus tampil sebelum rangkaian rincian panjang.

### 5. Copy terlalu menjelaskan implementasi — prioritas sedang

Setelah interaksi, banner menyebut “tanpa backend”, “hidup di tab ini”, dan perhitungan lintas modul. Katalog berulang kali menjelaskan berkas tidak disertakan dan dataset sintetis. Label masih bercampur: Inventory, Procurement, Reconditioning, Customer, Finance, Gross Profit, Ready.

Usulan: bahasa kerja showroom seperti Stok Kendaraan, Pembelian, Perbaikan, Pelanggan, Keuangan, Laba Kotor, Siap Jual. Keterangan “Mode demo · data contoh” dengan akses reset tetap terlihat; rincian penyimpanan sesi cukup di bantuan demo. CTA WhatsApp harus menjelaskan bahwa itu simulasi sebelum diklik apabila memang belum membuka percakapan.

## Akar arah desain

`docs/DESIGN-BRIEF-F0.md:67` memprioritaskan “Kepadatan menang atas udara” dan alat kerja delapan jam. Di baris 174, strategi media melarang fotografi ERP dan memilih placeholder katalog. Ada konflik internal: dokumen yang sama sebelumnya menyebut katalog harus dipimpin foto.

Arah tersebut menjelaskan mengapa implementasinya konsisten tetapi kurang menjual saat pertama dibuka. Brief utama tetap menuntut visual premium, pengalaman nyata, dan foto. Penyesuaian target yang disarankan: **operasional yang mudah dipakai, dengan presentasi otomotif premium pada titik masuk, inventory, detail kendaraan, dan katalog**. Fondasi komponen dan dataset dapat dipertahankan.

## Temuan yang mengganggu kepercayaan dan hands-on

Temuan berikut dipisahkan berdasarkan jenis buktinya.

### Terkonfirmasi pada browser live

1. **Harga termurah Rp0.** Katalog menampilkan “Termurah saat ini Rp0” walaupun unit pertama Rp85 juta. `Math.min(...harga, 0)` selalu memilih nol untuk harga positif (`src/routes/public/KatalogPage.tsx:88`).
2. **Katalog → CRM terputus pada jalur tab yang disediakan UI.** Buka “Lihat katalog publik” dari sidebar, kirim inquiry, kembali ke tab ERP: lead tidak ditemukan bahkan setelah memuat halaman CRM. Link memakai `target="_blank"` (`src/app/AppShell.tsx:81`), state bisnis memakai `sessionStorage` (`src/store/sesi.ts:764`). Lead terlihat jika membuka CRM pada tab katalog yang sama. Perbaikan paling kecil: jalur demo satu tab; sinkronisasi lintas tab hanya jika pengalaman tersebut memang diinginkan.
3. **Lead baru tetap NEW setelah dipindahkan.** Setelah inquiry dibuat, klik “Dihubungi” pada kartu: banner menyatakan perubahan berhasil, tetapi kartu tetap di kolom Lead Baru. State menyimpan CONTACTED, tetapi penggabungan lead baru tidak menerapkan `tahapLead` (`src/data/index.ts:115`). Reproduksi: `../.qa/live-flow.json` dan `../.qa/live-new-lead-after-move.png`.
4. **WhatsApp membuka penjelasan keterbatasan.** Ini bukan inquiry WhatsApp yang dapat dicoba, walaupun CTA berbunyi “Hubungi via WhatsApp” (`src/routes/public/KatalogDetailPage.tsx:321`). Integrasi API sungguhan tidak diperlukan untuk memperjelas atau menyimulasikan interaksi ini.

### Terlihat pada live dan dihitung dari dataset/kode

5. **19 dari 44 kendaraan bertentangan antara varian dan transmisi.** Dari 38 varian yang mengandung AT/MT/CVT, 19 tidak cocok dengan field transmisi. Contoh pada layar: Brio Satya E CVT → Manual (MT); Fortuner berlabel AT → MT. Generator memilih variant dan transmisi secara independen (`scripts/generate-dataset.mjs:427,430`). Ini masalah konsistensi internal; tidak memerlukan asumsi spesifikasi mobil dari sumber luar.
6. **Notifikasi menyebut 11 booking akan kedaluwarsa, tetapi hanya satu booking aktif dalam jendela lima hari.** Sepuluh lainnya berstatus SELESAI dengan unit SOLD. Selector mengecualikan LUNAS saja dan menerima selisih hari negatif (`src/data/selectors.ts:219`). Dashboard jadi tampak bermasalah padahal peringatannya salah.

### Ditemukan lewat pembacaan kode; belum direproduksi satu per satu di browser

7. Booking baru tidak menautkan lead/customer (`src/components/app/FormBooking.tsx:91`). Form penjualan default ke customer pertama dan harga listing, bukan pemesan dan kesepakatan booking (`src/components/app/FormPenjualan.tsx:32,36`). Penjualan tidak otomatis menutup lead sebagai WON (`src/store/sesi.ts:493`).
8. Timeline Vehicle Detail membaca aktivitas dasar (`src/data/selectors.ts:21`), sedangkan tindakan sesi ditulis ke log terpisah. Cerita kendaraan baru belum tercermin di timeline.
9. Record reconditioning hanya berasal dari dataset dasar (`src/data/index.ts:167`); belum ada pembuatan record recon untuk unit baru. Perpindahan tahap hanya mensyaratkan catatan (`src/components/app/FormTahapUnit.tsx:35`), belum memvalidasi hasil inspeksi dan pekerjaan yang selesai.
10. Perubahan dokumen baru dan penyelesaian booking baru tidak diperlakukan seperti record dasar (`src/data/index.ts:131,148`). Pembayaran lanjutan juga belum punya aksi untuk menyelesaikan piutang setelah transaksi dibuat.

Kelulusan verifier dataset membuktikan invariant yang diuji pada data bawaan; tidak membuktikan semua perilaku sesi atau konsistensi spesifikasi kendaraan.

## Impresi pertama menurut peran

Ini proyeksi reviewer, bukan kutipan responden.

| Peran | Yang sudah membantu | Hambatan awal |
|---|---|---|
| Owner | Nilai stok, modal, profit, piutang tersedia | Prioritas kurang tegas, tidak ada jalur contoh, notifikasi booking keliru |
| Sales | Kanban, follow-up, hubungan ke unit | Kartu serupa dan nama unit terpotong; lead baru gagal bergerak |
| Admin | Tabel dan modul operasional lengkap | Proses unit baru belum terhubung utuh ke recon/timeline |
| Calon pembeli di katalog | Filter harga, spesifikasi, form minat | Foto kosong dan WhatsApp berujung penjelasan |

## Urutan perbaikan yang disarankan

1. **Pulihkan kredibilitas dan sambungan alur:** Rp0, transmisi, notifikasi, katalog satu sesi dengan CRM, perubahan tahap lead, hubungan booking/customer/sales dan timeline. Tidak membutuhkan backend.
2. **Polish lima titik utama:** login/pemilihan role, dashboard, inventory, Vehicle Detail, katalog. Prioritaskan fotografi, hierarki, dan keterbacaan. Token dan primitif existing menjadi dasar.
3. **Susun satu cerita demo yang mudah dimulai:** “Telusuri unit” dari dashboard, contoh unit dengan riwayat lengkap, petunjuk langkah berikutnya. Tetap izinkan eksplorasi bebas.
4. **Terapkan konsistensi ke modul pendukung:** nama menu, ukuran teks, form, empty state, feedback tindakan, dan layout mobile.

Contoh walkthrough 5–10 menit: pilih Owner → pahami tiga angka utama → buka unit contoh → lihat pembelian, inspeksi, perbaikan dan modal → lihat pelanggan/booking/penjualan → lihat profit. Skenario interaktif pendamping: buka katalog di sesi yang sama → kirim minat → pindahkan lead → booking → penjualan → verifikasi status, timeline, dan profit berubah bersama.

Sasaran evaluasi berikutnya: dalam layar awal user tahu apa yang harus dicoba; identitas kendaraan terbaca lewat foto dan nama; profit ditemukan tanpa mencari di banyak tab; aksi yang diklik menampilkan perubahan konsisten di seluruh modul. Uji dengan calon pengguna diperlukan untuk mengonfirmasi sasaran ini.
