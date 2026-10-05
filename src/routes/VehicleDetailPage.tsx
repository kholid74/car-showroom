import { type ReactNode, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRightCircle, Banknote, CalendarClock, Check, ChevronRight, ClipboardCheck, FileText, Handshake,
  Info, MessageSquare, PackageCheck, Pencil, Receipt, Tag, UserRound, Wallet, Wrench,
} from 'lucide-react'
import { VehiclePhoto } from '@/components/ui/VehiclePhoto'
import { Panel, Baris as BarisKV } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { StatusPill } from '@/components/ui/StatusPill'
import { IdChip } from '@/components/ui/IdChip'
import { Baris as BarisTabel, Table, Td, Th, THead } from '@/components/ui/Table'
import { SelRingkas } from '@/components/ui/SelRingkas'
import { Button } from '@/components/ui/Button'
import {
  HASIL_INSPEKSI, STATUS_DOKUMEN, STATUS_LEAD, STATUS_PEMBAYARAN, STATUS_RECON, STATUS_UNIT, keteranganAging,
} from '@/lib/status'
import { bundelUnit, customerById, unitTersedia } from '@/data/selectors'
import { DEMO_TODAY } from '@/data'
import { TAHAP_UNIT_BERIKUTNYA, useSesi } from '@/store/sesi'
import { FormUnit } from '@/components/app/FormUnit'
import { FormTahapUnit } from '@/components/app/FormTahapUnit'
import { FormPenjualan } from '@/components/app/FormPenjualan'
import { FormPekerjaanRecon } from '@/components/app/FormPekerjaanRecon'
import { FormInspeksi } from '@/components/app/FormInspeksi'
import { angka, kilometer, persen, rupiahRingkas, tanggalPanjang, tanggalPendek, jarakHari, jam } from '@/lib/format'
import type {
  Activity, Booking, Inspection, Interaksi, Lead, Procurement, Reconditioning, Sale, Vehicle, VehicleDocuments,
} from '@/data/types'

type KunciTab = 'ringkasan' | 'procurement' | 'inspeksi' | 'reconditioning' | 'biaya' | 'lead' | 'penjualan' | 'dokumen' | 'aktivitas'

interface Tab {
  kunci: KunciTab
  label: string
  ikon: ReactNode
}

export function VehicleDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const [formUnit, setFormUnit] = useState(false)
  const [formTahap, setFormTahap] = useState(false)
  const [formJual, setFormJual] = useState(false)
  const bundel = bundelUnit(id)

  if (!bundel) return <UnitTidakDitemukan id={id} />

  const { unit, procurement, inspeksi, recon, dokumen, leads, booking, penjualan, aktivitas } = bundel
  const tab = (params.get('tab') ?? 'ringkasan') as KunciTab

  const pilihTab = (kunci: KunciTab) => {
    const berikut = new URLSearchParams(params)
    if (kunci === 'ringkasan') berikut.delete('tab')
    else berikut.set('tab', kunci)
    setParams(berikut, { replace: true })
  }

  const dokBermasalah = dokumen?.checklist.filter((c) => c.status !== 'Tersedia').length ?? 0
  const leadAktif = leads.filter((l) => !['WON', 'LOST'].includes(l.status)).length

  const TAB: Tab[] = [
    { kunci: 'ringkasan', label: 'Ringkasan', ikon: <Info size={13} /> },
    { kunci: 'procurement', label: 'Pembelian', ikon: <Handshake size={13} /> },
    { kunci: 'inspeksi', label: 'Inspeksi', ikon: <ClipboardCheck size={13} /> },
    { kunci: 'reconditioning', label: 'Perbaikan', ikon: <Wrench size={13} />, },
    { kunci: 'biaya', label: 'Biaya', ikon: <Wallet size={13} /> },
    { kunci: 'lead', label: 'Lead', ikon: <MessageSquare size={13} /> },
    { kunci: 'penjualan', label: 'Penjualan', ikon: <Receipt size={13} /> },
    { kunci: 'dokumen', label: 'Dokumen', ikon: <FileText size={13} /> },
    { kunci: 'aktivitas', label: 'Aktivitas', ikon: <CalendarClock size={13} /> },
  ]

  const penanda: Partial<Record<KunciTab, string>> = {
    inspeksi: inspeksi ? `${inspeksi.skor}` : '',
    reconditioning: recon ? `${recon.items.length}` : '',
    lead: leads.length ? `${leads.length}` : '',
    dokumen: dokBermasalah ? `${dokBermasalah} kurang` : '',
  }

  return (
    <div className="space-y-4">
      {/* ---------------- Kepala halaman ---------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/inventory" className="inline-flex items-center gap-1 text-2xs text-ink-3 hover:text-accent">
            <ArrowLeft size={12} />
            Kembali ke inventory
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {unit.brand} {unit.model} {unit.variant}
            </h2>
            <StatusPill label={STATUS_UNIT[unit.status].label} pil={STATUS_UNIT[unit.status].pil} />
            <span className="ml-1 inline-flex flex-wrap items-center gap-1.5">
              <Button variant="secondary" size="sm" ikon={<Pencil size={13} />} onClick={() => setFormUnit(true)}>
                Ubah data
              </Button>
              {TAHAP_UNIT_BERIKUTNYA[unit.status] && (
                <Button variant="secondary" size="sm" ikon={<ArrowRightCircle size={13} />} onClick={() => setFormTahap(true)}>
                  Ubah tahap
                </Button>
              )}
              {(unit.status === 'READY' || unit.status === 'BOOKED') && (
                <Button variant="primary" size="sm" ikon={<Receipt size={13} />} onClick={() => setFormJual(true)}>
                  Catat penjualan
                </Button>
              )}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-3">
            <IdChip nilai={unit.id} tebal />
            <span className="tnum">{unit.tahun}</span>
            <span>·</span>
            <span className="tnum">{kilometer(unit.kilometer)}</span>
            <span>·</span>
            <span className="id-chip">{unit.nomorPolisi}</span>
            <span>·</span>
            <span>{unit.transmisi} · {unit.bahanBakar} · {unit.warna}</span>
            <span>·</span>
            <span>Cabang {unit.cabang}</span>
          </div>
        </div>

        {leadAktif > 0 && (
          <div className="flex items-center gap-2 rounded-control bg-attention/10 px-2.5 py-1.5">
            <UserRound size={13} className="text-attention" />
            <span className="text-2xs font-medium text-attention">
              {leadAktif} lead masih aktif pada unit ini
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------- Isi tab ---------------- */}
        <div className="min-w-0 space-y-3">
          <TabBar tab={tab} tab2={TAB} penanda={penanda} pilihTab={pilihTab} />
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'ringkasan' && <TabRingkasan unit={unit} bundel={bundel} pilihTab={pilihTab} />}
            {tab === 'procurement' && <TabProcurement unit={unit} procurement={procurement} />}
            {tab === 'inspeksi' && <TabInspeksi unit={unit} inspeksi={inspeksi} />}
            {tab === 'reconditioning' && <TabReconditioning unit={unit} recon={recon} />}
            {tab === 'biaya' && <TabBiaya unit={unit} recon={recon} penjualan={penjualan} />}
            {tab === 'lead' && <TabLead leads={leads} />}
            {tab === 'penjualan' && <TabPenjualan unit={unit} booking={booking} penjualan={penjualan} />}
            {tab === 'dokumen' && <TabDokumen dokumen={dokumen} unit={unit} />}
            {tab === 'aktivitas' && <TabAktivitas aktivitas={aktivitas} />}
          </div>
        </div>

        {/* ---------------- Money rail ---------------- */}
        <RelModal unit={unit} penjualan={penjualan} aktivitas={aktivitas} pilihTab={pilihTab} />
      </div>

      {formUnit && <FormUnit terbuka unit={bundel.unit} onTutup={() => setFormUnit(false)} />}
      {formTahap && <FormTahapUnit terbuka unit={unit} onTutup={() => setFormTahap(false)} />}
      {formJual && <FormPenjualan terbuka unit={unit} booking={booking} onTutup={() => setFormJual(false)} />}
    </div>
  )
}

