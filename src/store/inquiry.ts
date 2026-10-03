import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dataset, DEMO_TODAY } from '@/data'
import type { Lead, TipePembayaran } from '@/data/types'

export interface PermintaanKatalog {
  nama: string
  telepon: string
  pesan: string
  vehicleId: string
  tipePembayaran: TipePembayaran
  budget: number
}

interface KeadaanPermintaan {
  masuk: Lead[]
  kirim: (p: PermintaanKatalog) => Lead
  reset: () => void
}

const geserHari = (tanggal: string, hari: number) => {
  const d = new Date(tanggal + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + hari)
  return d.toISOString().slice(0, 10)
}

const labelUnit = (vehicleId: string) => {
  const u = dataset.vehicles.find((v) => v.id === vehicleId)
  return u ? `${u.brand} ${u.model} ${u.variant}` : vehicleId
}

/**
 * Sales yang menerima lead baru: orang dengan lead aktif paling sedikit.
 * Dipilih dari data, bukan ditetapkan di kode — supaya beban kerja tetap masuk akal
 * ketika minat dari katalog bertambah selama demo.
 */
function salesPalingLengang(lengkap: Lead[]) {
  const tim = dataset.salesTeam
  if (tim.length === 0) return 'Belum ditugaskan'
  const hitung = tim.map((s) => ({
    nama: s.nama,
    aktif: lengkap.filter((l) => l.salesPIC === s.nama && !['WON', 'LOST'].includes(l.status)).length,
  }))
  hitung.sort((a, b) => a.aktif - b.aktif)
  return hitung[0].nama
}

/**
 * Minat dari katalog publik disimpan di sessionStorage, bukan hanya di memori:
 * tanpa itu, satu kali refresh membuat lead hilang dan alur "minat → CRM" tampak rusak.
 * Tetap tanpa backend — data hanya hidup selama tab ini terbuka, dan hilang saat tab ditutup.
 */
export const usePermintaanStore = create<KeadaanPermintaan>()(
  persist(
    (set, get) => ({
      masuk: [],
      kirim: (p) => {
        const sekarang = get().masuk
        const lengkap = [...sekarang, ...dataset.leads]
        const pesan = p.pesan.trim()
        const lead: Lead = {
          id: `LD-KATALOG-${String(sekarang.length + 1).padStart(2, '0')}`,
          customerId: null,
          nama: p.nama.trim(),
          telepon: p.telepon.trim(),
          sumber: 'Website',
          vehicleId: p.vehicleId,
          vehicleLabel: labelUnit(p.vehicleId),
          salesPIC: salesPalingLengang(lengkap),
          budget: p.budget,
          preferensiPembayaran: p.tipePembayaran,
          status: 'NEW',
          tanggalMasuk: DEMO_TODAY,
          interaksiTerakhir: DEMO_TODAY,
          nextFollowUp: geserHari(DEMO_TODAY, 1),
          catatan: pesan || `Mengirim minat pada ${labelUnit(p.vehicleId)} lewat katalog publik.`,
          interaksi: [
            {
              waktu: DEMO_TODAY,
              tipe: 'Katalog publik',
              oleh: 'Form katalog',
              catatan: pesan || 'Mengirim minat lewat katalog publik.',
            },
          ],
        }
        set({ masuk: [lead, ...sekarang] })
        return lead
      },
      reset: () => set({ masuk: [] }),
    }),
    {
      name: 'car-showroom-minat-katalog',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
