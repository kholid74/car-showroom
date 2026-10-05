import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { dataset, DEMO_TODAY } from '@/data'
import { useSesi } from '@/store/sesi'
import { rupiahRingkas } from '@/lib/format'
import type { Booking, Lead, TipePembayaran, Vehicle } from '@/data/types'

const rupiah = (n: number) => n.toLocaleString('id-ID')
const geser = (tanggal: string, hari: number) => {
  const d = new Date(tanggal + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + hari)
  return d.toISOString().slice(0, 10)
}

/**
 * Buat booking baru atau ubah DP booking yang sudah ada.
 * Booking mengunci unit keluar dari stok siap jual — karena itu unit wajib berstatus Ready.
 */
export function FormBooking({
  terbuka,
  onTutup,
  booking,
  unitAwal,
  leadAwal,
}: {
  terbuka: boolean
  onTutup: () => void
  booking?: Booking
  unitAwal?: Vehicle
  leadAwal?: Lead
}) {
  const buatBooking = useSesi((s) => s.buatBooking)
  const ubahDataBooking = useSesi((s) => s.ubahDataBooking)
  const batalkanBooking = useSesi((s) => s.batalkanBooking)

  const unitUntukBooking = useMemo(
    () => dataset.vehicles.filter((v) => v.status === 'READY'),
    [],
  )
  const unitEfektif = booking
    ? dataset.vehicles.find((v) => v.id === booking.vehicleId)
    : (unitAwal ?? unitUntukBooking[0])

  const [isi, setIsi] = useState({
    vehicleId: unitEfektif?.id ?? '',
    leadId: leadAwal?.id ?? booking?.leadId ?? '',
    customerNama: booking?.customerNama ?? leadAwal?.nama ?? '',
    salesPIC: booking?.salesPIC ?? leadAwal?.salesPIC ?? dataset.salesTeam[0]?.nama ?? '',
    tanggalBooking: booking?.tanggalBooking ?? DEMO_TODAY,
    kadaluarsa: booking?.kadaluarsa ?? geser(DEMO_TODAY, 7),
    kesepakatan: String(booking ? booking.dp + booking.sisaPembayaran : (unitEfektif?.listingPrice ?? 0)),
    dp: booking ? String(booking.dp) : '',
    tipePembayaran: (booking?.tipePembayaran ?? 'Cash') as TipePembayaran,
    catatan: booking?.catatan ?? '',
  })
  const [galat, setGalat] = useState<string[]>([])
  const [konfirmasiBatal, setKonfirmasiBatal] = useState(false)

  const ubah = (k: keyof typeof isi, v: string) => setIsi((s) => ({ ...s, [k]: v }))
  const unit = dataset.vehicles.find((v) => v.id === isi.vehicleId)
  const kesepakatan = Number(isi.kesepakatan) || 0
  const dp = Number(isi.dp) || 0
  const sisa = Math.max(0, kesepakatan - dp)

  const simpan = () => {
    const g: string[] = []
    if (!isi.vehicleId) g.push('Unit wajib dipilih.')
    if (isi.customerNama.trim().length < 3) g.push('Nama pemesan minimal 3 karakter.')
    if (kesepakatan <= 0) g.push('Harga kesepakatan wajib diisi.')
    if (dp < 0) g.push('DP tidak boleh negatif.')
    if (dp > kesepakatan) g.push('DP tidak boleh melebihi harga kesepakatan.')
    if (isi.kadaluarsa <= isi.tanggalBooking) g.push('Tanggal kadaluarsa harus setelah tanggal booking.')
    setGalat(g)
    if (g.length) return

    if (booking) {
      ubahDataBooking(
        booking.id,
        {
          dp,
          sisaPembayaran: sisa,
          statusPembayaran: dp === 0 ? 'MENUNGGU PEMBAYARAN' : dp >= kesepakatan ? 'LUNAS' : 'DP DIBAYAR',
          kadaluarsa: isi.kadaluarsa,
          catatan: isi.catatan.trim() || booking.catatan,
        },
        `${booking.customerNama} · DP ${rupiah(booking.dp)} → ${rupiah(dp)}`,
      )
    } else {
      buatBooking({
        vehicleId: isi.vehicleId,
        vehicleLabel: unit ? `${unit.brand} ${unit.model} ${unit.tahun}` : isi.vehicleId,
        leadId: isi.leadId || null,
        customerId: dataset.leads.find(l => l.id === isi.leadId)?.customerId ?? null,
        customerNama: isi.customerNama.trim(),
        salesPIC: isi.salesPIC,
        tanggalBooking: isi.tanggalBooking,
        kadaluarsa: isi.kadaluarsa,
        dp,
        hargaKesepakatan: kesepakatan,
        tipePembayaran: isi.tipePembayaran,
        catatan: isi.catatan.trim(),
      })
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={booking ? `Ubah booking · ${booking.id}` : 'Buat booking unit'}
      keterangan={
        booking
          ? 'Mengubah DP akan menghitung ulang sisa pembayaran dan status pembayaran booking.'
          : 'Unit yang dibooking otomatis keluar dari stok siap jual sampai transaksinya dicatat atau bookingnya dibatalkan.'
      }
      lebar="max-w-2xl"
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />

        <Kolom
          label="Unit"
          petunjuk={unit ? `${unit.id} · ${unit.brand} ${unit.model} ${unit.tahun} · listing ${rupiahRingkas(unit.listingPrice)}` : 'hanya unit berstatus Ready'}
        >
          <Pilihan value={isi.vehicleId} onChange={(e) => { const v = dataset.vehicles.find(v => v.id === e.target.value); setIsi(s => ({ ...s, vehicleId: e.target.value, leadId: '', customerNama: '', kesepakatan: String(v?.listingPrice ?? 0) })) }} disabled={Boolean(booking)}>
            {unitEfektif && !unitUntukBooking.some((v) => v.id === unitEfektif.id) && (
              <option value={unitEfektif.id}>
                {unitEfektif.id} · {unitEfektif.brand} {unitEfektif.model} ({unitEfektif.status})
              </option>
            )}
            {unitUntukBooking.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} · {v.brand} {v.model} {v.tahun} · {rupiahRingkas(v.listingPrice)}
              </option>
            ))}
          </Pilihan>
        </Kolom>

        <div className="col-span-2 space-y-3">
          {!booking && <Kolom label="Hubungkan dengan lead"><Pilihan value={isi.leadId} onChange={e => {
            const l = dataset.leads.find(l => l.id === e.target.value)
            setIsi(s => ({ ...s, leadId: e.target.value, customerNama: l?.nama ?? '', salesPIC: l?.salesPIC ?? s.salesPIC, tipePembayaran: l?.preferensiPembayaran ?? s.tipePembayaran }))
          }}><option value="">Pemesan baru / tanpa lead</option>{dataset.leads.filter(l => l.vehicleId === isi.vehicleId && !['WON', 'LOST'].includes(l.status)).map(l => <option key={l.id} value={l.id}>{l.nama} · {l.id}</option>)}</Pilihan></Kolom>}
          <Kolom label="Nama pemesan">
            <Masukan value={isi.customerNama} onChange={(e) => ubah('customerNama', e.target.value)} placeholder="Nama lengkap" disabled={Boolean(booking)} />
          </Kolom>
          <Kolom label="Sales PIC">
            <Pilihan value={isi.salesPIC} onChange={(e) => ubah('salesPIC', e.target.value)} disabled={Boolean(booking)}>
              {dataset.salesTeam.map((s) => (
                <option key={s.id} value={s.nama}>{s.nama}</option>
              ))}
            </Pilihan>
          </Kolom>
          <Kolom label="Tanggal booking">
            <Masukan type="date" value={isi.tanggalBooking} onChange={(e) => ubah('tanggalBooking', e.target.value)} disabled={Boolean(booking)} />
          </Kolom>
          <Kolom label="Berlaku sampai" petunjuk="booking kedaluwarsa bila DP tidak dilunasi">
            <Masukan type="date" value={isi.kadaluarsa} onChange={(e) => ubah('kadaluarsa', e.target.value)} />
          </Kolom>
          <Kolom label="Harga kesepakatan (Rp)" petunjuk={kesepakatan ? `Rp${rupiah(kesepakatan)}` : 'angka saja'}>
            <Masukan inputMode="numeric" value={isi.kesepakatan} onChange={(e) => ubah('kesepakatan', e.target.value.replace(/[^\d]/g, ''))} disabled={Boolean(booking)} />
          </Kolom>
          <Kolom label="DP diterima (Rp)" petunjuk={dp ? `sisa Rp${rupiah(sisa)}` : 'boleh 0 bila belum ada DP'}>
            <Masukan inputMode="numeric" value={isi.dp} onChange={(e) => ubah('dp', e.target.value.replace(/[^\d]/g, ''))} placeholder="5000000" />
          </Kolom>
          <Kolom label="Tipe pembayaran">
            <Pilihan value={isi.tipePembayaran} onChange={(e) => ubah('tipePembayaran', e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Kredit">Kredit</option>
            </Pilihan>
          </Kolom>
          <Kolom label="Catatan">
            <Masukan value={isi.catatan} onChange={(e) => ubah('catatan', e.target.value)} placeholder="mis. minta unit diservis dulu sebelum serah terima" />
          </Kolom>
        </div>
      </BadanDialog>

      <AksiDialog
        kiri={
          booking ? (
            konfirmasiBatal ? (
              <span className="inline-flex items-center gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    batalkanBooking(booking.id, booking.vehicleId, 'dibatalkan lewat form booking (demo)', `${booking.customerNama} · ${booking.vehicleId}`)
                    onTutup()
                  }}
                >
                  Ya, batalkan booking
                </Button>
                <button type="button" className="text-2xs text-ink-3 underline" onClick={() => setKonfirmasiBatal(false)}>
                  tidak jadi
                </button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setKonfirmasiBatal(true)}>
                Batalkan booking
              </Button>
            )
          ) : null
        }
      >
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          {booking ? 'Simpan perubahan DP' : 'Buat booking'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
