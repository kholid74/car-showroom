import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { useSesi } from '@/store/sesi'
import type { StatusDokumen, VehicleDocuments } from '@/data/types'

const STATUS: StatusDokumen[] = ['Tersedia', 'Menunggu', 'Belum Ada']

/**
 * Kelola kelengkapan dokumen satu unit dalam satu layar.
 * Pekerjaan admin yang paling sering: mengubah status berkas dan mencatat nomornya.
 */
export function FormDokumen({
  terbuka,
  onTutup,
  dokumen,
  label,
}: {
  terbuka: boolean
  onTutup: () => void
  dokumen: VehicleDocuments
  label: string
}) {
  const ubahDokumenUnit = useSesi((s) => s.ubahDokumenUnit)
  const [isi, setIsi] = useState(
    dokumen.checklist.map((c) => ({ nama: c.nama, status: c.status, nomor: c.nomor ?? '' })),
  )

  const ubah = (nama: string, patch: Partial<{ status: StatusDokumen; nomor: string }>) =>
    setIsi((s) => s.map((x) => (x.nama === nama ? { ...x, ...patch } : x)))

  const simpan = () => {
    isi.forEach((x, i) => {
      const asal = dokumen.checklist[i]
      if (asal.status !== x.status || (asal.nomor ?? '') !== x.nomor) {
        ubahDokumenUnit(dokumen.vehicleId, x.nama, x.status, x.nomor, label)
      }
    })
    onTutup()
  }

  const belumLengkap = isi.filter((x) => x.status !== 'Tersedia').length

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={`Kelola dokumen · ${dokumen.vehicleId}`}
      keterangan={`${label} · ${belumLengkap} dari ${isi.length} dokumen belum lengkap`}
      lebar="max-w-2xl"
      catatanBawah="Perubahan status langsung memengaruhi pengingat di lonceng notifikasi dan catatan kelengkapan di katalog publik."
    >
      <div className="divide-y divide-hairline">
        {isi.map((x) => (
          <div key={x.nama} className="grid grid-cols-1 gap-2 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_150px_200px] sm:items-end">
            <p className="text-xs text-ink">{x.nama}</p>
            <Kolom label="Status">
              <Pilihan
                value={x.status}
                onChange={(e) => ubah(x.nama, { status: e.target.value as StatusDokumen })}
                aria-label={`Status ${x.nama}`}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Pilihan>
            </Kolom>
            <Kolom label="Nomor dokumen">
              <Masukan
                value={x.nomor}
                onChange={(e) => ubah(x.nama, { nomor: e.target.value })}
                aria-label={`Nomor ${x.nama}`}
                placeholder="belum ada"
              />
            </Kolom>
          </div>
        ))}
      </div>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          Simpan kelengkapan dokumen
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
