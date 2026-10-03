import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, ChevronRight, Pencil, Plus, Receipt, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_PEMBAYARAN, STATUS_UNIT } from '@/lib/status'
import { dataset, DEMO_TODAY } from '@/data'
import { ringkasanBooking } from '@/data/agregat-keuangan'
import type { Booking, Vehicle } from '@/data/types'
import { FormPenjualan } from '@/components/app/FormPenjualan'
import { FormBooking } from '@/components/app/FormBooking'
import { jarakHari, persen, rupiahRingkas, tanggalPendek } from '@/lib/format'

export function BookingPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanBooking(), [])
  const [formJual, setFormJual] = useState<{ unit: Vehicle; booking: Booking } | null>(null)
  const [formBooking, setFormBooking] = useState<{ terbuka: boolean; booking?: Booking }>({ terbuka: false })
  const daftarStatus = useMemo(() => [...new Set(dataset.bookings.map((b) => b.statusPembayaran))], [])

  const semua = useMemo(
    () =>
      dataset.bookings
        .map((b) => ({
          booking: b,
          unit: dataset.vehicles.find((v) => v.id === b.vehicleId),
          customer: dataset.customers.find((c) => c.id === b.customerId),
        }))
        .sort((a, b) => (a.booking.tanggalBooking < b.booking.tanggalBooking ? 1 : -1)),
    [],
  )

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return semua
      .filter((x) => status === 'SEMUA' || x.booking.statusPembayaran === status)
      .filter((x) => {
        if (!kata) return true
        const kolom = [
          x.booking.id,
          x.booking.vehicleId,
          x.booking.customerNama,
          x.booking.salesPIC,
          x.unit ? `${x.unit.brand} ${x.unit.model}` : '',
        ]
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
  }, [q, status, semua])

  const adaFilter = q !== '' || status !== 'SEMUA'
  const nilaiDpTerfilter = terfilter.reduce((s, x) => s + x.booking.dp, 0)

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Booking Aktif"
          nilai={<Angka nilai={ringkas.aktif} ukuran="xl" />}
          catatan={`Unit masih berstatus Booked, belum terjual`}
        />
        <SelRingkas
          label="DP Tertahan"
          nilai={<Money nilai={ringkas.nilaiDpAktif} ukuran="xl" ringkas />}
          catatan={`Sisa tagihan ${rupiahRingkas(ringkas.sisaDpAktif)}`}
        />
        <SelRingkas
          label="Mendekati Kadaluarsa"
          nilai={<Angka nilai={ringkas.segera} ukuran="xl" nada={ringkas.segera ? 'perhatian' : 'muted'} />}
          catatan="Batas 5 hari dari hari demo"
        />
        <SelRingkas
          label="Sudah Jadi Penjualan"
          nilai={<Angka nilai={ringkas.selesai} ukuran="xl" nada="positif" />}
          catatan={`Dari ${ringkas.total} booking yang tercatat`}
        />
        <SelRingkas
          label="Konversi Booking"
          nilai={<Angka nilai={Math.round(ringkas.konversi * 100)} ukuran="xl" suffix="%" />}
          catatan="Booking yang berlanjut sampai transaksi"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari kode booking, unit, customer, atau sales…"
            aria-label="Cari booking"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <Button variant="primary" size="sm" ikon={<Plus size={13} />} onClick={() => setFormBooking({ terbuka: true })}>
          Buat booking
        </Button>

        {formBooking.terbuka && <FormBooking terbuka booking={formBooking.booking} onTutup={() => setFormBooking({ terbuka: false })} />}

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={status === 'SEMUA'} onClick={() => atur('status', 'SEMUA')} jumlah={ringkas.total}>
            Semua status
          </FilterChip>
          {daftarStatus.map((s) => (
            <FilterChip
              key={s}
              aktif={status === s}
              onClick={() => atur('status', s)}
              jumlah={dataset.bookings.filter((b) => b.statusPembayaran === s).length}
              warnaDot={STATUS_PEMBAYARAN[s]?.dot}
            >
              {STATUS_PEMBAYARAN[s]?.label ?? s}
            </FilterChip>
          ))}
        </div>

        {adaFilter && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setParams(new URLSearchParams(), { replace: true })} ikon={<X size={13} />}>
            Bersihkan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          judul={`${terfilter.length} booking`}
          keterangan="Booking mengunci unit: status unit berubah dari Ready menjadi Booked sampai transaksi selesai"
          padat
          aksi={<span className="text-2xs text-ink-3">DP pada saringan ini {rupiahRingkas(nilaiDpTerfilter)}</span>}
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada booking yang cocok dengan filter ini.</p>
          ) : (
            <Table minWidth={980}>
              <THead>
                <Th lebar={130}>Booking</Th>
                <Th lebar={250}>Unit</Th>
                <Th lebar={170}>Customer</Th>
                <Th align="right" className="hidden lg:table-cell" lebar={130}>Tanggal</Th>
                <Th align="right" lebar={150}>Kadaluarsa</Th>
                <Th align="right" lebar={140}>DP</Th>
                <Th align="right" className="hidden xl:table-cell" lebar={170}>Sisa Tagihan</Th>
                <Th className="hidden 2xl:table-cell" lebar={150}>Status</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {terfilter.map(({ booking: b, unit, customer }) => {
                  const aktif = unit?.status === 'BOOKED'
                  const sisaHari = jarakHari(b.kadaluarsa, DEMO_TODAY)
                  return (
                    <Baris key={b.id}>
                      <Td>
                        <span className="id-chip block text-ink-2">{b.id}</span>
                        <span className="mt-0.5 block text-2xs text-ink-3">{b.tipePembayaran}</span>
                      </Td>
                      <Td>
                        <Link to={`/inventory/${b.vehicleId}?tab=penjualan`} className="group block min-w-0">
                          <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                            {unit ? `${unit.brand} ${unit.model}` : b.vehicleId}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-2">
                            <IdChip nilai={b.vehicleId} />
                            {unit && (
                              <StatusPill
                                label={STATUS_UNIT[unit.status].label}
                                pil={STATUS_UNIT[unit.status].halus}
                                dot={STATUS_UNIT[unit.status].dot}
                                padat
                              />
                            )}
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        {customer ? (
                          <Link to={`/customer/${customer.id}`} className="block min-w-0 hover:underline">
                            <span className="block truncate text-xs text-ink-2">{b.customerNama}</span>
                            <span className="text-2xs text-ink-3">{customer.kota}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-ink-2">{b.customerNama}</span>
                        )}
                      </Td>
                      <Td align="right" className="hidden lg:table-cell">
                        <span className="text-2xs text-ink-2">{tanggalPendek(b.tanggalBooking)}</span>
                      </Td>
                      <Td align="right">
                        <span className="text-2xs text-ink-2">{tanggalPendek(b.kadaluarsa)}</span>
                        <span className={`mt-0.5 block text-2xs ${aktif && sisaHari.includes('lagi') && /[0-9]/.test(sisaHari) ? 'text-attention' : 'text-ink-3'}`}>
                          {aktif ? sisaHari : 'sudah ditutup'}
                        </span>
                      </Td>
                      <Td align="right">
                        <Money nilai={b.dp} ukuran="sm" nada="kuat" />
                        {unit && <span className="mt-0.5 block text-2xs text-ink-3">{persen(b.dp / unit.listingPrice, 0)} dari listing</span>}
                      </Td>
                      <Td align="right" className="hidden xl:table-cell">
                        {aktif ? (
                          <>
                            <Money nilai={b.sisaPembayaran} ukuran="sm" />
                            <span className="mt-0.5 block text-2xs text-ink-3">sisa di booking ini</span>
                          </>
                        ) : (
                          (() => {
                            // booking yang sudah menjadi penjualan: angka yang mengikat adalah angka
                            // transaksinya, bukan sisa saat booking — supaya tidak tampak masih menagih
                            const jual = dataset.sales.find((x) => x.vehicleId === b.vehicleId)
                            if (!jual) return <span className="text-2xs text-ink-3">—</span>
                            return (
                              <>
                                <Money nilai={jual.sisaPembayaran} ukuran="sm" nada={jual.sisaPembayaran > 0 ? 'perhatian' : 'muted'} />
                                <span className="mt-0.5 block text-2xs text-ink-3">
                                  {jual.sisaPembayaran > 0 ? 'sisa di transaksi' : 'transaksi lunas'}
                                </span>
                              </>
                            )
                          })()
                        )}
                      </Td>
                      <Td className="hidden 2xl:table-cell">
                        <StatusPill
                          label={STATUS_PEMBAYARAN[b.statusPembayaran]?.label ?? b.statusPembayaran}
                          pil={STATUS_PEMBAYARAN[b.statusPembayaran]?.halus ?? 'bg-sunken text-ink-2'}
                          dot={STATUS_PEMBAYARAN[b.statusPembayaran]?.dot}
                        />
                      </Td>
                      <Td align="right">
                        <span className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormBooking({ terbuka: true, booking: b })}
                            aria-label={`Ubah DP booking ${b.id}`}
                            title="Ubah DP atau batalkan booking ini"
                            className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                          >
                            <Pencil size={14} />
                          </button>
                          {aktif && unit && (
                            <button
                              type="button"
                              onClick={() => setFormJual({ unit, booking: b })}
                              aria-label={`Catat penjualan ${unit.id}`}
                              title="Catat penjualan unit ini"
                              className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-money-pos"
                            >
                              <Receipt size={14} />
                            </button>
                          )}
                          <Link
                            to={`/inventory/${b.vehicleId}?tab=penjualan`}
                            aria-label={`Buka unit ${b.vehicleId}`}
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
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel judul="Booking aktif" keterangan="Unit yang sedang terkunci oleh booking" padat>
            {ringkas.daftarAktif.length === 0 ? (
              <p className="px-4 py-4 text-xs text-ink-3">Tidak ada booking yang masih aktif.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {ringkas.daftarAktif.map(({ booking: b, unit }) => {
                  const sisa = jarakHari(b.kadaluarsa, DEMO_TODAY)
                  const mendesak = b.kadaluarsa <= DEMO_TODAY || sisa.includes('hari lagi')
                  return (
                    <li key={b.id}>
                      <Link to={`/inventory/${b.vehicleId}?tab=penjualan`} className="block px-4 py-2.5 hover:bg-sunken">
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-xs text-ink">
                              {unit ? `${unit.brand} ${unit.model}` : b.vehicleId}
                            </span>
                            <span className="mt-0.5 block truncate text-2xs text-ink-3">
                              {b.customerNama} · {b.id}
                            </span>
                          </span>
                          <Money nilai={b.dp} ukuran="sm" nada="muted" ringkas />
                        </div>
                        <span className={`mt-1 inline-flex items-center gap-1 text-2xs ${mendesak ? 'text-attention' : 'text-ink-3'}`}>
                          <CalendarClock size={11} />
                          berlaku sampai {tanggalPendek(b.kadaluarsa)} · {sisa}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel judul="Cara kerja booking" padat>
            <p className="px-4 py-3 text-2xs leading-relaxed text-ink-3">
              Saat customer membayar DP, unit langsung dikunci: statusnya berubah dari{' '}
              <span className="text-st-ready">Ready</span> menjadi <span className="text-st-booked">Booked</span> dan
              tidak lagi dihitung sebagai stok siap jual. Bila transaksi selesai, status berubah menjadi{' '}
              <span className="text-st-sold">Terjual</span>; bila booking batal, unit kembali ke{' '}
              <span className="text-st-ready">Ready</span>.
            </p>
          </Panel>
        </div>
      </div>

      {formJual && (
        <FormPenjualan terbuka unit={formJual.unit} booking={formJual.booking} onTutup={() => setFormJual(null)} />
      )}
    </div>
  )
}
