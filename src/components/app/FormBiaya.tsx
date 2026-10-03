import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { dataset, DEMO_TODAY } from '@/data'
import { useSesi } from '@/store/sesi'
import type { Expense } from '@/data/types'

const rupiah = (n: number) => n.toLocaleString('id-ID')

/**
 * Tambah atau ubah satu baris biaya operasional.
 * Biaya di sini adalah beban showroom (gaji, sewa, iklan), bukan biaya perbaikan unit —
 * itu masuk lewat Reconditioning, supaya modal unit tetap bisa ditelusuri.
 */
export function FormBiaya({
  terbuka,
  onTutup,
  biaya,
}: {
  terbuka: boolean
  onTutup: () => void
  biaya?: Expense
}) {
  const tambahBiaya = useSesi((s) => s.tambahBiaya)
  const ubahDataBiaya = useSesi((s) => s.ubahDataBiaya)
  const hapusBiaya = useSesi((s) => s.hapusBiaya)

  const kategori = useMemo(() => [...new Set(dataset.expenses.map((e) => e.kategori))], [])
  const metode = useMemo(() => [...new Set(dataset.expenses.map((e) => e.metode))], [])
  const pic = useMemo(() => dataset.users.map((u) => u.nama), [])

  const [isi, setIsi] = useState({
    tanggal: biaya?.tanggal ?? DEMO_TODAY,
    kategori: biaya?.kategori ?? kategori[0] ?? 'Operasional',
    item: biaya?.item ?? '',
    jumlah: biaya ? String(biaya.jumlah) : '',
    metode: biaya?.metode ?? metode[0] ?? 'Transfer',
    vendor: biaya?.vendor && biaya.vendor !== '—' ? biaya.vendor : '',
    pic: biaya?.pic ?? pic[0] ?? '',
  })
  const [galat, setGalat] = useState<string[]>([])
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)

  const ubah = (k: keyof typeof isi, v: string) => setIsi((s) => ({ ...s, [k]: v }))
  const jumlah = Number(isi.jumlah) || 0

  const simpan = () => {
    const g: string[] = []
    if (isi.item.trim().length < 3) g.push('Keterangan biaya minimal 3 karakter.')
    if (jumlah < 1000) g.push('Jumlah minimal Rp1.000.')
    if (jumlah > 5_000_000_000) g.push('Jumlah terlalu besar untuk satu baris biaya.')
    if (!isi.pic) g.push('PIC wajib dipilih.')
    setGalat(g)
    if (g.length) return

    if (biaya) {
      ubahDataBiaya(
        biaya.id,
        {
          tanggal: isi.tanggal,
          bulan: isi.tanggal.slice(0, 7),
          kategori: isi.kategori,
          item: isi.item.trim(),
          jumlah,
          metode: isi.metode,
          vendor: isi.vendor.trim() || '—',
          pic: isi.pic,
        },
        `${isi.item.trim()} (${rupiah(biaya.jumlah)} → ${rupiah(jumlah)})`,
      )
    } else {
      tambahBiaya({ ...isi, item: isi.item.trim(), jumlah })
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={biaya ? `Ubah biaya · ${biaya.id}` : 'Catat biaya operasional'}
      keterangan={
        biaya
          ? 'Perubahan langsung menggeser total biaya dan laba bersih di Finance serta Laporan.'
          : 'Biaya di sini dihitung sebagai beban periode, bukan penambah modal unit.'
      }
      lebar="max-w-xl"
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />
        <div className="col-span-2 space-y-3">
          <Kolom label="Tanggal">
            <Masukan type="date" value={isi.tanggal} onChange={(e) => ubah('tanggal', e.target.value)} />
          </Kolom>
          <Kolom label="Kategori">
            <Pilihan value={isi.kategori} onChange={(e) => ubah('kategori', e.target.value)}>
              {kategori.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Pilihan>
          </Kolom>
          <Kolom label="Keterangan" petunjuk="mis. Iklan Instagram Oktober">
            <Masukan value={isi.item} onChange={(e) => ubah('item', e.target.value)} placeholder="Keterangan biaya" />
          </Kolom>
          <Kolom label="Jumlah (Rp)" petunjuk={jumlah ? `Rp${rupiah(jumlah)}` : 'angka saja, tanpa titik'}>
            <Masukan
              inputMode="numeric"
              value={isi.jumlah}
              onChange={(e) => ubah('jumlah', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="2500000"
            />
          </Kolom>
          <Kolom label="Metode">
            <Pilihan value={isi.metode} onChange={(e) => ubah('metode', e.target.value)}>
              {metode.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Pilihan>
          </Kolom>
          <Kolom label="Vendor / penerima" petunjuk="boleh dikosongkan">
            <Masukan value={isi.vendor} onChange={(e) => ubah('vendor', e.target.value)} placeholder="—" />
          </Kolom>
          <Kolom label="PIC">
            <Pilihan value={isi.pic} onChange={(e) => ubah('pic', e.target.value)}>
              {pic.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Pilihan>
          </Kolom>
        </div>
      </BadanDialog>

      <AksiDialog kiri={
        biaya ? (
          konfirmasiHapus ? (
            <span className="inline-flex items-center gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  hapusBiaya(biaya.id, `${biaya.item} (${rupiah(biaya.jumlah)})`)
                  onTutup()
                }}
              >
                Ya, hapus permanen
              </Button>
              <button type="button" className="text-2xs text-ink-3 underline" onClick={() => setKonfirmasiHapus(false)}>
                batal
              </button>
            </span>
          ) : (
            <Button variant="ghost" onClick={() => setKonfirmasiHapus(true)}>
              Hapus biaya
            </Button>
          )
        ) : null
      }>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          {biaya ? 'Simpan perubahan' : 'Catat biaya'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
