/** Tipe data demo showroom. Satu sumber: src/data/dataset.json (dihasilkan scripts/generate-dataset.mjs). */

export type UnitStatus = 'BARU MASUK' | 'INSPEKSI' | 'RECONDITIONING' | 'READY' | 'BOOKED' | 'SOLD'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'TEST DRIVE' | 'NEGOTIATION' | 'BOOKED' | 'WON' | 'LOST'
export type HasilInspeksi = 'GOOD' | 'ATTENTION' | 'REPAIR REQUIRED'
export type StatusDokumen = 'Tersedia' | 'Menunggu' | 'Belum Ada'
export type Role = 'OWNER' | 'ADMIN' | 'SALES'
export type TipePembayaran = 'Cash' | 'Kredit'
export type SumberUnit = 'Individu' | 'Dealer' | 'Lelang' | 'Tukar Tambah'
export type SumberLead = 'WhatsApp' | 'Website' | 'Instagram' | 'Facebook Ads' | 'Marketplace' | 'Walk-in' | 'Referral'

export interface Meta {
  namaShowroom: string
  cabang: string[]
  demoToday: string
  seed: number
  catatan: string
}

export interface User {
  id: string
  nama: string
  email: string
  password: string
  role: Role
  jabatan: string
  cabang: string
}

export interface SalesPerson {
  id: string
  nama: string
  jabatan: string
  target: number
}

export interface Vehicle {
  id: string
  brand: string
  model: string
  variant: string
  tahun: number
  warna: string
  transmisi: string
  bahanBakar: string
  kelas: string
  kilometer: number
  nomorPolisi: string
  vin: string
  nomorMesin: string
  kondisiMasuk: string
  cabang: string
  status: UnitStatus
  lokasi: string
  purchasePrice: number
  reconCost: number
  otherCost: number
  totalCost: number
  listingPrice: number
  estimasiMargin: number
  tanggalMasuk: string
  tanggalSiap: string | null
  tanggalTerjual: string | null
  umurInventaris: number
  hariDiInventory: number
  hariSejakSiap: number | null
  salesPIC: string
  catatan: string
  foto: { ref: string; jumlahTersedia: number }
  bookingId?: string
}

export interface Procurement {
  id: string
  vehicleId: string
  sumber: SumberUnit
  namaSeller: string
  kontakSeller: string
  kotaSeller: string
  hargaPenawaran: number
  hargaDeal: number
  tanggalPenawaran: string
  tanggalPembelian: string
  metodePembayaran: string
  pic: string
  status: 'PROSPECT' | 'NEGOTIATION' | 'PURCHASED' | 'CANCELLED'
  dokumenDiterima: string[]
  catatan: string
  nilaiPasarAcuan: number
}

export interface InspectionItem {
  item: string
  hasil: HasilInspeksi
  catatan: string
}
export interface InspectionSection {
  kategori: string
  item: InspectionItem[]
}
export interface Inspection {
  id: string
  vehicleId: string
  tanggal: string
  inspektur: string
  skor: number
  rekomendasi: string
  ringkasan: { good: number; attention: number; repair: number }
  sections: InspectionSection[]
  catatan: string
}

export interface ReconItem {
  id: string
  vendor: string
  job: string
  biaya: number
  mulai: string
  selesai: string
  status: 'PLANNED' | 'IN PROGRESS' | 'COMPLETED'
  catatan: string
}
export interface Reconditioning {
  id: string
  vehicleId: string
  vendorUtama: string
  pic: string
  mulai: string
  selesai: string | null
  status: 'PLANNED' | 'IN PROGRESS' | 'COMPLETED'
  total: number
  items: ReconItem[]
}

export interface VehicleDocuments {
  vehicleId: string
  checklist: { nama: string; status: StatusDokumen; nomor: string | null; catatan: string }[]
}

export interface Interaksi {
  waktu: string
  tipe: string
  oleh: string
  catatan: string
}

export interface Lead {
  id: string
  customerId: string | null
  nama: string
  telepon: string
  sumber: SumberLead
  vehicleId: string
  vehicleLabel: string
  salesPIC: string
  budget: number
  preferensiPembayaran: TipePembayaran
  status: LeadStatus
  tanggalMasuk: string
  interaksiTerakhir: string
  nextFollowUp: string | null
  catatan: string
  interaksi: Interaksi[]
}

export interface Customer {
  id: string
  nama: string
  telepon: string
  email: string
  kota: string
  alamat: string
  sumberLead: SumberLead
  salesPIC: string
  budget: number
  preferensiPembayaran: TipePembayaran
  pekerjaan: string
  sejak: string
  catatan: string
  kreditAktif: unknown[]
}

export interface Booking {
  id: string
  vehicleId: string
  leadId: string | null
  customerId: string | null
  customerNama: string
  salesPIC: string
  tanggalBooking: string
  kadaluarsa: string
  dp: number
  sisaPembayaran: number
  statusPembayaran: string
  tipePembayaran: TipePembayaran
  catatan: string
}

export interface Sale {
  id: string
  vehicleId: string
  customerId: string
  customerNama: string
  salesPIC: string
  tanggal: string
  listingPrice: number
  negotiatedPrice: number
  diskon: number
  finalPrice: number
  tipePembayaran: TipePembayaran
  dp: number
  sisaPembayaran: number
  financePartner: string | null
  tenor: number | null
  estimasiCicilan: number | null
  status: string
  totalModal: number
  grossProfit: number
  bookingId: string
  serahTerima: string
  catatan: string
}

export interface Expense {
  id: string
  tanggal: string
  kategori: string
  item: string
  jumlah: number
  metode: string
  vendor: string
  pic: string
  bulan: string
}

export interface Activity {
  id: string
  vehicleId: string
  tanggal: string
  tipe: string
  judul: string
  detail: string
  oleh: string
}

export interface Dataset {
  meta: Meta
  users: User[]
  salesTeam: SalesPerson[]
  vehicles: Vehicle[]
  procurements: Procurement[]
  inspections: Inspection[]
  reconditionings: Reconditioning[]
  documents: VehicleDocuments[]
  leads: Lead[]
  customers: Customer[]
  bookings: Booking[]
  sales: Sale[]
  expenses: Expense[]
  activities: Activity[]
  financePartners: string[]
  vendors: string[]
  sumberLeadMaster: SumberLead[]
  sumberUnitMaster: SumberUnit[]
}