/* ================================================================== */
/* Navigasi tab                                                        */
/* ================================================================== */
function TabBar({
  tab,
  tab2,
  penanda,
  pilihTab,
}: {
  tab: KunciTab
  tab2: Tab[]
  penanda: Partial<Record<KunciTab, string>>
  pilihTab: (k: KunciTab) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const geser = (arah: -1 | 1) => {
    const idx = tab2.findIndex((t) => t.kunci === tab)
    const berikut = tab2[(idx + arah + tab2.length) % tab2.length]
    pilihTab(berikut.kunci)
    ref.current?.querySelector<HTMLButtonElement>(`#tab-${berikut.kunci}`)?.focus()
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="Bagian detail unit"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); geser(1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); geser(-1) }
      }}
      className="flex overflow-x-auto items-center gap-1 border-b border-hairline pb-0"
    >
      {tab2.map((t) => {
        const aktif = tab === t.kunci
        const tanda = penanda[t.kunci]
        return (
          <button
            key={t.kunci}
            id={`tab-${t.kunci}`}
            role="tab"
            type="button"
            aria-selected={aktif}
            aria-controls={`panel-${t.kunci}`}
            tabIndex={aktif ? 0 : -1}
            onClick={() => pilihTab(t.kunci)}
            className={[
              'relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-xs',
              'border-b-2 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
              aktif
                ? 'border-accent font-medium text-accent'
                : 'border-transparent text-ink-2 hover:border-hairline-strong hover:text-ink',
            ].join(' ')}
          >
            {t.ikon}
            {t.label}
            {tanda && (
              <span className={['tnum text-2xs', aktif ? 'text-accent' : 'text-ink-3'].join(' ')}>{tanda}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* Money rail — jawaban "berapa untungnya" dengan angka yang bisa ditrace */
/* ================================================================== */
function RelModal({
  unit,
  penjualan,
  aktivitas,
  pilihTab,
}: {
  unit: Vehicle
  penjualan?: Sale
  aktivitas: Activity[]
  pilihTab: (k: KunciTab) => void
}) {
  const terjual = Boolean(penjualan)
  const margin = terjual ? penjualan!.grossProfit : unit.estimasiMargin

  return (
    <aside className="space-y-3 order-first xl:order-last xl:sticky xl:top-24 xl:self-start">
      <section className="border border-hairline bg-panel rounded-panel">
        <header className="border-b border-hairline px-3 py-2.5">
          <p className="label-caps">{terjual ? 'Hasil Akhir Unit Ini' : 'Perhitungan Modal & Margin'}</p>
        </header>

        <div className="px-3 py-2.5">
          <TombolBaris label="Harga beli" nilai={unit.purchasePrice} onClick={() => pilihTab('procurement')} />
          <TombolBaris label="Reconditioning" nilai={unit.reconCost} onClick={() => pilihTab('reconditioning')} />
          <TombolBaris label="Biaya lain" nilai={unit.otherCost} onClick={() => pilihTab('biaya')} />

          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline-strong pt-2">
            <span className="text-2xs font-medium text-ink">Total modal</span>
            <Money nilai={unit.totalCost} ukuran="lg" nada="kuat" />
          </div>

          <div className="mt-2.5 border-t border-hairline pt-2.5">
            <TombolBaris label={terjual ? 'Harga listing' : 'Harga listing'} nilai={unit.listingPrice} onClick={() => pilihTab('penjualan')} />
            {terjual && (
              <>
                <TombolBaris label="Diskon diberikan" nilai={-penjualan!.diskon} onClick={() => pilihTab('penjualan')} />
                <TombolBaris label="Harga final" nilai={penjualan!.finalPrice} onClick={() => pilihTab('penjualan')} />
              </>
            )}
          </div>

          <div className="mt-2.5 rounded-control bg-money-pos/8 px-2.5 py-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xs font-medium text-money-pos">
                {terjual ? 'Laba kotor tercatat' : 'Potensi margin'}
              </span>
              <Money nilai={margin} ukuran="lg" nada="positif" />
            </div>
            <p className="mt-0.5 text-2xs text-money-pos/90">
              {persen(margin / unit.totalCost)} dari total modal
            </p>
          </div>

          {!terjual && (
            <p className="mt-2 text-2xs leading-relaxed text-ink-3">
              Angka di atas dihitung dari: harga beli + biaya reconditioning + biaya lain. Setiap baris dapat diklik
              untuk melihat sumber biayanya.
            </p>
          )}
        </div>

        <div className="border-t border-hairline px-3 py-2.5">
          <p className="label-caps">Ringkasan operasional</p>
          <div className="mt-1.5">
            <BarisKV label="Umur di inventory">
              <span className={keteranganAging(unit.hariDiInventory).kelas}>{unit.hariDiInventory} hari</span>
            </BarisKV>
            <BarisKV label={terjual ? 'Lama sampai terjual' : 'Lama sejak siap jual'}>
              {unit.hariSejakSiap ?? '—'} hari
            </BarisKV>
            <BarisKV label="Tanggal masuk">{tanggalPendek(unit.tanggalMasuk)}</BarisKV>
            <BarisKV label="Siap dipasarkan">{unit.tanggalSiap ? tanggalPendek(unit.tanggalSiap) : 'Belum siap'}</BarisKV>
            <BarisKV label={terjual ? 'Tanggal terjual' : 'Status jual'}>
              {unit.tanggalTerjual ? tanggalPendek(unit.tanggalTerjual) : STATUS_UNIT[unit.status].label}
            </BarisKV>
            <BarisKV label="Sales PIC">{unit.salesPIC}</BarisKV>
            <BarisKV label="Total catatan aktivitas">{angka(aktivitas.length)}</BarisKV>
          </div>
        </div>

        <div className="border-t border-hairline px-3 py-2.5">
          <p className="label-caps">Identitas teknis</p>
          <div className="mt-1.5">
            <BarisKV label="VIN"><span className="id-chip">{unit.vin}</span></BarisKV>
            <BarisKV label="Nomor mesin"><span className="id-chip">{unit.nomorMesin}</span></BarisKV>
            <BarisKV label="Kondisi saat dibeli">{unit.kondisiMasuk}</BarisKV>
            <BarisKV label="Lokasi">{unit.lokasi}</BarisKV>
          </div>
        </div>
      </section>

      <p className="px-1 text-2xs leading-relaxed text-ink-3">
        Hari demo {tanggalPendek(DEMO_TODAY)}. Seluruh angka berasal dari satu dataset yang sama dengan halaman
        inventory, laporan, dan pencatatan biaya.
      </p>
    </aside>
  )
}

function TombolBaris({ label, nilai, onClick }: { label: string; nilai: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Lihat sumber angka: ${label}`}
      className="group flex w-full items-baseline justify-between gap-3 rounded-control px-1 py-1 text-left hover:bg-sunken"
    >
      <span className="flex items-center gap-1 text-2xs text-ink-3 group-hover:text-ink-2">
        {label}
        <ChevronRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <Money nilai={nilai} ukuran="sm" />
    </button>
  )
}

/* ================================================================== */
/* Tab: Ringkasan                                                      */
/* ================================================================== */
function TabRingkasan({
  unit,
  bundel,
  pilihTab,
}: {
  unit: Vehicle
  bundel: NonNullable<ReturnType<typeof bundelUnit>>
  pilihTab: (k: KunciTab) => void
}) {
  const { procurement, inspeksi, recon, leads, booking, penjualan, dokumen, aktivitas } = bundel
  const dokBermasalah = dokumen?.checklist.filter((c) => c.status !== 'Tersedia') ?? []

  return (
    <div className="space-y-4">
      <VehiclePhoto unit={unit} priority credit className="aspect-[16/8] rounded-panel" />
      <div className="flex gap-2 overflow-x-auto py-1" aria-label="Tahapan kendaraan">{['Dibeli', 'Inspeksi', 'Perbaikan', 'Siap jual', 'Booking', 'Terjual'].map((label, i) => {
        const tahap = ['BARU MASUK', 'INSPEKSI', 'RECONDITIONING', 'READY', 'BOOKED', 'SOLD'].indexOf(unit.status)
        return <span key={label} className={'flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs ' + (i <= tahap ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink-3')}><span className="tnum text-[10px]">0{i + 1}</span>{label}</span>
      })}</div>
      <Panel judul="Perjalanan unit ini" keterangan={`${aktivitas.length} peristiwa tercatat, dari pembelian sampai kondisi sekarang`} padat>
        <LiniMasa aktivitas={aktivitas} ringkas />
      </Panel>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel
          judul="Ringkasan rantai proses"
          keterangan="Setiap tahap terhubung ke satu ID unit yang sama"
          padat
        >
          <ul className="divide-y divide-hairline">
            <RingkasBaris
              label="Pembelian"
              nilai={procurement ? `${rupiahRingkas(procurement.hargaDeal)} · ${procurement.sumber}` : 'Belum ada data pembelian'}
              aksi={() => pilihTab('procurement')}
              siap={Boolean(procurement)}
            />
            <RingkasBaris
              label="Inspeksi"
              nilai={inspeksi ? `Skor ${inspeksi.skor} · ${inspeksi.rekomendasi}` : 'Belum diinspeksi'}
              aksi={() => pilihTab('inspeksi')}
              siap={Boolean(inspeksi)}
            />
            <RingkasBaris
              label="Reconditioning"
              nilai={recon ? `${recon.items.length} pekerjaan · ${rupiahRingkas(recon.total)}` : 'Belum masuk reconditioning'}
              aksi={() => pilihTab('reconditioning')}
              siap={Boolean(recon)}
            />
            <RingkasBaris
              label="Dipasarkan"
              nilai={unit.tanggalSiap ? `Siap ${tanggalPendek(unit.tanggalSiap)} · listing ${rupiahRingkas(unit.listingPrice)}` : 'Belum siap dipasarkan'}
              aksi={() => pilihTab('penjualan')}
              siap={Boolean(unit.tanggalSiap)}
            />
            <RingkasBaris
              label="Peminat"
              nilai={`${leads.length} lead tercatat · ${leads.filter((l) => l.status === 'WON').length} menang`}
              aksi={() => pilihTab('lead')}
              siap={leads.length > 0}
            />
            <RingkasBaris
              label="Booking"
              nilai={booking ? `${booking.id} · DP ${rupiahRingkas(booking.dp)}` : 'Belum ada booking'}
              aksi={() => pilihTab('penjualan')}
              siap={Boolean(booking)}
            />
            <RingkasBaris
              label="Penjualan"
              nilai={penjualan ? `${penjualan.id} · ${rupiahRingkas(penjualan.finalPrice)} · laba ${rupiahRingkas(penjualan.grossProfit)}` : 'Belum terjual'}
              aksi={() => pilihTab('penjualan')}
              siap={Boolean(penjualan)}
            />
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel judul="Catatan operasional" padat>
            <p className="px-4 py-3 text-xs leading-relaxed text-ink-2">{unit.catatan}</p>
            {procurement?.catatan && (
              <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-ink-2">
                <span className="label-caps mr-2">Dari penjual</span>
                {procurement.catatan}
              </p>
            )}
            {inspeksi?.catatan && (
              <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-ink-2">
                <span className="label-caps mr-2">Hasil inspeksi</span>
                {inspeksi.catatan}
              </p>
            )}
          </Panel>

          <Panel
            judul="Perlu tindakan"
            keterangan="Hal yang menghambat unit ini dijual"
            padat
          >
            <ul className="divide-y divide-hairline">
              {inspeksi && inspeksi.ringkasan.repair > 0 && (
                <Pesan
                  nada="bahaya"
                  teks={`${inspeksi.ringkasan.repair} item inspeksi berstatus perlu perbaikan`}
                  aksi={() => pilihTab('inspeksi')}
                />
              )}
              {inspeksi && inspeksi.ringkasan.attention > 0 && (
                <Pesan
                  nada="perhatian"
                  teks={`${inspeksi.ringkasan.attention} item inspeksi perlu perhatian`}
                  aksi={() => pilihTab('inspeksi')}
                />
              )}
              {dokBermasalah.length > 0 && (
                <Pesan
                  nada="bahaya"
                  teks={`${dokBermasalah.length} dokumen belum lengkap: ${dokBermasalah.map((d) => d.nama).join(', ')}`}
                  aksi={() => pilihTab('dokumen')}
                />
              )}
              {booking && booking.statusPembayaran !== 'LUNAS' && (
                <Pesan
                  nada="perhatian"
                  teks={`Booking ${booking.id} berakhir ${tanggalPendek(booking.kadaluarsa)} (${jarakHari(booking.kadaluarsa, DEMO_TODAY)})`}
                  aksi={() => pilihTab('penjualan')}
                />
              )}
              {leads.some((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY && !['WON', 'LOST'].includes(l.status)) && (
                <Pesan
                  nada="perhatian"
                  teks="Ada lead yang jadwal follow-up-nya sudah lewat"
                  aksi={() => pilihTab('lead')}
                />
              )}
              {inspeksi?.ringkasan.repair === 0 &&
                dokBermasalah.length === 0 &&
                !booking &&
                !leads.some((l) => l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY && !['WON', 'LOST'].includes(l.status)) && (
                  <li className="px-4 py-3 text-xs text-ink-3">Tidak ada hambatan yang tercatat pada unit ini.</li>
                )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function RingkasBaris({
  label,
  nilai,
  aksi,
  siap,
}: {
  label: string
  nilai: string
  aksi: () => void
  siap: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={aksi}
        className="group flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-sunken"
      >
        <span className="text-xs text-ink-2">{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-xs ${siap ? 'text-ink' : 'text-ink-3'}`}>{nilai}</span>
          <ChevronRight size={13} className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
    </li>
  )
}

function Pesan({ nada, teks, aksi }: { nada: 'bahaya' | 'perhatian'; teks: string; aksi: () => void }) {
  const kelas = nada === 'bahaya' ? 'text-danger' : 'text-attention'
  return (
    <li>
      <button type="button" onClick={aksi} className="flex w-full items-start gap-2 px-4 py-2 text-left hover:bg-sunken">
        <span className={`mt-0.5 shrink-0 ${kelas}`}>•</span>
        <span className={`text-xs ${kelas}`}>{teks}</span>
      </button>
    </li>
  )
}

/* ================================================================== */
/* Tab: Procurement                                                    */
/* ================================================================== */
function TabProcurement({ unit, procurement }: { unit: Vehicle; procurement?: Procurement }) {
  if (!procurement) {
    return (
      <Panel judul="Procurement">
        <p className="text-xs text-ink-3">Belum ada data pembelian untuk unit ini.</p>
      </Panel>
    )
  }
  const selisihPenawaran = procurement.hargaPenawaran - procurement.hargaDeal
  const vsPasar = procurement.nilaiPasarAcuan - procurement.hargaDeal

  return (
    <div className="space-y-4">
      <Panel
        judul="Asal unit"
        keterangan={`${procurement.id} · dibeli ${tanggalPanjang(procurement.tanggalPembelian)}`}
        padat
      >
        <div className="grid grid-cols-1 divide-hairline md:grid-cols-2 md:divide-x">
          <div className="px-4 py-2">
            <BarisKV label="Sumber">{procurement.sumber}</BarisKV>
            <BarisKV label="Nama penjual">{procurement.namaSeller}</BarisKV>
            <BarisKV label="Kontak">{procurement.kontakSeller}</BarisKV>
            <BarisKV label="Kota">{procurement.kotaSeller}</BarisKV>
          </div>
          <div className="px-4 py-2">
            <BarisKV label="PIC pembelian">{procurement.pic}</BarisKV>
            <BarisKV label="Metode pembayaran">{procurement.metodePembayaran}</BarisKV>
            <BarisKV label="Status">{procurement.status}</BarisKV>
            <BarisKV label="Tanggal penawaran">{tanggalPendek(procurement.tanggalPenawaran)}</BarisKV>
          </div>
        </div>
      </Panel>

      <Panel judul="Negosiasi harga" keterangan="Perbandingan penawaran, harga deal, dan acuan pasar" padat>
        <div className="grid grid-cols-1 divide-hairline sm:grid-cols-3 sm:divide-x">
          <SelRingkas
            label="Penawaran awal"
            nilai={<Money nilai={procurement.hargaPenawaran} ukuran="lg" />}
            catatan={`Diajukan ${tanggalPendek(procurement.tanggalPenawaran)}`}
          />
          <SelRingkas
            label="Harga deal"
            nilai={<Money nilai={procurement.hargaDeal} ukuran="lg" nada="kuat" />}
            catatan={`Turun ${rupiahRingkas(selisihPenawaran)} dari penawaran`}
          />
          <SelRingkas
            label="Nilai pasar acuan"
            nilai={<Money nilai={procurement.nilaiPasarAcuan} ukuran="lg" />}
            catatan={vsPasar >= 0 ? `Beli ${rupiahRingkas(vsPasar)} di bawah acuan pasar` : `Beli ${rupiahRingkas(-vsPasar)} di atas acuan pasar`}
          />
        </div>
        <div className="border-t border-hairline px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-2">{procurement.catatan}</p>
        </div>
      </Panel>

      <Panel judul="Dokumen diterima saat pembelian" padat>
        <ul className="flex flex-wrap gap-1.5 px-4 py-3">
          {procurement.dokumenDiterima.map((d) => (
            <li key={d}>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-2 py-0.5 text-2xs text-ink-2">
                <PackageCheck size={12} className="text-st-ready" />
                {d}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <KaitanUnit unit={unit} teks="Harga beli ini menjadi komponen pertama dari total modal unit, dan muncul di modul Biaya serta laporan profit." />
    </div>
  )
}

/* ================================================================== */
/* Tab: Inspeksi                                                       */
/* ================================================================== */
function TabInspeksi({ unit, inspeksi }: { unit: Vehicle; inspeksi?: Inspection }) {
  const [form, setForm] = useState(false)

  if (!inspeksi) {
    return (
      <div className="space-y-4">
        <Panel judul="Inspeksi">
          <p className="text-xs leading-relaxed text-ink-2">
            Unit ini belum memiliki hasil inspeksi. Inspeksi dijalankan setelah unit masuk dan sebelum perbaikan —
            temuannya yang menentukan pekerjaan perbaikan.
          </p>
          <div className="border-t border-hairline px-4 py-3">
            <Button variant="primary" size="sm" ikon={<ClipboardCheck size={13} />} onClick={() => setForm(true)}>
              Isi hasil inspeksi
            </Button>
          </div>
        </Panel>
        {form && <FormInspeksi terbuka unit={unit} onTutup={() => setForm(false)} />}
      </div>
    )
  }
  const total = inspeksi.ringkasan.good + inspeksi.ringkasan.attention + inspeksi.ringkasan.repair

  return (
    <div className="space-y-4">
      <Panel
        judul="Hasil inspeksi"
        keterangan={`${inspeksi.id} · ${tanggalPanjang(inspeksi.tanggal)} · diperiksa ${inspeksi.inspektur}`}
        padat
      >
        <div className="grid grid-cols-1 divide-hairline sm:grid-cols-4 sm:divide-x">
          <SelRingkas
            label="Skor kelayakan"
            nilai={<Angka nilai={inspeksi.skor} ukuran="lg" nada={inspeksi.skor >= 85 ? 'positif' : 'perhatian'} suffix="/100" />}
            catatan={inspeksi.rekomendasi}
          />
          <SelRingkas label="Item baik" nilai={<Angka nilai={inspeksi.ringkasan.good} ukuran="lg" nada="positif" />} catatan={`dari ${total} item diperiksa`} />
          <SelRingkas label="Perlu perhatian" nilai={<Angka nilai={inspeksi.ringkasan.attention} ukuran="lg" nada="perhatian" />} catatan="Dipantau, belum wajib diganti" />
          <SelRingkas label="Perlu perbaikan" nilai={<Angka nilai={inspeksi.ringkasan.repair} ukuran="lg" nada={inspeksi.ringkasan.repair ? 'bahaya' : 'muted'} />} catatan="Masuk rencana reconditioning" />
        </div>
        <div className="border-t border-hairline px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-2">{inspeksi.catatan}</p>
        </div>
      </Panel>

      {inspeksi.sections.map((s) => {
        const temuan = s.item.filter((i) => i.hasil !== 'GOOD')
        return (
          <Panel
            key={s.kategori}
            judul={s.kategori}
            keterangan={temuan.length ? `${temuan.length} dari ${s.item.length} item punya temuan` : `Semua ${s.item.length} item baik`}
            padat
          >
            <Table minWidth={560}>
              <THead>
                <Th lebar={260}>Item</Th>
                <Th lebar={150}>Hasil</Th>
                <Th>Catatan</Th>
              </THead>
              <tbody>
                {s.item.map((i) => (
                  <BarisTabel key={i.item}>
                    <Td>{i.item}</Td>
                    <Td>
                      <StatusPill
                        label={HASIL_INSPEKSI[i.hasil].label}
                        pil={HASIL_INSPEKSI[i.hasil].halus}
                        dot={HASIL_INSPEKSI[i.hasil].dot}
                      />
                    </Td>
                    <Td>{i.catatan || <span className="text-ink-3">—</span>}</Td>
                  </BarisTabel>
                ))}
              </tbody>
            </Table>
          </Panel>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* Tab: Reconditioning                                                 */
/* ================================================================== */
function TabReconditioning({ unit, recon }: { unit: Vehicle; recon?: Reconditioning }) {
  const selesaikanRecon = useSesi((s) => s.selesaikanRecon)
  const ubahStatusPekerjaan = useSesi((s) => s.ubahStatusPekerjaan)
  const [formPekerjaan, setFormPekerjaan] = useState(false)
  const label = `${unit.brand} ${unit.model} ${unit.tahun}`

  if (!recon) {
    return (
      <Panel judul="Perbaikan">
        <p className="text-xs leading-relaxed text-ink-3">
          Belum ada catatan perbaikan untuk unit ini. Catatan dibuat otomatis begitu unit masuk tahap Perbaikan —
          alurnya Inspeksi → Perbaikan → Siap Jual.
        </p>
      </Panel>
    )
  }
  const totalItem = recon.items.reduce((s, i) => s + i.biaya, 0)
  // Unit yang belum pernah dikerjakan pada data demo membawa perkiraan biaya reconditioning
  // pada modalnya; selisih ini wajar dan disebut apa adanya, bukan diberi label "tidak cocok".
  const selisih = unit.reconCost - totalItem
  const cocok = selisih === 0

  return (
    <div className="space-y-4">
      <Panel
        judul="Pekerjaan perbaikan"
        keterangan={`${recon.id} · mulai ${tanggalPendek(recon.mulai)}${recon.selesai ? ` · selesai ${tanggalPendek(recon.selesai)}` : ' · masih berjalan'}`}
        padat
        aksi={
          <span className="flex items-center gap-2">
            <StatusPill
              label={STATUS_RECON[recon.status].label}
              pil={STATUS_RECON[recon.status].halus}
              dot={STATUS_RECON[recon.status].dot}
            />
            <Money nilai={recon.total} ukuran="lg" nada="kuat" />
            <Button variant="secondary" size="sm" ikon={<Wrench size={13} />} onClick={() => setFormPekerjaan(true)}>
              Tambah pekerjaan
            </Button>
            {recon.status !== 'COMPLETED' && (
              <Button variant="primary" size="sm" ikon={<Check size={13} />} onClick={() => selesaikanRecon(recon.id, label)}>
                Tandai selesai
              </Button>
            )}
          </span>
        }
      >
        {recon.items.length === 0 && (
          <p className="border-b border-hairline px-4 py-3 text-xs leading-relaxed text-ink-3">
            Belum ada pekerjaan yang dicatat untuk unit ini. Tambahkan pekerjaan lewat tombol di atas; biayanya
            menambah modal unit.
          </p>
        )}
        <Table minWidth={760}>
          <THead>
            <Th lebar={90}>ID</Th>
            <Th lebar={240}>Pekerjaan</Th>
            <Th lebar={190}>Vendor</Th>
            <Th className="hidden md:table-cell" lebar={110}>Mulai</Th>
            <Th className="hidden md:table-cell" lebar={110}>Selesai</Th>
            <Th lebar={140}>Status</Th>
            <Th align="right" lebar={140}>Biaya</Th>
            <Th align="right" lebar={130}>Tindakan</Th>
          </THead>
          <tbody>
            {recon.items.map((i) => (
              <BarisTabel key={i.id}>
                <Td><span className="id-chip text-ink-3">{i.id.slice(-12)}</span></Td>
                <Td>
                  <span className="text-xs text-ink">{i.job}</span>
                  <span className="mt-0.5 block text-2xs text-ink-3">{i.catatan}</span>
                </Td>
                <Td>{i.vendor}</Td>
                <Td className="hidden md:table-cell"><span className="text-2xs">{tanggalPendek(i.mulai)}</span></Td>
                <Td className="hidden md:table-cell"><span className="text-2xs">{tanggalPendek(i.selesai)}</span></Td>
                <Td>
                  <StatusPill
                    label={STATUS_RECON[i.status].label}
                    pil={STATUS_RECON[i.status].halus}
                    dot={STATUS_RECON[i.status].dot}
                    padat
                  />
                </Td>
                <Td align="right"><Money nilai={i.biaya} ukuran="sm" /></Td>
                <Td align="right">
                  {i.status === 'COMPLETED' ? (
                    <span className="text-2xs text-ink-3">Selesai</span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => ubahStatusPekerjaan(recon.id, i.id, 'COMPLETED', label)}
                    >
                      Selesaikan
                    </Button>
                  )}
                </Td>
              </BarisTabel>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline-strong bg-sunken">
              <Td tebal>{recon.items.length} pekerjaan</Td>
              <Td />
              <Td />
              <Td className="hidden md:table-cell" />
              <Td className="hidden md:table-cell" />
              <Td tebal>
                {cocok ? 'Cocok dengan total modal' : `${rupiahRingkas(selisih)} belum dirinci`}
              </Td>
              <Td align="right" tebal><Money nilai={unit.reconCost} ukuran="sm" nada="kuat" /></Td>
              <Td />
            </tr>
          </tfoot>
        </Table>
      </Panel>

      <KaitanUnit
        unit={unit}
        teks={
          cocok
            ? `Total pekerjaan di atas sama dengan komponen reconditioning pada total modal unit (${rupiahRingkas(unit.reconCost)}). Angka ini dipakai di modul Biaya dan laporan profit.`
            : `Komponen reconditioning pada modal unit ini ${rupiahRingkas(unit.reconCost)}, sedangkan pekerjaan yang sudah dirinci ${rupiahRingkas(totalItem)}. Selisih ${rupiahRingkas(selisih)} berasal dari perkiraan awal saat unit masuk dan belum dipecah per pekerjaan.`
        }
      />

      {formPekerjaan && (
        <FormPekerjaanRecon terbuka reconId={recon.id} label={label} onTutup={() => setFormPekerjaan(false)} />
      )}
    </div>
  )
}

/* ================================================================== */
/* Tab: Biaya                                                          */
/* ================================================================== */
function TabBiaya({
  unit,
  recon,
  penjualan,
}: {
  unit: Vehicle
  recon?: Reconditioning
  penjualan?: Sale
}) {
  const perVendor = new Map<string, number>()
  recon?.items.forEach((i) => perVendor.set(i.vendor, (perVendor.get(i.vendor) ?? 0) + i.biaya))

  return (
    <div className="space-y-4">
      <Panel judul="Struktur biaya unit" keterangan="Semua biaya yang membentuk total modal" padat>
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-xs text-ink-2">Harga beli unit</span>
            <Money nilai={unit.purchasePrice} ukuran="sm" />
          </div>
          <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-xs text-ink-2">Biaya reconditioning</span>
            <Money nilai={unit.reconCost} ukuran="sm" />
          </div>
          <div className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-xs text-ink-2">Biaya lain (transport, administrasi, perizinan)</span>
            <Money nilai={unit.otherCost} ukuran="sm" />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline-strong pt-2">
            <span className="text-xs font-medium text-ink">Total modal</span>
            <Money nilai={unit.totalCost} ukuran="lg" nada="kuat" />
          </div>
        </div>

        <div className="border-t border-hairline px-4 py-3">
          {penjualan ? (
            <>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-xs text-ink-2">Harga jual final</span>
                <Money nilai={penjualan.finalPrice} ukuran="sm" />
              </div>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-xs text-ink-2">Total modal</span>
                <Money nilai={-unit.totalCost} ukuran="sm" nada="muted" />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline-strong pt-2">
                <span className="text-xs font-medium text-ink">Gross profit</span>
                <Money nilai={penjualan.grossProfit} ukuran="lg" nada="positif" />
              </div>
              <p className="mt-1 text-2xs text-ink-3">
                Margin {persen(penjualan.grossProfit / unit.totalCost)} dari modal · diskon diberikan{' '}
                {rupiahRingkas(penjualan.diskon)} dari harga listing
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-xs text-ink-2">Harga listing saat ini</span>
                <Money nilai={unit.listingPrice} ukuran="sm" />
              </div>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-xs text-ink-2">Total modal</span>
                <Money nilai={-unit.totalCost} ukuran="sm" nada="muted" />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline-strong pt-2">
                <span className="text-xs font-medium text-ink">Potensi margin</span>
                <Money nilai={unit.estimasiMargin} ukuran="lg" nada="positif" />
              </div>
              <p className="mt-1 text-2xs text-ink-3">
                Margin {persen(unit.estimasiMargin / unit.totalCost)} dari modal, jika unit terjual pada harga listing.
              </p>
            </>
          )}
        </div>
      </Panel>

      {perVendor.size > 0 && (
        <Panel judul="Biaya per vendor reconditioning" keterangan="Untuk evaluasi harga vendor" padat>
          <ul className="divide-y divide-hairline">
            {[...perVendor.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([vendor, nilai]) => (
                <li key={vendor} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-xs text-ink-2">{vendor}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="tnum text-2xs text-ink-3">{persen(nilai / unit.reconCost)}</span>
                    <Money nilai={nilai} ukuran="sm" />
                  </span>
                </li>
              ))}
          </ul>
        </Panel>
      )}

      <KaitanUnit
        unit={unit}
        teks="Angka biaya di sini identik dengan yang muncul di dashboard, laporan profit, dan rel modal. Tidak ada perhitungan terpisah per halaman."
      />
    </div>
  )
}

/* ================================================================== */
/* Tab: Lead                                                           */
/* ================================================================== */
function TabLead({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <Panel judul="Lead">
        <p className="text-xs text-ink-3">Belum ada lead yang masuk untuk unit ini.</p>
      </Panel>
    )
  }
  return (
    <div className="space-y-4">
      {leads.map((l) => {
        const customer = customerById(l.customerId)
        return (
          <Panel
            key={l.id}
            judul={l.nama}
            keterangan={`${l.id} · ${l.sumber} · sales ${l.salesPIC}`}
            padat
            aksi={<StatusPill label={STATUS_LEAD[l.status].label} pil={STATUS_LEAD[l.status].halus} dot={STATUS_LEAD[l.status].dot} />}
          >
            <div className="grid grid-cols-1 divide-hairline md:grid-cols-2 md:divide-x">
              <div className="px-4 py-2">
                <BarisKV label="Telepon">{l.telepon}</BarisKV>
                <BarisKV label="Budget">{<Money nilai={l.budget} ukuran="sm" />}</BarisKV>
                <BarisKV label="Preferensi pembayaran">{l.preferensiPembayaran}</BarisKV>
                <BarisKV label="Tanggal masuk lead">{tanggalPanjang(l.tanggalMasuk)}</BarisKV>
              </div>
              <div className="px-4 py-2">
                <BarisKV label="Customer terkait">{customer ? customer.nama : 'Belum jadi customer'}</BarisKV>
                <BarisKV label="Interaksi terakhir">{tanggalPendek(l.interaksiTerakhir.slice(0, 10))}</BarisKV>
                <BarisKV label="Follow-up berikutnya">
                  {l.nextFollowUp ? `${tanggalPendek(l.nextFollowUp)} · ${jarakHari(l.nextFollowUp, DEMO_TODAY)}` : 'Tidak ada jadwal'}
                </BarisKV>
                <BarisKV label="Catatan">{l.catatan}</BarisKV>
              </div>
            </div>

            <ol className="divide-y divide-hairline border-t border-hairline">
              {l.interaksi.map((i: Interaksi, idx: number) => (
                <li key={`${i.waktu}-${idx}`} className="flex items-start gap-3 px-4 py-2">
                  <span className="tnum w-24 shrink-0 text-2xs text-ink-3">
                    {tanggalPendek(i.waktu.slice(0, 10))} {jam(i.waktu)}
                  </span>
                  <span className="min-w-0">
                    <span className="text-xs font-medium text-ink">{i.tipe}</span>
                    <span className="mt-0.5 block text-2xs text-ink-2">{i.catatan}</span>
                    <span className="mt-0.5 block text-2xs text-ink-3">oleh {i.oleh}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/* Tab: Penjualan                                                      */
/* ================================================================== */
function TabPenjualan({
  unit,
  booking,
  penjualan,
}: {
  unit: Vehicle
  booking?: Booking
  penjualan?: Sale
}) {
  if (!booking && !penjualan) {
    return (
      <div className="space-y-4">
        <Panel judul="Penjualan">
          <p className="text-xs text-ink-2">
            Unit ini belum terjual dan belum ada booking. Setelah customer sepakat, alurnya:{' '}
            <span className="text-ink">negosiasi → booking & DP → pembayaran → serah terima</span>. Status unit
            berubah dari <span className="font-medium">Ready</span> ke <span className="font-medium">Booked</span>,
            lalu <span className="font-medium">Terjual</span>.
          </p>
        </Panel>
        <KaitanUnit unit={unit} teks={`Harga listing ${rupiahRingkas(unit.listingPrice)} sudah tayang di katalog publik selama ${unit.hariSejakSiap ?? unit.hariDiInventory} hari.`} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {booking && (
        <Panel
          judul={`Booking ${booking.id}`}
          keterangan={`Dibuat ${tanggalPanjang(booking.tanggalBooking)} · berlaku sampai ${tanggalPendek(booking.kadaluarsa)}`}
          padat
          aksi={
            <StatusPill
              label={STATUS_PEMBAYARAN[booking.statusPembayaran]?.label ?? booking.statusPembayaran}
              pil={STATUS_PEMBAYARAN[booking.statusPembayaran]?.halus ?? 'bg-sunken text-ink-2'}
              dot={STATUS_PEMBAYARAN[booking.statusPembayaran]?.dot}
            />
          }
        >
          <div className="grid grid-cols-1 divide-hairline sm:grid-cols-3 sm:divide-x">
            <SelRingkas label="Customer" nilai={<span className="text-xs text-ink">{booking.customerNama}</span>} catatan={`Sales ${booking.salesPIC}`} />
            <SelRingkas label="Uang muka (DP)" nilai={<Money nilai={booking.dp} ukuran="lg" nada="kuat" />} catatan={`${persen(booking.dp / unit.listingPrice)} dari harga listing`} />
            <SelRingkas label="Sisa pembayaran" nilai={<Money nilai={booking.sisaPembayaran} ukuran="lg" />} catatan={booking.tipePembayaran} />
          </div>
          <p className="border-t border-hairline px-4 py-3 text-xs text-ink-2">{booking.catatan}</p>
        </Panel>
      )}

      {penjualan && (
        <Panel
          judul={`Transaksi ${penjualan.id}`}
          keterangan={`Terjual ${tanggalPanjang(penjualan.tanggal)} · serah terima ${tanggalPendek(penjualan.serahTerima)}`}
          padat
          aksi={
            <StatusPill
              label={STATUS_PEMBAYARAN[penjualan.status]?.label ?? penjualan.status}
              pil={STATUS_PEMBAYARAN[penjualan.status]?.halus ?? 'bg-sunken text-ink-2'}
              dot={STATUS_PEMBAYARAN[penjualan.status]?.dot}
            />
          }
        >
          <div className="grid grid-cols-1 divide-hairline md:grid-cols-2 md:divide-x">
            <div className="px-4 py-2">
              <BarisKV label="Customer">{penjualan.customerNama}</BarisKV>
              <BarisKV label="Sales PIC">{penjualan.salesPIC}</BarisKV>
              <BarisKV label="Harga listing">{<Money nilai={penjualan.listingPrice} ukuran="sm" />}</BarisKV>
              <BarisKV label="Diskon">{<Money nilai={-penjualan.diskon} ukuran="sm" nada="muted" />}</BarisKV>
              <BarisKV label="Harga final" tebal>{<Money nilai={penjualan.finalPrice} ukuran="sm" nada="kuat" />}</BarisKV>
            </div>
            <div className="px-4 py-2">
              <BarisKV label="Tipe pembayaran">{penjualan.tipePembayaran}</BarisKV>
              {penjualan.tipePembayaran === 'Kredit' && (
                <>
                  <BarisKV label="Multifinance">{penjualan.financePartner}</BarisKV>
                  <BarisKV label="Tenor">{penjualan.tenor} bulan</BarisKV>
                  <BarisKV label="Estimasi cicilan">{<Money nilai={penjualan.estimasiCicilan ?? 0} ukuran="sm" />}</BarisKV>
                </>
              )}
              <BarisKV label="DP diterima">{<Money nilai={penjualan.dp} ukuran="sm" />}</BarisKV>
              <BarisKV label="Sisa pembayaran">{<Money nilai={penjualan.sisaPembayaran} ukuran="sm" />}</BarisKV>
            </div>
          </div>

          <div className="border-t border-hairline px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-2">Total modal unit</span>
              <Money nilai={-penjualan.totalModal} ukuran="sm" nada="muted" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-hairline-strong pt-2">
              <span className="text-xs font-medium text-ink">Gross profit unit ini</span>
              <Money nilai={penjualan.grossProfit} ukuran="lg" nada="positif" />
            </div>
            <p className="mt-1.5 text-xs text-ink-2">{penjualan.catatan}</p>
          </div>
        </Panel>
      )}

      {penjualan && (
        <KaitanUnit
          unit={unit}
          teks={`Transaksi ${penjualan.id} pada unit ${unit.id} inilah yang muncul di laporan penjualan, laporan profit, dan performa sales ${penjualan.salesPIC}.`}
        />
      )}
    </div>
  )
}

/* ================================================================== */
/* Tab: Dokumen                                                        */
/* ================================================================== */
function TabDokumen({ dokumen, unit }: { dokumen?: VehicleDocuments; unit: Vehicle }) {
  if (!dokumen) {
    return (
      <Panel judul="Dokumen">
        <p className="text-xs text-ink-3">Belum ada checklist dokumen untuk unit ini.</p>
      </Panel>
    )
  }
  const kurang = dokumen.checklist.filter((c) => c.status !== 'Tersedia').length

  return (
    <div className="space-y-4">
      <Panel
        judul="Kelengkapan dokumen"
        keterangan={kurang ? `${kurang} dari ${dokumen.checklist.length} dokumen belum lengkap` : 'Seluruh dokumen lengkap'}
        padat
      >
        <Table minWidth={560}>
          <THead>
            <Th lebar={240}>Dokumen</Th>
            <Th lebar={150}>Status</Th>
            <Th lebar={180}>Nomor</Th>
            <Th>Catatan</Th>
          </THead>
          <tbody>
            {dokumen.checklist.map((d) => (
              <BarisTabel key={d.nama}>
                <Td tebal>{d.nama}</Td>
                <Td>
                  <StatusPill label={STATUS_DOKUMEN[d.status].label} pil={STATUS_DOKUMEN[d.status].halus} dot={STATUS_DOKUMEN[d.status].dot} />
                </Td>
                <Td><span className="id-chip text-ink-2">{d.nomor ?? '—'}</span></Td>
                <Td>{d.catatan || <span className="text-ink-3">—</span>}</Td>
              </BarisTabel>
            ))}
          </tbody>
        </Table>
      </Panel>

      <p className="px-1 text-2xs leading-relaxed text-ink-3">
        Dokumen pada demo ini hanya metadata. Tidak ada berkas STNK, BPKB, atau data pribadi yang sebenarnya.
      </p>

      <KaitanUnit
        unit={unit}
        teks={`Kelengkapan dokumen menentukan cepatnya proses balik nama dan serah terima unit ${unit.id}.`}
      />
    </div>
  )
}

/* ================================================================== */
/* Tab: Aktivitas                                                      */
/* ================================================================== */
function TabAktivitas({ aktivitas }: { aktivitas: Activity[] }) {
  if (aktivitas.length === 0) {
    return (
      <Panel judul="Aktivitas">
        <p className="text-xs text-ink-3">Belum ada aktivitas tercatat.</p>
      </Panel>
    )
  }
  return (
    <Panel
      judul="Seluruh aktivitas unit"
      keterangan={`${aktivitas.length} peristiwa, terurut dari yang paling awal`}
      padat
    >
      <LiniMasa aktivitas={aktivitas} />
    </Panel>
  )
}

/* ================================================================== */
/* Lini masa (dipakai di Ringkasan dan Aktivitas)                      */
/* ================================================================== */
function ikonTipe(tipe: string) {
  switch (tipe) {
    case 'PROCUREMENT': return <Handshake size={13} />
    case 'INSPECTION': return <ClipboardCheck size={13} />
    case 'RECONDITIONING': return <Wrench size={13} />
    case 'INVENTORY': return <PackageCheck size={13} />
    case 'MERCHANDISING': return <Tag size={13} />
    case 'CRM': return <MessageSquare size={13} />
    case 'SALES': return <Receipt size={13} />
    case 'FINANCE': return <Banknote size={13} />
    default: return <Info size={13} />
  }
}

function LiniMasa({ aktivitas }: { aktivitas: Activity[]; ringkas?: boolean }) {
  const daftar = aktivitas
  return (
    <ol className="px-4 py-3">
      {daftar.map((a, idx) => (
        <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
          {/* garis penghubung antar peristiwa */}
          {idx < daftar.length - 1 && (
            <span className="absolute left-[13px] top-6 bottom-0 w-px bg-hairline" aria-hidden />
          )}
          <span className="relative z-[1] mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-hairline bg-panel text-ink-3">
            {ikonTipe(a.tipe)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="tnum text-2xs text-ink-3">{tanggalPendek(a.tanggal)}</span>
              <span className="text-xs font-medium text-ink">{a.judul}</span>
              <IdChip nilai={a.oleh} />
            </div>
            <p className="mt-0.5 text-2xs text-ink-2">{a.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ================================================================== */
/* Pembantu kecil                                                      */
/* ================================================================== */
function KaitanUnit({ unit, teks }: { unit: Vehicle; teks: string }) {
  return (
    <p className="flex items-start gap-2 border border-hairline bg-sunken/60 rounded-panel px-3 py-2.5 text-2xs leading-relaxed text-ink-2">
      <Info size={13} className="mt-px shrink-0 text-ink-3" />
      <span>
        <span className="id-chip mr-1.5 text-ink-3">{unit.id}</span>
        {teks}
      </span>
    </p>
  )
}

function UnitTidakDitemukan({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <Panel>
        <h2 className="text-xs font-semibold text-ink">Unit {id} tidak ditemukan</h2>
        <p className="mt-1 text-xs text-ink-2">
          Unit dengan ID tersebut tidak ada di data demo. ID unit yang tersedia berformat{' '}
          <span className="id-chip">VH-2026-0001</span> sampai <span className="id-chip">VH-2026-0044</span>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => history.back()}>
            Kembali
          </Button>
          <Link
            to="/inventory"
            className="inline-flex h-7 items-center gap-1.5 rounded-control border border-hairline-strong px-2.5 text-2xs font-medium text-ink-2 hover:bg-sunken"
          >
            Buka inventory
            <ChevronRight size={13} />
          </Link>
        </div>
        <p className="mt-3 text-2xs text-ink-3">
          Contoh unit yang bisa dibuka:{' '}
          {unitTersedia().slice(0, 3).map((v, i) => (
            <span key={v.id}>
              {i > 0 && ' · '}
              <Link to={`/inventory/${v.id}`} className="id-chip text-accent hover:underline">{v.id}</Link>
            </span>
          ))}
        </p>
      </Panel>
    </div>
  )
}
