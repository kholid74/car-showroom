import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { HASIL_INSPEKSI } from '@/lib/status'
import { useSesi } from '@/store/sesi'
import type { HasilInspeksi, InspectionSection, Vehicle } from '@/data/types'

const HASIL: HasilInspeksi[] = ['GOOD', 'ATTENTION', 'REPAIR REQUIRED']

const dasar = (kategori: string, item: string[]): InspectionSection => ({
  kategori,
  item: item.map((i) => ({ item: i, hasil: 'GOOD' as HasilInspeksi, catatan: '' })),
})

/** Titik periksa standar showroom untuk unit yang belum pernah diinspeksi pada demo. */
const TEMPLATE: InspectionSection[] = [
  dasar('Eksterior', ['Bodi & cat', 'Kaca & lampu', 'Ban & velg', 'Pintu & kunci']),
  dasar('Interior', ['Jok & plafon', 'Dashboard & AC', 'Audio & kelistrikan']),
  dasar('Mesin & kaki-kaki', ['Mesin & transmisi', 'Rem & suspensi', 'Aki & alternator']),
  dasar('Dokumen & riwayat', ['STNK & BPKB', 'Riwayat servis', 'Riwayat kecelakaan']),
]

/**
 * Isi hasil inspeksi per titik periksa.
 * Skor dan rekomendasi dihitung dari temuan yang dipilih — bukan diketik manual,
 * supaya tidak mungkin ada inspeksi berlabel "layak jual" dengan temuan perbaikan.
 */
export function FormInspeksi({
  terbuka,
  onTutup,
  unit,
}: {
  terbuka: boolean
  onTutup: () => void
  unit: Vehicle
}) {
  const simpanInspeksi = useSesi((s) => s.simpanInspeksi)
  const lama = dataset.inspections.find((i) => i.vehicleId === unit.id)

  const [sections, setSections] = useState<InspectionSection[]>(() =>
    lama ? lama.sections.map((s) => ({ ...s, item: s.item.map((i) => ({ ...i })) })) : TEMPLATE.map((s) => ({ ...s, item: s.item.map((i) => ({ ...i })) })),
  )
  const [inspektur, setInspektur] = useState(lama?.inspektur ?? dataset.salesTeam[0]?.nama ?? '')
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState<string[]>([])

  const atur = (si: number, ii: number, patch: Partial<InspectionSection['item'][number]>) =>
    setSections((s) =>
      s.map((sec, a) => (a === si ? { ...sec, item: sec.item.map((it, b) => (b === ii ? { ...it, ...patch } : it)) } : sec)),
    )

  const semua = sections.flatMap((s) => s.item)
  const good = semua.filter((x) => x.hasil === 'GOOD').length
  const attention = semua.filter((x) => x.hasil === 'ATTENTION').length
  const repair = semua.filter((x) => x.hasil === 'REPAIR REQUIRED').length
  const skor = Math.round(((good + attention * 0.6) / Math.max(1, semua.length)) * 100)
  const rekomendasi = repair > 0 ? 'LAYAK JUAL DENGAN PERBAIKAN' : attention > 0 ? 'LAYAK JUAL DENGAN CATATAN' : 'LAYAK JUAL TANPA PERBAIKAN'

  const simpan = () => {
    const g: string[] = []
    if (!inspektur) g.push('Inspektur wajib dipilih.')
    if (semua.length === 0) g.push('Tidak ada titik periksa yang diperiksa.')
    setGalat(g)
    if (g.length) return

    simpanInspeksi({
      vehicleId: unit.id,
      vehicleLabel: `${unit.brand} ${unit.model} ${unit.tahun}`,
      inspektur,
      sections,
      catatan,
    })
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={`Hasil inspeksi · ${unit.id}`}
      keterangan={`${unit.brand} ${unit.model} ${unit.tahun} · skor & rekomendasi dihitung dari temuan yang Anda pilih`}
      lebar="max-w-3xl"
      catatanBawah="Inspeksi baru menggantikan penilaian sebelumnya untuk unit ini dan langsung tampil di halaman Inspeksi serta tab inspeksi pada detail unit."
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />

        <div className="flex flex-wrap items-center gap-2 rounded-control border border-hairline bg-sunken px-3 py-2">
          <span className="label-caps">Pratinjau penilaian</span>
          <span className="tnum text-xs font-semibold text-ink">Skor {skor}</span>
          <span className="text-2xs text-ink-3">{rekomendasi}</span>
          <span className="ml-auto text-2xs text-ink-3">
            {good} baik · {attention} perhatian · {repair} perlu perbaikan
          </span>
        </div>

        <div className="col-span-2 space-y-3">
          <Kolom label="Inspektur">
            <Pilihan value={inspektur} onChange={(e) => setInspektur(e.target.value)}>
              {dataset.salesTeam.map((s) => (
                <option key={s.id} value={s.nama}>{s.nama}</option>
              ))}
            </Pilihan>
          </Kolom>
          <Kolom label="Catatan umum">
            <Masukan value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="mis. unit bekas pemakaian pribadi, servis rutin" />
          </Kolom>
        </div>

        <div className="col-span-2 space-y-3">
          {sections.map((sec, si) => (
            <div key={sec.kategori} className="rounded-panel border border-hairline">
              <p className="border-b border-hairline bg-sunken px-3 py-1.5 text-2xs font-semibold text-ink">{sec.kategori}</p>
              <div className="divide-y divide-hairline">
                {sec.item.map((it, ii) => (
                  <div key={it.item} className="grid grid-cols-1 gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_170px_minmax(0,1fr)] sm:items-center">
                    <p className="text-xs text-ink-2">{it.item}</p>
                    <Pilihan
                      value={it.hasil}
                      onChange={(e) => atur(si, ii, { hasil: e.target.value as HasilInspeksi })}
                      aria-label={`Hasil ${it.item}`}
                    >
                      {HASIL.map((h) => (
                        <option key={h} value={h}>{HASIL_INSPEKSI[h].label}</option>
                      ))}
                    </Pilihan>
                    <Masukan
                      value={it.catatan}
                      onChange={(e) => atur(si, ii, { catatan: e.target.value })}
                      aria-label={`Catatan ${it.item}`}
                      placeholder="catatan temuan (opsional)"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          Simpan hasil inspeksi
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
