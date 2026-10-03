import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_PEMBAYARAN } from '@/lib/status'
import { dataset } from '@/data'
import { diskonPerPenjualan, marginPerTipePembayaran, ringkasanPenjualan } from '@/data/agregat-keuangan'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'

export function PenjualanPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const tipe = params.get('tipe') ?? 'SEMUA'
  const status = params.get('status') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanPenjualan(), [])
  const perTipe = useMemo(() => marginPerTipePembayaran(), [])
  const diskonTerbesar = useMemo(() => diskonPerPenjualan().slice(0, 5), [])
  const daftarStatus = useMemo(() => [...new Set(dataset.sales.map((s) => s.status))], [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return dataset.sales
      .filter((s) => tipe === 'SEMUA' || s.tipePembayaran === tipe)
      .filter((s) => status === 'SEMUA' || s.status === status)
      .filter((s) => {
        if (!kata) return true
        const unit = dataset.vehicles.find((v) => v.id === s.vehicleId)
        const kolom = [s.id, s.vehicleId, s.customerNama, s.salesPIC, unit ? `${unit.brand} ${unit.model}` : '']
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
  }, [q, tipe, status])

  const adaFilter = q !== '' || tipe !== 'SEMUA' || status !== 'SEMUA'
  const gpTerfilter = terfilter.reduce((s, x) => s + x.grossProfit, 0)
  const modalTerfilter = terfilter.reduce((s, x) => s + x.totalModal, 0)

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Unit Terjual"
          nilai={<Angka nilai={ringkas.jumlah} ukuran="xl" />}
          catatan={`${ringkas.bulanIni} unit di bulan berjalan`}
        />
        <SelRingkas
          label="Nilai Penjualan"
          nilai={<Money nilai={ringkas.nilai} ukuran="xl" ringkas />}
          catatan={`Harga rata-rata ${rupiahRingkas(ringkas.hargaRataRata)}`}
        />
        <SelRingkas
          label="Diskon Diberikan"
          nilai={<Money nilai={ringkas.diskonTotal} ukuran="xl" ringkas nada="perhatian" />}
          catatan={`${persen(ringkas.diskonTotal / Math.max(1, ringkas.nilaiListing))} dari total harga listing`}
        />
        <SelRingkas
          label="Gross Profit"
          nilai={<Money nilai={ringkas.grossProfit} ukuran="xl" ringkas nada="positif" />}
          catatan={`Dari modal ${rupiahRingkas(ringkas.modal)}`}
        />
        <SelRingkas
          label="Margin"
          nilai={<Angka nilai={Number((ringkas.margin * 100).toFixed(1))} ukuran="xl" suffix="%" />}
          catatan="Gross profit dibagi total modal unit terjual"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari invoice, unit, customer, atau sales…"
            aria-label="Cari penjualan"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={tipe === 'SEMUA'} onClick={() => atur('tipe', 'SEMUA')} jumlah={ringkas.jumlah}>
            Semua pembayaran
          </FilterChip>
          <FilterChip
            aktif={tipe === 'Cash'}
            onClick={() => atur('tipe', 'Cash')}
            jumlah={ringkas.kas.jumlah}
          >
            Cash
          </FilterChip>
          <FilterChip
            aktif={tipe === 'Kredit'}
            onClick={() => atur('tipe', 'Kredit')}
            jumlah={ringkas.kredit.jumlah}
          >
            Kredit
          </FilterChip>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => atur('status', e.target.value)}
            aria-label="Saring status pembayaran"
            className="h-7 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2 hover:bg-sunken"
          >
            <option value="SEMUA">Semua status</option>
            {daftarStatus.map((s) => (
              <option key={s} value={s}>{STATUS_PEMBAYARAN[s]?.label ?? s}</option>
            ))}
          </select>

          {adaFilter && (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })} ikon={<X size={13} />}>
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          judul={`${terfilter.length} transaksi`}
          keterangan="Klik unit untuk melihat transaksinya pada halaman detail unit"
          padat
          aksi={
            <span className="text-2xs text-ink-3">
              GP saringan ini <span className="text-money-pos">{rupiahRingkas(gpTerfilter)}</span> · margin{' '}
              {persen(gpTerfilter / Math.max(1, modalTerfilter))}
            </span>
          }
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada transaksi yang cocok dengan filter ini.</p>
          ) : (
            <Table minWidth={1040}>
              <THead>
                <Th lebar={140}>Invoice</Th>
                <Th lebar={240}>Unit</Th>
                <Th lebar={170}>Customer</Th>
                <Th className="hidden xl:table-cell" lebar={130}>Sales</Th>
                <Th align="right" className="hidden 2xl:table-cell" lebar={110}>Tanggal</Th>
                <Th align="right" className="hidden 2xl:table-cell" lebar={140}>Harga Listing</Th>
                <Th align="right" lebar={120}>Diskon</Th>
                <Th align="right" lebar={140}>Harga Final</Th>
                <Th className="hidden 2xl:table-cell" lebar={150}>Pembayaran</Th>
                <Th align="right" lebar={140}>Gross Profit</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map((s) => {
                  const unit = dataset.vehicles.find((v) => v.id === s.vehicleId)
                  const margin = s.totalModal ? s.grossProfit / s.totalModal : 0
                  return (
                    <Baris key={s.id}>
                      <Td>
                        <span className="id-chip block text-ink-2">{s.id}</span>
                        <span className="mt-0.5 block">
                          <StatusPill
                            label={STATUS_PEMBAYARAN[s.status]?.label ?? s.status}
                            pil={STATUS_PEMBAYARAN[s.status]?.halus ?? 'bg-sunken text-ink-2'}
                            dot={STATUS_PEMBAYARAN[s.status]?.dot}
                            padat
                          />
                        </span>
                      </Td>
                      <Td>
                        <Link to={`/inventory/${s.vehicleId}?tab=penjualan`} className="group block min-w-0">
                          <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                            {unit ? `${unit.brand} ${unit.model}` : s.vehicleId}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-2">
                            <IdChip nilai={s.vehicleId} />
                            <span className="id-chip text-ink-3">{unit?.nomorPolisi}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Link to={`/customer/${s.customerId}`} className="block min-w-0 hover:underline">
                          <span className="block truncate text-xs text-ink-2">{s.customerNama}</span>
                        </Link>
                      </Td>
                      <Td className="hidden xl:table-cell"><span className="text-2xs text-ink-2">{s.salesPIC}</span></Td>
                      <Td align="right" className="hidden 2xl:table-cell">
                        <span className="text-2xs text-ink-2">{tanggalPendek(s.tanggal)}</span>
                      </Td>
                      <Td align="right" className="hidden 2xl:table-cell">
                        <Money nilai={s.listingPrice} ukuran="sm" nada="muted" />
                      </Td>
                      <Td align="right">
                        {s.diskon > 0 ? (
                          <>
                            <Money nilai={-s.diskon} ukuran="sm" nada="perhatian" />
                            <span className="mt-0.5 block text-2xs text-ink-3">{persen(s.diskon / s.listingPrice, 1)}</span>
                          </>
                        ) : (
                          <span className="text-2xs text-ink-3">tanpa diskon</span>
                        )}
                      </Td>
                      <Td align="right"><Money nilai={s.finalPrice} ukuran="sm" nada="kuat" /></Td>
                      <Td className="hidden 2xl:table-cell">
                        <span className="text-2xs text-ink-2">{s.tipePembayaran}</span>
                        {s.financePartner && <span className="mt-0.5 block text-2xs text-ink-3">{s.financePartner} · {s.tenor} bln</span>}
                        {s.tipePembayaran === 'Kredit' && s.estimasiCicilan && (
                          <span className="mt-0.5 block text-2xs text-ink-3">cicilan {rupiahRingkas(s.estimasiCicilan)}</span>
                        )}
                      </Td>
                      <Td align="right">
                        <Money nilai={s.grossProfit} ukuran="sm" nada="positif" />
                        <span className="mt-0.5 block text-2xs text-ink-3">{persen(margin)} dari modal</span>
                      </Td>
                      <Td align="right">
                        <Link
                          to={`/inventory/${s.vehicleId}?tab=penjualan`}
                          aria-label={`Buka transaksi ${s.id}`}
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
                  <Td tebal>{terfilter.length} transaksi</Td>
                  <Td />
                  <Td />
                  <Td className="hidden xl:table-cell" />
                  <Td className="hidden 2xl:table-cell" />
                  <Td className="hidden 2xl:table-cell" />
                  <Td align="right" tebal>
                    <Money nilai={-terfilter.reduce((s, x) => s + x.diskon, 0)} ukuran="sm" nada="perhatian" ringkas />
                  </Td>
                  <Td align="right" tebal>
                    <Money nilai={terfilter.reduce((s, x) => s + x.finalPrice, 0)} ukuran="sm" nada="kuat" />
                  </Td>
                  <Td className="hidden 2xl:table-cell" />
                  <Td align="right" tebal><Money nilai={gpTerfilter} ukuran="sm" nada="positif" /></Td>
                  <Td />
                </tr>
              </tfoot>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel judul="Margin menurut tipe pembayaran" keterangan="Apakah kredit lebih menguntungkan daripada cash" padat>
            <Table minWidth={0}>
              <THead>
                <Th>Tipe</Th>
                <Th align="right">Unit</Th>
                <Th align="right">Rata-rata GP</Th>
                <Th align="right">Margin</Th>
              </THead>
              <tbody>
                {perTipe.map((t) => (
                  <Baris key={t.tipe}>
                    <Td>
                      {t.tipe}
                      <span className="mt-0.5 block text-2xs text-ink-3">{rupiahRingkas(t.nilai)} nilai</span>
                    </Td>
                    <Td align="right"><Angka nilai={t.unit} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Money nilai={t.rataGp} ukuran="sm" nada="positif" ringkas /></Td>
                    <Td align="right"><span className="tnum text-xs text-ink-2">{persen(t.margin)}</span></Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
            <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
              {(() => {
                const cash = perTipe.find((t) => t.tipe === 'Cash')
                const kredit = perTipe.find((t) => t.tipe === 'Kredit')
                if (!cash || !kredit || !cash.unit || !kredit.unit) return null
                const beda = kredit.margin - cash.margin
                return `${kredit.unit} unit kredit bermargin ${persen(kredit.margin)} dan ${cash.unit} unit cash bermargin ${persen(cash.margin)} — selisih ${persen(Math.abs(beda))} lebih ${beda >= 0 ? 'tinggi' : 'rendah'} pada kredit. Yang paling membedakan keduanya adalah kecepatan kas masuk, bukan besarnya laba per unit.`
              })()}
            </p>
          </Panel>

          <Panel judul="Diskon terdalam" keterangan="Lima transaksi dengan potongan paling dalam" padat>
            <ul className="divide-y divide-hairline">
              {diskonTerbesar.map(({ sale, unit, persenDiskon }) => (
                <li key={sale.id}>
                  <Link to={`/inventory/${sale.vehicleId}?tab=penjualan`} className="block px-4 py-2.5 hover:bg-sunken">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-ink">
                          {unit ? `${unit.brand} ${unit.model}` : sale.vehicleId}
                        </span>
                        <span className="mt-0.5 block truncate text-2xs text-ink-3">
                          {sale.id} · {sale.customerNama}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <Money nilai={-sale.diskon} ukuran="sm" nada="perhatian" />
                        <span className="mt-0.5 block text-2xs text-ink-3">{persen(persenDiskon, 1)} dari listing</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
