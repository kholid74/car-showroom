import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { dataset } from '@/data'
import { biayaPerBulan, biayaPerKategori, ringkasanBiaya } from '@/data/agregat-keuangan'
import { persen, rupiahRingkas, tanggalPendek } from '@/lib/format'

export function BiayaPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const kategori = params.get('kategori') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanBiaya(), [])
  const perKategori = useMemo(() => biayaPerKategori(), [])
  const perBulan = useMemo(() => biayaPerBulan(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return dataset.expenses
      .filter((e) => kategori === 'SEMUA' || e.kategori === kategori)
      .filter((e) => {
        if (!kata) return true
        const kolom = [e.id, e.item, e.vendor, e.pic, e.metode, e.kategori]
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
  }, [q, kategori])

  const adaFilter = q !== '' || kategori !== 'SEMUA'
  const totalTerfilter = terfilter.reduce((s, e) => s + e.jumlah, 0)

  return (
    <div className="space-y-4">
      <StripRingkas kolom={5}>
        <SelRingkas
          label="Total Biaya 6 Bulan"
          nilai={<Money nilai={ringkas.total} ukuran="xl" ringkas />}
          catatan={`${ringkas.jumlah} transaksi biaya tercatat`}
        />
        <SelRingkas
          label="Rata-rata per Bulan"
          nilai={<Money nilai={ringkas.rataPerBulan} ukuran="xl" ringkas />}
          catatan={`${ringkas.bulanTercatat} bulan tercatat`}
        />
        <SelRingkas
          label="Kategori Terbesar"
          nilai={<span className="text-lg font-semibold tracking-tight text-ink">{ringkas.kategoriTerbesar?.kategori ?? '—'}</span>}
          catatan={
            ringkas.kategoriTerbesar
              ? `${rupiahRingkas(ringkas.kategoriTerbesar.jumlah)} · ${persen(ringkas.kategoriTerbesar.jumlah / Math.max(1, ringkas.total), 0)} dari total`
              : 'Belum ada data'
          }
        />
        <SelRingkas
          label="Biaya Terbesar"
          nilai={<Money nilai={ringkas.terbesar?.jumlah ?? 0} ukuran="xl" ringkas nada="perhatian" />}
          catatan={ringkas.terbesar ? `${ringkas.terbesar.item} · ${tanggalPendek(ringkas.terbesar.tanggal)}` : '—'}
        />
        <SelRingkas
          label="Rasio ke Gross Profit"
          nilai={
            <Angka
              nilai={Number(
                (
                  (ringkas.total / Math.max(1, dataset.sales.reduce((s, x) => s + x.grossProfit, 0))) *
                  100
                ).toFixed(0),
              )}
              ukuran="xl"
              suffix="%"
            />
          }
          catatan="Beban operasional dibanding laba kotor unit terjual"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari item, vendor, atau PIC…"
            aria-label="Cari biaya"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={kategori === 'SEMUA'} onClick={() => atur('kategori', 'SEMUA')} jumlah={ringkas.jumlah}>
            Semua kategori
          </FilterChip>
          {perKategori.map((k) => (
            <FilterChip
              key={k.kategori}
              aktif={kategori === k.kategori}
              onClick={() => atur('kategori', k.kategori)}
              jumlah={k.transaksi}
            >
              {k.kategori}
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
          judul={`${terfilter.length} transaksi biaya`}
          keterangan="Diurutkan dari yang terbaru"
          padat
          aksi={<span className="text-2xs text-ink-3">Total pada saringan ini {rupiahRingkas(totalTerfilter)}</span>}
        >
          {terfilter.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada biaya yang cocok dengan filter ini.</p>
          ) : (
            <Table minWidth={920}>
              <THead>
                <Th lebar={110}>Tanggal</Th>
                <Th lebar={150}>Kategori</Th>
                <Th lebar={250}>Item</Th>
                <Th className="hidden lg:table-cell" lebar={200}>Vendor</Th>
                <Th className="hidden xl:table-cell" lebar={140}>Metode</Th>
                <Th className="hidden xl:table-cell" lebar={130}>PIC</Th>
                <Th align="right" lebar={140}>Jumlah</Th>
              </THead>
              <tbody>
                {terfilter.map((e) => (
                  <Baris key={e.id}>
                    <Td>
                      <span className="text-2xs text-ink-2">{tanggalPendek(e.tanggal)}</span>
                      <span className="mt-0.5 block">
                        <span className="id-chip text-ink-3">{e.id}</span>
                      </span>
                    </Td>
                    <Td>{e.kategori}</Td>
                    <Td>
                      <span className="text-xs text-ink-2">{e.item}</span>
                    </Td>
                    <Td className="hidden lg:table-cell"><span className="text-2xs text-ink-2">{e.vendor}</span></Td>
                    <Td className="hidden xl:table-cell"><span className="text-2xs text-ink-2">{e.metode}</span></Td>
                    <Td className="hidden xl:table-cell"><span className="text-2xs text-ink-2">{e.pic}</span></Td>
                    <Td align="right"><Money nilai={e.jumlah} ukuran="sm" /></Td>
                  </Baris>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-hairline-strong bg-sunken">
                  <Td tebal>{terfilter.length} transaksi</Td>
                  <Td />
                  <Td />
                  <Td className="hidden lg:table-cell" />
                  <Td className="hidden xl:table-cell" />
                  <Td className="hidden xl:table-cell" />
                  <Td align="right" tebal><Money nilai={totalTerfilter} ukuran="sm" nada="kuat" /></Td>
                </tr>
              </tfoot>
            </Table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel judul="Biaya per kategori" keterangan="Proporsi tiap kategori terhadap total" padat>
            <ul className="divide-y divide-hairline">
              {perKategori.map((k) => (
                <li key={k.kategori} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-ink-2">{k.kategori}</span>
                    <Money nilai={k.jumlah} ukuran="sm" nada="kuat" />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-sunken">
                      <span
                        className="block h-full rounded-pill bg-accent"
                        style={{ width: `${Math.round((k.jumlah / Math.max(1, ringkas.total)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-24 shrink-0 text-right text-2xs text-ink-3">
                      {persen(k.jumlah / Math.max(1, ringkas.total), 0)} · {k.transaksi} trx
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel judul="Biaya per bulan" keterangan="Enam bulan terakhir" padat>
            <Table minWidth={0}>
              <THead>
                <Th>Bulan</Th>
                <Th align="right">Trx</Th>
                <Th align="right">Total</Th>
              </THead>
              <tbody>
                {perBulan.map((b) => (
                  <Baris key={b.bulan}>
                    <Td>
                      {b.label}
                      <span className="mt-0.5 block text-2xs text-ink-3">
                        {b.perKategori
                          .sort((x, y) => y.jumlah - x.jumlah)
                          .slice(0, 2)
                          .map((k) => k.kategori)
                          .join(' · ')}
                      </span>
                    </Td>
                    <Td align="right"><Angka nilai={b.jumlah} ukuran="sm" nada="muted" /></Td>
                    <Td align="right"><Money nilai={b.total} ukuran="sm" nada="kuat" ringkas /></Td>
                  </Baris>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>
      </div>
    </div>
  )
}
