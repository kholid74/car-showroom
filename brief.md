Buat sebuah showcase frontend clickable untuk Kalsara Digital Studio berupa:

SHOWROOM / USED CAR DEALER MANAGEMENT SYSTEM

Tujuan:
Membuat demo ERP / management system untuk bisnis showroom mobil bekas yang dapat digunakan Kalsara sebagai showcase kepada calon klien.

Demo harus memperlihatkan bagaimana seluruh proses operasional showroom dapat terintegrasi dalam satu sistem:

PEMBELIAN UNIT
→ UNIT MASUK
→ INSPEKSI
→ RECONDITIONING
→ INVENTORY
→ DIPASARKAN
→ LEAD CUSTOMER
→ FOLLOW-UP / NEGOSIASI
→ BOOKING / DP
→ PENJUALAN
→ PEMBAYARAN
→ UNIT SOLD
→ PROFIT & REPORTING

Ini bukan production ERP.

Prioritas utama:
- frontend clickable
- realistic business flow
- realistic dummy data
- UX yang terasa seperti produk sungguhan
- visual premium
- semua modul saling berhubungan
- cocok untuk hands-on demo kepada calon klien

Backend/database tidak diperlukan kecuali authentication/login sederhana jika memang diperlukan.

==================================================
1. SEBELUM IMPLEMENTASI
==================================================

Sebelum coding:

1. Audit codebase/repository yang tersedia.
2. Identifikasi framework, routing, component, design system dan struktur existing.
3. Jangan melakukan rewrite jika tidak diperlukan.
4. Gunakan kembali component dan pattern yang sudah tersedia jika relevan.
5. Tentukan struktur informasi dan business flow sebelum membuat halaman.
6. Setelah itu implementasikan secara bertahap.

Jangan langsung membuat kumpulan halaman dashboard yang tidak memiliki hubungan data.

Core dari showcase ini adalah:

SATU UNIT KENDARAAN HARUS DAPAT DITRACE DARI PEMBELIAN SAMPAI TERJUAL.

==================================================
2. TARGET USER / ROLE
==================================================

Buat minimal 3 role:

1. OWNER / MANAGEMENT

Akses seluruh data:
- Dashboard
- Inventory
- Procurement
- Sales
- CRM
- Finance
- Reports
- Performance

2. ADMIN / OPERATIONAL

Mengelola:
- Unit
- Procurement
- Inspeksi
- Reconditioning
- Dokumen
- Transaksi
- Customer

3. SALES

Fokus pada:
- Leads
- Customer
- Follow-up
- Unit yang diminati customer
- Booking
- Penjualan

Untuk demo, boleh gunakan:

Login sebagai Owner
Login sebagai Admin
Login sebagai Sales

Role switching juga boleh digunakan jika lebih nyaman untuk showcase.

==================================================
3. DASHBOARD MANAGEMENT
==================================================

Buat executive dashboard yang langsung memberi gambaran kondisi showroom.

Contoh KPI:

42
Unit Tersedia

Rp6,8 M
Nilai Inventory

8
Unit Terjual Bulan Ini

Rp1,7 M
Nilai Penjualan Bulan Ini

17
Leads Aktif

Rp168 jt
Gross Profit Bulan Ini

Tambahkan visualisasi yang relevan seperti:

- Penjualan bulanan
- Gross profit
- Inventory aging
- Lead pipeline
- Unit berdasarkan status
- Sales performance

Jangan memenuhi dashboard dengan chart yang tidak berguna.

Setiap metric harus terasa relevan dengan bisnis showroom.

==================================================
4. INVENTORY / STOCK MANAGEMENT
==================================================

Buat halaman Inventory.

Setiap kendaraan memiliki:

- Foto
- Brand
- Model
- Variant
- Tahun
- Warna
- Transmisi
- Kilometer
- Nomor polisi
- Nomor rangka / VIN
- Nomor mesin
- Harga beli
- Biaya reconditioning
- Total modal
- Harga jual
- Estimasi margin
- Lokasi/cabang
- Status

Status contoh:

BARU MASUK
INSPEKSI
RECONDITIONING
READY
BOOKED
SOLD

Buat:

Table view
dan jika relevan:
Card/Grid view

Tambahkan:
- search
- filter
- sort
- status filter

==================================================
5. VEHICLE DETAIL — HALAMAN PALING PENTING
==================================================

Vehicle Detail harus menjadi salah satu halaman paling matang.

Contoh:

Toyota Fortuner VRZ 2.4 AT
2022
38.420 km
B 1234 ABC

Status:
READY

Harga Beli
Rp410.000.000

Reconditioning
Rp7.500.000

