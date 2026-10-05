import {
  BarChart3, CalendarCheck, Car, ClipboardCheck, FileText, LayoutDashboard,
  Receipt, TrendingUp, Users, Wallet, Wrench, Handshake, UserRound,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Role } from '@/data/types'

export interface ItemNav {
  label: string
  ke: string
  ikon: ComponentType<{ size?: number | string; className?: string }>
  peran: Role[]
  keterangan?: string
}

export interface GrupNav {
  judul: string
  item: ItemNav[]
}

const SEMUA: Role[] = ['OWNER', 'ADMIN', 'SALES']

/**
 * Struktur navigasi per peran — sesuai brief: Owner melihat semuanya,
 * Admin mengelola operasional, Sales fokus lead → penjualan.
 */
export const NAVIGASI: GrupNav[] = [
  {
    judul: 'Ringkasan',
    item: [
      { label: 'Dashboard', ke: '/', ikon: LayoutDashboard, peran: SEMUA, keterangan: 'Ringkasan kondisi showroom' },
    ],
  },
  {
    judul: 'Operasional',
    item: [
      { label: 'Stok Kendaraan', ke: '/inventory', ikon: Car, peran: SEMUA, keterangan: 'Stok unit dan statusnya' },
      { label: 'Pembelian', ke: '/procurement', ikon: Handshake, peran: ['OWNER', 'ADMIN'], keterangan: 'Pembelian unit dari penjual' },
      { label: 'Inspeksi', ke: '/inspeksi', ikon: ClipboardCheck, peran: ['OWNER', 'ADMIN'], keterangan: 'Hasil pemeriksaan unit' },
      { label: 'Perbaikan', ke: '/reconditioning', ikon: Wrench, peran: ['OWNER', 'ADMIN'], keterangan: 'Pekerjaan perbaikan dan biayanya' },
      { label: 'Dokumen', ke: '/dokumen', ikon: FileText, peran: ['OWNER', 'ADMIN'], keterangan: 'Kelengkapan berkas unit' },
    ],
  },
  {
    judul: 'Penjualan',
    item: [
      { label: 'CRM & Leads', ke: '/crm', ikon: Users, peran: SEMUA, keterangan: 'Pipeline dan follow-up' },
      { label: 'Pelanggan', ke: '/customer', ikon: UserRound, peran: SEMUA, keterangan: 'Riwayat hubungan pelanggan' },
      { label: 'Booking', ke: '/booking', ikon: CalendarCheck, peran: SEMUA, keterangan: 'Booking dan DP' },
      { label: 'Penjualan', ke: '/penjualan', ikon: Receipt, peran: SEMUA, keterangan: 'Transaksi sampai serah terima' },
    ],
  },
  {
    judul: 'Keuangan',
    item: [
      { label: 'Keuangan', ke: '/finance', ikon: Wallet, peran: ['OWNER'], keterangan: 'Modal, penjualan, profit per unit' },
      { label: 'Biaya Operasional', ke: '/biaya', ikon: Receipt, peran: ['OWNER'], keterangan: 'Pengeluaran bulanan showroom' },
    ],
  },
  {
    judul: 'Analitik',
    item: [
      { label: 'Laporan', ke: '/laporan', ikon: BarChart3, peran: ['OWNER'], keterangan: 'Penjualan, inventory, aging, lead' },
      { label: 'Performa Sales', ke: '/performa', ikon: TrendingUp, peran: ['OWNER'], keterangan: 'Konversi dan kontribusi sales' },
    ],
  },
]

export const navigasiUntukPeran = (role: Role): GrupNav[] =>
  NAVIGASI.map((grup) => ({ ...grup, item: grup.item.filter((i) => i.peran.includes(role)) })).filter(
    (grup) => grup.item.length > 0,
  )

export const semuaItemNav = NAVIGASI.flatMap((g) => g.item)

/**
 * Peran yang berhak membuka sebuah jalur. Dipakai penjaga rute supaya daftar peran hanya
 * hidup di satu tempat: kalau menu dan penjaga rute menyimpan daftarnya masing-masing,
 * keduanya akan menyimpang cepat atau lambat.
 */
export function peranUntukJalur(jalur: string): Role[] | null {
  const item = semuaItemNav.find((i) => i.ke === jalur)
  return item ? item.peran : null
}
