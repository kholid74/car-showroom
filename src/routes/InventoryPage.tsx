import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronRight, FileWarning, LayoutGrid, List, Pencil, Plus, Search, X } from 'lucide-react'
import { VehiclePhoto } from '@/components/ui/VehiclePhoto'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { StatusPill } from '@/components/ui/StatusPill'
import { IdChip } from '@/components/ui/IdChip'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip, SakelarTampilan } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_UNIT, URUTAN_STATUS, keteranganAging } from '@/lib/status'
import { dataset } from '@/data'
import { dokumenByUnit } from '@/data/selectors'
import { FormUnit } from '@/components/app/FormUnit'
import { FormTahapUnit } from '@/components/app/FormTahapUnit'
import { kilometer, tanggalPendek } from '@/lib/format'
import type { UnitStatus, Vehicle } from '@/data/types'

type KunciUrut = 'unit' | 'status' | 'masuk' | 'umur' | 'modal' | 'listing' | 'margin'
type Arah = 'asc' | 'desc'
type Tampilan = 'tabel' | 'kartu'

const NILAI_URUT: Record<KunciUrut, (v: Vehicle) => string | number> = {
  unit: (v) => `${v.brand} ${v.model} ${v.variant}`.toLowerCase(),
  status: (v) => STATUS_UNIT[v.status].urut,
  masuk: (v) => v.tanggalMasuk,
  umur: (v) => v.hariSejakSiap ?? v.hariDiInventory,
  modal: (v) => v.totalCost,
  listing: (v) => v.listingPrice,
  margin: (v) => v.estimasiMargin,
}

const LABEL_URUT: Record<KunciUrut, string> = {
  unit: 'Unit',
  status: 'Status',
  masuk: 'Tanggal masuk',
  umur: 'Umur stok',
  modal: 'Total modal',
  listing: 'Harga listing',
  margin: 'Estimasi margin',
}

