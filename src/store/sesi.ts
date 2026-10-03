import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEMO_TODAY } from '@/data/meta'
import type {
  Lead,
  LeadStatus,
  Procurement,
  Sale,
  SumberLead,
  SumberUnit,
  TipePembayaran,
  UnitStatus,
  Vehicle,
  VehicleDocuments,
} from '@/data/types'

/**
 * Seluruh tulisan pada sesi demo berkumpul di sini: data yang dibuat atau diubah pengunjung
 * hidup berdampingan dengan dataset dasar, bukan di store terpisah per modul. Ini yang membuat
 * tombol tambah/ubah di demo bisa dipertanggungjawabkan: setiap perubahan tercatat, tampil di
 * spanduk sesi, dan bisa dikembalikan ke data demo.
 *
 * Tanpa backend, tidak ada yang dikirim ke server. Isinya disimpan di sessionStorage supaya
 * bertahan saat halaman dimuat ulang tetapi hilang begitu tab ditutup.
 */

export interface CatatanSesi {
  id: string
  waktu: string
  jenis: 'Penjualan' | 'Lead' | 'Tahap lead' | 'Status unit' | 'Unit baru' | 'Ubah unit' | 'Dokumen'
  ringkas: string
}

export interface MasukanPenjualan {
  vehicleId: string
  vehicleLabel: string
  customerId: string
  customerNama: string
  salesPIC: string
  tanggal: string
  listingPrice: number
  finalPrice: number
  diskon: number
  tipePembayaran: TipePembayaran
  dp: number
  financePartner: string | null
  tenor: number | null
  estimasiCicilan: number | null
  totalModal: number
  bookingId: string
  catatan: string
}

export interface MasukanLead {
  nama: string
  telepon: string
  sumber: SumberLead
  vehicleId: string
  vehicleLabel: string
  budget: number
  preferensiPembayaran: TipePembayaran
  salesPIC: string
  catatan: string
}

export interface MasukanUnit {
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
  cabang: string
  salesPIC: string
  sumber: SumberUnit
  namaSeller: string
  kotaSeller: string
  hargaDeal: number
  biayaLain: number
  catatan: string
}

/** Perpindahan tahap unit yang diizinkan — gerbang proses, bukan sekadar pilihan bebas. */
export const TAHAP_UNIT_BERIKUTNYA: Partial<Record<UnitStatus, UnitStatus>> = {
  'BARU MASUK': 'INSPEKSI',
  INSPEKSI: 'RECONDITIONING',
  RECONDITIONING: 'READY',
}

export const TAHAP_LEAD_BERIKUTNYA: Partial<Record<LeadStatus, LeadStatus>> = {
  NEW: 'CONTACTED',
  CONTACTED: 'INTERESTED',
  INTERESTED: 'TEST DRIVE',
  'TEST DRIVE': 'NEGOTIATION',
  NEGOTIATION: 'BOOKED',
  BOOKED: 'WON',
}

/** Checklist dokumen standar untuk unit yang baru dimasukkan pada sesi demo. */
export const DOKUMEN_STANDAR = [
  'STNK',
  'BPKB',
  'Faktur',
  'Kwitansi Pembelian',
  'Dokumen Inspeksi',
  'Perjanjian Jual Beli',
]

const geserHari = (tanggal: string, hari: number) => {
  const d = new Date(tanggal + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + hari)
  return d.toISOString().slice(0, 10)
}

const nomorUrut = (awalan: string, panjang: number) => `${awalan}${String(panjang + 1).padStart(2, '0')}`

interface KeadaanSesi {
  versi: number
  statusUnit: Record<string, UnitStatus>
  tanggalSiap: Record<string, string>
  catatanTahap: Record<string, string>
  tahapLead: Record<string, LeadStatus>
  riwayatLead: { leadId: string; dari: LeadStatus; ke: LeadStatus; waktu: string }[]
  leadBaru: Lead[]
  leadKatalog: Lead[]
  ubahLead: Record<string, Partial<Lead>>
  penjualanBaru: Sale[]
  bookingSelesai: string[]
  unitBaru: Vehicle[]
  procurementBaru: Procurement[]
  dokumenBaru: VehicleDocuments[]
  ubahUnit: Record<string, Partial<Vehicle>>
  ubahDokumen: Record<string, Record<string, { status: string; nomor: string | null }>>
  catatan: CatatanSesi[]

