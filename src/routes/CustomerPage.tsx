import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Pencil, Plus, Search, X } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Money, Angka } from '@/components/ui/Money'
import { IdChip } from '@/components/ui/IdChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { SelRingkas, StripRingkas } from '@/components/ui/SelRingkas'
import { FilterChip } from '@/components/ui/FilterChip'
import { Baris, Table, Td, Th, THead } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { STATUS_LEAD } from '@/lib/status'
import { dataset } from '@/data'
import { daftarCustomer, ringkasanCustomer } from '@/data/agregat-lead'
import { rupiahRingkas, tanggalPendek } from '@/lib/format'
import { FormCustomer } from '@/components/app/FormCustomer'
import type { Customer } from '@/data/types'

export function CustomerPage() {
  const [params, setParams] = useSearchParams()
  const [formCustomer, setFormCustomer] = useState<{ terbuka: boolean; customer?: Customer }>({ terbuka: false })
  const q = params.get('q') ?? ''
  const sumber = params.get('sumber') ?? 'SEMUA'
  const transaksi = params.get('transaksi') ?? 'SEMUA'

  const atur = (kunci: string, nilai: string) => {
    const berikut = new URLSearchParams(params)
    if (!nilai || nilai === 'SEMUA') berikut.delete(kunci)
    else berikut.set(kunci, nilai)
    setParams(berikut, { replace: true })
  }

  const ringkas = useMemo(() => ringkasanCustomer(), [])
  const semua = useMemo(() => daftarCustomer(), [])

  const terfilter = useMemo(() => {
    const kata = q.trim().toLowerCase()
    return semua
      .filter((c) => sumber === 'SEMUA' || c.sumberLead === sumber)
      .filter((c) => (transaksi === 'ADA' ? c.jumlahTransaksi > 0 : transaksi === 'BELUM' ? c.jumlahTransaksi === 0 : true))
      .filter((c) => {
        if (!kata) return true
        const kolom = [c.id, c.nama, c.telepon, c.email, c.kota, c.salesPIC]
        return kolom.some((k) => k.toLowerCase().includes(kata))
      })
      .sort((a, b) => (a.sejak < b.sejak ? 1 : -1))
  }, [q, sumber, transaksi, semua])

  const nilaiTransaksi = terfilter.reduce((s, c) => s + c.nilaiTransaksi, 0)
  const adaFilter = q !== '' || sumber !== 'SEMUA' || transaksi !== 'SEMUA'

  return (
    <div className="space-y-4">
      <StripRingkas kolom={4}>
        <SelRingkas label="Total Customer" nilai={<Angka nilai={ringkas.total} ukuran="xl" />} catatan={`Dari ${ringkas.sumberUnik} sumber lead berbeda`} />
        <SelRingkas
          label="Sudah Transaksi"
          nilai={<Angka nilai={semua.filter((c) => c.jumlahTransaksi > 0).length} ukuran="xl" nada="positif" />}
          catatan={`${semua.filter((c) => c.jumlahTransaksi === 0).length} masih dalam proses`}
        />
        <SelRingkas label="Nilai Transaksi" nilai={<Money nilai={semua.reduce((s, c) => s + c.nilaiTransaksi, 0)} ukuran="xl" ringkas />} catatan="Dari pelanggan pada data demo" />
        <SelRingkas
          label="Rata-rata Lead per Customer"
          nilai={<Angka nilai={Number((semua.reduce((s, c) => s + c.jumlahLead, 0) / Math.max(1, semua.length)).toFixed(1))} ukuran="xl" />}
          catatan="Menunjukkan customer yang membandingkan beberapa unit"
        />
      </StripRingkas>

      <div className="flex flex-wrap items-center gap-2 border border-hairline bg-panel rounded-panel px-3 py-2.5">
        <label className="relative flex h-7 min-w-56 flex-1 items-center md:max-w-72">
          <Search size={14} className="pointer-events-none absolute left-2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari nama, telepon, email, atau kota…"
            aria-label="Cari customer"
            className="h-7 w-full rounded-control border border-hairline-strong bg-panel pl-7 pr-2 text-xs text-ink placeholder:text-ink-3 hover:bg-sunken focus-visible:bg-panel"
          />
        </label>

        <Button variant="primary" size="sm" ikon={<Plus size={13} />} onClick={() => setFormCustomer({ terbuka: true })}>
          Tambah customer
        </Button>

        {formCustomer.terbuka && (
          <FormCustomer terbuka customer={formCustomer.customer} onTutup={() => setFormCustomer({ terbuka: false })} />
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip aktif={transaksi === 'SEMUA'} onClick={() => atur('transaksi', 'SEMUA')} jumlah={semua.length}>
            Semua customer
          </FilterChip>
          <FilterChip
            aktif={transaksi === 'ADA'}
            onClick={() => atur('transaksi', 'ADA')}
            jumlah={semua.filter((c) => c.jumlahTransaksi > 0).length}
          >
            Sudah transaksi
          </FilterChip>
          <FilterChip
            aktif={transaksi === 'BELUM'}
            onClick={() => atur('transaksi', 'BELUM')}
            jumlah={semua.filter((c) => c.jumlahTransaksi === 0).length}
          >
            Masih proses
          </FilterChip>
        </div>

        <div className="ml-auto flex items-center gap-2">
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

          {adaFilter && (
            <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })} ikon={<X size={13} />}>
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      <Panel
        judul={`${terfilter.length} customer`}
        keterangan="Klik customer untuk melihat riwayat lead, interaksi, dan transaksinya"
        padat
        aksi={<span className="text-2xs text-ink-3">Nilai transaksi {rupiahRingkas(nilaiTransaksi)}</span>}
      >
        {terfilter.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-ink-3">Tidak ada customer yang cocok dengan filter ini.</p>
        ) : (
          <Table minWidth={940}>
            <THead>
              <Th lebar={220}>Customer</Th>
              <Th lebar={190}>Kontak</Th>
              <Th className="hidden lg:table-cell" lebar={140}>Kota</Th>
              <Th lebar={130}>Sumber</Th>
              <Th className="hidden xl:table-cell" lebar={140}>Sales PIC</Th>
              <Th align="right" lebar={90}>Lead</Th>
              <Th align="right" lebar={160}>Transaksi</Th>
              <Th align="right" className="hidden 2xl:table-cell" lebar={110}>Sejak</Th>
              <Th lebar={36} />
            </THead>
            <tbody>
              {terfilter.map((c) => (
                <Baris key={c.id}>
                  <Td>
                    <Link to={`/customer/${c.id}`} className="group block min-w-0">
                      <span className="block truncate text-xs font-medium text-ink group-hover:text-accent">{c.nama}</span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-2">
                        <IdChip nilai={c.id} />
                        <span className="truncate text-2xs text-ink-3">{c.pekerjaan}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <span className="block text-xs text-ink-2">{c.telepon}</span>
                    <span className="mt-0.5 block truncate text-2xs text-ink-3">{c.email}</span>
                  </Td>
                  <Td className="hidden lg:table-cell">{c.kota}</Td>
                  <Td>{c.sumberLead}</Td>
                  <Td className="hidden xl:table-cell"><span className="text-2xs text-ink-2">{c.salesPIC}</span></Td>
                  <Td align="right">
                    <Angka nilai={c.jumlahLead} ukuran="sm" nada="kuat" />
                    {c.leadTerakhir && (
                      <span className="mt-0.5 block">
                        <StatusPill
                          label={STATUS_LEAD[c.leadTerakhir.status].label}
                          pil={STATUS_LEAD[c.leadTerakhir.status].halus}
                          dot={STATUS_LEAD[c.leadTerakhir.status].dot}
                          padat
                        />
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    {c.jumlahTransaksi > 0 ? (
                      <>
                        <Money nilai={c.nilaiTransaksi} ukuran="sm" nada="kuat" />
                        <span className="mt-0.5 block text-2xs text-money-pos">
                          laba {rupiahRingkas(c.labaTransaksi)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xs text-ink-3">belum ada</span>
                    )}
                  </Td>
                  <Td align="right" className="hidden 2xl:table-cell"><span className="text-2xs text-ink-2">{tanggalPendek(c.sejak)}</span></Td>
                  <Td align="right">
                    <span className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const asli = dataset.customers.find((x) => x.id === c.id)
                          if (asli) setFormCustomer({ terbuka: true, customer: asli })
                        }}
                        aria-label={`Ubah customer ${c.id}`}
                        title="Ubah data customer"
                        className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent"
                      >
                        <Pencil size={14} />
                      </button>
                      <Link to={`/customer/${c.id}`} aria-label={`Buka customer ${c.id}`} className="inline-flex rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-accent">
                        <ChevronRight size={15} />
                      </Link>
                    </span>
                  </Td>
                </Baris>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <p className="flex items-center gap-2 px-1 text-2xs text-ink-3">
        <Search size={12} />
        Customer dibuat otomatis saat sebuah lead masuk tahap test drive, sehingga daftar ini konsisten dengan pipeline
        di halaman CRM.
      </p>
    </div>
  )
}
