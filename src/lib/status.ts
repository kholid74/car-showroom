import type { HasilInspeksi, LeadStatus, StatusDokumen, UnitStatus } from '@/data/types'

/**
 * Pemetaan status → label + kelas Tailwind.
 * Kelas ditulis sebagai literal agar terdeteksi compiler Tailwind, dan
 * hanya memakai token semantik (warna = makna, tidak pernah dekorasi).
 */

export const STATUS_UNIT: Record<UnitStatus, { label: string; pil: string; halus: string; dot: string; urut: number }> = {
  'BARU MASUK': { label: 'Baru Masuk', pil: 'bg-st-baru text-white', halus: 'bg-st-baru/10 text-st-baru', dot: 'bg-st-baru', urut: 1 },
  INSPEKSI: { label: 'Inspeksi', pil: 'bg-st-inspeksi text-white', halus: 'bg-st-inspeksi/10 text-st-inspeksi', dot: 'bg-st-inspeksi', urut: 2 },
  RECONDITIONING: { label: 'Reconditioning', pil: 'bg-st-recon text-white', halus: 'bg-st-recon/10 text-st-recon', dot: 'bg-st-recon', urut: 3 },
  READY: { label: 'Ready', pil: 'bg-st-ready text-white', halus: 'bg-st-ready/10 text-st-ready', dot: 'bg-st-ready', urut: 4 },
  BOOKED: { label: 'Booked', pil: 'bg-st-booked text-white', halus: 'bg-st-booked/10 text-st-booked', dot: 'bg-st-booked', urut: 5 },
  SOLD: { label: 'Terjual', pil: 'bg-st-sold text-white', halus: 'bg-st-sold/10 text-st-sold', dot: 'bg-st-sold', urut: 6 },
}

export const URUTAN_STATUS: UnitStatus[] = ['BARU MASUK', 'INSPEKSI', 'RECONDITIONING', 'READY', 'BOOKED', 'SOLD']

export const STATUS_LEAD: Record<LeadStatus, { label: string; halus: string; dot: string }> = {
  NEW: { label: 'Lead Baru', halus: 'bg-st-baru/10 text-st-baru', dot: 'bg-st-baru' },
  CONTACTED: { label: 'Dihubungi', halus: 'bg-st-inspeksi/10 text-st-inspeksi', dot: 'bg-st-inspeksi' },
  INTERESTED: { label: 'Tertarik', halus: 'bg-st-inspeksi/10 text-st-inspeksi', dot: 'bg-st-inspeksi' },
  'TEST DRIVE': { label: 'Test Drive', halus: 'bg-attention/10 text-attention', dot: 'bg-attention' },
  NEGOTIATION: { label: 'Negosiasi', halus: 'bg-st-recon/10 text-st-recon', dot: 'bg-st-recon' },
  BOOKED: { label: 'Booking', halus: 'bg-st-booked/10 text-st-booked', dot: 'bg-st-booked' },
  WON: { label: 'Menang', halus: 'bg-money-pos/10 text-money-pos', dot: 'bg-money-pos' },
  LOST: { label: 'Batal', halus: 'bg-st-sold/10 text-st-sold', dot: 'bg-st-sold' },
}

/** Tahapan kolom kanban — WON/LOST tidak masuk papan aktif */
export const TAHAP_PIPELINE: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'TEST DRIVE', 'NEGOTIATION', 'BOOKED']

export const HASIL_INSPEKSI: Record<HasilInspeksi, { label: string; halus: string; dot: string }> = {
  GOOD: { label: 'Baik', halus: 'bg-st-ready/10 text-st-ready', dot: 'bg-st-ready' },
  ATTENTION: { label: 'Perhatian', halus: 'bg-attention/10 text-attention', dot: 'bg-attention' },
  'REPAIR REQUIRED': { label: 'Perlu Perbaikan', halus: 'bg-danger/10 text-danger', dot: 'bg-danger' },
}

export const STATUS_DOKUMEN: Record<StatusDokumen, { label: string; halus: string; dot: string }> = {
  Tersedia: { label: 'Tersedia', halus: 'bg-st-ready/10 text-st-ready', dot: 'bg-st-ready' },
  Menunggu: { label: 'Menunggu', halus: 'bg-attention/10 text-attention', dot: 'bg-attention' },
  'Belum Ada': { label: 'Belum Ada', halus: 'bg-danger/10 text-danger', dot: 'bg-danger' },
}

export const STATUS_RECON: Record<string, { label: string; halus: string; dot: string }> = {
  PLANNED: { label: 'Direncanakan', halus: 'bg-st-baru/10 text-st-baru', dot: 'bg-st-baru' },
  'IN PROGRESS': { label: 'Dikerjakan', halus: 'bg-st-recon/10 text-st-recon', dot: 'bg-st-recon' },
  COMPLETED: { label: 'Selesai', halus: 'bg-st-ready/10 text-st-ready', dot: 'bg-st-ready' },
}

export const STATUS_PEMBAYARAN: Record<string, { label: string; halus: string; dot: string }> = {
  LUNAS: { label: 'Lunas', halus: 'bg-money-pos/10 text-money-pos', dot: 'bg-money-pos' },
  'DIBAYAR SEBAGIAN': { label: 'Dibayar Sebagian', halus: 'bg-attention/10 text-attention', dot: 'bg-attention' },
  'DP DIBAYAR': { label: 'DP Dibayar', halus: 'bg-st-inspeksi/10 text-st-inspeksi', dot: 'bg-st-inspeksi' },
  'MENUNGGU PEMBAYARAN': { label: 'Menunggu Pembayaran', halus: 'bg-st-baru/10 text-st-baru', dot: 'bg-st-baru' },
  SELESAI: { label: 'Selesai (jadi penjualan)', halus: 'bg-money-pos/10 text-money-pos', dot: 'bg-money-pos' },
}

/** Keterangan umur stok — dipakai di tabel inventory */
export function keteranganAging(hari: number): { label: string; kelas: string } {
  if (hari <= 30) return { label: `${hari} hari`, kelas: 'text-ink-2' }
  if (hari <= 60) return { label: `${hari} hari`, kelas: 'text-ink-2' }
  if (hari <= 90) return { label: `${hari} hari`, kelas: 'text-attention' }
  return { label: `${hari} hari`, kelas: 'text-danger font-medium' }
}
