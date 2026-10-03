import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { useSesi } from '@/store/sesi'

const rupiah = (n: number) => n.toLocaleString('id-ID')

/** Tambah satu pekerjaan perbaikan ke sebuah reconditioning. Biayanya menambah modal unit. */
export function FormPekerjaanRecon({
  terbuka,
  onTutup,
  reconId,
  label,
}: {
  terbuka: boolean
  onTutup: () => void
  reconId: string
  label: string
}) {
  const tambahPekerjaanRecon = useSesi((s) => s.tambahPekerjaanRecon)
  const [isi, setIsi] = useState({
    vendor: dataset.vendors[0] ?? 'Vendor internal',
    job: '',
    biaya: '',
    catatan: '',
  })
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (k: keyof typeof isi, v: string) => setIsi((s) => ({ ...s, [k]: v }))
  const biaya = Number(isi.biaya) || 0

  const simpan = () => {
    const g: string[] = []
    if (isi.job.trim().length < 4) g.push('Nama pekerjaan minimal 4 karakter.')
    if (biaya <= 0) g.push('Biaya pekerjaan wajib diisi.')
    setGalat(g)
    if (g.length) return

    tambahPekerjaanRecon(
      reconId,
      { vendor: isi.vendor, job: isi.job.trim(), biaya, catatan: isi.catatan.trim() },
      label,
    )
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Tambah pekerjaan reconditioning"
      keterangan={`${label} · biaya pekerjaan menambah modal unit, sehingga estimasi margin ikut turun.`}
      lebar="max-w-xl"
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />
        <Kolom label="Pekerjaan" petunjuk="mis. Ketok & cat ulang pintu kanan depan">
          <Masukan value={isi.job} onChange={(e) => ubah('job', e.target.value)} placeholder="Nama pekerjaan" />
        </Kolom>
        <div className="col-span-2 space-y-3">
          <Kolom label="Vendor / bengkel">
            <Pilihan value={isi.vendor} onChange={(e) => ubah('vendor', e.target.value)}>
              {dataset.vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Pilihan>
          </Kolom>
          <Kolom label="Biaya (Rp)" petunjuk={biaya ? `Rp${rupiah(biaya)}` : 'angka saja'}>
            <Masukan
              inputMode="numeric"
              value={isi.biaya}
              onChange={(e) => ubah('biaya', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="1500000"
            />
          </Kolom>
          <Kolom label="Catatan">
            <Masukan value={isi.catatan} onChange={(e) => ubah('catatan', e.target.value)} placeholder="mis. dikerjakan 3 hari, garansi 1 bulan" />
          </Kolom>
        </div>
      </BadanDialog>
      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          Tambah pekerjaan
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
