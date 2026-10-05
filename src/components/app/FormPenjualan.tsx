import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan, TeksPanjang } from '@/components/ui/Formulir'
import { dataset, DEMO_TODAY } from '@/data'
import { useSesi } from '@/store/sesi'
import { rupiah } from '@/lib/format'
import type { Booking, TipePembayaran, Vehicle } from '@/data/types'

/**
 * Catat penjualan dari unit yang sudah dibooking atau berstatus siap.
 * Efeknya bukan cuma satu baris baru: unit menjadi TERJUAL, booking-nya ditutup, dan angka
 * Penjualan, Finance, Laporan, serta Dashboard ikut berubah karena semuanya membaca satu sumber.
 */
export function FormPenjualan({
  terbuka,
  onTutup,
  unit,
  booking,
}: {
  terbuka: boolean
  onTutup: () => void
  unit: Vehicle
  booking?: Booking
}) {
  const catatPenjualan = useSesi((s) => s.catatPenjualan)
  const [hasil, setHasil] = useState<{ id: string; profit: number; sisa: number } | null>(null)

  const [f, setF] = useState(() => ({
    tanggal: DEMO_TODAY,
    customerId: booking?.customerId ?? dataset.customers[0]?.id ?? '',
    namaBaru: booking?.customerNama ?? '',
    pakaiCustomerBaru: Boolean(booking && !booking.customerId),
    salesPIC: booking?.salesPIC ?? unit.salesPIC,
    final: String(booking ? booking.dp + booking.sisaPembayaran : unit.listingPrice),
    dp: String(booking?.dp ?? 0),
    bayar: (booking?.tipePembayaran ?? 'Kredit') as TipePembayaran,
    finance: dataset.financePartners[0] ?? 'Adira Finance',
    tenor: '36',
    catatan: '',
  }))
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (kunci: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [kunci]: e.target.value }))
  const ubahCentang = (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, pakaiCustomerBaru: e.target.checked }))

  const angka = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0
  const hitung = useMemo(() => {
    const final = angka(f.final)
    const dp = angka(f.dp)
    const diskon = Math.max(0, unit.listingPrice - final)
    const sisa = Math.max(0, final - dp)
    const tenor = Number(f.tenor) || 0
    const cicilan = f.bayar === 'Kredit' && tenor > 0 ? Math.round(sisa / tenor) : 0
    return { final, dp, diskon, sisa, cicilan, profit: final - unit.totalCost }
  }, [f.final, f.dp, f.bayar, f.tenor, unit.listingPrice, unit.totalCost])

  const simpan = () => {
    const masalah: string[] = []
    if (hitung.final < 10_000_000) masalah.push('Harga jual final minimal Rp10 juta.')
    if (hitung.final > unit.listingPrice) masalah.push('Harga jual tidak boleh melebihi harga listing.')
    if (hitung.dp < 0) masalah.push('DP tidak boleh negatif.')
    if (hitung.dp > hitung.final) masalah.push('DP tidak boleh melebihi harga jual.')
    if (f.bayar === 'Kredit' && !f.finance) masalah.push('Pilih mitra pembiayaan untuk transaksi kredit.')
    if (f.bayar === 'Kredit' && (Number(f.tenor) < 12 || Number(f.tenor) > 72)) masalah.push('Tenor kredit antara 12 dan 72 bulan.')
    if (f.pakaiCustomerBaru && f.namaBaru.trim().length < 2) masalah.push('Nama pembeli baru minimal 2 huruf.')
    if (f.tanggal < '2026-01-01' || f.tanggal > DEMO_TODAY) masalah.push(`Tanggal transaksi harus antara awal 2026 dan ${DEMO_TODAY}.`)
    setGalat(masalah)
    if (masalah.length) return

    const customer = dataset.customers.find((c) => c.id === f.customerId)
    const namaPembeli = f.pakaiCustomerBaru ? f.namaBaru.trim() : (customer?.nama ?? 'Pembeli demo')
    const penjualan = catatPenjualan({
      vehicleId: unit.id,
      vehicleLabel: `${unit.brand} ${unit.model} ${unit.tahun}`,
      customerId: f.pakaiCustomerBaru ? '' : f.customerId,
      customerNama: namaPembeli,
      salesPIC: f.salesPIC,
      tanggal: f.tanggal,
      listingPrice: unit.listingPrice,
      finalPrice: hitung.final,
      diskon: hitung.diskon,
      tipePembayaran: f.bayar,
      dp: hitung.dp,
      financePartner: f.bayar === 'Kredit' ? f.finance : null,
      tenor: f.bayar === 'Kredit' ? Number(f.tenor) : null,
      estimasiCicilan: f.bayar === 'Kredit' ? hitung.cicilan : null,
      totalModal: unit.totalCost,
      bookingId: booking?.id ?? '',
      catatan: f.catatan,
    })
    setHasil({ id: penjualan.id, profit: penjualan.grossProfit, sisa: penjualan.sisaPembayaran })
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={hasil ? 'Penjualan tercatat' : `Catat penjualan · ${unit.id}`}
      keterangan={
        hasil
          ? undefined
          : `${unit.brand} ${unit.model} ${unit.tahun} · modal ${rupiah(unit.totalCost)} · listing ${rupiah(unit.listingPrice)}`
      }
      lebar="max-w-2xl"
      catatanBawah="Transaksi demo: dicatat pada sesi tab ini. Perhatikan Dashboard, Finance, dan Laporan ikut berubah."
    >
      {hasil ? (
        <div className="px-4 py-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-money-pos">
            <CheckCircle2 size={15} />
            Invoice <span className="id-chip text-ink">{hasil.id}</span> tercatat
          </p>
          <ul className="mt-3 space-y-1.5 text-2xs leading-relaxed text-ink-2">
            <li>· Unit {unit.id} berstatus <span className="font-medium text-ink">TERJUAL</span>, stok tersedia berkurang satu.</li>
            <li>· Laba kotor transaksi <span className="font-medium text-ink">{rupiah(hasil.profit)}</span>; sisa tagihan {rupiah(hasil.sisa)}.</li>
            <li>· Angka di Penjualan, Finance, Laporan, dan Dashboard sudah menyesuaikan — semuanya membaca sumber data yang sama.</li>
            {booking && <li>· Booking {booking.id} ditutup karena unitnya sudah terjual.</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onTutup}>
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        <>
          <BadanDialog>
            <Kolom label="Tanggal transaksi" lebar="separuh" galat={galat.find((g) => g.includes('Tanggal'))}>
              <Masukan value={f.tanggal} onChange={ubah('tanggal')} type="date" />
            </Kolom>
            <Kolom label="Sales penutup" lebar="separuh">
              <Pilihan value={f.salesPIC} onChange={ubah('salesPIC')} aria-label="Sales penutup">
                {dataset.salesTeam.map((s) => (
                  <option key={s.id} value={s.nama}>{s.nama}</option>
                ))}
              </Pilihan>
            </Kolom>

            <div className="col-span-2 flex flex-wrap items-center gap-2 rounded-control border border-hairline bg-sunken px-3 py-2">
              <label className="flex items-center gap-2 text-2xs text-ink-2">
                <input type="checkbox" checked={f.pakaiCustomerBaru} onChange={ubahCentang} className="h-3.5 w-3.5" />
                Pembeli belum ada di data customer
              </label>
            </div>

            {f.pakaiCustomerBaru ? (
              <Kolom label="Nama pembeli" galat={galat.find((g) => g.includes('Nama pembeli'))}>
                <Masukan value={f.namaBaru} onChange={ubah('namaBaru')} placeholder="Nama sesuai KTP" />
              </Kolom>
            ) : (
              <Kolom label="Pembeli">
                <Pilihan value={f.customerId} onChange={ubah('customerId')} aria-label="Pembeli">
                  {dataset.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} · {c.kota}
                    </option>
                  ))}
                </Pilihan>
              </Kolom>
            )}

            <Kolom label="Harga jual final (Rp)" lebar="separuh" galat={galat.find((g) => g.includes('Harga jual'))}>
              <Masukan value={f.final} onChange={ubah('final')} inputMode="numeric" />
            </Kolom>
            <Kolom label="DP diterima (Rp)" lebar="separuh" galat={galat.find((g) => g.includes('DP'))}>
              <Masukan value={f.dp} onChange={ubah('dp')} inputMode="numeric" />
            </Kolom>
            <Kolom label="Tipe pembayaran" lebar="separuh">
              <Pilihan value={f.bayar} onChange={ubah('bayar')} aria-label="Tipe pembayaran">
                <option value="Cash">Tunai (Cash)</option>
                <option value="Kredit">Kredit</option>
              </Pilihan>
            </Kolom>
            {f.bayar === 'Kredit' && (
              <>
                <Kolom label="Mitra pembiayaan" lebar="separuh" galat={galat.find((g) => g.includes('pembiayaan'))}>
                  <Pilihan value={f.finance} onChange={ubah('finance')} aria-label="Mitra pembiayaan">
                    {dataset.financePartners.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Pilihan>
                </Kolom>
                <Kolom label="Tenor (bulan)" lebar="separuh" galat={galat.find((g) => g.includes('Tenor'))}>
                  <Masukan value={f.tenor} onChange={ubah('tenor')} inputMode="numeric" />
                </Kolom>
              </>
            )}
            <Kolom label="Catatan transaksi" lebar={f.bayar === 'Kredit' ? 'separuh' : 'penuh'}>
              <TeksPanjang value={f.catatan} onChange={ubah('catatan')} rows={2} placeholder="Contoh: serah terima Sabtu, STNK menyusul." />
            </Kolom>

            <div className="col-span-2 rounded-control border border-hairline bg-sunken px-3 py-2.5">
              <p className="text-2xs text-ink-2">
                Diskon <span className="tnum font-medium text-ink">{rupiah(hitung.diskon)}</span> · sisa tagihan{' '}
                <span className="tnum font-medium text-ink">{rupiah(hitung.sisa)}</span> · laba kotor{' '}
                <span className={`tnum font-medium ${hitung.profit >= 0 ? 'text-money-pos' : 'text-danger'}`}>
                  {rupiah(hitung.profit)}
                </span>
                {f.bayar === 'Kredit' && hitung.cicilan > 0 && (
                  <>
                    {' '}· estimasi cicilan <span className="tnum font-medium text-ink">{rupiah(hitung.cicilan)}</span>/bulan
                  </>
                )}
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-3">
                Status pembayaran ditentukan otomatis: sisa nol berarti lunas, sisanya dibayar sebagian.
              </p>
            </div>

            <DaftarGalat galat={galat} />
          </BadanDialog>

          <AksiDialog>
            <Button variant="ghost" onClick={onTutup}>
              Batal
            </Button>
            <Button variant="primary" onClick={simpan}>
              Catat penjualan
            </Button>
          </AksiDialog>
        </>
      )}
    </Dialog>
  )
}
