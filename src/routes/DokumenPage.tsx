import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, FileWarning, FolderPen, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_DOKUMEN, STATUS_UNIT } from '@/lib/status'
import { rekapJenisDokumen, ringkasanDokumen, unitDokumenBermasalah } from '@/data/agregat'
import { dataset } from '@/data'
import { persen } from '@/lib/format'
import { FormDokumen } from '@/components/app/FormDokumen'
import type { VehicleDocuments } from '@/data/types'

export function DokumenPage() {
  const [params, setParams] = useSearchParams()
  const [formDok, setFormDok] = useState<VehicleDocuments | null>(null)
  const q = params.get('q') ?? ''
  const jenis = params.get('jenis') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanDokumen(), [])
  const rekap = useMemo(() => rekapJenisDokumen(), [])
  const bermasalah = useMemo(() => unitDokumenBermasalah(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return bermasalah
      .filter((x) => jenis === 'SEMUA' || x.bermasalah.some((b) => b.nama === jenis))
      .filter((x) => {
        if (!kata) return true
        const kolom = [x.unit.id, x.unit.brand, x.unit.model, x.unit.salesPIC, ...x.bermasalah.map((b) => b.nama)]
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
  }, [q, jenis, bermasalah])

  const adaFilter = q !== '' || jenis !== 'SEMUA'

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Unit Diperiksa"
          nilai={<Angka nilai={ringkas.unit} ukuran="xl" />}
          catatan={`${ringkas.total} dokumen dalam checklist`}
        />
        <SelRingkas
          label="Dokumen Lengkap"
          nilai={<Angka nilai={ringkas.unitLengkap} ukuran="xl" nada="positif" />}
          catatan={`${persen(ringkas.unitLengkap / Math.max(1, ringkas.unit), 0)} dari seluruh unit`}
        />
        <SelRingkas
          label="Unit Ada Temuan"
          nilai={<Angka nilai={ringkas.unitBermasalah} ukuran="xl" nada={ringkas.unitBermasalah ? 'bahaya' : 'muted'} />}
          catatan="Menghambat balik nama & serah terima"
        />
        <SelRingkas
          label="Dokumen Menunggu"
          nilai={<Angka nilai={ringkas.menunggu} ukuran="xl" nada="perhatian" />}
          catatan="Berkas sedang diurus ke pemilik sebelumnya"
        />
        <SelRingkas
          label="Dokumen Belum Ada"
          nilai={<Angka nilai={ringkas.belumAda} ukuran="xl" nada={ringkas.belumAda ? 'bahaya' : 'muted'} />}
          catatan="Belum diterima dari penjual"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari unit, sales, atau jenis dokumen…"
            aria-label="Cari dokumen"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={jenis === 'SEMUA'} onClick={() => atur('jenis', 'SEMUA')} jumlah={bermasalah.length}>
            Semua jenis
          </FilterChip>
          {rekap
            .filter((r) => r.menunggu + r.belumAda > 0)
            .map((r) => (
              <FilterChip
                key={r.nama}
                aktif={jenis === r.nama}
                onClick={() => atur('jenis', r.nama)}
                jumlah={r.menunggu + r.belumAda}
              >
                {r.nama}
              </FilterChip>
            ))}
        </div>

        {adaFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
            ikon={<X size={13} />}
          >
            Bersihkan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          judul={`${terfilter.length} unit dengan dokumen belum lengkap`}
          keterangan="Daftar pengecualian — unit di luar daftar ini dokumennya sudah lengkap"
          padat
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">
              Tidak ada unit yang cocok dengan filter ini. Seluruh dokumen unit lain sudah lengkap.
            </p>
          ) : (
            <Table minWidth={760}>
              <THead>
                <Th lebar={260}>Unit</Th>
                <Th lebar={130}>Status Unit</Th>
                <Th>Dokumen Bermasalah</Th>
                <Th align="right" className="hidden md:table-cell" lebar={110}>Jumlah</Th>
                <Th lebar={140} className="hidden lg:table-cell">Sales PIC</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map((x) => (
                  <Baris key={x.unit.id}>
                    <Td>
                      <Link to={`/inventory/${x.unit.id}?tab=dokumen`} className="group block min-w-0">
                        <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                          {x.unit.brand} {x.unit.model}
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-2">
                          <IdChip nilai={x.unit.id} />
                          <span className="id-chip text-ink-3">{x.unit.nomorPolisi}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <StatusPill
                        label={STATUS_UNIT[x.unit.status].label}
                        pil={STATUS_UNIT[x.unit.status].halus}
                        dot={STATUS_UNIT[x.unit.status].dot}
                      />
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1.5">
                        {x.bermasalah.map((b) => (
                          <button
                            key={b.nama}
                            type="button"
                            onClick={() => setFormDok(x.dokumen)}
                            className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs hover:brightness-95 ${STATUS_DOKUMEN[b.status].halus}`}
                            title={`${b.catatan} — klik untuk ubah statusnya`}
                          >
                            <FileWarning size={11} />
                            {b.nama} · {STATUS_DOKUMEN[b.status].label}
                          </button>
                        ))}
                        {x.bermasalah.length === 0 && <span className="text-2xs text-ink-3">Semua dokumen tersedia</span>}
                      </span>
                    </Td>
                    <Td align="right" className="hidden md:table-cell">
                      <span className="tnum text-xs font-medium text-danger">{x.bermasalah.length}</span>
                      <span className="mt-0.5 block text-2xs text-ink-3">dari {x.dokumen.checklist.length}</span>
                    </Td>
                    <Td className="hidden lg:table-cell"><span className="text-2xs text-ink-2">{x.unit.salesPIC}</span></Td>
                    <Td align="right">
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormDok(x.dokumen)}
                          aria-label={`Kelola dokumen ${x.unit.id}`}
                          title="Kelola kelengkapan dokumen"
                          className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                        >
                          <FolderPen size={14} />
                        </button>
                        <Link
                          to={`/inventory/${x.unit.id}?tab=dokumen`}
                          aria-label={`Buka detail ${x.unit.id}`}
                          className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                        >
                          <ChevronRight size={15} />
                        </Link>
                      </span>
                    </Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel judul="Rekap per jenis dokumen" keterangan="Diurutkan dari yang paling sering bermasalah" padat>
            <Table minWidth={0}>
              <THead>
                <Th>Dokumen</Th>
                <Th align="right">Lengkap</Th>
                <Th align="right">Menunggu</Th>
                <Th align="right">Belum Ada</Th>
              </THead>
              <tbody>
                {rekap.map((r) => (
                  <Baris key={r.nama}>
                    <Td>
                      <span className="text-xs text-ink-2">{r.nama}</span>
                    </Td>
                    <Td align="right"><span className="tnum text-xs text-money-pos">{r.tersedia}</span></Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${r.menunggu ? 'text-attention' : 'text-ink-3'}`}>{r.menunggu}</span>
                    </Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${r.belumAda ? 'text-danger' : 'text-ink-3'}`}>{r.belumAda}</span>
                    </Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel judul="Cara kerja pemeriksaan dokumen" padat>
            <p className="px-4 py-3 text-2xs leading-relaxed text-ink-3">
              Setiap unit memiliki checklist enam dokumen: STNK, BPKB, Faktur, Kwitansi Pembelian, Dokumen Inspeksi,
              dan Perjanjian Jual Beli. Status <span className="text-money-pos">Tersedia</span> berarti berkas ada di
              showroom, <span className="text-attention">Menunggu</span> berarti masih diurus ke penjual sebelumnya,
              dan <span className="text-danger">Belum Ada</span> berarti belum diterima. Ketiganya menentukan kapan
              sebuah unit boleh diserahkan ke pembeli.
            </p>
          </Panel>
        </div>
      </div>

      {formDok && (
        <FormDokumen
          terbuka
          dokumen={formDok}
          label={(() => {
            const u = dataset.vehicles.find((v) => v.id === formDok.vehicleId)
            return u ? `${u.brand} ${u.model} ${u.tahun}` : formDok.vehicleId
          })()}
          onTutup={() => setFormDok(null)}
        />
      )}
    </div>
  )
}
