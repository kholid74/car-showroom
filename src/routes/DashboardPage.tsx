import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/Panel'
import { VehiclePhoto } from '@/components/ui/VehiclePhoto'
import { Money, Angka } from '@/components/ui/Money'
import { SelRingkas } from '@/components/ui/SelRingkas'
import { StatusPill } from '@/components/ui/StatusPill'
import { IdChip } from '@/components/ui/IdChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { STATUS_UNIT, STATUS_LEAD, URUTAN_STATUS } from '@/lib/status'
import {
  agingInventaris, hitungPerStatus, kpi, notifikasi, penjualanPerBulan, pipelineLead,
} from '@/data/selectors'
import { dataset, DEMO_TODAY, bulanIni } from '@/data'
import { useAuth } from '@/store/auth'
import { bulanLabel, jarakHari, rupiahRingkas, tanggalPendek } from '@/lib/format'
import { AlertTriangle, ArrowRight, CalendarClock, Info, ShieldAlert } from 'lucide-react'

export function DashboardPage() {
  const { pengguna } = useAuth()
  const role = pengguna?.role ?? 'OWNER'
  return role === 'SALES' ? <DashboardSales /> : <DashboardManajemen />
}

/* ------------------------------------------------------------------ */
/* Owner & Admin                                                       */
/* ------------------------------------------------------------------ */
function DashboardManajemen() {
  const k = kpi()
  const perStatus = hitungPerStatus()
  const penjualan = penjualanPerBulan(6)
  const pipeline = pipelineLead().filter((p) => !['WON', 'LOST'].includes(p.tahap))
  const aging = agingInventaris()
  const sinyal = notifikasi()
  const totalUnit = dataset.vehicles.length

  return (
    <div className="space-y-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="label-caps">Ruang kerja manajemen</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Bisnis Anda, dalam satu pandangan.</h2><p className="mt-2 text-sm text-ink-3">Pantau pergerakan stok, peluang penjualan, dan hasil setiap unit.</p></div><span className="rounded-full border border-hairline bg-panel px-4 py-2 text-xs text-ink-2">{tanggalPendek(DEMO_TODAY)} · Semua cabang</span></div>
      <section className="showcase-kpis grid grid-cols-2 divide-hairline border border-hairline bg-panel md:grid-cols-3 xl:grid-cols-6 md:divide-x">
        <SelRingkas label="Unit Tersedia" nilai={<Angka nilai={k.unitTersedia} ukuran="xl" />} catatan={`${totalUnit} unit total, ${perStatus.SOLD} terjual`} />
        <SelRingkas label="Nilai Stok" nilai={<Money nilai={k.nilaiInventory} ukuran="xl" ringkas />} catatan={`modal ${rupiahRingkas(k.totalModalStok)}`} />
        <SelRingkas label="Terjual Bulan Ini" nilai={<Angka nilai={k.unitTerjualBulanIni} ukuran="xl" suffix="unit" />} catatan={rupiahRingkas(k.nilaiPenjualanBulanIni)} />
        <SelRingkas label="Laba Kotor Bulan Ini" nilai={<Money nilai={k.grossProfitBulanIni} ukuran="xl" ringkas nada="positif" />} catatan={`margin ${(k.marginRataRata * 100).toFixed(1).replace('.', ',')}% rata-rata`} />
        <SelRingkas label="Lead Aktif" nilai={<Angka nilai={k.leadAktif} ukuran="xl" />} catatan={`dari ${k.totalLead} lead · ${dataset.customers.length} customer`} />
        <SelRingkas label="Rata-rata Hari Terjual" nilai={<Angka nilai={k.rataRataHariTerjual} ukuran="xl" suffix="hari" />} catatan={`piutang ${rupiahRingkas(k.piutang)}`} />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel judul="Tren penjualan" keterangan="Nilai penjualan dalam enam bulan terakhir" aksi={<span className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent">{rupiahRingkas(penjualan.reduce((sum, b) => sum + b.nilai, 0))} total</span>}>
          <div className="flex h-44 items-end gap-3 border-b border-hairline pt-5 sm:gap-6" role="img" aria-label={penjualan.map(b => `${bulanLabel(b.bulan)}: ${rupiahRingkas(b.nilai)}`).join(', ')}>
            {penjualan.map((b, i) => <div key={b.bulan} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-2 whitespace-nowrap text-[10px] font-medium text-ink-2 sm:text-xs">{rupiahRingkas(b.nilai)}</span><div className={'mx-auto w-full max-w-14 rounded-t-md ' + (i === penjualan.length - 1 ? 'bg-accent' : 'bg-[#b5c9ce]')} style={{ height: `${Math.max(2, b.nilai / Math.max(1, ...penjualan.map(x => x.nilai)) * 78)}%` }} /></div>)}
          </div>
          <div className="mt-3 flex gap-3 sm:gap-6">{penjualan.map(b => <span key={b.bulan} className="min-w-0 flex-1 text-center text-[10px] text-ink-3 sm:text-xs">{bulanLabel(b.bulan).split(' ')[0]}</span>)}</div>
        </Panel>
        <Link to="/inventory/VH-2026-0001" className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-panel bg-[#17272c] p-6 text-white">
          <VehiclePhoto unit={{ brand: 'Toyota', model: 'Fortuner' }} priority className="absolute inset-0 h-full w-full opacity-65 transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102127] via-[#102127]/30 to-transparent" />
          <div className="relative"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] tracking-wider backdrop-blur">MULAI DEMO DI SINI</span><h2 className="mt-4 text-xl font-semibold">Satu mobil. Seluruh ceritanya.</h2><p className="mt-2 max-w-sm text-xs leading-relaxed text-white/80">Ikuti Fortuner dari pembelian, perbaikan, sampai laba penjualan.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#e9c49a]">Telusuri perjalanan unit <ArrowRight size={16} /></span></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Perlu perhatian */}
        <Panel
          judul="Perlu perhatian hari ini"
          keterangan={`Dihitung dari data per ${tanggalPendek(DEMO_TODAY)}`}
          padat
          className="xl:col-span-2"
        >
          {sinyal.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-ink-3">Tidak ada yang perlu ditindak hari ini.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {sinyal.map((s) => {
                const Ikon = s.tingkat === 'bahaya' ? ShieldAlert : s.tingkat === 'perhatian' ? AlertTriangle : Info
                const warna = s.tingkat === 'bahaya' ? 'text-danger' : s.tingkat === 'perhatian' ? 'text-attention' : 'text-ink-3'
                return (
                  <li key={s.id}>
                    <Link to={s.tautan} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-sunken">
                      <Ikon size={15} className={`mt-0.5 shrink-0 ${warna}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-ink">{s.judul}</p>
                        <p className="mt-0.5 truncate text-2xs text-ink-3">{s.keterangan}</p>
                      </div>
                      <ArrowRight size={14} className="mt-0.5 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* Status unit */}
        <Panel judul="Unit berdasarkan status" keterangan="Termasuk unit yang sudah terjual" padat>
          <ul className="divide-y divide-hairline">
            {URUTAN_STATUS.map((s) => {
              const jml = perStatus[s]
              const pct = totalUnit ? Math.round((jml / totalUnit) * 100) : 0
              return (
                <li key={s} className="flex items-center gap-3 px-4 py-2">
                  <span className="w-40 shrink-0">
                    <StatusPill label={STATUS_UNIT[s].label} pil={STATUS_UNIT[s].halus} dot={STATUS_UNIT[s].dot} />
                  </span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                    <span className="block h-full rounded-pill" style={{ width: `${pct}%`, background: `var(--color-${tokenStatus(s)})` }} />
                  </span>
                  <Angka nilai={jml} ukuran="sm" nada="kuat" className="w-6 text-right" />
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Penjualan per bulan + rinciannya — dua panel bertumpuk agar tinggi kolom seimbang */}
        <div className="flex flex-col gap-4 xl:col-span-2">
        <Panel judul="Penjualan 6 bulan terakhir" keterangan="Unit, nilai penjualan, dan gross profit" padat>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="bg-sunken text-left">
                  <Th>Bulan</Th>
                  <Th align="right">Unit</Th>
                  <Th align="right">Nilai Penjualan</Th>
                  <Th align="right" className="hidden md:table-cell">Modal</Th>
                  <Th align="right">Gross Profit</Th>
                </tr>
              </thead>
              <tbody>
                {penjualan.map((b) => (
                  <tr key={b.bulan} className="border-t border-hairline hover:bg-sunken/60">
                    <Td>{bulanLabel(b.bulan)}</Td>
                    <Td align="right"><Angka nilai={b.unit} ukuran="sm" /></Td>
                    <Td align="right"><Money nilai={b.nilai} ukuran="sm" ringkas /></Td>
                    <Td align="right" className="hidden md:table-cell"><Money nilai={b.modal} ukuran="sm" nada="muted" ringkas /></Td>
                    <Td align="right"><Money nilai={b.grossProfit} ukuran="sm" nada="positif" ringkas /></Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline-strong bg-sunken">
                  <Td tebal>Total</Td>
                  <Td align="right" tebal><Angka nilai={penjualan.reduce((s, b) => s + b.unit, 0)} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Money nilai={penjualan.reduce((s, b) => s + b.nilai, 0)} ukuran="sm" nada="kuat" ringkas /></Td>
                  <Td align="right" tebal className="hidden md:table-cell"><Money nilai={penjualan.reduce((s, b) => s + b.modal, 0)} ukuran="sm" nada="muted" ringkas /></Td>
                  <Td align="right" tebal><Money nilai={penjualan.reduce((s, b) => s + b.grossProfit, 0)} ukuran="sm" nada="positif" ringkas /></Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel judul={`Transaksi ${bulanLabel(bulanIni)}`} keterangan="Unit yang terjual bulan ini, beserta modal dan labanya" padat>
          <Table minWidth={560}>
            <THead>
              <Th>Invoice</Th>
              <Th>Unit</Th>
              <Th className="hidden sm:table-cell">Customer</Th>
              <Th align="right">Harga Final</Th>
              <Th align="right">Gross Profit</Th>
            </THead>
            <tbody>
              {dataset.sales
                .filter((s) => s.tanggal.slice(0, 7) === bulanIni)
                .map((s) => {
                  const v = dataset.vehicles.find((x) => x.id === s.vehicleId)
                  return (
                    <Baris key={s.id}>
                      <Td><IdChip nilai={s.id} /></Td>
                      <Td>
                        <Link to={`/inventory/${s.vehicleId}`} className="block hover:underline">
                          <span className="text-xs font-medium text-ink">{v?.brand} {v?.model}</span>
                          <span className="mt-0.5 block"><IdChip nilai={s.vehicleId} /></span>
                        </Link>
                      </Td>
                      <Td className="hidden sm:table-cell">{s.customerNama}</Td>
                      <Td align="right"><Money nilai={s.finalPrice} ukuran="sm" nada="kuat" /></Td>
                      <Td align="right"><Money nilai={s.grossProfit} ukuran="sm" nada="positif" /></Td>
                    </Baris>
                  )
                })}
            </tbody>
          </Table>
        </Panel>
        </div>

        {/* Pipeline + aging */}
        <div className="flex flex-col gap-4">
          <Panel judul="Pipeline lead aktif" keterangan="Belum menang dan belum batal" padat className="flex-1">
            <ul className="divide-y divide-hairline">
              {pipeline.map((p) => (
                <li key={p.tahap} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-pill ${STATUS_LEAD[p.tahap].dot}`} aria-hidden />
                    <span className="text-xs text-ink-2">{STATUS_LEAD[p.tahap].label}</span>
                  </span>
                  <span className="flex items-baseline gap-3">
                    <Money nilai={p.nilai} ukuran="sm" nada="muted" ringkas />
                    <Angka nilai={p.jumlah} ukuran="sm" nada="kuat" className="w-5 text-right" />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel judul="Inventory aging" keterangan="Sejak unit siap dipasarkan" padat className="flex-1">
            <ul className="divide-y divide-hairline">
              {aging.map((b, i) => (
                <li key={b.label} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className={`text-xs ${i === 3 && b.jumlah > 0 ? 'text-danger' : 'text-ink-2'}`}>{b.label}</span>
                  <span className="flex items-baseline gap-3">
                    <Money nilai={b.unit.reduce((s, v) => s + v.listingPrice, 0)} ukuran="sm" nada="muted" ringkas />
                    <Angka nilai={b.jumlah} ukuran="sm" nada={i === 3 && b.jumlah > 0 ? 'bahaya' : 'kuat'} className="w-5 text-right" />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* Unit terbaru masuk */}
      <Panel
        judul="Unit terbaru masuk"
        keterangan="Lima unit dengan tanggal masuk terakhir"
        padat
        aksi={<Link to="/inventory" className="text-2xs font-medium text-accent hover:underline">Lihat inventory</Link>}
      >
        <Table minWidth={720}>
          <THead>
            <Th>Unit</Th>
            <Th>Status</Th>
            <Th align="right" className="hidden md:table-cell">Total Modal</Th>
            <Th align="right">Harga Listing</Th>
            <Th align="right" className="hidden lg:table-cell">Estimasi Margin</Th>
            <Th align="right" className="hidden sm:table-cell">Masuk</Th>
          </THead>
          <tbody>
              {[...dataset.vehicles]
                .sort((a, b) => (a.tanggalMasuk < b.tanggalMasuk ? 1 : -1))
                .slice(0, 5)
                .map((v) => (
                  <Baris key={v.id}>
                    <Td>
                      <Link to={`/inventory/${v.id}`} className="block hover:underline">
                        <span className="text-xs font-medium text-ink">{v.brand} {v.model} {v.variant}</span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <IdChip nilai={v.id} />
                          <span className="text-2xs text-ink-3">{v.tahun} · {v.nomorPolisi}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td><StatusPill label={STATUS_UNIT[v.status].label} pil={STATUS_UNIT[v.status].pil} /></Td>
                    <Td align="right" className="hidden md:table-cell"><Money nilai={v.totalCost} ukuran="sm" /></Td>
                    <Td align="right"><Money nilai={v.listingPrice} ukuran="sm" nada="kuat" /></Td>
                    <Td align="right" className="hidden lg:table-cell"><Money nilai={v.estimasiMargin} ukuran="sm" nada="positif" /></Td>
                    <Td align="right" className="hidden sm:table-cell"><span className="text-2xs text-ink-2">{tanggalPendek(v.tanggalMasuk)}</span></Td>
                  </Baris>
                ))}
            </tbody>
          </Table>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sales                                                               */
/* ------------------------------------------------------------------ */
function DashboardSales() {
  const { pengguna } = useAuth()
  const nama = pengguna?.nama ?? ''
  const leadSaya = dataset.leads.filter((l) => l.salesPIC === nama)
  const aktif = leadSaya.filter((l) => !['WON', 'LOST'].includes(l.status))
  const jatuhTempo = aktif.filter((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY)
  const unitSaya = dataset.sales.filter((s) => s.salesPIC === nama)
  const bookingSaya = dataset.bookings.filter((b) => b.salesPIC === nama && b.statusPembayaran !== 'LUNAS')
  const nilaiPipeline = aktif.reduce((s, l) => s + l.budget, 0)

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 divide-hairline border border-hairline bg-panel md:grid-cols-4 md:divide-x">
        <SelRingkas label="Lead Aktif Saya" nilai={<Angka nilai={aktif.length} ukuran="xl" />} catatan={`${leadSaya.length} total lead ditangani`} />
        <SelRingkas label="Jatuh Tempo Follow-up" nilai={<Angka nilai={jatuhTempo.length} ukuran="xl" nada="perhatian" />} catatan="Perlu dihubungi hari ini" />
        <SelRingkas label="Nilai Pipeline" nilai={<Money nilai={nilaiPipeline} ukuran="xl" ringkas />} catatan="Dari budget lead aktif" />
        <SelRingkas label="Unit Terjual Saya" nilai={<Angka nilai={unitSaya.length} ukuran="xl" />} catatan={`${bookingSaya.length} booking berjalan`} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel judul="Follow-up hari ini" keterangan="Lead yang sudah jatuh tempo atau jatuh tempo hari ini" padat className="xl:col-span-2">
          {jatuhTempo.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-ink-3">Tidak ada follow-up yang jatuh tempo.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {jatuhTempo.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-medium text-ink">
                      {l.nama}
                      <StatusPill label={STATUS_LEAD[l.status].label} pil={STATUS_LEAD[l.status].halus} dot={STATUS_LEAD[l.status].dot} padat />
                    </p>
                    <p className="mt-0.5 truncate text-2xs text-ink-3">
                      {l.vehicleLabel} · {l.sumber} · budget {rupiahRingkas(l.budget)}
                    </p>
                  </div>
                  <span className="shrink-0 text-2xs text-attention">{l.nextFollowUp ? jarakHari(l.nextFollowUp, DEMO_TODAY) : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel judul="Pipeline saya" padat>
          <ul className="divide-y divide-hairline">
            {pipelineLead()
              .filter((p) => !['WON', 'LOST'].includes(p.tahap))
              .map((p) => {
                const jml = p.daftar.filter((l) => l.salesPIC === nama).length
                return (
                  <li key={p.tahap} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-pill ${STATUS_LEAD[p.tahap].dot}`} aria-hidden />
                      <span className="text-xs text-ink-2">{STATUS_LEAD[p.tahap].label}</span>
                    </span>
                    <Angka nilai={jml} ukuran="sm" nada={jml ? 'kuat' : 'muted'} />
                  </li>
                )
              })}
          </ul>
        </Panel>
      </div>

      <Panel judul="Unit yang saya tangani" keterangan="Unit dengan lead aktif atau booking berjalan" padat>
        <ul className="divide-y divide-hairline">
          {aktif.slice(0, 8).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <IdChip nilai={l.vehicleId} ke={`/inventory/${l.vehicleId}`} />
                <span className="truncate text-xs text-ink">{l.vehicleLabel}</span>
              </div>
              <span className="flex shrink-0 items-center gap-3 text-2xs text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  {l.nextFollowUp ? jarakHari(l.nextFollowUp, DEMO_TODAY) : 'tanpa jadwal'}
                </span>
                <Money nilai={l.budget} ukuran="sm" nada="muted" ringkas />
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function tokenStatus(s: string) {
  return {
    'BARU MASUK': 'st-baru',
    INSPEKSI: 'st-inspeksi',
    RECONDITIONING: 'st-recon',
    READY: 'st-ready',
    BOOKED: 'st-booked',
    SOLD: 'st-sold',
  }[s] as string
}
