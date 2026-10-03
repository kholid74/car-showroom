import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { Panel, Baris as BarisKV } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { STATUS_LEAD, STATUS_UNIT } from '@/lib/status'
import { bundelCustomer } from '@/data/agregat-lead'
import { rupiahRingkas, tanggalPanjang, tanggalPendek, jam } from '@/lib/format'

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const bundel = bundelCustomer(customerId)

  if (!bundel) {
    return (
      <Panel>
        <h2 className="text-xs font-semibold text-ink">Customer {customerId} tidak ditemukan</h2>
        <p className="mt-1 text-xs text-ink-2">
          Customer pada demo ini bernomor <span className="id-chip">CST-001</span> sampai{' '}
          <span className="id-chip">CST-022</span>.
        </p>
        <Link to="/customer" className="mt-3 inline-flex text-2xs font-medium text-accent hover:underline">
          Kembali ke daftar customer
        </Link>
      </Panel>
    )
  }

  const { customer, leads, booking, penjualan, kendaraan } = bundel

  // seluruh interaksi dari semua lead customer ini, digabung dan diurutkan terbaru dulu
  const interaksi = leads
    .flatMap((l) => l.interaksi.map((i) => ({ ...i, leadId: l.id, vehicleId: l.vehicleId, vehicleLabel: l.vehicleLabel })))
    .sort((a, b) => (a.waktu < b.waktu ? 1 : -1))

  const nilaiTransaksi = penjualan.reduce((s, x) => s + x.finalPrice, 0)
  const labaTransaksi = penjualan.reduce((s, x) => s + x.grossProfit, 0)

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <Link to="/customer" className="inline-flex items-center gap-1 text-2xs text-ink-3 hover:text-accent">
          <ArrowLeft size={12} />
          Kembali ke daftar customer
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{customer.nama}</h2>
          <IdChip nilai={customer.id} tebal />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-3">
          <span className="flex items-center gap-1"><Phone size={11} />{customer.telepon}</span>
          <span className="flex items-center gap-1"><Mail size={11} />{customer.email}</span>
          <span className="flex items-center gap-1"><MapPin size={11} />{customer.kota}</span>
          <span>Customer sejak {tanggalPendek(customer.sejak)}</span>
        </div>
      </div>

      <StripRingkas kolom={4}>
        <SelRingkas label="Lead Tercatat" nilai={<Angka nilai={leads.length} ukuran="xl" />} catatan="Termasuk negosiasi yang masih berjalan" />
        <SelRingkas
          label="Transaksi"
          nilai={<Angka nilai={penjualan.length} ukuran="xl" nada={penjualan.length ? 'positif' : 'muted'} />}
          catatan={booking.length ? `${booking.length} booking tercatat` : 'Belum ada booking'}
        />
        <SelRingkas label="Nilai Transaksi" nilai={<Money nilai={nilaiTransaksi} ukuran="xl" ringkas />} catatan="Total harga final yang dibayar" />
        <SelRingkas label="Laba dari Customer Ini" nilai={<Money nilai={labaTransaksi} ukuran="xl" ringkas nada="positif" />} catatan="Gross profit yang tercatat" />
      </StripRingkas>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel judul="Riwayat lead" keterangan="Unit yang pernah diminati, beserta status akhirnya" padat>
            <Table minWidth={760}>
              <THead>
                <Th lebar={110}>Lead</Th>
                <Th lebar={230}>Unit</Th>
                <Th lebar={130}>Tahap</Th>
                <Th align="right" lebar={140}>Budget</Th>
                <Th className="hidden lg:table-cell" lebar={130}>Sales PIC</Th>
                <Th align="right" lebar={110}>Masuk</Th>
                <Th lebar={36} />
              </THead>
              <tbody>
                {leads
                  .slice()
                  .sort((a, b) => (a.tanggalMasuk < b.tanggalMasuk ? 1 : -1))
                  .map((l) => (
                    <Baris key={l.id}>
                      <Td><span className="id-chip text-ink-2">{l.id}</span></Td>
                      <Td>
                        <Link to={`/inventory/${l.vehicleId}`} className="group block min-w-0">
                          <span className="block truncate text-xs text-ink group-hover:text-accent">{l.vehicleLabel}</span>
                          <IdChip nilai={l.vehicleId} />
                        </Link>
                      </Td>
                      <Td>
                        <StatusPill label={STATUS_LEAD[l.status].label} pil={STATUS_LEAD[l.status].halus} dot={STATUS_LEAD[l.status].dot} />
                      </Td>
                      <Td align="right"><Money nilai={l.budget} ukuran="sm" /></Td>
                      <Td className="hidden lg:table-cell"><span className="text-2xs text-ink-2">{l.salesPIC}</span></Td>
                      <Td align="right"><span className="text-2xs text-ink-2">{tanggalPendek(l.tanggalMasuk)}</span></Td>
                      <Td align="right">
                        <Link to={`/crm/${l.id}`} aria-label={`Buka lead ${l.id}`} className="inline-flex text-ink-3 hover:text-accent">
                          <ChevronRight size={15} />
                        </Link>
                      </Td>
                    </Baris>
                  ))}
              </tbody>
            </Table>
          </Panel>

          {penjualan.length > 0 && (
            <Panel judul="Transaksi" keterangan="Unit yang benar-benar dibeli oleh customer ini" padat>
              <Table minWidth={700}>
                <THead>
                  <Th lebar={150}>Invoice</Th>
                  <Th lebar={200}>Unit</Th>
                  <Th align="right" lebar={150}>Harga Final</Th>
                  <Th align="right" lebar={150}>Gross Profit</Th>
                  <Th className="hidden lg:table-cell" lebar={130}>Pembayaran</Th>
                  <Th align="right" lebar={110}>Tanggal</Th>
                </THead>
                <tbody>
                  {penjualan.map((s) => {
                    const unit = kendaraan.find((v) => v.id === s.vehicleId)
                    return (
                      <Baris key={s.id}>
                        <Td><span className="id-chip text-ink-2">{s.id}</span></Td>
                        <Td>
                          <Link to={`/inventory/${s.vehicleId}?tab=penjualan`} className="group block min-w-0">
                            <span className="block truncate text-xs text-ink group-hover:text-accent">
                              {unit ? `${unit.brand} ${unit.model}` : s.vehicleId}
                            </span>
                            <IdChip nilai={s.vehicleId} />
                          </Link>
                        </Td>
                        <Td align="right"><Money nilai={s.finalPrice} ukuran="sm" nada="kuat" /></Td>
                        <Td align="right"><Money nilai={s.grossProfit} ukuran="sm" nada="positif" /></Td>
                        <Td className="hidden lg:table-cell">
                          <span className="text-2xs text-ink-2">{s.tipePembayaran}</span>
                          {s.financePartner && <span className="mt-0.5 block text-2xs text-ink-3">{s.financePartner}</span>}
                        </Td>
                        <Td align="right"><span className="text-2xs text-ink-2">{tanggalPendek(s.tanggal)}</span></Td>
                      </Baris>
                    )
                  })}
                </tbody>
              </Table>
            </Panel>
          )}

          <Panel
            judul="Seluruh interaksi"
            keterangan={`${interaksi.length} catatan dari semua lead customer ini`}
            padat
          >
            <ol className="divide-y divide-hairline">
              {interaksi.map((i, idx) => (
                <li key={`${i.leadId}-${i.waktu}-${idx}`} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="tnum w-28 shrink-0 text-2xs text-ink-3">
                    {tanggalPendek(i.waktu.slice(0, 10))}
                    <span className="mt-0.5 block">{jam(i.waktu)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-ink">{i.tipe}</span>
                      <Link to={`/crm/${i.leadId}`} className="id-chip text-accent hover:underline">{i.leadId}</Link>
                      <Link to={`/inventory/${i.vehicleId}`} className="id-chip text-ink-3 hover:text-accent">{i.vehicleId}</Link>
                    </span>
                    <span className="mt-0.5 block text-2xs text-ink-2">{i.catatan}</span>
                    <span className="mt-0.5 block text-2xs text-ink-3">oleh {i.oleh}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-18 xl:self-start">
          <Panel judul="Profil customer" padat>
            <div className="px-4 py-3">
              <BarisKV label="Pekerjaan">{customer.pekerjaan}</BarisKV>
              <BarisKV label="Alamat">{customer.alamat}</BarisKV>
              <BarisKV label="Kota">{customer.kota}</BarisKV>
              <BarisKV label="Sumber lead">{customer.sumberLead}</BarisKV>
              <BarisKV label="Sales PIC">{customer.salesPIC}</BarisKV>
              <BarisKV label="Budget awal">{<Money nilai={customer.budget} ukuran="sm" />}</BarisKV>
              <BarisKV label="Preferensi pembayaran">{customer.preferensiPembayaran}</BarisKV>
            </div>
            <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
              {customer.catatan}
            </p>
          </Panel>

          <Panel judul="Unit yang pernah diminati" keterangan={`${kendaraan.length} unit berbeda`} padat>
            <ul className="divide-y divide-hairline">
              {kendaraan.map((v) => (
                <li key={v.id}>
                  <Link to={`/inventory/${v.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-sunken">
                    <span className="min-w-0">
                      <span className="block truncate text-xs text-ink">{v.brand} {v.model}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <IdChip nilai={v.id} />
                        <span className="text-2xs text-ink-3">{rupiahRingkas(v.listingPrice)}</span>
                      </span>
                    </span>
                    <StatusPill label={STATUS_UNIT[v.status].label} pil={STATUS_UNIT[v.status].halus} dot={STATUS_UNIT[v.status].dot} padat />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          {booking.length > 0 && (
            <Panel judul="Booking" padat>
              <ul className="divide-y divide-hairline">
                {booking.map((b) => (
                  <li key={b.id} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="id-chip text-ink-2">{b.id}</span>
                      <Money nilai={b.dp} ukuran="sm" nada="kuat" />
                    </div>
                    <p className="mt-1 text-2xs text-ink-3">
                      Dibuat {tanggalPanjang(b.tanggalBooking)} · {b.statusPembayaran}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <p className="flex items-start gap-2 px-1 text-2xs leading-relaxed text-ink-3">
            <MessageSquare size={13} className="mt-px shrink-0" />
            <span>
              Profil ini menggabungkan lead, booking, dan transaksi dari satu ID customer — inilah yang membuat sales
              bisa melihat riwayat pembelian pelanggan tanpa membuka beberapa sistem.
            </span>
          </p>
        </aside>
      </div>
    </div>
  )
}
