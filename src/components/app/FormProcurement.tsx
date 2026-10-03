import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { useSesi } from '@/store/sesi'
import { rupiahRingkas } from '@/lib/format'
import type { Procurement } from '@/data/types'

const rupiah = (n: number) => n.toLocaleString('id-ID')
const DOKUMEN = ['BPKB', 'STNK', 'Faktur', 'Kwitansi Pembelian', 'Dokumen Inspeksi', 'Perjanjian Jual Beli']

/**
 * Ubah data pembelian unit.
 * Harga deal di sini adalah harga beli unit — mengubahnya menggeser modal, estimasi margin,
 * dan seluruh laporan yang memakai modal. Karena itu tautannya eksplisit di badan dialog.
 */
export function FormProcurement({
  terbuka,
  onTutup,
  procurement,
  label,
}: {
  terbuka: boolean
  onTutup: () => void
  procurement: Procurement
  label: string
}) {
  const ubahDataProcurement = useSesi((s) => s.ubahDataProcurement)
  const tandaiDokumenPembelian = useSesi((s) => s.tandaiDokumenPembelian)

  const [isi, setIsi] = useState({
    penawaran: String(procurement.hargaPenawaran),
    deal: String(procurement.hargaDeal),
    metode: procurement.metodePembayaran,
    catatan: procurement.catatan,
  })
  const [dokumen, setDokumen] = useState<string[]>(procurement.dokumenDiterima ?? [])
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (k: keyof typeof isi, v: string) => setIsi((s) => ({ ...s, [k]: v }))
  const penawaran = Number(isi.penawaran) || 0
  const deal = Number(isi.deal) || 0
  const hemat = penawaran - deal

  const simpan = () => {
    const g: string[] = []
    if (penawaran <= 0 || deal <= 0) g.push('Harga penawaran dan harga deal wajib diisi.')
    if (deal > penawaran) g.push('Harga deal tidak lazim melebihi harga penawaran — periksa angkanya.')
    setGalat(g)
    if (g.length) return

    ubahDataProcurement(
      procurement.id,
      { hargaPenawaran: penawaran, hargaDeal: deal, metodePembayaran: isi.metode, catatan: isi.catatan.trim() },
      label,
      deal !== procurement.hargaDeal ? { vehicleId: procurement.vehicleId, hargaDeal: deal } : undefined,
    )
    if (dokumen.length !== (procurement.dokumenDiterima ?? []).length) {
      tandaiDokumenPembelian(procurement.id, dokumen, label)
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={`Ubah pembelian · ${procurement.id}`}
      keterangan={`${label} · harga deal adalah harga beli unit, jadi modal dan margin unit ini ikut menyesuaikan.`}
      lebar="max-w-2xl"
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />

        <Kolom label="Harga penawaran (Rp)" petunjuk={penawaran ? `Rp${rupiah(penawaran)}` : 'angka saja'}>
          <Masukan inputMode="numeric" value={isi.penawaran} onChange={(e) => ubah('penawaran', e.target.value.replace(/[^\d]/g, ''))} />
        </Kolom>
        <Kolom
          label="Harga deal (Rp)"
          petunjuk={deal ? `Rp${rupiah(deal)}${hemat > 0 ? ` · turun ${rupiahRingkas(hemat)} dari penawaran` : ''}` : 'angka saja'}
        >
          <Masukan inputMode="numeric" value={isi.deal} onChange={(e) => ubah('deal', e.target.value.replace(/[^\d]/g, ''))} />
        </Kolom>
        <Kolom label="Metode pembayaran">
          <Pilihan value={isi.metode} onChange={(e) => ubah('metode', e.target.value)}>
            {['Transfer bank', 'Tunai', 'Transfer'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Catatan pembelian">
          <Masukan value={isi.catatan} onChange={(e) => ubah('catatan', e.target.value)} placeholder="mis. harga sudah termasuk balik nama" />
        </Kolom>

        <div className="col-span-2 space-y-2">
          <p className="label-caps">Dokumen yang sudah diterima dari penjual</p>
          <div className="flex flex-wrap gap-1.5">
            {DOKUMEN.map((d) => {
              const aktif = dokumen.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setDokumen((s) => (aktif ? s.filter((x) => x !== d) : [...s, d]))}
                  className={`rounded-pill px-2.5 py-1 text-2xs ${
                    aktif ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <p className="text-2xs leading-relaxed text-ink-3">
            {dokumen.length} dari {DOKUMEN.length} berkas ditandai diterima. Kelengkapan berkas pada checklist unit diurus terpisah di menu Dokumen.
          </p>
        </div>
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          Simpan pembelian
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