export function InventoryPage() {
  const [params, setParams] = useSearchParams()
  const [formUnit, setFormUnit] = useState<{ terbuka: boolean; unit?: Vehicle }>({ terbuka: false })
  const [formTahap, setFormTahap] = useState<Vehicle | null>(null)

  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? 'SEMUA') as UnitStatus | 'SEMUA'
  const cabang = params.get('cabang') ?? 'SEMUA'
  const urut = (params.get('urut') ?? 'masuk') as KunciUrut
  const arah = (params.get('arah') ?? 'desc') as Arah
  const tampilan = (params.get('tampilan') ?? 'kartu') as Tampilan

  const aturParam = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ubahUrut = (kunci: KunciUrut) => {
    if (kunci === urut) aturParam('arah', arah === 'asc' ? 'desc' : 'asc')
    else {
      const berikut = new URLSearchParams(params)
      berikut.set('urut', kunci)
      berikut.set('arah', kunci === 'unit' ? 'asc' : 'desc')
      setParams(berikut, { replace: true })
    }
  }

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    let daftar = dataset.vehicles.filter((v) => {
      if (status !== 'SEMUA' && v.status !== status) return false
      if (cabang !== 'SEMUA' && v.cabang !== cabang) return false
      if (!kata) return true
      const kolom = [v.id, v.nomorPolisi, v.vin, v.brand, v.model, v.variant, v.warna, v.salesPIC, v.cabang]
      return kolom.some((k) => k.toLowerCase().includes(kata))
    })
    const ambil = NILAI_URUT[urut]
    daftar = [...daftar].sort((a, b) => {
      const x = ambil(a)
      const y = ambil(b)
      if (x === y) return 0
      const hasil = x > y ? 1 : -1
      return arah === 'asc' ? hasil : -hasil
    })
    return daftar
  }, [q, status, cabang, urut, arah])

  const ringkasan = useMemo(() => {
    const tersedia = terfilter.filter((v) => v.status !== 'SOLD')
    const terjual = terfilter.filter((v) => v.status === 'SOLD')
    const labaTerjual = dataset.sales
      .filter((s) => terjual.some((v) => v.id === s.vehicleId))
      .reduce((s, x) => s + x.grossProfit, 0)
    return {
      unit: terfilter.length,
      tersedia: tersedia.length,
      terjual: terjual.length,
      modal: terfilter.reduce((s, v) => s + v.totalCost, 0),
      listing: terfilter.reduce((s, v) => s + v.listingPrice, 0),
      potensiMargin: tersedia.reduce((s, v) => s + v.estimasiMargin, 0),
      labaTerjual,
    }
  }, [terfilter])

  const hitungStatus = useMemo(() => {
    const hasil = { SEMUA: dataset.vehicles.length } as Record<string, number>
    URUTAN_STATUS.forEach((s) => { hasil[s] = dataset.vehicles.filter((v) => v.status === s).length })
    return hasil
  }, [])

  const adaFilter = q !== '' || status !== 'SEMUA' || cabang !== 'SEMUA'

  return (
    <div className="space-y-4">
      {/* ---------------- Ringkasan hasil saring ---------------- */}
      <StripRingkas kolom={5}>
        <SelRingkas label="Unit Ditampilkan" nilai={<Angka nilai={ringkasan.unit} ukuran="xl" />} catatan={`${ringkasan.tersedia} tersedia · ${ringkasan.terjual} terjual`} />
        <SelRingkas label="Total Modal" nilai={<Money nilai={ringkasan.modal} ukuran="xl" ringkas />} catatan="Harga beli + reconditioning + biaya lain" />
        <SelRingkas label="Nilai Listing" nilai={<Money nilai={ringkasan.listing} ukuran="xl" ringkas />} catatan="Harga jual yang dipasang" />
        <SelRingkas label="Potensi Margin" nilai={<Money nilai={ringkasan.potensiMargin} ukuran="xl" ringkas nada="positif" />} catatan="Dari unit yang belum terjual" />
        <SelRingkas label="Laba Tercatat" nilai={<Money nilai={ringkasan.labaTerjual} ukuran="xl" ringkas nada="positif" />} catatan="Realisasi dari unit terjual" />
      </StripRingkas>

      {/* ---------------- Alat saring ---------------- */}
      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => aturParam('q', e.target.value)}
            placeholder="Cari unit, nomor polisi, VIN, atau sales…"
            aria-label="Cari unit"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={status === 'SEMUA'} onClick={() => aturParam('status', 'SEMUA')} jumlah={hitungStatus.SEMUA}>
            Semua status
          </FilterChip>
          {URUTAN_STATUS.map((s) => (
            <FilterChip
              key={s}
              aktif={status === s}
              onClick={() => aturParam('status', s)}
              jumlah={hitungStatus[s]}
              warnaDot={STATUS_UNIT[s].dot}
            >
              {STATUS_UNIT[s].label}
            </FilterChip>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={cabang}
            onChange={(e) => aturParam('cabang', e.target.value)}
            aria-label="Saring cabang"
            className="h-7 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2 hover:bg-sunken"
          >
            <option value="SEMUA">Semua cabang</option>
            {dataset.meta.cabang.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 xl:hidden">
            <span className="label-caps">Urut</span>
            <select
              value={urut}
              onChange={(e) => aturParam('urut', e.target.value)}
              aria-label="Urutkan"
              className="h-7 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2 hover:bg-sunken"
            >
              {(Object.keys(LABEL_URUT) as KunciUrut[]).map((k) => (
                <option key={k} value={k}>{LABEL_URUT[k]}</option>
              ))}
            </select>
          </label>

          <SakelarTampilan<Tampilan>
            nilai={tampilan}
            onChange={(v) => aturParam('tampilan', v)}
            opsi={[
              { nilai: 'tabel', label: 'Tabel', ikon: <List size={13} /> },
              { nilai: 'kartu', label: 'Kartu', ikon: <LayoutGrid size={13} /> },
            ]}
          />

          <Button
            variant="primary"
            size="sm"
            ikon={<Plus size={13} />}
            onClick={() => setFormUnit({ terbuka: true })}
          >
            Tambah unit
          </Button>

          {adaFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              ikon={<X size={13} />}
            >
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      {/* ---------------- Daftar unit ---------------- */}
      {terfilter.length === 0 ? (
        <Panel>
          <div className="py-8 text-center">
            <p className="text-xs font-medium text-ink">Tidak ada unit yang cocok dengan filter ini.</p>
            <p className="mx-auto mt-1 max-w-md text-2xs text-ink-3">
              Coba longgarkan kata kunci atau kembalikan filter status ke semua status.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              Bersihkan filter
            </Button>
          </div>
        </Panel>
      ) : tampilan === 'tabel' ? (
        <Panel
          judul={`${terfilter.length} unit`}
          keterangan={adaFilter ? 'Hasil setelah penyaringan' : 'Seluruh unit yang tercatat di sistem'}
          padat
        >
          <Table minWidth={1040}>
            <THead>
              <ThUrut kunci="unit" urut={urut} arah={arah} onKlik={ubahUrut} lebar={300}>Unit</ThUrut>
              <ThUrut kunci="status" urut={urut} arah={arah} onKlik={ubahUrut} lebar={136}>Status</ThUrut>
              <Th className="hidden xl:table-cell" lebar={116}>Nomor Polisi</Th>
              <Th className="hidden lg:table-cell" lebar={140}>Tahun / Kilometer</Th>
              <ThUrut kunci="masuk" urut={urut} arah={arah} onKlik={ubahUrut} align="right" className="hidden lg:table-cell" lebar={100}>Masuk</ThUrut>
              <ThUrut kunci="umur" urut={urut} arah={arah} onKlik={ubahUrut} align="right">Umur Stok</ThUrut>
              <ThUrut kunci="modal" urut={urut} arah={arah} onKlik={ubahUrut} align="right">Total Modal</ThUrut>
              <ThUrut kunci="listing" urut={urut} arah={arah} onKlik={ubahUrut} align="right">Harga Listing</ThUrut>
              <ThUrut kunci="margin" urut={urut} arah={arah} onKlik={ubahUrut} align="right" className="hidden md:table-cell">Estimasi Margin</ThUrut>
              <Th className="hidden xl:table-cell">Sales PIC</Th>
              <Th aria-label="Aksi" />
            </THead>
            <tbody>
              {terfilter.map((v) => {
                const aging = keteranganAging(v.hariSejakSiap ?? v.hariDiInventory)
                const dok = dokumenByUnit(v.id)
                const dokBermasalah = dok?.checklist.filter((c) => c.status !== 'Tersedia').length ?? 0
                return (
                  <Baris key={v.id}>
                    <Td>
                      <Link to={`/inventory/${v.id}`} className="group block min-w-0">
                        <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                          {v.brand} {v.model}
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-2">
                          <IdChip nilai={v.id} />
                          <span className="truncate text-2xs text-ink-3">{v.variant}</span>
                          {dokBermasalah > 0 && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 text-2xs text-danger"
                              title={`${dokBermasalah} dokumen belum lengkap`}
                            >
                              <FileWarning size={12} />
                            </span>
                          )}
                        </span>
                      </Link>
                    </Td>
                    <Td><StatusPill label={STATUS_UNIT[v.status].label} pil={STATUS_UNIT[v.status].pil} /></Td>
                    <Td className="hidden xl:table-cell">
                      <span className="id-chip text-ink-2">{v.nomorPolisi}</span>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span className="tnum text-2xs text-ink-2">{v.tahun} · {kilometer(v.kilometer)}</span>
                    </Td>
                    <Td align="right" className="hidden lg:table-cell">
                      <span className="text-2xs text-ink-2">{tanggalPendek(v.tanggalMasuk)}</span>
                    </Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${aging.kelas}`}>{aging.label}</span>
                      {v.status === 'SOLD' && <span className="mt-0.5 block text-2xs text-ink-3">hari sampai terjual</span>}
                    </Td>
                    <Td align="right"><Money nilai={v.totalCost} ukuran="sm" /></Td>
                    <Td align="right"><Money nilai={v.listingPrice} ukuran="sm" nada="kuat" /></Td>
                    <Td align="right" className="hidden md:table-cell">
                      <Money nilai={v.estimasiMargin} ukuran="sm" nada="positif" />
                      <span className="mt-0.5 block text-2xs text-ink-3">
                        {((v.estimasiMargin / v.totalCost) * 100).toFixed(1).replace('.', ',')}% dari modal
                      </span>
                    </Td>
                    <Td className="hidden xl:table-cell">
                      <span className="text-2xs text-ink-2">{v.salesPIC}</span>
                    </Td>
                    <Td align="right">
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormUnit({ terbuka: true, unit: v })}
                          aria-label={`Ubah data ${v.id}`}
                          title="Ubah data unit"
                          className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormTahap(v)}
                          aria-label={`Ubah tahap ${v.id}`}
                          title="Ubah tahap unit"
                          className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <Link to={`/inventory/${v.id}`} aria-label={`Buka detail ${v.id}`} className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent">
                          <ChevronRight size={15} />
                        </Link>
                      </span>
                    </Td>
                  </Baris>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-hairline-strong bg-sunken">
                <Td tebal>{terfilter.length} unit</Td>
                <Td />
                <Td className="hidden xl:table-cell" />
                <Td className="hidden lg:table-cell" />
                <Td className="hidden lg:table-cell" />
                <Td />
                <Td align="right" tebal><Money nilai={ringkasan.modal} ukuran="sm" nada="kuat" ringkas /></Td>
                <Td align="right" tebal><Money nilai={ringkasan.listing} ukuran="sm" nada="kuat" ringkas /></Td>
                <Td align="right" tebal className="hidden md:table-cell">
                  <Money nilai={terfilter.reduce((s, v) => s + v.estimasiMargin, 0)} ukuran="sm" nada="positif" ringkas />
                </Td>
                <Td className="hidden xl:table-cell" />
                <Td />
              </tr>
            </tfoot>
          </Table>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {terfilter.map((v) => {
            const aging = keteranganAging(v.hariSejakSiap ?? v.hariDiInventory)
            const dok = dokumenByUnit(v.id)
            const dokBermasalah = dok?.checklist.filter((c) => c.status !== 'Tersedia').length ?? 0
            return (
              <article key={v.id} className="flex overflow-hidden flex-col border border-hairline bg-panel rounded-panel shadow-sm"><Link to={`/inventory/${v.id}`} aria-label={`Lihat ${v.brand} ${v.model}`}><VehiclePhoto unit={v} className="aspect-[16/10]" /></Link>
                <header className="flex items-start justify-between gap-3 border-b border-hairline px-3 py-2.5">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-ink">{v.brand} {v.model}</h3>
                    <p className="truncate text-2xs text-ink-3">{v.variant}</p>
                  </div>
                  <StatusPill label={STATUS_UNIT[v.status].label} pil={STATUS_UNIT[v.status].pil} />
                </header>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-2.5 text-2xs">
                  <Kv label="ID Unit"><IdChip nilai={v.id} /></Kv>
                  <Kv label="Tahun / Transmisi">{v.tahun} · {v.transmisi}</Kv>
                  <Kv label="Nomor Polisi">{v.nomorPolisi}</Kv>
                  <Kv label="Kilometer">{kilometer(v.kilometer)}</Kv>
                  <Kv label="Warna">{v.warna}</Kv>
                  <Kv label="Cabang">{v.cabang}</Kv>
                  <Kv label="Masuk">{tanggalPendek(v.tanggalMasuk)}</Kv>
                  <Kv label="Umur Stok"><span className={aging.kelas}>{aging.label}</span></Kv>
                </dl>

                <div className="mt-auto border-t border-hairline px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-2xs text-ink-3">Total modal</span>
                    <Money nilai={v.totalCost} ukuran="sm" />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="text-2xs text-ink-3">Harga listing</span>
                    <Money nilai={v.listingPrice} ukuran="sm" nada="kuat" />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline pt-1.5">
                    <span className="text-2xs text-ink-3">{v.status === 'SOLD' ? 'Estimasi margin saat listing' : 'Estimasi margin'}</span>
                    <Money nilai={v.estimasiMargin} ukuran="sm" nada="positif" />
                  </div>
                </div>

                <footer className="flex items-center justify-between gap-2 border-t border-hairline px-3 py-2">
                  <span className="truncate text-2xs text-ink-3">
                    Sales: {v.salesPIC}
                    {dokBermasalah > 0 && <span className="text-danger"> · {dokBermasalah} dokumen belum lengkap</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormUnit({ terbuka: true, unit: v })}
                      aria-label={`Ubah data ${v.id}`}
                      className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                    >
                      <Pencil size={13} />
                    </button>
                    <Link
                      to={`/inventory/${v.id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-control px-1.5 py-0.5 text-2xs font-medium text-accent hover:bg-accent-soft"
                    >
                      Detail
                      <ChevronRight size={13} />
                    </Link>
                  </span>
                </footer>
              </article>
            )
          })}
        </div>
      )}

      {formUnit.terbuka && (
        <FormUnit terbuka unit={formUnit.unit} onTutup={() => setFormUnit({ terbuka: false })} />
      )}
      {formTahap && <FormTahapUnit terbuka unit={formTahap} onTutup={() => setFormTahap(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Kv({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-2xs text-ink-3">{label}</dt>
      <dd className="tnum truncate text-2xs text-ink-2">{children}</dd>
    </div>
  )
}

function ThUrut({
  kunci,
  urut,
  arah,
  onKlik,
  children,
  align = 'left',
  className = '',
  lebar,
}: {
  kunci: KunciUrut
  urut: KunciUrut
  arah: Arah
  onKlik: (k: KunciUrut) => void
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
  lebar?: number
}) {
  const aktif = urut === kunci
  return (
    <Th align={align} className={className} lebar={lebar} ariaSort={aktif ? (arah === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onKlik(kunci)}
        className={[
          'inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-caps',
          aktif ? 'text-accent' : 'hover:text-ink',
        ].join(' ')}
        title={`Urutkan berdasarkan ${LABEL_URUT[kunci]}`}
      >
        {children}
        {aktif ? (arah === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : null}
      </button>
    </Th>
  )
}
