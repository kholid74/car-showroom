import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Pencil, Plus, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { dataset } from '@/data'
import { procurementPerSumber, ringkasanProcurement } from '@/data/agregat'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'
import { FormProcurement } from '@/components/app/FormProcurement'
import { FormUnit } from '@/components/app/FormUnit'
import type { Procurement } from '@/data/types'

export function ProcurementPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const sumber = params.get('sumber') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const [formBeli, setFormBeli] = useState(false)
  const [formProc, setFormProc] = useState<Procurement | null>(null)
  const ringkas = useMemo(() => ringkasanProcurement(), [])
  const perSumber = useMemo(() => procurementPerSumber(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return dataset.procurements
      .filter((p) => sumber === 'SEMUA' || p.sumber === sumber)
      .filter((p) => {
        if (!kata) return true
        const unit = dataset.vehicles.find((v) => v.id === p.vehicleId)
        const kolom = [p.id, p.vehicleId, p.namaSeller, p.kotaSeller, p.pic, unit ? `${unit.brand} ${unit.model}` : '']
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => (a.tanggalPembelian < b.tanggalPembelian ? 1 : -1))
  }, [q, sumber])

  const adaFilter = q !== '' || sumber !== 'SEMUA'

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas label="Unit Dibeli" nilai={<Angka nilai={ringkas.jumlah} ukuran="xl" />} catatan={`Nilai deal ${rupiahRingkas(ringkas.totalDeal)}`} />
        <SelRingkas label="Total Penawaran Awal" nilai={<Money nilai={ringkas.totalPenawaran} ukuran="xl" ringkas />} catatan="Sebelum negosiasi" />
        <SelRingkas label="Turun dari Negosiasi" nilai={<Money nilai={ringkas.selisihNego} ukuran="xl" ringkas nada="positif" />} catatan={`Rata-rata ${rupiahRingkas(ringkas.rataSelisihNego)} per unit`} />
        <SelRingkas label="Dibeli di Bawah Acuan Pasar" nilai={<Angka nilai={ringkas.diBawahAcuan} ukuran="xl" />} catatan={`${persen(ringkas.diBawahAcuan / Math.max(1, ringkas.jumlah), 0)} dari pembelian`} />
        <SelRingkas label="Selisih Terhadap Pasar" nilai={<Money nilai={ringkas.nilaiBawahAcuan} ukuran="xl" ringkas nada="positif" />} catatan="Akumulasi harga beli di bawah acuan" />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari penjual, kota, unit, atau PIC…"
            aria-label="Cari pembelian"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <Button variant="primary" size="sm" ikon={<Plus size={13} />} onClick={() => setFormBeli(true)}>
          Catat pembelian unit
        </Button>

        {formBeli && <FormUnit terbuka onTutup={() => setFormBeli(false)} />}
        {formProc && (
          <FormProcurement
            terbuka
            procurement={formProc}
            label={(() => {
              const u = dataset.vehicles.find((v) => v.id === formProc.vehicleId)
              return u ? `${u.brand} ${u.model} ${u.tahun}` : formProc.vehicleId
            })()}
            onTutup={() => setFormProc(null)}
          />
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={sumber === 'SEMUA'} onClick={() => atur('sumber', 'SEMUA')} jumlah={ringkas.jumlah}>
            Semua sumber
          </FilterChip>
          {dataset.sumberUnitMaster.map((s) => (
            <FilterChip
              key={s}
              aktif={sumber === s}
              onClick={() => atur('sumber', s)}
              jumlah={dataset.procurements.filter((p) => p.sumber === s).length}
            >
              {s}
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
          judul={`${terfilter.length} pembelian unit`}
          keterangan="Klik unit untuk melihat asal-usulnya di halaman detail"
          padat
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada data pembelian yang cocok.</p>
          ) : (
            <Table minWidth={940}>
              <THead>
                <Th lebar={280}>Unit</Th>
                <Th lebar={190}>Sumber &amp; Penjual</Th>
                <Th align="right" lebar={130}>Penawaran</Th>
                <Th align="right" lebar={130}>Harga Deal</Th>
                <Th align="right" className="hidden lg:table-cell" lebar={110}>Turun Nego</Th>
                <Th align="right" lebar={170}>Posisi vs Pasar</Th>
                <Th className="hidden 2xl:table-cell" lebar={120}>PIC</Th>
                <Th align="right" lebar={96}>Dibeli</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map((p) => {
                  const unit = dataset.vehicles.find((v) => v.id === p.vehicleId)
                  const nego = p.hargaPenawaran - p.hargaDeal
                  const vsAcuan = p.nilaiPasarAcuan - p.hargaDeal
                  return (
                    <Baris key={p.id}>
                      <Td>
                        <Link to={`/inventory/${p.vehicleId}?tab=procurement`} className="group block min-w-0">
                          <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                            {unit ? `${unit.brand} ${unit.model}` : p.vehicleId}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-2">
                            <IdChip nilai={p.vehicleId} />
                            <span className="id-chip text-ink-3">{p.id}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="block text-xs text-ink-2">{p.sumber}</span>
                        <span className="mt-0.5 block truncate text-2xs text-ink-3" title={`${p.namaSeller} · ${p.kotaSeller}`}>
                          {p.namaSeller} · {p.kotaSeller}
                        </span>
                      </Td>
                      <Td align="right"><Money nilai={p.hargaPenawaran} ukuran="sm" nada="muted" /></Td>
                      <Td align="right"><Money nilai={p.hargaDeal} ukuran="sm" nada="kuat" /></Td>
                      <Td align="right" className="hidden lg:table-cell">
                        <Money nilai={nego} ukuran="sm" nada="positif" />
                        <span className="mt-0.5 block text-2xs text-ink-3">
                          {persen(nego / Math.max(1, p.hargaPenawaran), 1)} dari penawaran
                        </span>
                      </Td>
                      <Td align="right">
                        <span className={`text-2xs ${vsAcuan >= 0 ? 'text-money-pos' : 'text-danger'}`}>
                          {vsAcuan >= 0 ? 'Di bawah acuan ' : 'Di atas acuan '}
                          {rupiahRingkas(Math.abs(vsAcuan))}
                        </span>
                        <span className="mt-0.5 block text-2xs text-ink-3">acuan {rupiahRingkas(p.nilaiPasarAcuan)}</span>
                      </Td>
                      <Td className="hidden 2xl:table-cell"><span className="text-2xs text-ink-2">{p.pic}</span></Td>
                      <Td align="right"><span className="text-2xs text-ink-2">{tanggalPendek(p.tanggalPembelian)}</span></Td>
                      <Td align="right">
                        <span className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormProc(p)}
                            aria-label={`Ubah pembelian ${p.id}`}
                            title="Ubah harga penawaran, harga deal, atau dokumen diterima"
                            className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                          >
                            <Pencil size={14} />
                          </button>
                          <Link
                            to={`/inventory/${p.vehicleId}?tab=procurement`}
                            aria-label={`Buka detail ${p.vehicleId}`}
                            className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                          >
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
                  <Td tebal>{terfilter.length} pembelian</Td>
                  <Td />
                  <Td align="right" tebal>
                    <Money nilai={terfilter.reduce((s, p) => s + p.hargaPenawaran, 0)} ukuran="sm" nada="muted" ringkas />
                  </Td>
                  <Td align="right" tebal>
                    <Money nilai={terfilter.reduce((s, p) => s + p.hargaDeal, 0)} ukuran="sm" nada="kuat" ringkas />
                  </Td>
                  <Td align="right" tebal className="hidden lg:table-cell">
                    <Money nilai={terfilter.reduce((s, p) => s + (p.hargaPenawaran - p.hargaDeal), 0)} ukuran="sm" nada="positif" ringkas />
                  </Td>
                  <Td />
                  <Td className="hidden 2xl:table-cell" />
                  <Td />
                  <Td />
                </tr>
              </tfoot>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel judul="Pembelian per sumber unit" keterangan="Dari mana saja unit didapat" padat>
            <ul className="divide-y divide-hairline">
              {perSumber.map((s) => (
                <li key={s.sumber} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-ink-2">{s.sumber}</span>
                    <Angka nilai={s.jumlah} ukuran="sm" nada="kuat" suffix="unit" />
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className="text-2xs text-ink-3">
                      rata turun nego {rupiahRingkas(s.rataSelisih)}
                    </span>
                    <Money nilai={s.nilai} ukuran="sm" nada="muted" ringkas />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {ringkas.jumlah > 0 && (
            <Panel judul="Cara membaca halaman ini" padat>
              <p className="px-4 py-3 text-2xs leading-relaxed text-ink-3">
                Setiap baris adalah satu pembelian yang menghasilkan satu unit. Harga deal di sini menjadi komponen
                pertama total modal unit tersebut, dan bisa dilihat kembali di halaman detail unit pada tab
                Procurement.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
