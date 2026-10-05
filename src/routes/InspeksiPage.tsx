import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Pencil, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_UNIT } from '@/lib/status'
import { dataset } from '@/data'
import { kategoriTemuan, ringkasanInspeksi } from '@/data/agregat'
import { angka, persen, tanggalPendek } from '@/lib/format'
import { FormInspeksi } from '@/components/app/FormInspeksi'
import type { Vehicle } from '@/data/types'

export function InspeksiPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const rekomendasi = params.get('rekomendasi') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const [formInspeksi, setFormInspeksi] = useState<Vehicle | null>(null)
  const ringkas = useMemo(() => ringkasanInspeksi(), [])
  const kategori = useMemo(() => kategoriTemuan(), [])
  const daftarRekomendasi = useMemo(
    () => [...new Set(dataset.inspections.map((i) => i.rekomendasi))].sort(),
    [],
  )

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return dataset.inspections
      .filter((i) => rekomendasi === 'SEMUA' || i.rekomendasi === rekomendasi)
      .filter((i) => {
        if (!kata) return true
        const unit = dataset.vehicles.find((v) => v.id === i.vehicleId)
        const kolom = [i.id, i.vehicleId, i.inspektur, unit ? `${unit.brand} ${unit.model}` : '']
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => a.skor - b.skor)
  }, [q, rekomendasi])

  const adaFilter = q !== '' || rekomendasi !== 'SEMUA'

  // Antrean inspeksi: unit yang sudah masuk tahap Inspeksi tetapi belum punya hasil pemeriksaan.
  // Tanpa daftar ini, unit tersebut tidak punya jalan masuk ke form inspeksi sama sekali.
  const menunggu = useMemo(() => {
    const sudah = new Set(dataset.inspections.map((i) => i.vehicleId))
    return dataset.vehicles.filter((v) => v.status === 'INSPEKSI' && !sudah.has(v.id))
  }, [])

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Unit Diinspeksi"
          nilai={<Angka nilai={ringkas.jumlah} ukuran="xl" />}
          catatan={`${angka(ringkas.totalItem)} item diperiksa`}
        />
        <SelRingkas
          label="Rata-rata Skor"
          nilai={<Angka nilai={Math.round(ringkas.rataSkor)} ukuran="xl" suffix="/100" />}
          catatan={`Terendah ${ringkas.skorTerendah}/100`}
        />
        <SelRingkas
          label="Item Baik"
          nilai={<Angka nilai={Math.round(ringkas.persenBaik * 100)} ukuran="xl" suffix="%" />}
          catatan="Dari seluruh item yang diperiksa"
        />
        <SelRingkas
          label="Perlu Perhatian"
          nilai={<Angka nilai={ringkas.attention} ukuran="xl" nada="perhatian" />}
          catatan="Dipantau, belum wajib diganti"
        />
        <SelRingkas
          label="Perlu Perbaikan"
          nilai={<Angka nilai={ringkas.repair} ukuran="xl" nada={ringkas.repair ? 'bahaya' : 'muted'} />}
          catatan="Masuk rencana reconditioning"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari unit, ID inspeksi, atau inspektur…"
            aria-label="Cari inspeksi"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        {formInspeksi && <FormInspeksi terbuka unit={formInspeksi} onTutup={() => setFormInspeksi(null)} />}

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={rekomendasi === 'SEMUA'} onClick={() => atur('rekomendasi', 'SEMUA')} jumlah={ringkas.jumlah}>
            Semua rekomendasi
          </FilterChip>
          {daftarRekomendasi.map((r) => (
            <FilterChip
              key={r}
              aktif={rekomendasi === r}
              onClick={() => atur('rekomendasi', r)}
              jumlah={dataset.inspections.filter((i) => i.rekomendasi === r).length}
            >
              {r}
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

      {menunggu.length > 0 && (
        <Panel
          judul={`${menunggu.length} unit menunggu inspeksi`}
          keterangan="Unit berstatus Inspeksi yang belum punya hasil pemeriksaan — tanpa hasil ini unit tidak bisa masuk tahap Perbaikan"
          padat
        >
          <ul className="divide-y divide-hairline">
            {menunggu.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <Link to={`/inventory/${v.id}?tab=inspeksi`} className="group min-w-0">
                    <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                      {v.brand} {v.model} {v.tahun}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <IdChip nilai={v.id} />
                      <span className="text-2xs text-ink-3">{v.variant}</span>
                    </span>
                  </Link>
                </span>
                <Button variant="secondary" size="sm" ikon={<Pencil size={13} />} onClick={() => setFormInspeksi(v)}>
                  Isi hasil inspeksi
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          judul={`${terfilter.length} hasil inspeksi`}
          keterangan="Diurutkan dari skor terendah — unit yang paling perlu perhatian ada di atas"
          padat
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada hasil inspeksi yang cocok.</p>
          ) : (
            <Table minWidth={880}>
              <THead>
                <Th lebar={280}>Unit</Th>
                <Th lebar={110}>Status Unit</Th>
                <Th lebar={140}>Inspektur</Th>
                <Th align="right" lebar={90}>Skor</Th>
                <Th align="right" className="hidden md:table-cell" lebar={90}>Baik</Th>
                <Th align="right" lebar={100}>Perhatian</Th>
                <Th align="right" lebar={110}>Perbaikan</Th>
                <Th className="hidden lg:table-cell" lebar={220}>Rekomendasi</Th>
                <Th align="right" lebar={110}>Tanggal</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map((i) => {
                  const unit = dataset.vehicles.find((v) => v.id === i.vehicleId)
                  return (
                    <Baris key={i.id}>
                      <Td>
                        <Link to={`/inventory/${i.vehicleId}?tab=inspeksi`} className="group block min-w-0">
                          <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                            {unit ? `${unit.brand} ${unit.model}` : i.vehicleId}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-2">
                            <IdChip nilai={i.vehicleId} />
                            <span className="id-chip text-ink-3">{i.id}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        {unit && <StatusPill label={STATUS_UNIT[unit.status].label} pil={STATUS_UNIT[unit.status].halus} dot={STATUS_UNIT[unit.status].dot} />}
                      </Td>
                      <Td>{i.inspektur}</Td>
                      <Td align="right">
                        <span className={`tnum text-xs font-semibold ${i.skor >= 85 ? 'text-money-pos' : i.skor >= 70 ? 'text-attention' : 'text-danger'}`}>
                          {i.skor}
                        </span>
                      </Td>
                      <Td align="right" className="hidden md:table-cell"><Angka nilai={i.ringkasan.good} ukuran="sm" nada="muted" /></Td>
                      <Td align="right">
                        <span className={`tnum text-xs ${i.ringkasan.attention ? 'text-attention' : 'text-ink-3'}`}>{i.ringkasan.attention}</span>
                      </Td>
                      <Td align="right">
                        <span className={`tnum text-xs ${i.ringkasan.repair ? 'text-danger font-medium' : 'text-ink-3'}`}>{i.ringkasan.repair}</span>
                      </Td>
                      <Td className="hidden lg:table-cell"><span className="text-2xs text-ink-2">{i.rekomendasi}</span></Td>
                      <Td align="right"><span className="text-2xs text-ink-2">{tanggalPendek(i.tanggal)}</span></Td>
                      <Td align="right">
                        <span className="inline-flex items-center gap-1">
                          {unit && (
                            <button
                              type="button"
                              onClick={() => setFormInspeksi(unit)}
                              aria-label={`Isi hasil inspeksi ${unit.id}`}
                              title="Isi ulang hasil inspeksi unit ini"
                              className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        <Link
                          to={`/inventory/${i.vehicleId}?tab=inspeksi`}
                          aria-label={`Buka detail ${i.vehicleId}`}
                          className="inline-flex text-ink-3 hover:text-accent"
                        >
                          <ChevronRight size={15} />
                        </Link>
                        </span>
                      </Td>
                    </Baris>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            judul="Kategori dengan temuan terbanyak"
            keterangan="Akumulasi temuan dari seluruh inspeksi"
            padat
          >
            <ul className="divide-y divide-hairline">
              {kategori.map((k) => (
                <li key={k.kategori} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-ink-2">{k.kategori}</span>
                    <span className="tnum text-xs font-medium text-ink">{k.temuan}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                      <span
                        className="block h-full rounded-pill"
                        style={{
                          width: `${Math.round((k.temuan / Math.max(1, k.total)) * 100)}%`,
                          background: k.repair > k.attention ? 'var(--color-danger)' : 'var(--color-attention)',
                        }}
                      />
                    </span>
                    <span className="w-24 shrink-0 text-right text-2xs text-ink-3">
                      {k.repair} perbaikan · {k.attention} perhatian
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {ringkas.perluPerbaikanMenyeluruh > 0 && (
            <Panel judul="Unit perlu perbaikan menyeluruh" padat>
              <ul className="divide-y divide-hairline">
                {dataset.inspections
                  .filter((i) => i.rekomendasi === 'PERLU PERBAIKAN MENYELURUH')
                  .map((i) => {
                    const unit = dataset.vehicles.find((v) => v.id === i.vehicleId)
                    return (
                      <li key={i.id}>
                        <Link
                          to={`/inventory/${i.vehicleId}?tab=inspeksi`}
                          className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-sunken"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs text-ink">
                              {unit ? `${unit.brand} ${unit.model}` : i.vehicleId}
                            </span>
                            <span className="mt-0.5 block"><IdChip nilai={i.vehicleId} /></span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="tnum block text-xs text-danger">{i.skor}/100</span>
                            <span className="text-2xs text-ink-3">{i.ringkasan.repair} item perbaikan</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
              </ul>
              <p className="border-t border-hairline px-4 py-2.5 text-2xs text-ink-3">
                {persen(ringkas.perluPerbaikanMenyeluruh / Math.max(1, ringkas.jumlah), 0)} dari unit yang diperiksa
                butuh perbaikan menyeluruh sebelum dipasarkan.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
