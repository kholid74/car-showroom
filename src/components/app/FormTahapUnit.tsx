import { useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, TeksPanjang } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { TAHAP_UNIT_BERIKUTNYA, useSesi } from '@/store/sesi'
import { STATUS_UNIT } from '@/lib/status'
import type { Vehicle } from '@/data/types'

/**
 * Ubah tahap unit. Perpindahan yang ditawarkan bukan pilihan bebas: hanya langkah berikutnya
 * yang sah (Baru Masuk → Inspeksi → Reconditioning → Ready). Justru inilah yang membedakan
 * sistem dari spreadsheet — unit tidak bisa tayang sebelum dikerjakan.
 *
 * Gerbangnya bukan sekadar urutan tahap: masuk Perbaikan menuntut hasil inspeksi yang sudah
 * dicatat, dan Siap Jual menuntut catatan perbaikan yang sudah ditandai selesai. Dokumen yang
 * belum lengkap tetap berupa peringatan, bukan penghalang.
 */
export function FormTahapUnit({
  terbuka,
  onTutup,
  unit,
}: {
  terbuka: boolean
  onTutup: () => void
  unit: Vehicle
}) {
  const ubahStatusUnit = useSesi((s) => s.ubahStatusUnit)
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState<string[]>([])

  const berikutnya = TAHAP_UNIT_BERIKUTNYA[unit.status]
  const dokumen = dataset.documents.find((d) => d.vehicleId === unit.id)
  const belumLengkap = dokumen ? dokumen.checklist.filter((c) => c.status !== 'Tersedia').length : 0
  const inspeksi = dataset.inspections.find((i) => i.vehicleId === unit.id)
  const recon = dataset.reconditionings.find((r) => r.vehicleId === unit.id)
  const pekerjaanSisa = recon ? recon.items.filter((i) => i.status !== 'COMPLETED').length : 0

  /** Syarat yang menghalangi perpindahan — diperiksa sebelum tombol simpan ditekan. */
  const penghalang: string[] = []
  if (berikutnya === 'RECONDITIONING' && !inspeksi)
    penghalang.push(
      'Belum ada hasil inspeksi untuk unit ini. Isi form Inspeksi dulu — temuan inspeksi jadi dasar pekerjaan perbaikan.',
    )
  if (berikutnya === 'READY') {
    if (!recon)
      penghalang.push('Unit ini belum punya catatan perbaikan, jadi belum ada pekerjaan yang bisa dinilai selesai.')
    else if (recon.status !== 'COMPLETED')
      penghalang.push(
        recon.items.length === 0
          ? 'Catatan perbaikan unit ini belum ditandai selesai. Buka tab Perbaikan: tambahkan pekerjaan, atau tandai selesai bila unit memang tidak perlu dikerjakan.'
          : `${pekerjaanSisa} dari ${recon.items.length} pekerjaan perbaikan belum selesai. Selesaikan dulu di tab Perbaikan sebelum unit dinyatakan siap jual.`,
      )
  }

  const simpan = () => {
    const masalah: string[] = []
    if (!berikutnya) masalah.push('Tahap unit ini sudah di ujung alur — penjualan dicatat dari halaman Penjualan atau Booking.')
    if (catatan.trim().length < 5) masalah.push('Catatan minimal 5 huruf: tahap ini perlu jejak alasan.')
    setGalat(masalah)
    if (masalah.length || penghalang.length || !berikutnya) return
    ubahStatusUnit(unit.id, berikutnya, catatan.trim(), `${unit.brand} ${unit.model}`)
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={`Ubah tahap unit · ${unit.id}`}
      keterangan={`${unit.brand} ${unit.model} ${unit.tahun} saat ini berstatus ${STATUS_UNIT[unit.status]?.label ?? unit.status}.`}
      catatanBawah="Tahap hanya bisa maju satu langkah, dan setiap perpindahan tercatat pada spanduk sesi."
    >
      <BadanDialog>
        <div className="col-span-2 flex flex-wrap items-center gap-2 rounded-control border border-hairline bg-sunken px-3 py-2.5">
          <span className="text-2xs text-ink-2">Sekarang</span>
          <span className="text-xs font-medium text-ink">{STATUS_UNIT[unit.status]?.label ?? unit.status}</span>
          {berikutnya && (
            <>
              <span className="text-2xs text-ink-3">→ berikutnya</span>
              <span className="text-xs font-medium text-accent">{STATUS_UNIT[berikutnya]?.label ?? berikutnya}</span>
            </>
          )}
        </div>

        {penghalang.length > 0 && (
          <div className="col-span-2 rounded-control border border-danger/30 bg-danger/5 p-2.5">
            <p className="flex items-start gap-2 text-2xs font-medium leading-relaxed text-ink">
              <Info size={13} className="mt-0.5 shrink-0 text-danger" />
              <span>Tahap ini belum bisa dipindahkan:</span>
            </p>
            <ul className="mt-1.5 space-y-1 pl-5">
              {penghalang.map((p) => (
                <li key={p} className="list-disc text-2xs leading-relaxed text-ink-2">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {berikutnya === 'READY' && belumLengkap > 0 && (
          <p className="col-span-2 flex items-start gap-2 rounded-control border border-attention/30 bg-attention/5 p-2 text-2xs leading-relaxed text-ink-2">
            <Info size={13} className="mt-0.5 shrink-0 text-attention" />
            <span>
              {belumLengkap} dokumen unit ini belum tersedia. Unit tetap bisa dinyatakan siap, tetapi pengingatnya akan
              tetap muncul di lonceng notifikasi sampai berkasnya lengkap.
            </span>
          </p>
        )}

        <Kolom label="Catatan pekerjaan / alasan" petunjuk="Contoh: inspeksi 37 item selesai, 3 temuan sudah dijadwalkan.">
          <TeksPanjang value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} />
        </Kolom>

        <DaftarGalat galat={galat} />
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan} disabled={!berikutnya || penghalang.length > 0}>
          {berikutnya ? `Pindahkan ke ${STATUS_UNIT[berikutnya]?.label ?? berikutnya}` : 'Tidak ada tahap berikutnya'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