  ubahStatusUnit: (vehicleId: string, ke: UnitStatus, catatan: string, label: string) => void
  pindahkanLead: (leadId: string, dari: LeadStatus, ke: LeadStatus, label: string) => void
  tambahLead: (masukan: MasukanLead, asal?: 'ERP' | 'KATALOG') => Lead
  ubahDataLead: (leadId: string, patch: Partial<Lead>, label: string) => void
  tambahUnit: (masukan: MasukanUnit) => Vehicle
  ubahDataUnit: (vehicleId: string, patch: Partial<Vehicle>, label: string) => void
  ubahDokumenUnit: (vehicleId: string, nama: string, status: string, nomor: string, label: string) => void
  catatPenjualan: (masukan: MasukanPenjualan) => Sale
  reset: () => void
}

const catat = (s: CatatanSesi[], jenis: CatatanSesi['jenis'], ringkas: string): CatatanSesi[] => [
  { id: `SESI-${jenis}-${s.length + 1}-${Date.now()}`, waktu: new Date().toISOString(), jenis, ringkas },
  ...s,
].slice(0, 60)

export const useSesi = create<KeadaanSesi>()(
  persist(
    (set, get) => ({
      versi: 0,
      statusUnit: {},
      tanggalSiap: {},
      catatanTahap: {},
      tahapLead: {},
      riwayatLead: [],
      leadBaru: [],
      leadKatalog: [],
      ubahLead: {},
      penjualanBaru: [],
      bookingSelesai: [],
      unitBaru: [],
      procurementBaru: [],
      dokumenBaru: [],
      ubahUnit: {},
      ubahDokumen: {},
      catatan: [],

      ubahStatusUnit: (vehicleId, ke, catatanTahap, label) =>
        set((s) => ({
          versi: s.versi + 1,
          statusUnit: { ...s.statusUnit, [vehicleId]: ke },
          catatanTahap: catatanTahap ? { ...s.catatanTahap, [vehicleId]: catatanTahap } : s.catatanTahap,
          // unit yang baru siap dijual mulai dihitung umurnya dari hari demo
          tanggalSiap: ke === 'READY' ? { ...s.tanggalSiap, [vehicleId]: DEMO_TODAY } : s.tanggalSiap,
          catatan: catat(s.catatan, 'Status unit', `${label} → ${ke}${catatanTahap ? ` · ${catatanTahap}` : ''}`),
        })),

      pindahkanLead: (leadId, dari, ke, label) =>
        set((s) => ({
          versi: s.versi + 1,
          tahapLead: { ...s.tahapLead, [leadId]: ke },
          riwayatLead: [{ leadId, dari, ke, waktu: new Date().toISOString() }, ...s.riwayatLead].slice(0, 60),
          catatan: catat(s.catatan, 'Tahap lead', `${label} ${dari} → ${ke}`),
        })),

      tambahLead: (m, asal = 'ERP') => {
        const dariKatalog = asal === 'KATALOG'
        const lead: Lead = {
          id: dariKatalog
            ? nomorUrut('LD-KATALOG-', get().leadKatalog.length)
            : nomorUrut('LD-SESI-', get().leadBaru.length),
          customerId: null,
          nama: m.nama.trim(),
          telepon: m.telepon.trim(),
          sumber: m.sumber,
          vehicleId: m.vehicleId,
          vehicleLabel: m.vehicleLabel,
          salesPIC: m.salesPIC,
          budget: m.budget,
          preferensiPembayaran: m.preferensiPembayaran,
          status: 'NEW',
          tanggalMasuk: DEMO_TODAY,
          interaksiTerakhir: DEMO_TODAY,
          nextFollowUp: geserHari(DEMO_TODAY, 1),
          catatan:
            m.catatan.trim() ||
            (dariKatalog ? 'Mengirim minat lewat katalog publik.' : 'Lead dimasukkan manual pada sesi demo.'),
          interaksi: [
            {
              waktu: DEMO_TODAY,
              tipe: dariKatalog ? 'Katalog publik' : 'Lead masuk',
              oleh: dariKatalog ? 'Form katalog' : 'Input manual (demo)',
              catatan:
                m.catatan.trim() ||
                (dariKatalog ? 'Mengirim minat lewat katalog publik.' : 'Lead dicatat pada sesi demo.'),
            },
          ],
        }
        set((s) => ({
          versi: s.versi + 1,
          leadBaru: dariKatalog ? s.leadBaru : [lead, ...s.leadBaru],
          leadKatalog: dariKatalog ? [lead, ...s.leadKatalog] : s.leadKatalog,
          catatan: catat(
            s.catatan,
            'Lead',
            `${lead.nama} · ${lead.vehicleLabel}${dariKatalog ? ' (katalog publik)' : ''}`,
          ),
        }))
        return lead
      },

      ubahDataLead: (leadId, patch, label) =>
        set((s) => ({
          versi: s.versi + 1,
          ubahLead: { ...s.ubahLead, [leadId]: { ...s.ubahLead[leadId], ...patch } },
          catatan: catat(s.catatan, 'Lead', `${label} diperbarui (${Object.keys(patch).join(', ')})`),
        })),

      tambahUnit: (m) => {
        const totalCost = m.hargaDeal + m.biayaLain
        // harga listing sementara dari modal + margin wajar; dikunci ulang setelah reconditioning
        const listingPrice = Math.round((totalCost * 1.09) / 1_000_000) * 1_000_000
        const unit: Vehicle = {
          id: nomorUrut('VH-SESI-', get().unitBaru.length),
          brand: m.brand.trim(),
          model: m.model.trim(),
          variant: m.variant.trim(),
          tahun: m.tahun,
          warna: m.warna,
          transmisi: m.transmisi,
          bahanBakar: m.bahanBakar,
          kelas: m.kelas,
          kilometer: m.kilometer,
          nomorPolisi: m.nomorPolisi.trim(),
          vin: `DEMO-SESI-${String(get().unitBaru.length + 1).padStart(3, '0')}`,
          nomorMesin: `SESI-${String(get().unitBaru.length + 1).padStart(3, '0')}`,
          kondisiMasuk: 'Baru dimasukkan pada sesi demo',
          cabang: m.cabang,
          status: 'BARU MASUK',
          lokasi: `${m.cabang} · area masuk`,
          purchasePrice: m.hargaDeal,
          reconCost: 0,
          otherCost: m.biayaLain,
          totalCost,
          listingPrice,
          estimasiMargin: listingPrice - totalCost,
          tanggalMasuk: DEMO_TODAY,
          tanggalSiap: null,
          tanggalTerjual: null,
          umurInventaris: 0,
          hariDiInventory: 0,
          hariSejakSiap: null,
          salesPIC: m.salesPIC,
          catatan: m.catatan.trim() || 'Unit dimasukkan lewat form demo.',
          foto: { ref: 'belum-ada', jumlahTersedia: 0 },
        }

        const procurement: Procurement = {
          id: nomorUrut('PRC-SESI-', get().procurementBaru.length),
          vehicleId: unit.id,
          sumber: m.sumber,
          namaSeller: m.namaSeller.trim() || 'Belum dicatat',
          kontakSeller: '—',
          kotaSeller: m.kotaSeller.trim() || m.cabang,
          hargaPenawaran: m.hargaDeal,
          hargaDeal: m.hargaDeal,
          tanggalPenawaran: DEMO_TODAY,
          tanggalPembelian: DEMO_TODAY,
          metodePembayaran: 'Transfer',
          pic: m.salesPIC,
          status: 'PURCHASED',
          dokumenDiterima: [],
          catatan: 'Pembelian dicatat pada sesi demo.',
          nilaiPasarAcuan: listingPrice,
        }

        const dokumen: VehicleDocuments = {
          vehicleId: unit.id,
          checklist: DOKUMEN_STANDAR.map((nama) => ({
            nama,
            status: 'Belum Ada' as const,
            nomor: null,
            catatan: 'Unit baru masuk — dokumen menyusul.',
          })),
        }

        set((s) => ({
          versi: s.versi + 1,
          unitBaru: [unit, ...s.unitBaru],
          procurementBaru: [procurement, ...s.procurementBaru],
          dokumenBaru: [dokumen, ...s.dokumenBaru],
          catatan: catat(s.catatan, 'Unit baru', `${unit.brand} ${unit.model} ${unit.tahun} · modal ${totalCost.toLocaleString('id-ID')}`),
        }))
        return unit
      },

      ubahDataUnit: (vehicleId, patch, label) =>
        set((s) => ({
          versi: s.versi + 1,
          ubahUnit: { ...s.ubahUnit, [vehicleId]: { ...s.ubahUnit[vehicleId], ...patch } },
          catatan: catat(s.catatan, 'Ubah unit', `${label} diperbarui (${Object.keys(patch).join(', ')})`),
        })),

      ubahDokumenUnit: (vehicleId, nama, status, nomor, label) =>
        set((s) => ({
          versi: s.versi + 1,
          ubahDokumen: {
            ...s.ubahDokumen,
            [vehicleId]: {
              ...s.ubahDokumen[vehicleId],
              [nama]: { status, nomor: nomor.trim() ? nomor.trim() : null },
            },
          },
          catatan: catat(s.catatan, 'Dokumen', `${label} · ${nama} → ${status}`),
        })),

      catatPenjualan: (m) => {
        const sisaPembayaran = Math.max(0, m.finalPrice - m.dp)
        const penjualan: Sale = {
          id: nomorUrut('INV-SESI-', get().penjualanBaru.length),
          vehicleId: m.vehicleId,
          customerId: m.customerId,
          customerNama: m.customerNama,
          salesPIC: m.salesPIC,
          tanggal: m.tanggal,
          listingPrice: m.listingPrice,
          negotiatedPrice: m.finalPrice,
          diskon: m.diskon,
          finalPrice: m.finalPrice,
          tipePembayaran: m.tipePembayaran,
          dp: m.dp,
          sisaPembayaran,
          financePartner: m.tipePembayaran === 'Kredit' ? m.financePartner : null,
          tenor: m.tipePembayaran === 'Kredit' ? m.tenor : null,
          estimasiCicilan: m.tipePembayaran === 'Kredit' ? m.estimasiCicilan : null,
          status: sisaPembayaran === 0 ? 'LUNAS' : 'DIBAYAR SEBAGIAN',
          totalModal: m.totalModal,
          grossProfit: m.finalPrice - m.totalModal,
          bookingId: m.bookingId,
          serahTerima: m.tanggal,
          catatan: m.catatan.trim() || 'Penjualan dicatat pada sesi demo.',
        }
        set((s) => ({
          versi: s.versi + 1,
          penjualanBaru: [penjualan, ...s.penjualanBaru],
          statusUnit: { ...s.statusUnit, [m.vehicleId]: 'SOLD' },
          bookingSelesai: m.bookingId ? [...s.bookingSelesai, m.bookingId] : s.bookingSelesai,
          catatan: catat(
            s.catatan,
            'Penjualan',
            `${m.vehicleLabel} terjual ${m.finalPrice.toLocaleString('id-ID')} (${m.tipePembayaran})`,
          ),
        }))
        return penjualan
      },

      reset: () =>
        set((s) => ({
          versi: s.versi + 1,
          statusUnit: {},
          tanggalSiap: {},
          catatanTahap: {},
          tahapLead: {},
          riwayatLead: [],
          leadBaru: [],
          leadKatalog: [],
          ubahLead: {},
          penjualanBaru: [],
          bookingSelesai: [],
          unitBaru: [],
          procurementBaru: [],
          dokumenBaru: [],
          ubahUnit: {},
          ubahDokumen: {},
          catatan: [],
        })),
    }),
    {
      name: 'car-showroom-sesi-demo',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

/** Tahap efektif lead: pakai perubahan sesi bila ada, kalau tidak pakai data dasar. */
export const tahapEfektif = (leadId: string, asli: LeadStatus, tahap: Record<string, LeadStatus>) =>
  tahap[leadId] ?? asli

export const jumlahPerubahan = (s: KeadaanSesi) =>
  Object.keys(s.statusUnit).length +
  Object.keys(s.tahapLead).length +
  Object.keys(s.ubahUnit).length +
  Object.keys(s.ubahLead).length +
  s.leadBaru.length +
  s.leadKatalog.length +
  s.penjualanBaru.length +
  s.unitBaru.length

/** Ringkasan satu baris: apa saja yang sudah diubah pengunjung pada sesi ini. */
export function ringkasPerubahan(s: KeadaanSesi): string {
  const bagian: string[] = []
  if (s.penjualanBaru.length) bagian.push(`${s.penjualanBaru.length} penjualan dicatat`)
  if (s.unitBaru.length) bagian.push(`${s.unitBaru.length} unit baru dimasukkan`)
  if (s.leadBaru.length) bagian.push(`${s.leadBaru.length} lead baru ditambahkan`)
  if (s.leadKatalog.length) bagian.push(`${s.leadKatalog.length} lead baru dari katalog publik`)
  if (Object.keys(s.tahapLead).length) bagian.push(`${Object.keys(s.tahapLead).length} tahap lead dipindahkan`)
  if (Object.keys(s.statusUnit).length) bagian.push(`${Object.keys(s.statusUnit).length} status unit diubah`)
  if (Object.keys(s.ubahUnit).length) bagian.push(`${Object.keys(s.ubahUnit).length} data unit diperbarui`)
  if (Object.keys(s.ubahLead).length) bagian.push(`${Object.keys(s.ubahLead).length} data lead diperbarui`)
  if (Object.keys(s.ubahDokumen).length) bagian.push(`${Object.keys(s.ubahDokumen).length} checklist dokumen diubah`)
  return bagian.join(' · ')
}