Biaya Lain
Rp2.500.000

TOTAL MODAL
Rp420.000.000

Harga Listing
Rp449.000.000

Potential Margin
Rp29.000.000

Tampilkan section/tab:

OVERVIEW
PROCUREMENT
INSPECTION
RECONDITIONING
COST
LEADS
SALES
DOCUMENTS
ACTIVITY

Buat timeline perjalanan kendaraan:

12 Sep
Unit dibeli

13 Sep
Inspeksi selesai

14 Sep
Masuk reconditioning

17 Sep
Reconditioning selesai

18 Sep
Ready for sale

20 Sep
Listing published

24 Sep
Lead masuk

26 Sep
Test drive

28 Sep
Booking / DP

30 Sep
Sold

Tujuannya:
calon klien langsung memahami bahwa seluruh proses kendaraan tercatat dalam satu sistem.

==================================================
6. PROCUREMENT / PEMBELIAN UNIT
==================================================

Buat modul Procurement.

Data minimal:

- Sumber kendaraan
- Nama seller
- Kontak
- Jenis seller

Contoh:
Individual
Dealer
Auction
Trade-in

Tambahkan:

- Harga penawaran
- Harga deal
- Tanggal pembelian
- Metode pembayaran
- PIC
- Dokumen
- Notes

Status:

PROSPECT
NEGOTIATION
PURCHASED
CANCELLED

Hubungkan procurement dengan Inventory.

Ketika kendaraan PURCHASED:
kendaraan menjadi unit inventory.

==================================================
7. INSPECTION
==================================================

Buat vehicle inspection checklist.

Kategori:

EXTERIOR
INTERIOR
ENGINE
TRANSMISSION
SUSPENSION
BRAKES
ELECTRICAL
TIRES
DOCUMENTS

Setiap item bisa memiliki:

GOOD
ATTENTION
REPAIR REQUIRED

Contoh:

Body
Good

Front bumper
Repair Required

Engine
Good

AC
Attention

Tires
Good

Tambahkan:

Inspection Notes
Inspector
Inspection Date

==================================================
8. RECONDITIONING
==================================================

Buat halaman Reconditioning.

Contoh pekerjaan:

Body Repair
Rp2.500.000

Polishing
Rp750.000

Oil Service
Rp1.200.000

Brake Pad
Rp1.500.000

Interior Detailing
Rp650.000

Battery
Rp900.000

TOTAL
Rp7.500.000

Data:

- Vendor
- Job
- Cost
- Start date
- Finish date
- Status

Status:

PLANNED
IN PROGRESS
COMPLETED

Biaya reconditioning harus otomatis terlihat pada Vehicle Detail sebagai bagian dari total modal.

==================================================
9. CRM / LEADS
==================================================

Buat CRM sederhana khusus showroom.

Lead memiliki:

- Nama
- Nomor HP
- Source
- Unit diminati
- Sales PIC
- Budget
- Payment preference
- Last interaction
- Next follow-up
- Status

Source:

WhatsApp
Website
Instagram
Facebook Ads
Marketplace
Walk-in
Referral

Pipeline:

NEW LEAD
CONTACTED
INTERESTED
TEST DRIVE
NEGOTIATION
BOOKED
WON
LOST

Buat Kanban View untuk pipeline.

Contoh:

NEW
5

CONTACTED
4

TEST DRIVE
3

NEGOTIATION
2

BOOKED
2

WON
8

Card lead harus clickable.

==================================================
10. CUSTOMER DETAIL
==================================================

Tampilkan:

- Customer information
- Contact
- Lead source
- Unit yang diminati
- Interaction history
- Test drive
- Negotiation
- Booking
- Transaction history

Buat activity timeline.

Contoh:

10:21
Lead masuk dari WhatsApp

11:04
Sales menghubungi customer

14:30
Customer menjadwalkan test drive

Besok
Test drive

==================================================
11. SALES / PENJUALAN
==================================================

Buat sales flow:

Lead
→ Negotiation
→ Booking
→ DP
→ Payment
→ Sold

Sales transaction memiliki:

- Customer
- Vehicle
- Sales PIC
- Listing price
- Negotiated price
- Discount
- Final price
- Payment type
- DP
- Remaining payment
- Status

Payment type:

CASH
CREDIT

Untuk credit:

- Finance partner
- DP
- Tenor
- Estimated installment

Tidak perlu membuat financing engine yang kompleks.

==================================================
12. BOOKING / DP
==================================================

Ketika customer booking:

Vehicle status:

READY
→ BOOKED

Tampilkan:

Booking ID
Customer
Vehicle
Booking date
Expiration
DP
Payment status

Jika transaksi selesai:

