import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search, Wrench, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_RECON, STATUS_UNIT } from '@/lib/status'
import { dataset } from '@/data'
import { biayaPerVendor, pekerjaanBerjalan, ringkasanReconditioning } from '@/data/agregat'
import { jarakHari, persen, rupiahRingkas, tanggalPendek } from '@/lib/format'
import { DEMO_TODAY } from '@/data'
import type { UnitStatus } from '@/data/types'

const FILTER_STATUS: { nilai: UnitStatus | 'SEMUA'; label: string }[] = [
  { nilai: 'SEMUA', label: 'Semua unit' },
  { nilai: 'RECONDITIONING', label: 'Masih dikerjakan' },
  { nilai: 'READY', label: 'Sudah selesai (Ready)' },
  { nilai: 'BOOKED', label: 'Sudah selesai (Booked)' },
  { nilai: 'SOLD', label: 'Sudah selesai (Terjual)' },
]

export function ReconditioningPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? 'SEMUA') as UnitStatus | 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanReconditioning(), [])
  const vendor = useMemo(() => biayaPerVendor(), [])
  const berjalan = useMemo(() => pekerjaanBerjalan(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return dataset.reconditionings
      .filter((r) => {
        if (status === 'SEMUA') return true
        const unit = dataset.vehicles.find((v) => v.id === r.vehicleId)
        return unit?.status === status
      })
      .filter((r) => {
        if (!kata) return true
        const unit = dataset.vehicles.find((v) => v.id === r.vehicleId)
        const kolom = [r.id, r.vehicleId, r.pic, r.vendorUtama, unit ? `${unit.brand} ${unit.model}` : '']
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => b.total - a.total)
  }, [q, status])

  const totalTerfilter = terfilter.reduce((s, r) => s + r.total, 0)
  const adaFilter = q !== '' || status !== 'SEMUA'

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Unit Dikerjakan"
          nilai={<Angka nilai={ringkas.unit} ukuran="xl" />}
          catatan={`${ringkas.pekerjaan} pekerjaan tercatat`}
        />
        <SelRingkas
          label="Total Biaya Reconditioning"
          nilai={<Money nilai={ringkas.totalBiaya} ukuran="xl" ringkas />}
          catatan={`Rata-rata ${rupiahRingkas(ringkas.rataBiaya)} per unit`}
        />
        <SelRingkas
          label="Pekerjaan Berjalan"
          nilai={<Angka nilai={ringkas.berjalan} ukuran="xl" nada="perhatian" />}
          catatan={`${ringkas.direncanakan} pekerjaan masih direncanakan`}
        />
        <SelRingkas
          label="Unit Belum Selesai"
          nilai={<Angka nilai={ringkas.unitBelumSelesai} ukuran="xl" />}
          catatan={`Biaya tercatat ${rupiahRingkas(ringkas.unitBelumSelesaiNilai)}`}
        />
        <SelRingkas
          label="Pekerjaan Selesai"
          nilai={<Angka nilai={ringkas.selesai} ukuran="xl" nada="positif" />}
          catatan={`${persen(ringkas.selesai / Math.max(1, ringkas.pekerjaan), 0)} dari seluruh pekerjaan`}
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari unit, vendor, atau PIC…"
            aria-label="Cari reconditioning"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_STATUS.map((f) => (
            <FilterChip
              key={f.nilai}
              aktif={status === f.nilai}
              onClick={() => atur('status', f.nilai)}
              jumlah={
                f.nilai === 'SEMUA'
                  ? dataset.reconditionings.length
                  : dataset.reconditionings.filter(
                      (r) => dataset.vehicles.find((v) => v.id === r.vehicleId)?.status === f.nilai,
                    ).length
              }
            >
              {f.label}
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
          judul={`${terfilter.length} unit dengan reconditioning`}
          keterangan="Diurutkan dari biaya terbesar — untuk melihat mana yang paling menyerap modal"
          padat
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada data reconditioning yang cocok.</p>
          ) : (
            <Table minWidth={900}>
              <THead>
                <Th lebar={280}>Unit</Th>
                <Th lebar={130}>Status Unit</Th>
                <Th align="right" lebar={90}>Pekerjaan</Th>
                <Th lebar={190}>Vendor Utama</Th>
                <Th align="right" className="hidden 2xl:table-cell" lebar={110}>Mulai</Th>
                <Th align="right" className="hidden 2xl:table-cell" lebar={110}>Selesai</Th>
                <Th lebar={130}>Progres</Th>
                <Th align="right" lebar={140}>Biaya</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map((r) => {
                  const unit = dataset.vehicles.find((v) => v.id === r.vehicleId)
                  const selesai = r.items.filter((i) => i.status === 'COMPLETED').length
                  const pct = Math.round((selesai / Math.max(1, r.items.length)) * 100)
                  return (
                    <Baris key={r.id}>
                      <Td>
                        <Link to={`/inventory/${r.vehicleId}?tab=reconditioning`} className="group block min-w-0">
                          <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                            {unit ? `${unit.brand} ${unit.model}` : r.vehicleId}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-2">
                            <IdChip nilai={r.vehicleId} />
                            <span className="id-chip text-ink-3">{r.id}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        {unit && <StatusPill label={STATUS_UNIT[unit.status].label} pil={STATUS_UNIT[unit.status].halus} dot={STATUS_UNIT[unit.status].dot} />}
                      </Td>
                      <Td align="right"><Angka nilai={r.items.length} ukuran="sm" nada="muted" /></Td>
                      <Td><span className="text-2xs text-ink-2">{r.vendorUtama}</span></Td>
                      <Td align="right" className="hidden 2xl:table-cell"><span className="text-2xs">{tanggalPendek(r.mulai)}</span></Td>
                      <Td align="right" className="hidden 2xl:table-cell">
                        <span className="text-2xs">{r.selesai ? tanggalPendek(r.selesai) : '—'}</span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                            <span
                              className="block h-full rounded-pill"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? 'var(--color-st-ready)' : 'var(--color-st-recon)',
                              }}
                            />
                          </span>
                          <span className="tnum w-12 shrink-0 text-right text-2xs text-ink-3">
                            {selesai}/{r.items.length}
                          </span>
                        </span>
                      </Td>
                      <Td align="right"><Money nilai={r.total} ukuran="sm" nada="kuat" /></Td>
                      <Td align="right">
                        <Link
                          to={`/inventory/${r.vehicleId}?tab=reconditioning`}
                          aria-label={`Buka detail ${r.vehicleId}`}
                          className="inline-flex text-ink-3 hover:text-accent"
                        >
                          <ChevronRight size={15} />
                        </Link>
                      </Td>
                    </Baris>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline-strong bg-sunken">
                  <Td tebal>{terfilter.length} unit</Td>
                  <Td />
                  <Td align="right" tebal><Angka nilai={terfilter.reduce((s, r) => s + r.items.length, 0)} ukuran="sm" nada="kuat" /></Td>
                  <Td />
                  <Td className="hidden lg:table-cell" />
                  <Td className="hidden lg:table-cell" />
                  <Td />
                  <Td align="right" tebal><Money nilai={totalTerfilter} ukuran="sm" nada="kuat" ringkas /></Td>
                  <Td />
                </tr>
              </tfoot>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            judul="Pekerjaan yang belum selesai"
            keterangan={`${berjalan.length} pekerjaan berjalan atau direncanakan`}
            padat
          >
            {berjalan.length === 0 ? (
              <p className="px-4 py-4 text-xs text-ink-3">Semua pekerjaan reconditioning sudah selesai.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {berjalan.slice(0, 8).map((p, idx) => (
                  <li key={`${p.vehicleId}-${idx}`}>
                    <Link
                      to={`/inventory/${p.vehicleId}?tab=reconditioning`}
                      className="block px-4 py-2.5 hover:bg-sunken"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-start gap-2">
                          <Wrench size={13} className="mt-0.5 shrink-0 text-st-recon" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs text-ink">{p.job}</span>
                            <span className="mt-0.5 block truncate text-2xs text-ink-3">
                              {p.unit.brand} {p.unit.model} · {p.vendor}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <Money nilai={p.biaya} ukuran="sm" nada="muted" ringkas />
                          <span className="mt-0.5 block text-2xs text-ink-3">{jarakHari(p.selesai, DEMO_TODAY)}</span>
                        </span>
                      </div>
                      <span className="mt-1 inline-flex">
                        <StatusPill
                          label={STATUS_RECON[p.status].label}
                          pil={STATUS_RECON[p.status].halus}
                          dot={STATUS_RECON[p.status].dot}
                          padat
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {berjalan.length > 8 && (
              <p className="border-t border-hairline px-4 py-2.5 text-2xs text-ink-3">
                Menampilkan 8 dari {berjalan.length} pekerjaan. Sisanya bisa dilihat di halaman detail masing-masing
                unit pada tab Reconditioning.
              </p>
            )}
          </Panel>

          <Panel judul="Biaya per vendor" keterangan="Total seluruh unit, untuk evaluasi harga vendor" padat>
            <ul className="divide-y divide-hairline">
              {vendor.map((v) => (
                <li key={v.vendor} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-ink-2">{v.vendor}</span>
                    <Money nilai={v.biaya} ukuran="sm" nada="kuat" />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                      <span
                        className="block h-full rounded-pill bg-accent"
                        style={{ width: `${Math.round((v.biaya / Math.max(1, ringkas.totalBiaya)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-32 shrink-0 text-right text-2xs text-ink-3">
                      {v.pekerjaan} pekerjaan · {v.unit} unit
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
