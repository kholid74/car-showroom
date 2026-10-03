import { create } from 'zustand'
import type { LeadStatus } from '@/data/types'

/**
 * Perubahan tahap lead selama sesi demo.
 *
 * Demo ini tidak punya backend, jadi perpindahan tahap TIDAK tersimpan —
 * state hanya hidup selama tab dibuka, dan antarmuka menyatakannya secara terbuka.
 * Tujuannya memperlihatkan alurnya, bukan berpura-pura ada database.
 */
interface LeadStore {
  perubahan: Record<string, LeadStatus>
  riwayat: { leadId: string; dari: LeadStatus; ke: LeadStatus; waktu: string }[]
  pindahkan: (leadId: string, dari: LeadStatus, ke: LeadStatus) => void
  reset: () => void
}

export const TAHAP_BERIKUTNYA: Partial<Record<LeadStatus, LeadStatus>> = {
  NEW: 'CONTACTED',
  CONTACTED: 'INTERESTED',
  INTERESTED: 'TEST DRIVE',
  'TEST DRIVE': 'NEGOTIATION',
  NEGOTIATION: 'BOOKED',
  BOOKED: 'WON',
}

export const useLeadStore = create<LeadStore>((set) => ({
  perubahan: {},
  riwayat: [],
  pindahkan: (leadId, dari, ke) =>
    set((s) => ({
      perubahan: { ...s.perubahan, [leadId]: ke },
      riwayat: [
        { leadId, dari, ke, waktu: new Date().toISOString() },
        ...s.riwayat,
      ].slice(0, 40),
    })),
  reset: () => set({ perubahan: {}, riwayat: [] }),
}))

/** Tahap efektif: pakai perubahan sesi bila ada, kalau tidak pakai data demo. */
export const tahapEfektif = (leadId: string, asli: LeadStatus, perubahan: Record<string, LeadStatus>) =>
  perubahan[leadId] ?? asli
