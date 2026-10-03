import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Hammer } from 'lucide-react'

const FASE: Record<string, { fase: string; isi: string }> = {
  '/procurement': { fase: 'F5', isi: 'Procurement: data penjual unit, penawaran, deal, PIC, dokumen diterima' },
  '/inspeksi': { fase: 'F5', isi: 'Inspeksi: checklist sembilan kategori dengan hasil Baik / Perhatian / Perlu Perbaikan' },
  '/reconditioning': { fase: 'F5', isi: 'Reconditioning: daftar pekerjaan, vendor, biaya, status pengerjaan' },
  '/dokumen': { fase: 'F5', isi: 'Dokumen: kelengkapan berkas per unit dan daftar temuan' },
  '/inventory': { fase: 'F3', isi: 'Inventory: tabel unit, filter status, pencarian, kartu unit' },
  '/inventory/:id': { fase: 'F4', isi: 'Detail unit: procurement, inspeksi, reconditioning, biaya, lead, penjualan, dokumen, dan lini masa satu unit dari dibeli sampai terjual' },
  '/crm': { fase: 'F6', isi: 'CRM: papan pipeline, kartu lead, jadwal follow-up' },
  '/customer': { fase: 'F6', isi: 'Customer: riwayat interaksi, test drive, negosiasi, transaksi' },
  '/booking': { fase: 'F7', isi: 'Booking: DP, masa kadaluarsa, status pembayaran' },
  '/penjualan': { fase: 'F7', isi: 'Penjualan: dari negosiasi sampai serah terima, cash maupun kredit' },
  '/finance': { fase: 'F7', isi: 'Finance: modal, harga jual, gross profit per unit, piutang' },
  '/biaya': { fase: 'F7', isi: 'Biaya operasional: marketing, kantor, transport, perawatan' },
  '/laporan': { fase: 'F8', isi: 'Laporan: penjualan, inventory, profit, lead, aging, performa' },
  '/performa': { fase: 'F8', isi: 'Performa sales: unit terjual, nilai, gross profit, konversi' },
}

/**
 * Penanda fase pengembangan. Komponen ini dipakai HANYA selama pembangunan
 * bertahap dan dihapus pada F10, sehingga build akhir tidak memuat layar kosong.
 */
export function ModulBerikutnya({ jalur }: { jalur: string }) {
  const info = FASE[jalur] ?? { fase: 'berikutnya', isi: 'Modul ini sedang dikerjakan.' }
  return (
    <div className="mx-auto max-w-2xl">
      <Panel>
        <div className="flex items-start gap-3">
          <Hammer size={18} className="mt-0.5 shrink-0 text-ink-3" />
          <div>
            <h2 className="text-xs font-semibold text-ink">Modul ini dibangun pada {info.fase}</h2>
            <p className="mt-1 text-xs text-ink-2">{info.isi}</p>
            <p className="mt-2 text-2xs text-ink-3">
              Data untuk modul ini sudah ada di dataset demo dan sudah lolos pemeriksaan konsistensi —
              hanya antarmukanya belum dibangun.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => history.back()}>
              <ArrowLeft size={14} />
              Kembali
            </Button>
          </div>
        </div>
        <p className="mt-4 border-t border-hairline pt-3 text-2xs text-ink-3">
          Sementara itu, semua keterkaitan data dapat dilihat dari{' '}
          <Link to="/inventory" className="font-medium text-accent hover:underline">
            halaman inventory
          </Link>{' '}
          dan dashboard.
        </p>
      </Panel>
    </div>
  )
}