BOOKED
→ SOLD

==================================================
13. FINANCE
==================================================

Buat modul finance sederhana.

JANGAN membuat full accounting system.

Fokus pada showroom operational finance.

Tampilkan:

REVENUE
COST
GROSS PROFIT
RECEIVABLE
EXPENSE

Untuk setiap kendaraan:

Harga beli
+
Reconditioning
+
Biaya lain
=
TOTAL MODAL

Final Selling Price
-
Total Modal
=
GROSS PROFIT

Contoh:

Harga beli
Rp410.000.000

Reconditioning
Rp7.500.000

Biaya lainnya
Rp2.500.000

TOTAL MODAL
Rp420.000.000

Harga jual
Rp442.000.000

GROSS PROFIT
Rp22.000.000

==================================================
14. EXPENSE
==================================================

Buat operational expense.

Contoh:

Marketing
Rp5.000.000

Office
Rp3.200.000

Vehicle Transport
Rp2.500.000

Maintenance
Rp1.800.000

Gunakan data realistis.

==================================================
15. DOCUMENT MANAGEMENT
==================================================

Setiap kendaraan memiliki checklist dokumen.

Contoh:

STNK
Available

BPKB
Available

Faktur
Available

Kwitansi Pembelian
Available

Inspection Document
Available

Sales Agreement
Pending

Jangan menyimpan dokumen sensitif sungguhan.

Gunakan dummy file/document metadata.

==================================================
16. REPORTING
==================================================

Buat halaman Reports.

Minimal:

SALES REPORT
INVENTORY REPORT
PROFIT REPORT
LEAD REPORT
SALES PERFORMANCE
INVENTORY AGING

Contoh inventory aging:

0–30 hari
18 unit

31–60 hari
12 unit

61–90 hari
8 unit

>90 hari
4 unit

Highlight kendaraan yang terlalu lama berada di inventory.

==================================================
17. SALES PERFORMANCE
==================================================

Contoh:

Andi
12 sales
Rp2.4 M
Rp210 jt gross profit

Rizky
9 sales
Rp1.8 M
Rp156 jt gross profit

Dimas
7 sales
Rp1.3 M
Rp118 jt gross profit

Tambahkan:

- Lead handled
- Conversion rate
- Sales
- Revenue

==================================================
18. GLOBAL SEARCH
==================================================

Jika memungkinkan, tambahkan global search.

User dapat mencari:

"Fortuner"

dan mendapatkan:

Vehicle
Toyota Fortuner VRZ

Customer
Customer interested in Fortuner

Lead
Lead #LD-1023

Transaction
INV-2026-00921

==================================================
19. NOTIFICATION
==================================================

Tambahkan notification center sederhana.

Contoh:

3 follow-up jatuh tempo hari ini

2 unit selesai reconditioning

1 booking akan expired

4 dokumen kendaraan belum lengkap

5 unit berada di inventory >90 hari

==================================================
20. DATA DEMO
==================================================

Jangan gunakan Lorem Ipsum.

Gunakan data Indonesia yang realistis.

Minimal:

30–50 kendaraan

Brand:
Toyota
Honda
Suzuki
Mitsubishi
Daihatsu
Hyundai
BMW
Mercedes-Benz

Model contoh:

Toyota Fortuner
Toyota Innova Zenix
Toyota Alphard
Honda CR-V
Honda Brio
Mitsubishi Pajero Sport
Suzuki XL7
Hyundai Creta
BMW X1
Mercedes-Benz C200

Buat:

- kendaraan READY
- kendaraan INSPECTION
- kendaraan RECONDITIONING
- kendaraan BOOKED
- kendaraan SOLD

Tambahkan:

20+ customer/leads
10+ transactions
realistic procurement data
realistic inspection
realistic expenses
realistic sales history

Semua data harus saling konsisten.

Contoh:

Jika Fortuner status SOLD,
maka:
- memiliki customer
- memiliki sales transaction
- memiliki payment
- tidak muncul sebagai READY inventory

==================================================
21. CROSS-MODULE RELATIONSHIP
==================================================

INI SANGAT PENTING.

Jangan membuat setiap halaman menggunakan dummy data independen.

Gunakan satu shared dataset/state.

Contoh:

Vehicle ID:
VH-2026-0012

harus digunakan pada:

Procurement
Inventory
Inspection
Reconditioning
Lead
Booking
Sales
Finance
Reports

Jika kendaraan memiliki:

Purchase Price:
Rp410 jt

Reconditioning:
Rp7.5 jt

Other Cost:
Rp2.5 jt

maka:

Total Cost:
Rp420 jt

Jika terjual:
Rp442 jt

maka:

Gross Profit:
Rp22 jt

Nilai yang sama harus muncul di semua modul.

==================================================
22. PUBLIC WEBSITE / SHOWROOM CATALOG
==================================================

Selain ERP dashboard, buat atau pertahankan public-facing showroom sederhana.

Customer dapat:

- Melihat stok mobil
- Search/filter kendaraan
- Melihat detail mobil
- Melihat harga
- Melihat spesifikasi
- Melihat foto
- Inquiry melalui WhatsApp
- Request test drive

Jika sebuah kendaraan SOLD:

jangan tampilkan sebagai available stock.

Public website dan ERP harus terasa sebagai satu ekosistem.

Flow:

SHOWROOM ERP
↓
Unit READY
↓
Published
↓
PUBLIC WEBSITE
↓
Customer inquiry
↓
CRM LEAD
↓
Sales follow-up
↓
Booking
↓
Sold

Ini merupakan salah satu selling point utama demo.

==================================================
23. DESIGN DIRECTION
==================================================

Desain harus:

Premium
Modern
Clean
Professional
Automotive
B2B SaaS quality

Jangan terlihat seperti:

- template admin gratis
- bootstrap dashboard generik
- ERP enterprise kuno

Gunakan whitespace dengan baik.

Prioritaskan:

- typography hierarchy
- information density
- table readability
- status clarity
- dashboard scanning

Desktop merupakan primary experience.

Tetap responsive untuk tablet/mobile.

Gunakan Bahasa Indonesia pada seluruh interface.

==================================================
24. SHOWCASE EXPERIENCE
==================================================

Tujuan utama bukan banyaknya fitur.

Tujuannya agar saat calon klien mencoba demo selama 5–10 menit, mereka langsung memahami:

"Semua proses showroom saya bisa berada dalam satu sistem."

Demo harus mampu menunjukkan cerita:

Owner membuka dashboard
↓
Melihat kondisi bisnis
↓
Membuka satu kendaraan
↓
Melihat kendaraan dibeli dari siapa
↓
Melihat hasil inspeksi
↓
Melihat biaya reconditioning
↓
Melihat total modal
↓
Melihat lead yang tertarik
↓
Melihat proses negosiasi
↓
Melihat booking
↓
Melihat transaksi penjualan
↓
Melihat profit kendaraan

==================================================
25. DEMO AUTHENTICATION
==================================================

Jika repository sudah memiliki authentication:
gunakan dan extend authentication tersebut.

Jika belum:
buat authentication demo yang sederhana.

Sediakan akun demo:

Owner / Management
Admin Operational
Sales

Tidak perlu backend kompleks.

Authentication hanya perlu cukup untuk hands-on showcase.

Struktur harus mudah dikembangkan nantinya agar Kalsara dapat membuat temporary demo access per calon client.

Jangan hardcode business logic ke authentication.

==================================================
26. OUT OF SCOPE
==================================================

Jangan implementasikan secara kompleks:

- Full accounting / general ledger
- Tax engine
- Bank reconciliation
- Real payment gateway
- Real financing integration
- Marketplace API
- WhatsApp API
- OCR BPKB/STNK
- Government integration
- AI pricing engine
- Multi-company ERP
- Complex HR/payroll

Boleh tampilkan placeholder/coming soon jika sangat relevan, tetapi jangan memenuhi UI dengan fitur yang belum diperlukan.

==================================================
27. QUALITY CHECK
==================================================

Setelah implementasi:

1. Jalankan aplikasi.
2. Jalankan build.
3. Jalankan lint/test jika tersedia.
4. Perbaiki error.
5. Pastikan tidak ada broken route.
6. Pastikan seluruh CTA penting clickable.
7. Pastikan navigation bekerja.
8. Pastikan data antar modul konsisten.
9. Pastikan responsive.
10. Pastikan tidak ada Lorem Ipsum.
11. Pastikan tidak ada placeholder visual yang terlihat unfinished.
12. Pastikan tidak ada console error signifikan.

Terakhir, lakukan self-review sebagai:

- Product Designer
- Senior UI/UX Designer
- Showroom Owner
- Sales Showroom
- Operational Admin

Cari flow yang terasa tidak masuk akal atau terlalu generik, kemudian perbaiki.

PRIORITAS AKHIR:

1. Business flow yang realistis
2. Data antar modul terintegrasi
3. Vehicle Detail yang sangat kuat
4. Dashboard management
5. Inventory
6. CRM & Sales pipeline
7. Procurement → Inspection → Reconditioning
8. Finance/profit visibility
9. Public showroom integration
10. Visual polish

Jangan mengejar jumlah fitur jika mengorbankan kualitas alur demo.
