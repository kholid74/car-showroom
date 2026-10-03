import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Info, Trophy } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { StatusPill } from '@/components/ui/StatusPill'
import { dataset, DEMO_TODAY } from '@/data'
import { performaSales, labelUnit } from '@/data/agregat-laporan'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'

export function PerformaPage() {
  const tim = useMemo(() => performaSales(), [])

  const total = useMemo(
    () => ({
      unit: tim.reduce((s, x) => s + x.unit, 0),
      target: tim.reduce((s, x) => s + x.target, 0),
      nilai: tim.reduce((s, x) => s + x.nilai, 0),
      grossProfit: tim.reduce((s, x) => s + x.grossProfit, 0),
      lead: tim.reduce((s, x) => s + x.lead, 0),
      won: tim.reduce((s, x) => s + x.won, 0),
      aktif: tim.reduce((s, x) => s + x.aktif, 0),
      terlambat: tim.reduce((s, x) => s + x.terlambat, 0),
      rataClosing: (() => {
        const isi = tim.filter((x) => x.rataClosing > 0)
        return isi.length ? isi.reduce((s, x) => s + x.rataClosing, 0) / isi.length : 0
      })(),
    }),
    [tim],
  )

  // lead yang paling lama menunggu tindak lanjut — diurutkan dari yang paling terlambat
  const terlambat = useMemo(
    () =>
      dataset.leads
        .filter((l) => l.nextFollowUp !== null && l.nextFollowUp < DEMO_TODAY && !['WON', 'LOST'].includes(l.status))
        .sort((a, b) => (a.nextFollowUp! < b.nextFollowUp! ? -1 : 1)),
    [],
  )

  const capaianTerbesar = Math.max(...tim.map((x) => x.capaianTarget), 0.01)

  return (
    <div className="space-y-4">
      <p className="mt-0 mb-1 rounded-control border border-hairline bg-sunken px-3 py-2 text-2xs leading-relaxed text-ink-3">
        Halaman ini <span className="text-ink-2">sengaja tanpa tombol tambah atau ubah</span>: kinerja sales dibaca, bukan diisi. Angkanya dihitung dari lead, booking, dan penjualan yang tercatat di modul lain.
      </p>
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Unit Terjual Tim"
          nilai={<Angka nilai={total.unit} ukuran="xl" />}
          catatan={`Target periode demo ${total.target} unit · capaian ${persen(total.target ? total.unit / total.target : 0, 0)}`}
        />
        <SelRingkas
          label="Nilai Penjualan Tim"
          nilai={<Money nilai={total.nilai} ukuran="xl" ringkas />}
          catatan={`Gross profit ${rupiahRingkas(total.grossProfit)}`}
        />
        <SelRingkas
          label="Konversi Lead Tim"
          nilai={<Angka nilai={Number(((total.lead ? total.won / total.lead : 0) * 100).toFixed(1))} ukuran="xl" suffix="%" />}
          catatan={`${total.won} dari ${total.lead} lead menjadi penjualan`}
        />
        <SelRingkas
          label="Lead Aktif"
          nilai={<Angka nilai={total.aktif} ukuran="xl" />}
          catatan={`Rata-rata closing ${Math.round(total.rataClosing)} hari`}
        />
        <SelRingkas
          label="Follow-up Terlambat"
          nilai={<Angka nilai={total.terlambat} ukuran="xl" nada={total.terlambat ? 'perhatian' : 'kuat'} suffix="lead" />}
          catatan={total.terlambat ? 'Melewati tanggal follow-up yang dijadwalkan' : 'Semua follow-up terkendali'}
        />
      </StripRingkas>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel
            judul="Performa per orang"
            keterangan="Semua angka dihitung dari lead dan penjualan yang tercatat, bukan input manual"
            padat
          >
            <Table minWidth={980}>
              <THead>
                <Th lebar={200}>Sales</Th>
                <Th align="right" lebar={80}>Lead</Th>
                <Th align="right" lebar={80}>Aktif</Th>
                <Th align="right" lebar={80}>Won</Th>
                <Th align="right" lebar={100}>Konversi</Th>
                <Th align="right" lebar={90}>Unit</Th>
                <Th align="right" lebar={90}>Target</Th>
                <Th align="right" lebar={150}>Nilai Penjualan</Th>
                <Th align="right" lebar={140}>Gross Profit</Th>
                <Th className="hidden lg:table-cell" align="right" lebar={120}>Rata Closing</Th>
                <Th align="right" lebar={110}>Terlambat</Th>
              </THead>
              <tbody>
                {tim.map((x, i) => (
                  <Baris key={x.id} aktif={i === 0 && x.unit > 0}>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        {i === 0 && x.unit > 0 && <Trophy size={13} className="shrink-0 text-attention" aria-label="unit terjual terbanyak" />}
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-ink">{x.nama}</span>
                          <span className="mt-0.5 block text-2xs text-ink-3">{x.jabatan}</span>
                        </span>
                      </span>
                    </Td>
                    <Td align="right"><Angka nilai={x.lead} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Angka nilai={x.aktif} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Angka nilai={x.won} ukuran="sm" nada="kuat" /></Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${x.konversi >= 0.2 ? 'text-money-pos' : 'text-ink-2'}`}>{persen(x.konversi, 0)}</span>
                    </Td>
                    <Td align="right"><Angka nilai={x.unit} ukuran="sm" nada="kuat" /></Td>
                    <Td align="right"><Angka nilai={x.target} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Money nilai={x.nilai} ukuran="sm" nada="kuat" ringkas /></Td>
                    <Td align="right"><Money nilai={x.grossProfit} ukuran="sm" nada={x.grossProfit >= 0 ? 'positif' : 'bahaya'} ringkas /></Td>
                    <Td align="right" className="hidden lg:table-cell">
                      <span className="tnum text-xs text-ink-2">{x.rataClosing ? `${Math.round(x.rataClosing)} hari` : '—'}</span>
                    </Td>
                    <Td align="right">
                      {x.terlambat ? (
                        <StatusPill label={`${x.terlambat} lead`} pil="bg-attention/10 text-attention" dot="bg-attention" padat />
                      ) : (
                        <span className="text-2xs text-ink-3">—</span>
                      )}
                    </Td>
                  </Baris>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline-strong bg-sunken">
                  <Td tebal>Total tim</Td>
                  <Td align="right" tebal><Angka nilai={total.lead} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Angka nilai={total.aktif} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Angka nilai={total.won} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><span className="tnum text-xs text-ink">{persen(total.lead ? total.won / total.lead : 0, 0)}</span></Td>
                  <Td align="right" tebal><Angka nilai={total.unit} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Angka nilai={total.target} ukuran="sm" nada="muted" /></Td>
                  <Td align="right" tebal><Money nilai={total.nilai} ukuran="sm" nada="kuat" ringkas /></Td>
                  <Td align="right" tebal><Money nilai={total.grossProfit} ukuran="sm" nada="positif" ringkas /></Td>
                  <Td align="right" className="hidden lg:table-cell" />
                  <Td align="right" tebal><Angka nilai={total.terlambat} ukuran="sm" nada="perhatian" /></Td>
                </tr>
              </tfoot>
            </Table>
            <p className="flex items-start gap-2 border-t border-hairline px-4 py-3 text-2xs leading-relaxed text-ink-3">
              <Info size={13} className="mt-px shrink-0" />
              <span>
                Target yang ditampilkan adalah target periode demo pada data master (unit yang harusnya terjual selama
                periode ini), bukan target bulanan. Rata-rata closing dihitung dari tanggal lead masuk sampai tanggal
                transaksi untuk lead yang menang.
              </span>
            </p>
          </Panel>

          <Panel
            judul={`${terlambat.length} lead melewati jadwal follow-up`}
            keterangan="Diurutkan dari yang paling lama tertunda"
            padat
            aksi={
              <Link to="/crm" className="text-2xs font-medium text-accent hover:underline">
                Buka papan CRM →
              </Link>
            }
          >
            {terlambat.length === 0 ? (
              <p className="px-4 py-6 text-xs text-ink-3">Tidak ada follow-up yang terlambat.</p>
            ) : (
              <Table minWidth={820}>
                <THead>
                  <Th lebar={220}>Lead</Th>
                  <Th lebar={200}>Unit Diminati</Th>
                  <Th lebar={160}>Sales</Th>
                  <Th lebar={130}>Jadwal Follow-up</Th>
                  <Th align="right" lebar={110}>Terlambat</Th>
                  <Th lebar={36} />
                </THead>
                <tbody>
                  {terlambat.slice(0, 8).map((l) => {
                    const hari = Math.round(
                      (new Date(DEMO_TODAY + 'T00:00:00Z').getTime() - new Date(l.nextFollowUp! + 'T00:00:00Z').getTime()) /
                        86400000,
                    )
                    return (
                      <Baris key={l.id}>
                        <Td>
                          <Link to={`/crm/${l.id}`} className="group block min-w-0">
                            <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">{l.nama}</span>
                            <span className="mt-0.5 block text-2xs text-ink-3">{l.id} · {l.sumber}</span>
                          </Link>
                        </Td>
                        <Td><span className="text-xs text-ink-2">{labelUnit(l.vehicleId)}</span></Td>
                        <Td><span className="text-xs text-ink-2">{l.salesPIC}</span></Td>
                        <Td><span className="text-2xs text-ink-2">{tanggalPendek(l.nextFollowUp!)}</span></Td>
                        <Td align="right">
                          <span className="tnum text-xs font-medium text-danger">{hari} hari</span>
                        </Td>
                        <Td align="right">
                          <Link
                            to={`/crm/${l.id}`}
                            aria-label={`Buka lead ${l.id}`}
                            className="inline-flex text-ink-3 hover:text-accent"
                          >
                            <AlertTriangle size={14} />
                          </Link>
                        </Td>
                      </Baris>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Panel>
        </div>

        <aside className="space-y-4 2xl:sticky 2xl:top-18 2xl:self-start">
          <Panel judul="Capaian target periode demo" keterangan={`Target tim ${total.target} unit`} padat>
            <ul className="divide-y divide-hairline">
              {tim.map((x) => (
                <li key={x.id} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-ink-2">{x.nama}</span>
                    <span className="tnum shrink-0 text-xs text-ink">
                      {x.unit}
                      <span className="text-ink-3"> / {x.target}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                      <span
                        className={`block h-full rounded-pill ${x.capaianTarget >= 1 ? 'bg-money-pos' : x.capaianTarget >= 0.5 ? 'bg-accent' : 'bg-attention'}`}
                        style={{ width: `${Math.min(100, Math.round((x.capaianTarget / capaianTerbesar) * 100))}%` }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right text-2xs text-ink-3">{persen(x.capaianTarget, 0)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
              Panjang batang menunjukkan capaian terhadap target masing-masing, jadi orang dengan target lebih besar
              tidak otomatis tampak lebih baik.
            </p>
          </Panel>

          <Panel judul="Distribusi lead aktif" keterangan="Beban kerja tiap sales hari ini" padat>
            <ul className="divide-y divide-hairline">
              {tim.map((x) => (
                <li key={x.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate text-xs text-ink-2">{x.nama}</span>
                  <span className="shrink-0 text-2xs text-ink-3">
                    <Angka nilai={x.aktif} ukuran="sm" nada="kuat" suffix="lead" />
                    {x.terlambat > 0 && <span className="ml-2 text-danger">{x.terlambat} terlambat</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
