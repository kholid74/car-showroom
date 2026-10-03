import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, CalendarClock, Columns3, List, MessageSquare, Phone, Search, X,
} from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip, SakelarTampilan } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_LEAD, TAHAP_PIPELINE } from '@/lib/status'
import { dataset, DEMO_TODAY } from '@/data'
import { bebanSales, leadPerSumber, ringkasanLead } from '@/data/agregat-lead'
import { TAHAP_LEAD_BERIKUTNYA, useSesi } from '@/store/sesi'
import { jarakHari, persen, rupiahRingkas, tanggalPendek } from '@/lib/format'
import type { Lead, LeadStatus } from '@/data/types'

type Tampilan = 'papan' | 'tabel'

export function CrmPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const pic = params.get('pic') ?? 'SEMUA'
  const sumber = params.get('sumber') ?? 'SEMUA'
  const tampilan = (params.get('tampilan') ?? 'papan') as Tampilan

  const sesi = useSesi()
  const { pindahkanLead: pindahkan, riwayatLead: riwayat } = sesi

  // dataset.leads sudah merupakan tampilan langsung: lead dasar + lead sesi + tahap sesi.
  // Jadi papan, KPI, dan filter membaca daftar yang sama tanpa penggabungan manual.
  const semua = dataset.leads

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanLead(), [])
  const perSumber = useMemo(() => leadPerSumber(), [])
  const beban = useMemo(() => bebanSales(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return semua.filter((l) => {
      if (pic !== 'SEMUA' && l.salesPIC !== pic) return false
      if (sumber !== 'SEMUA' && l.sumber !== sumber) return false
      if (!kata) return true
      const kolom = [l.id, l.nama, l.telepon, l.vehicleLabel, l.vehicleId, l.salesPIC, l.catatan]
      return kolom.some((k) => k.toLowerCase().includes(kata))
    })
  }, [semua, q, pic, sumber])

  const papan = useMemo(
    () =>
      TAHAP_PIPELINE.map((tahap) => {
        const daftar = terfilter.filter((l) => l.status === tahap)
        return {
          tahap,
          daftar: daftar.sort((a, b) => ((a.nextFollowUp ?? '9999') < (b.nextFollowUp ?? '9999') ? -1 : 1)),
          nilai: daftar.reduce((s, l) => s + l.budget, 0),
        }
      }),
    [terfilter],
  )

  const selesai = terfilter.filter((l) => ['WON', 'LOST'].includes(l.status))
  const adaFilter = q !== '' || pic !== 'SEMUA' || sumber !== 'SEMUA'
  const adaPerubahan = Object.keys(sesi.tahapLead).length > 0

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas label="Lead Aktif" nilai={<Angka nilai={ringkas.aktif} ukuran="xl" />} catatan={`dari ${ringkas.total} lead yang pernah masuk`} />
        <SelRingkas label="Nilai Pipeline" nilai={<Money nilai={ringkas.nilaiPipeline} ukuran="xl" ringkas />} catatan={`Rata-rata ${rupiahRingkas(ringkas.rataBudget)} per lead`} />
        <SelRingkas
          label="Jatuh Tempo Follow-up"
          nilai={<Angka nilai={ringkas.jatuhTempo} ukuran="xl" nada={ringkas.jatuhTempo ? 'perhatian' : 'muted'} />}
          catatan={`${ringkas.tanpaJadwal} lead belum punya jadwal`}
        />
        <SelRingkas label="Sudah Menang" nilai={<Angka nilai={ringkas.menang} ukuran="xl" nada="positif" />} catatan={`${rupiahRingkas(ringkas.nilaiMenang)} nilai budget`} />
        <SelRingkas label="Konversi Lead" nilai={<Angka nilai={Math.round(ringkas.konversi * 100)} ukuran="xl" suffix="%" />} catatan={`${ringkas.batal} lead batal`} />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-64">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari nama, nomor HP, atau unit…"
            aria-label="Cari lead"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={pic === 'SEMUA'} onClick={() => atur('pic', 'SEMUA')} jumlah={semua.length}>
            Semua sales
          </FilterChip>
          {dataset.salesTeam.map((s) => (
            <FilterChip
              key={s.id}
              aktif={pic === s.nama}
              onClick={() => atur('pic', s.nama)}
              jumlah={semua.filter((l) => l.salesPIC === s.nama).length}
            >
              {s.nama.split(' ')[0]}
            </FilterChip>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={sumber}
            onChange={(e) => atur('sumber', e.target.value)}
            aria-label="Saring sumber lead"
            className="h-7 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2 hover:bg-sunken"
          >
            <option value="SEMUA">Semua sumber</option>
            {dataset.sumberLeadMaster.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <SakelarTampilan<Tampilan>
            nilai={tampilan}
            onChange={(v) => atur('tampilan', v)}
            opsi={[
              { nilai: 'papan', label: 'Papan', ikon: <Columns3 size={13} /> },
              { nilai: 'tabel', label: 'Tabel', ikon: <List size={13} /> },
            ]}
          />

          {adaFilter && (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })} ikon={<X size={13} />}>
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      {adaPerubahan && (
        <div className="flex flex-wrap items-center gap-2 rounded-panel border border-hairline bg-sunken px-3 py-2">
          <p className="text-2xs text-ink-2">
            <span className="font-medium text-ink">{riwayat.length} perubahan tahap lead</span> pada sesi ini — kartu
            yang dipindahkan ditandai, dan seluruh angka di halaman ini ikut menyesuaikan.
          </p>
        </div>
      )}

      {tampilan === 'papan' ? (
          <div className="space-y-2">
            <p className="text-2xs text-ink-3">
              Papan ini bisa digeser ke kanan untuk melihat kolom berikutnya (Booking, dan seterusnya).
            </p>
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max gap-3">
                {papan.map((kolom) => (
                  <section key={kolom.tahap} className="flex w-52 flex-col border border-hairline bg-panel rounded-panel">
                  <header className="border-b border-hairline px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-pill ${STATUS_LEAD[kolom.tahap].dot}`} aria-hidden />
                      <h2 className="text-xs font-semibold text-ink">{STATUS_LEAD[kolom.tahap].label}</h2>
                      <span className="tnum ml-auto text-xs text-ink-3">{kolom.daftar.length}</span>
                    </div>
                    <p className="mt-0.5 text-2xs text-ink-3">{rupiahRingkas(kolom.nilai)} nilai budget</p>
                  </header>

                  <ul className="flex-1 space-y-px p-2">
                    {kolom.daftar.length === 0 && <li className="px-1 py-3 text-center text-2xs text-ink-3">Tidak ada lead</li>}
                    {kolom.daftar.map((l) => (
                      <KartuLead key={l.id} lead={l} tahap={kolom.tahap} onChangeTahap={(id, dari, ke) => pindahkan(id, dari, ke, l.nama)} />
                    ))}
                  </ul>
                </section>
                ))}
              </div>
            </div>

          <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
            <span className="label-caps">Sudah selesai</span>
            {(['WON', 'LOST'] as LeadStatus[]).map((t) => {
              const jml = selesai.filter((l) => l.status === t).length
              return (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-pill bg-sunken px-2 py-0.5 text-2xs text-ink-2">
                  <span className={`h-1.5 w-1.5 rounded-pill ${STATUS_LEAD[t].dot}`} aria-hidden />
                  {STATUS_LEAD[t].label}
                  <span className="tnum text-ink-3">{jml}</span>
                </span>
              )
            })}
            <span className="text-2xs text-ink-3">
              · total {terfilter.length} lead pada saringan ini
            </span>
          </div>
        </div>
      ) : (
        <Panel judul={`${terfilter.length} lead`} keterangan="Klik lead untuk melihat riwayat interaksinya" padat>
          <Table minWidth={1000}>
            <THead>
              <Th lebar={200}>Lead</Th>
              <Th lebar={130}>Tahap</Th>
              <Th lebar={120}>Sumber</Th>
              <Th lebar={230}>Unit Diminati</Th>
              <Th align="right" lebar={140}>Budget</Th>
              <Th className="hidden lg:table-cell" lebar={140}>Sales PIC</Th>
              <Th align="right" lebar={140}>Follow-up</Th>
              <Th className="hidden 2xl:table-cell" align="right" lebar={110}>Masuk</Th>
              <Th lebar={36} />
            </THead>
            <tbody>
              {terfilter.map((l) => {
                const tahap = l.status
                const lewat = l.nextFollowUp && l.nextFollowUp <= DEMO_TODAY && !['WON', 'LOST'].includes(tahap)
                return (
                  <Baris key={l.id}>
                    <Td>
                      <Link to={`/crm/${l.id}`} className="group block">
                        <span className="block text-xs font-medium text-ink group-hover:text-accent">{l.nama}</span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="id-chip text-ink-3">{l.id}</span>
                          <span className="text-2xs text-ink-3">{l.telepon}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td><StatusPill label={STATUS_LEAD[tahap].label} pil={STATUS_LEAD[tahap].halus} dot={STATUS_LEAD[tahap].dot} /></Td>
                    <Td>
                      {l.sumber}
                      {l.id.startsWith('LD-KATALOG') && (
                        <span className="ml-1.5 rounded-pill bg-accent-soft px-1.5 py-0.5 text-2xs font-medium text-accent">
                          dari katalog
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Link to={`/inventory/${l.vehicleId}`} className="hover:underline">
                        <span className="block truncate text-xs text-ink-2">{l.vehicleLabel}</span>
                        <IdChip nilai={l.vehicleId} />
                      </Link>
                    </Td>
                    <Td align="right"><Money nilai={l.budget} ukuran="sm" /></Td>
                    <Td className="hidden lg:table-cell"><span className="text-2xs text-ink-2">{l.salesPIC}</span></Td>
                    <Td align="right">
                      {l.nextFollowUp ? (
                        <span className={`text-2xs ${lewat ? 'text-danger' : 'text-ink-2'}`}>
                          {tanggalPendek(l.nextFollowUp)}
                          <span className="mt-0.5 block text-ink-3">{jarakHari(l.nextFollowUp, DEMO_TODAY)}</span>
                        </span>
                      ) : (
                        <span className="text-2xs text-ink-3">tanpa jadwal</span>
                      )}
                    </Td>
                    <Td align="right" className="hidden 2xl:table-cell"><span className="text-2xs text-ink-2">{tanggalPendek(l.tanggalMasuk)}</span></Td>
                    <Td align="right">
                      <Link to={`/crm/${l.id}`} aria-label={`Buka lead ${l.id}`} className="inline-flex text-ink-3 hover:text-accent">
                        <ArrowRight size={15} />
                      </Link>
                    </Td>
                  </Baris>
                )
              })}
            </tbody>
          </Table>
        </Panel>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel judul="Efektivitas sumber lead" keterangan="Bukan hanya banyak lead, tapi yang berujung closing" padat>
          <Table minWidth={0}>
            <THead>
              <Th>Sumber</Th>
              <Th align="right">Lead</Th>
              <Th align="right">Menang</Th>
              <Th align="right">Konversi</Th>
            </THead>
            <tbody>
              {perSumber.map((s) => (
                <Baris key={s.sumber}>
                  <Td>{s.sumber}</Td>
                  <Td align="right"><Angka nilai={s.jumlah} ukuran="sm" nada="muted" /></Td>
                  <Td align="right"><Angka nilai={s.menang} ukuran="sm" nada="positif" /></Td>
                  <Td align="right">
                    <span className={`tnum text-xs ${s.konversi >= 0.3 ? 'text-money-pos' : s.konversi > 0 ? 'text-ink-2' : 'text-ink-3'}`}>
                      {persen(s.konversi, 0)}
                    </span>
                  </Td>
                </Baris>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel judul="Beban kerja sales" keterangan="Lead aktif dan yang sudah jatuh tempo" padat>
          <Table minWidth={0}>
            <THead>
              <Th>Sales</Th>
              <Th align="right">Lead Aktif</Th>
              <Th align="right">Jatuh Tempo</Th>
              <Th align="right">Menang</Th>
            </THead>
            <tbody>
              {beban.map((b) => (
                <Baris key={b.sales}>
                  <Td>{b.sales}</Td>
                  <Td align="right"><Angka nilai={b.aktif} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right">
                    <span className={`tnum text-xs ${b.jatuhTempo ? 'text-attention font-medium' : 'text-ink-3'}`}>{b.jatuhTempo}</span>
                  </Td>
                  <Td align="right"><Angka nilai={b.menang} ukuran="sm" nada="positif" /></Td>
                </Baris>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function KartuLead({
  lead,
  tahap,
  onChangeTahap,
}: {
  lead: Lead
  tahap: LeadStatus
  onChangeTahap: (leadId: string, dari: LeadStatus, ke: LeadStatus) => void
}) {
  const berikutnya = TAHAP_LEAD_BERIKUTNYA[tahap]
  const lewat = lead.nextFollowUp && lead.nextFollowUp <= DEMO_TODAY

  return (
    <li className="group relative rounded-control border border-hairline bg-panel px-2.5 py-2 hover:border-hairline-strong hover:bg-sunken/50">
      <Link to={`/crm/${lead.id}`} className="block min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-ink">{lead.nama}</span>
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5">
          <IdChip nilai={lead.vehicleId} />
          <span className="truncate text-2xs text-ink-2">{lead.vehicleLabel}</span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-2xs text-ink-3">
            <MessageSquare size={11} />
            {lead.sumber}
          </span>
          <Money nilai={lead.budget} ukuran="sm" nada="muted" ringkas />
        </span>
        <span className="mt-1 flex items-center justify-between gap-2 border-t border-hairline pt-1 text-2xs">
          <span className="flex items-center gap-1.5 text-ink-3">
            <Phone size={11} />
            {lead.salesPIC.split(' ')[0]}
          </span>
          <span className={`flex items-center gap-1 ${lewat ? 'text-danger' : 'text-ink-3'}`}>
            <CalendarClock size={11} />
            {lead.nextFollowUp ? jarakHari(lead.nextFollowUp, DEMO_TODAY) : 'tanpa jadwal'}
          </span>
        </span>
      </Link>

      {berikutnya && (
        <button
          type="button"
          onClick={() => onChangeTahap(lead.id, tahap, berikutnya)}
          title={`Pindahkan ke ${STATUS_LEAD[berikutnya].label} (demo, tidak tersimpan)`}
          className="absolute right-1.5 top-1.5 hidden h-6 items-center gap-1 rounded-control bg-accent px-1.5 text-2xs font-medium text-white group-hover:inline-flex focus-visible:inline-flex"
        >
          {STATUS_LEAD[berikutnya].label}
          <ArrowRight size={11} />
        </button>
      )}
    </li>
  )
}
