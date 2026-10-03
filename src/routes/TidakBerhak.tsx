import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { LABEL_PERAN, useAuth } from '@/store/auth'
import { semuaItemNav } from '@/app/nav'
import type { Role } from '@/data/types'

/**
 * Layar penolakan akses. Dipakai penjaga rute supaya pembatasan peran berlaku pada alamat
 * halaman, bukan hanya pada daftar menu — menyembunyikan menu saja bukan pembatasan.
 */
export function TidakBerhak({ jalur, peran }: { jalur: string; peran: Role[] }) {
  const { pengguna } = useAuth()
  const halaman = semuaItemNav.find((i) => i.ke === jalur)

  return (
    <Panel
      judul="Halaman ini tidak terbuka untuk peran Anda"
      keterangan={`${halaman?.label ?? jalur} dibatasi untuk ${peran.map((p) => LABEL_PERAN[p]).join(' dan ')}`}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-attention" />
        <div className="min-w-0">
          <p className="text-xs leading-relaxed text-ink-2">
            Anda sedang masuk sebagai <span className="font-medium text-ink">{pengguna ? LABEL_PERAN[pengguna.role] : 'tanpa peran'}</span>,
            dan halaman ini hanya bisa dibuka oleh {peran.map((p) => LABEL_PERAN[p]).join(' atau ')}.
          </p>
          <p className="mt-2 text-2xs leading-relaxed text-ink-3">
            Pembatasan ini berlaku pada rute, bukan hanya pada menu. Pada aplikasi nyata halaman seperti ini
            dilindungi di sisi server sekaligus di sisi antarmuka — menyembunyikan menu saja tidak cukup.
          </p>
          <p className="mt-3 text-2xs text-ink-3">
            Untuk melihat isinya pada demo ini, ganti peran lewat pemilih di kanan atas.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-control border border-hairline-strong bg-panel px-2.5 py-1.5 text-2xs font-medium text-ink hover:bg-sunken"
          >
            <ArrowLeft size={13} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </Panel>
  )
}
