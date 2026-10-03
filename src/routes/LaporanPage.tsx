import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { StatusPill } from '@/components/ui/StatusPill'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { STATUS_UNIT } from '@/lib/status'
import {
  agingInventori,
  bandingkanPeriode,
  marginPerKelas,
  marginPerMerek,
  perputaranStok,
  sumberLeadEfektif,
} from '@/data/agregat-laporan'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'

const WARNA_EMBER = ['bg-money-pos', 'bg-st-inspeksi', 'bg-attention', 'bg-danger']

function Delta({ nilai }: { nilai: number }) {
  const naik = nilai > 0.0001
  const turun = nilai < -0.0001
  const Ikon = naik ? ArrowUpRight : turun ? ArrowDownRight : Minus
  const angka = Math.abs(nilai * 100)
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-2xs font-medium ${
        naik ? 'text-money-pos' : turun ? 'text-danger' : 'text-ink-3'
      }`}
    >
      <Ikon size={12} />
      {nilai === 0 ? 'sama' : `${angka < 10 ? angka.toFixed(1).replace('.', ',') : angka.toFixed(0)}% ${naik ? 'naik' : 'turun'}`}
    </span>
  )
}

export function LaporanPage() {
  const aging = useMemo(() => agingInventori(), [])
  const putaran = useMemo(() => perputaranStok(), [])
  const perMerek = useMemo(() => marginPerMerek(), [])
  const perKelas = useMemo(() => marginPerKelas(), [])
  const perSumber = useMemo(() => sumberLeadEfektif(), [])
  const banding = useMemo(() => bandingkanPeriode(30), [])

  const modalTerbesar = Math.max(...aging.ember.map((e) => e.modal), 1)
  const leadTerbesar = Math.max(...perSumber.map((s) => s.lead), 1)

  return (
    <div className="space-y-4">
      <p className="mt-0 mb-1 rounded-control border border-hairline bg-sunken px-3 py-2 text-2xs leading-relaxed text-ink-3">
        Halaman ini <span className="text-ink-2">sengaja tanpa tombol tambah atau ubah</span>: laporan dibaca, bukan diisi. Angkanya dihitung dari data operasional di modul lain — termasuk perubahan yang Anda buat pada sesi demo ini, yang langsung ikut terhitung di sini.
      </p>
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Modal Terikat"
          nilai={<Money nilai={aging.modal} ukuran="xl" ringkas />}
          catatan={`${aging.unit} unit belum terjual`}
        />
        <SelRingkas
          label="Rata-rata Umur Stok"
          nilai={<Angka nilai={Math.round(aging.rataUmur)} ukuran="xl" suffix="hari" />}
          catatan={`Unit tertua ${aging.tertua[0]?.hariDiInventory ?? 0} hari`}
        />
        <SelRingkas
          label="Unit Menua (>90 hari)"
          nilai={<Angka nilai={aging.menua} ukuran="xl" nada={aging.menua ? 'perhatian' : 'kuat'} suffix="unit" />}
          catatan={aging.menua ? `${rupiahRingkas(aging.modalTertua)} pada 6 unit tertua` : 'Tidak ada unit menua'}
        />
        <SelRingkas
          label="Rata-rata Hari Terjual"
          nilai={<Angka nilai={Math.round(putaran.rataHariTerjual)} ukuran="xl" suffix="hari" />}
          catatan={`Tercepat ${putaran.rataHariTerjualTercepat} hari · terlama ${putaran.rataHariTerjualTerlama} hari`}
        />
        <SelRingkas
          label="Perputaran Stok"
          nilai={<Angka nilai={Number(putaran.putaranPerTahun.toFixed(2))} ukuran="xl" suffix="x / tahun" />}
          catatan={`${putaran.unitTerjual} unit terjual dalam ${putaran.periodeHari} hari`}
        />
      </StripRingkas>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Panel
            judul="Sebaran umur inventory"
            keterangan="Berapa lama modal tertahan pada tiap kelompok umur"
            padat
          >
            <Table minWidth={760}>
              <THead>
                <Th lebar={160}>Kelompok Umur</Th>
                <Th align="right" lebar={90}>Unit</Th>
                <Th lebar={220}>Proporsi Modal</Th>
                <Th align="right" lebar={160}>Modal</Th>
                <Th align="right" lebar={160}>Nilai Listing</Th>
              </THead>
              <tbody>
                {aging.ember.map((e, i) => (
                  <Baris key={e.label}>
                    <Td tebal>{e.label}</Td>
                    <Td align="right"><Angka nilai={e.unit} ukuran="sm" nada="kuat" /></Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                          <span
                            className={`block h-full rounded-pill ${WARNA_EMBER[i]}`}
                            style={{ width: `${Math.round((e.modal / modalTerbesar) * 100)}%` }}
                          />
                        </span>
                        <span className="w-12 shrink-0 text-right text-2xs text-ink-3">
                          {persen(e.modal / Math.max(1, aging.modal), 0)}
                        </span>
                      </span>
                    </Td>
                    <Td align="right"><Money nilai={e.modal} ukuran="sm" nada={i >= 2 ? 'perhatian' : 'kuat'} ringkas /></Td>
                    <Td align="right"><Money nilai={e.nilaiListing} ukuran="sm" nada="muted" ringkas /></Td>
                  </Baris>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline-strong bg-sunken">
                  <Td tebal>{aging.unit} unit belum terjual</Td>
                  <Td align="right" tebal><Angka nilai={aging.unit} ukuran="sm" nada="kuat" /></Td>
                  <Td />
                  <Td align="right" tebal><Money nilai={aging.modal} ukuran="sm" nada="kuat" /></Td>
                  <Td align="right" tebal><Money nilai={aging.nilaiListing} ukuran="sm" nada="muted" /></Td>
                </tr>
              </tfoot>
            </Table>
            <p className="flex items-start gap-2 border-t border-hairline px-4 py-3 text-2xs leading-relaxed text-ink-3">
              <Info size={13} className="mt-px shrink-0" />
              <span>
                Perputaran stok dihitung sebagai perkiraan: {putaran.unitTerjual} unit terjual dibagi rata-rata stok
                tersedia pada periode demo, disetahunkan. Angka ini untuk melihat kecenderungan, bukan laporan akuntansi.
              </span>
            </p>
          </Panel>

          <Panel
            judul="Unit paling lama di inventory"
            keterangan={`${aging.modalTertua > 0 ? rupiahRingkas(aging.modalTertua) : 'Rp0'} modal tertahan pada enam unit ini`}
            padat
          >
            <Table minWidth={880}>
              <THead>
                <Th lebar={240}>Unit</Th>
                <Th lebar={150}>Status</Th>
                <Th align="right" lebar={110}>Hari di Stok</Th>
                <Th className="hidden lg:table-cell" align="right" lebar={130}>Hari Sejak Siap</Th>
                <Th align="right" lebar={150}>Modal</Th>
                <Th align="right" lebar={150}>Harga Listing</Th>
              </THead>
              <tbody>
                {aging.tertua.map((v) => (
                  <Baris key={v.id}>
                    <Td>
                      <Link to={`/inventory/${v.id}`} className="group block min-w-0">
                        <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">
                          {v.brand} {v.model} {v.tahun}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <IdChip nilai={v.id} />
                          <span className="text-2xs text-ink-3">{v.nomorPolisi}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <StatusPill
                        label={STATUS_UNIT[v.status]?.label ?? v.status}
                        pil={STATUS_UNIT[v.status]?.halus ?? 'bg-sunken text-ink-2'}
                        dot={STATUS_UNIT[v.status]?.dot}
                        padat
                      />
                    </Td>
                    <Td align="right">
                      <span className={`tnum text-xs font-medium ${v.hariDiInventory > 90 ? 'text-danger' : 'text-ink-2'}`}>
                        {v.hariDiInventory}
                      </span>
                    </Td>
                    <Td align="right" className="hidden lg:table-cell">
                      <span className="tnum text-xs text-ink-2">{v.hariSejakSiap ?? '—'}</span>
                    </Td>
                    <Td align="right"><Money nilai={v.totalCost} ukuran="sm" nada="muted" ringkas /></Td>
                    <Td align="right"><Money nilai={v.listingPrice} ukuran="sm" nada="kuat" ringkas /></Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
            {aging.siapTapiLama.length > 0 && (
              <p className="border-t border-hairline px-4 py-3 text-2xs leading-relaxed text-ink-3">
                {aging.siapTapiLama.length} unit sudah berstatus READY tetapi lebih dari 60 hari belum terjual —
                kandidat pertama untuk peninjauan harga:{' '}
                {aging.siapTapiLama
                  .slice(0, 3)
                  .map((v) => `${v.brand} ${v.model} (${v.hariSejakSiap} hari)`)
                  .join(', ')}
                .
              </p>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel judul="Margin per merek" keterangan="Merek mana yang benar-benar menghasilkan laba" padat>
              <Table minWidth={0}>
                <THead>
                  <Th>Merek</Th>
                  <Th align="right">Unit</Th>
                  <Th align="right">Gross Profit</Th>
                  <Th align="right">Margin</Th>
                </THead>
                <tbody>
                  {perMerek.map((m) => (
                    <Baris key={m.label}>
                      <Td>
                        {m.label}
                        <span className="mt-0.5 block text-2xs text-ink-3">{rupiahRingkas(m.nilai)} nilai penjualan</span>
                      </Td>
                      <Td align="right"><Angka nilai={m.unit} ukuran="sm" nada="muted" /></Td>
                      <Td align="right"><Money nilai={m.grossProfit} ukuran="sm" nada={m.grossProfit >= 0 ? 'positif' : 'bahaya'} ringkas /></Td>
                      <Td align="right">
                        <span className={`tnum text-xs ${m.margin >= 0.06 ? 'text-money-pos' : m.margin >= 0 ? 'text-ink-2' : 'text-danger'}`}>
                          {persen(m.margin)}
                        </span>
                      </Td>
                    </Baris>
                  ))}
                </tbody>
              </Table>
            </Panel>

            <Panel judul="Margin per kelas unit" keterangan="Segmentasi berdasarkan kelas kendaraan" padat>
              <Table minWidth={0}>
                <THead>
                  <Th>Kelas</Th>
                  <Th align="right">Unit</Th>
                  <Th align="right">Rata-rata GP</Th>
                  <Th align="right">Margin</Th>
                </THead>
                <tbody>
                  {perKelas.map((k) => (
                    <Baris key={k.label}>
                      <Td>
                        {k.label}
                        <span className="mt-0.5 block text-2xs text-ink-3">{rupiahRingkas(k.nilai)} nilai penjualan</span>
                      </Td>
                      <Td align="right"><Angka nilai={k.unit} ukuran="sm" nada="muted" /></Td>
                      <Td align="right"><Money nilai={k.unit ? k.grossProfit / k.unit : 0} ukuran="sm" nada="kuat" ringkas /></Td>
                      <Td align="right">
                        <span className={`tnum text-xs ${k.margin >= 0.06 ? 'text-money-pos' : 'text-ink-2'}`}>{persen(k.margin)}</span>
                      </Td>
                    </Baris>
                  ))}
                </tbody>
              </Table>
            </Panel>
          </div>

          <Panel
            judul="Efektivitas sumber lead"
            keterangan="Sumber mana yang mendatangkan lead dan mana yang benar-benar jadi penjualan"
            padat
          >
            <Table minWidth={880}>
              <THead>
                <Th lebar={180}>Sumber Lead</Th>
                <Th lebar={200}>Volume Lead</Th>
                <Th align="right" lebar={90}>Aktif</Th>
                <Th align="right" lebar={90}>Won</Th>
                <Th align="right" lebar={90}>Lost</Th>
                <Th align="right" lebar={110}>Konversi</Th>
                <Th align="right" lebar={150}>Nilai Penjualan</Th>
                <Th align="right" lebar={140}>Gross Profit</Th>
              </THead>
              <tbody>
                {perSumber.map((s) => (
                  <Baris key={s.sumber}>
                    <Td tebal>{s.sumber}</Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                          <span className="block h-full rounded-pill bg-accent" style={{ width: `${Math.round((s.lead / leadTerbesar) * 100)}%` }} />
                        </span>
                        <span className="w-8 shrink-0 text-right text-2xs text-ink-3">{s.lead}</span>
                      </span>
                    </Td>
                    <Td align="right"><Angka nilai={s.aktif} ukuran="sm" nada="muted" /></Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${s.won ? 'text-money-pos' : 'text-ink-3'}`}>{s.won}</span>
                    </Td>
                    <Td align="right"><Angka nilai={s.lost} ukuran="sm" nada="muted" /></Td>
                    <Td align="right">
                      <span className={`tnum text-xs ${s.konversi >= 0.1 ? 'text-money-pos' : 'text-ink-2'}`}>
                        {persen(s.konversi, 0)}
                      </span>
                    </Td>
                    <Td align="right"><Money nilai={s.nilai} ukuran="sm" nada="kuat" ringkas /></Td>
                    <Td align="right"><Money nilai={s.grossProfit} ukuran="sm" nada="positif" ringkas /></Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
            <p className="border-t border-hairline px-4 py-3 text-2xs leading-relaxed text-ink-3">
              Nilai penjualan dilacak lewat rantai lead → booking → penjualan, jadi hanya lead yang tercatat di sistem
              yang bisa dihitung. Lead dari sumber yang tidak pernah ditanyakan saat masuk akan muncul dengan volume
              tinggi tetapi konversi rendah.
            </p>
          </Panel>
        </div>

        <aside className="space-y-4 2xl:sticky 2xl:top-18 2xl:self-start">
          <Panel judul={`Perbandingan ${banding.hari} hari terakhir`} keterangan="Dibanding periode sebelumnya" padat>
            <div className="divide-y divide-hairline">
              {(
                [
                  { label: 'Unit terjual', nilai: banding.kini.unit, lama: banding.sebelumnya.unit, delta: banding.delta.unit, uang: false },
                  { label: 'Nilai penjualan', nilai: banding.kini.nilai, lama: banding.sebelumnya.nilai, delta: banding.delta.nilai, uang: true },
                  { label: 'Gross profit', nilai: banding.kini.grossProfit, lama: banding.sebelumnya.grossProfit, delta: banding.delta.grossProfit, uang: true },
                  { label: 'Lead masuk', nilai: banding.kini.lead, lama: banding.sebelumnya.lead, delta: banding.delta.lead, uang: false },
                ] as const
              ).map((b) => (
                <div key={b.label} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xs text-ink-3">{b.label}</span>
                    <Delta nilai={b.delta} />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    {b.uang ? (
                      <>
                        <Money nilai={b.nilai} ukuran="sm" nada="kuat" ringkas />
                        <span className="text-2xs text-ink-3">sebelumnya {rupiahRingkas(b.lama)}</span>
                      </>
                    ) : (
                      <>
                        <Angka nilai={b.nilai} ukuran="sm" nada="kuat" suffix={b.label === 'Lead masuk' ? 'lead' : 'unit'} />
                        <span className="text-2xs text-ink-3">sebelumnya {b.lama}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
              {tanggalPendek(banding.dari)} sampai {tanggalPendek(banding.sampai)} dibanding{' '}
              {tanggalPendek(banding.dariSebelumnya)} sampai {tanggalPendek(banding.sampaiSebelumnya)}. Volume pada demo
              ini kecil, jadi persentase mudah terlihat besar tanpa arti.
            </p>
          </Panel>

          <Panel judul="Yang perlu ditindak" keterangan="Ringkas dari notifikasi hari ini" padat>
            <ul className="divide-y divide-hairline">
              {aging.menua > 0 && (
                <li className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="text-2xs text-ink-2">Unit menua &gt; 90 hari</span>
                  <Angka nilai={aging.menua} ukuran="sm" nada="perhatian" suffix="unit" />
                </li>
              )}
              <li className="flex items-start justify-between gap-3 px-4 py-2.5">
                <span className="text-2xs text-ink-2">Modal tertahan pada unit menua</span>
                <Money nilai={aging.modalTertua} ukuran="sm" nada="perhatian" ringkas />
              </li>
              <li className="flex items-start justify-between gap-3 px-4 py-2.5">
                <span className="text-2xs text-ink-2">Siap dijual tapi belum laku &gt; 60 hari</span>
                <Angka nilai={aging.siapTapiLama.length} ukuran="sm" nada="kuat" suffix="unit" />
              </li>
            </ul>
            <div className="border-t border-hairline px-4 py-2.5">
              <Link to="/performa" className="text-2xs font-medium text-accent hover:underline">
                Lihat performa sales periode demo →
              </Link>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
