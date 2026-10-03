import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, Info, Phone, RotateCcw, UserRound } from 'lucide-react'
import { Panel, Baris as BarisKV } from '@/components/ui/Panel'
import { Money } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { STATUS_LEAD } from '@/lib/status'
import { dataset, DEMO_TODAY } from '@/data'
import { useLeadStore } from '@/store/leads'
import { jarakHari, persen, rupiahRingkas, tanggalPanjang, tanggalPendek, jam } from '@/lib/format'
import type { LeadStatus } from '@/data/types'

const TAHAP_AKTIF: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'TEST DRIVE', 'NEGOTIATION', 'BOOKED', 'WON', 'LOST']

export function LeadDetailPage() {
  const { leadId = '' } = useParams()
  const { perubahan, pindahkan } = useLeadStore()
  const lead = dataset.leads.find((l) => l.id === leadId)

  if (!lead) {
    return (
      <Panel>
        <h1 className="text-xs font-semibold text-ink">Lead {leadId} tidak ditemukan</h1>
        <p className="mt-1 text-xs text-ink-2">
          Lead pada demo ini bernomor <span className="id-chip">LD-1001</span> sampai{' '}
          <span className="id-chip">LD-1039</span>.
        </p>
        <Link to="/crm" className="mt-3 inline-flex text-2xs font-medium text-accent hover:underline">
          Kembali ke CRM
        </Link>
      </Panel>
    )
  }

  const tahap = perubahan[lead.id] ?? lead.status
  const customer = dataset.customers.find((c) => c.id === lead.customerId)
  const unit = dataset.vehicles.find((v) => v.id === lead.vehicleId)
  const booking = dataset.bookings.find((b) => b.leadId === lead.id)
  const penjualan = dataset.sales.find((s) => s.vehicleId === lead.vehicleId && s.customerId === lead.customerId)
  const selisihBudget = unit ? unit.listingPrice - lead.budget : 0
  const lewat = lead.nextFollowUp && lead.nextFollowUp <= DEMO_TODAY

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/crm" className="inline-flex items-center gap-1 text-2xs text-ink-3 hover:text-accent">
            <ArrowLeft size={12} />
            Kembali ke CRM
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-ink">{lead.nama}</h1>
            <StatusPill label={STATUS_LEAD[tahap].label} pil={STATUS_LEAD[tahap].halus} dot={STATUS_LEAD[tahap].dot} />
            {perubahan[lead.id] && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2 py-0.5 text-2xs text-accent">
                tahap diubah di sesi demo (dari {STATUS_LEAD[lead.status].label})
                <RotateCcw size={11} />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-3">
            <span className="id-chip">{lead.id}</span>
            <span className="flex items-center gap-1">
              <Phone size={11} />
              {lead.telepon}
            </span>
            <span>Masuk {tanggalPendek(lead.tanggalMasuk)}</span>
            <span>Sales {lead.salesPIC}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel
            judul="Riwayat interaksi"
            keterangan={`${lead.interaksi.length} catatan, dari lead masuk sampai kondisi terakhir`}
            padat
          >
            <ol className="divide-y divide-hairline">
              {lead.interaksi
                .slice()
                .reverse()
                .map((i, idx) => (
                  <li key={`${i.waktu}-${idx}`} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="tnum w-28 shrink-0 text-2xs text-ink-3">
                      {tanggalPendek(i.waktu.slice(0, 10))}
                      <span className="mt-0.5 block">{jam(i.waktu)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-ink">{i.tipe}</span>
                      <span className="mt-0.5 block text-2xs text-ink-2">{i.catatan}</span>
                      <span className="mt-0.5 block text-2xs text-ink-3">oleh {i.oleh}</span>
                    </span>
                  </li>
                ))}
            </ol>
            <p className="border-t border-hairline px-4 py-2.5 text-2xs text-ink-3">
              Catatan sales: {lead.catatan}
            </p>
          </Panel>

          <Panel judul="Unit yang diminati" keterangan="Unit ini yang dibahas pada seluruh interaksi di atas" padat>
            {unit ? (
              <div className="px-4 py-3">
                <Link to={`/inventory/${unit.id}`} className="group flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink group-hover:text-accent">
                      {unit.brand} {unit.model} {unit.variant}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-2xs text-ink-3">
                      <IdChip nilai={unit.id} />
                      <span>{unit.tahun}</span>
                      <span>·</span>
                      <span className="id-chip">{unit.nomorPolisi}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Money nilai={unit.listingPrice} ukuran="sm" nada="kuat" />
                    <StatusPill
                      label={unit.status === 'SOLD' ? 'Terjual' : unit.status === 'BOOKED' ? 'Booked' : 'Ready'}
                      pil={
                        unit.status === 'SOLD'
                          ? 'bg-st-sold text-white'
                          : unit.status === 'BOOKED'
                            ? 'bg-st-booked text-white'
                            : 'bg-st-ready text-white'
                      }
                    />
                  </span>
                </Link>

                <div className="mt-3 grid grid-cols-1 divide-y divide-hairline border-t border-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <Sel label="Budget customer" nilai={rupiahRingkas(lead.budget)} />
                  <Sel label="Harga listing" nilai={rupiahRingkas(unit.listingPrice)} />
                  <Sel
                    label={selisihBudget > 0 ? 'Selisih yang perlu dinegosiasi' : 'Budget di atas harga listing'}
                    nilai={rupiahRingkas(Math.abs(selisihBudget))}
                    nada={selisihBudget > 0 ? 'perhatian' : 'positif'}
                  />
                </div>
              </div>
            ) : (
              <p className="px-4 py-4 text-xs text-ink-3">Unit yang diminati tidak ditemukan pada data demo.</p>
            )}
          </Panel>

          {booking && (
            <Panel
              judul={`Booking ${booking.id}`}
              keterangan={`Dibuat ${tanggalPanjang(booking.tanggalBooking)} · berakhir ${tanggalPendek(booking.kadaluarsa)}`}
              padat
            >
              <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Sel label="Uang muka" nilai={rupiahRingkas(booking.dp)} />
                <Sel label="Sisa pembayaran" nilai={rupiahRingkas(booking.sisaPembayaran)} />
                <Sel label="Status pembayaran" nilai={booking.statusPembayaran} />
              </div>
            </Panel>
          )}

          {penjualan && (
            <Panel judul={`Transaksi ${penjualan.id}`} keterangan={`Terjual ${tanggalPanjang(penjualan.tanggal)}`} padat>
              <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Sel label="Harga final" nilai={rupiahRingkas(penjualan.finalPrice)} nada="kuat" />
                <Sel label="Gross profit" nilai={rupiahRingkas(penjualan.grossProfit)} nada="positif" />
                <Sel label="Tipe pembayaran" nilai={penjualan.tipePembayaran} />
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-18 xl:self-start">
          <Panel judul="Tindak lanjut" padat>
            <div className="px-4 py-3">
              <BarisKV label="Follow-up berikutnya">
                {lead.nextFollowUp ? (
                  <span className={lewat ? 'text-danger' : 'text-ink-2'}>
                    {tanggalPendek(lead.nextFollowUp)} · {jarakHari(lead.nextFollowUp, DEMO_TODAY)}
                  </span>
                ) : (
                  'Tidak ada jadwal'
                )}
              </BarisKV>
              <BarisKV label="Interaksi terakhir">{tanggalPendek(lead.interaksiTerakhir.slice(0, 10))}</BarisKV>
              <BarisKV label="Preferensi pembayaran">{lead.preferensiPembayaran}</BarisKV>
              <BarisKV label="Sumber lead">{lead.sumber}</BarisKV>
              <BarisKV label="Sales PIC">{lead.salesPIC}</BarisKV>
            </div>

            <div className="border-t border-hairline px-4 py-3">
              <p className="label-caps">Ubah tahap lead</p>
              <select
                value={tahap}
                onChange={(e) => pindahkan(lead.id, tahap, e.target.value as LeadStatus)}
                aria-label="Ubah tahap lead"
                className="mt-1.5 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink hover:bg-sunken"
              >
                {TAHAP_AKTIF.map((t) => (
                  <option key={t} value={t}>
                    {STATUS_LEAD[t].label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-2xs leading-relaxed text-ink-3">
                Perubahan hanya berlaku di sesi demo ini (tanpa backend) dan dipakai untuk memperlihatkan perpindahan
                kartu di papan pipeline.
              </p>
            </div>
          </Panel>

          <Panel judul="Customer" keterangan={customer ? 'Data pelanggan yang tersimpan' : 'Belum menjadi customer'} padat>
            {customer ? (
              <>
                <div className="px-4 py-3">
                  <BarisKV label="Nama">{customer.nama}</BarisKV>
                  <BarisKV label="Telepon">{customer.telepon}</BarisKV>
                  <BarisKV label="Email">{customer.email}</BarisKV>
                  <BarisKV label="Kota">{customer.kota}</BarisKV>
                </div>
                <div className="border-t border-hairline px-4 py-2.5">
                  <Link
                    to={`/customer/${customer.id}`}
                    className="inline-flex items-center gap-1 text-2xs font-medium text-accent hover:underline"
                  >
                    Buka profil customer
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </>
            ) : (
              <p className="px-4 py-3 text-2xs leading-relaxed text-ink-3">
                Lead ini belum sampai tahap test drive, sehingga belum tercatat sebagai customer. Profil customer
                dibuat otomatis ketika lead masuk tahap test drive.
              </p>
            )}
          </Panel>

          <p className="flex items-start gap-2 px-1 text-2xs leading-relaxed text-ink-3">
            <Info size={13} className="mt-px shrink-0" />
            <span>
              {persen(lead.budget / Math.max(1, unit?.listingPrice ?? 1), 0)} dari harga listing ada di budget
              customer{unit ? ` (${rupiahRingkas(unit.listingPrice)})` : ''}. Angka ini yang biasanya jadi titik
              negosiasi.
            </span>
          </p>

          {customer && (
            <Link
              to={`/customer/${customer.id}`}
              className="flex items-center justify-between gap-3 border border-hairline bg-panel rounded-panel px-3 py-2.5 text-2xs text-ink-2 hover:bg-sunken"
            >
              <span className="flex items-center gap-2">
                <UserRound size={14} className="text-ink-3" />
                Semua lead & transaksi {customer.nama}
              </span>
              <ArrowRight size={13} className="text-ink-3" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

function Sel({
  label,
  nilai,
  nada = 'default',
}: {
  label: string
  nilai: string
  nada?: 'default' | 'kuat' | 'positif' | 'perhatian'
}) {
  const warna =
    nada === 'positif' ? 'text-money-pos' : nada === 'perhatian' ? 'text-attention' : nada === 'kuat' ? 'text-ink font-semibold' : 'text-ink-2'
  return (
    <div className="px-4 py-2.5">
      <p className="label-caps">{label}</p>
      <p className={`tnum mt-1 text-xs ${warna}`}>{nilai}</p>
    </div>
  )
}
