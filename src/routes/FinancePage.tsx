import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_PEMBAYARAN } from '@/lib/status'
import { dataset } from '@/data'
import { useSesi } from '@/store/sesi'
import { labaOperasional, piutangPenjualan, profitPerBulan, ringkasanPenjualan } from '@/data/agregat-keuangan'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'
import { DEMO_TODAY } from '@/data'

export function FinancePage() {
  const lunasiPenjualan = useSesi((s) => s.lunasiPenjualan)
  const ringkas = useMemo(() => ringkasanPenjualan(), [])
  const piutang = useMemo(() => piutangPenjualan(), [])
  const perBulan = useMemo(() => profitPerBulan(), [])
  const laba = useMemo(() => labaOperasional(), [])
  const totalPiutang = piutang.reduce((s, x) => s + x.sale.sisaPembayaran, 0)
  const umurPiutangTertua = piutang.length ? Math.max(...piutang.map((p) => p.umurHari)) : 0

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Modal Unit Terjual"
          nilai={<Money nilai={ringkas.modal} ukuran="xl" ringkas />}
          catatan={`Dari ${ringkas.jumlah} unit yang sudah terjual`}
        />
        <SelRingkas
          label="Nilai Penjualan"
          nilai={<Money nilai={ringkas.nilai} ukuran="xl" ringkas />}
          catatan={`Diskon diberikan ${rupiahRingkas(ringkas.diskonTotal)}`}
        />
        <SelRingkas
          label="Gross Profit"
          nilai={<Money nilai={ringkas.grossProfit} ukuran="xl" ringkas nada="positif" />}
          catatan={`Rata-rata ${rupiahRingkas(ringkas.grossProfit / Math.max(1, ringkas.jumlah))} per unit`}
        />
        <SelRingkas
          label="Margin"
          nilai={<Angka nilai={Number((ringkas.margin * 100).toFixed(1))} ukuran="xl" suffix="%" />}
          catatan="Gross profit dibagi modal"
        />
        <SelRingkas
          label="Piutang Belum Lunas"
          nilai={<Money nilai={totalPiutang} ukuran="xl" ringkas nada={totalPiutang ? 'perhatian' : 'muted'} />}
          catatan={`${piutang.length} transaksi belum lunas`}
        />
      </StripRingkas>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel
            judul="Profit per unit terjual"
            keterangan="Harga beli + reconditioning + biaya lain dibandingkan harga jual final"
            padat
          >
            <Table minWidth={880}>
              <THead>
                <Th lebar={240}>Unit</Th>
                <Th align="right" lebar={140}>Modal</Th>
                <Th align="right" lebar={140}>Harga Final</Th>
                <Th align="right" lebar={140}>Gross Profit</Th>
                <Th align="right" lebar={100}>Margin</Th>
                <Th className="hidden lg:table-cell" lebar={150}>Pembayaran</Th>
                <Th align="right" className="hidden xl:table-cell" lebar={110}>Tanggal</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {dataset.sales
                  .slice()
                  .sort((a, b) => b.grossProfit - a.grossProfit)
                  .map((s) => {
                    const unit = dataset.vehicles.find((v) => v.id === s.vehicleId)
                    const margin = s.totalModal ? s.grossProfit / s.totalModal : 0
                    return (
                      <Baris key={s.id}>
                        <Td>
                          <Link to={`/inventory/${s.vehicleId}?tab=biaya`} className="group block min-w-0">
                            <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                              {unit ? `${unit.brand} ${unit.model}` : s.vehicleId}
                            </span>
                            <span className="mt-0.5 flex min-w-0 items-center gap-2">
                              <IdChip nilai={s.vehicleId} />
                              <span className="id-chip text-ink-3">{s.id}</span>
                            </span>
                          </Link>
                        </Td>
                        <Td align="right"><Money nilai={s.totalModal} ukuran="sm" nada="muted" /></Td>
                        <Td align="right"><Money nilai={s.finalPrice} ukuran="sm" nada="kuat" /></Td>
                        <Td align="right"><Money nilai={s.grossProfit} ukuran="sm" nada="positif" /></Td>
                        <Td align="right">
                          <span className={`tnum text-xs font-medium ${margin >= 0.06 ? 'text-money-pos' : margin > 0 ? 'text-ink-2' : 'text-danger'}`}>
                            {persen(margin)}
                          </span>
                        </Td>
                        <Td className="hidden lg:table-cell">
                          <span className="text-2xs text-ink-2">{s.tipePembayaran}</span>
                          {s.financePartner && <span className="mt-0.5 block text-2xs text-ink-3">{s.financePartner}</span>}
                        </Td>
                        <Td align="right" className="hidden xl:table-cell"><span className="text-2xs text-ink-2">{tanggalPendek(s.tanggal)}</span></Td>
                        <Td align="right">
                          <Link
                            to={`/inventory/${s.vehicleId}?tab=biaya`}
                            aria-label={`Buka rincian biaya ${s.vehicleId}`}
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
                  <Td tebal>{dataset.sales.length} unit terjual</Td>
                  <Td align="right" tebal><Money nilai={ringkas.modal} ukuran="sm" nada="muted" /></Td>
                  <Td align="right" tebal><Money nilai={ringkas.nilai} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Money nilai={ringkas.grossProfit} ukuran="sm" nada="positif" /></Td>
                  <Td align="right" tebal><span className="tnum text-xs text-ink">{persen(ringkas.margin)}</span></Td>
                  <Td className="hidden lg:table-cell" />
                  <Td className="hidden xl:table-cell" />
                  <Td />
                </tr>
              </tfoot>
            </Table>
          </Panel>

          <Panel judul="Profit per bulan" keterangan="Konsistensi margin antar bulan" padat>
            <Table minWidth={720}>
              <THead>
                <Th lebar={140}>Bulan</Th>
                <Th align="right" lebar={90}>Unit</Th>
                <Th align="right" lebar={150}>Nilai Penjualan</Th>
                <Th align="right" lebar={140}>Modal</Th>
                <Th align="right" lebar={140}>Gross Profit</Th>
                <Th align="right" lebar={100}>Margin</Th>
              </THead>
              <tbody>
                {perBulan.map((b) => (
                  <Baris key={b.bulan}>
                    <Td tebal>{b.label}</Td>
                    <Td align="right"><Angka nilai={b.unit} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Money nilai={b.nilai} ukuran="sm" ringkas /></Td>
                    <Td align="right"><Money nilai={b.modal} ukuran="sm" nada="muted" ringkas /></Td>
                    <Td align="right"><Money nilai={b.grossProfit} ukuran="sm" nada="positif" ringkas /></Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${b.margin >= 0.06 ? 'text-money-pos' : 'text-ink-2'}`}>{persen(b.margin)}</span>
                    </Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel judul="Setelah biaya operasional" keterangan="Gambaran sederhana, bukan pembukuan penuh" padat>
            <div className="grid grid-cols-1 divide-hairline sm:grid-cols-3 sm:divide-x">
              <SelRingkas label="Gross Profit" nilai={<Money nilai={laba.grossProfit} ukuran="lg" nada="positif" />} catatan="Dari unit terjual" />
              <SelRingkas label="Biaya Operasional" nilai={<Money nilai={laba.biayaOperasional} ukuran="lg" nada="perhatian" />} catatan="Marketing, kantor, transport, perawatan" />
              <SelRingkas
                label="Laba Setelah Biaya"
                nilai={<Money nilai={laba.labaBersih} ukuran="lg" nada={laba.labaBersih >= 0 ? 'positif' : 'bahaya'} />}
                catatan={`Biaya setara ${persen(laba.rasioBiaya, 0)} dari gross profit`}
              />
            </div>
            <p className="flex items-start gap-2 border-t border-hairline px-4 py-3 text-2xs leading-relaxed text-ink-3">
              <Info size={13} className="mt-px shrink-0" />
              <span>
                Angka ini tidak memperhitungkan pajak, penyusutan, atau biaya pembiayaan — sesuai lingkup demo yang
                fokus pada arus operasional showroom, bukan sistem akuntansi lengkap. Rincian biaya ada di halaman{' '}
                <Link to="/biaya" className="font-medium text-accent hover:underline">Biaya Operasional</Link>.
              </span>
            </p>
          </Panel>
        </div>

        <aside className="space-y-4 2xl:sticky 2xl:top-18 2xl:self-start">
          <Panel
            judul="Piutang penjualan"
            keterangan={`${piutang.length} transaksi belum lunas, total ${rupiahRingkas(totalPiutang)}`}
            padat
          >
            {piutang.length === 0 ? (
              <p className="px-4 py-4 text-xs text-ink-3">Semua transaksi sudah lunas.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {piutang.map(({ sale, unit, umurHari }) => (
                  <li key={sale.id} className="px-4 py-2.5">
                    <Link to={`/inventory/${sale.vehicleId}?tab=penjualan`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-xs text-ink">
                            {unit ? `${unit.brand} ${unit.model}` : sale.vehicleId}
                          </span>
                          <span className="mt-0.5 block truncate text-2xs text-ink-3">
                            {sale.id} · {sale.customerNama}
                          </span>
                        </span>
                        <Money nilai={sale.sisaPembayaran} ukuran="sm" nada="perhatian" />
                      </div>
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-2xs text-ink-3">
                      <span className="flex items-center gap-2">
                        <StatusPill
                          label={STATUS_PEMBAYARAN[sale.status]?.label ?? sale.status}
                          pil={STATUS_PEMBAYARAN[sale.status]?.halus ?? 'bg-sunken text-ink-2'}
                          dot={STATUS_PEMBAYARAN[sale.status]?.dot}
                          padat
                        />
                        <span>{umurHari} hari sejak transaksi</span>
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          lunasiPenjualan(
                            sale.id,
                            sale.vehicleId,
                            unit ? `${unit.brand} ${unit.model}` : sale.vehicleId,
                            sale.sisaPembayaran,
                          )
                        }
                      >
                        Tandai lunas
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
              Piutang pada demo ini muncul dari transaksi berstatus "dibayar sebagian" — umumnya sisa pembayaran
              kredit yang menunggu pencairan multifinance.
            </p>
          </Panel>

          <Panel judul="Ringkasan hari demo" keterangan={`Dihitung pada ${tanggalPendek(DEMO_TODAY)}`} padat>
            <div className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-2xs text-ink-3">Unit terjual bulan ini</span>
                <Angka nilai={ringkas.bulanIni} ukuran="sm" nada="kuat" suffix="unit" />
              </div>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-2xs text-ink-3">Kas masuk (cash)</span>
                <Money nilai={ringkas.kas.nilai} ukuran="sm" ringkas />
              </div>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-2xs text-ink-3">Nilai kredit</span>
                <Money nilai={ringkas.kredit.nilai} ukuran="sm" ringkas />
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2">
                <span className="text-2xs text-ink-3">Umur piutang tertua</span>
                <span className="tnum text-xs text-ink-2">
                  {piutang.length ? `${umurPiutangTertua} hari` : '—'}
                </span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
