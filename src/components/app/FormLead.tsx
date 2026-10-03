import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan, TeksPanjang } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { bebanSales } from '@/data/agregat-lead'
import { useSesi } from '@/store/sesi'
import { rupiah } from '@/lib/format'
import type { Lead, SumberLead, TipePembayaran } from '@/data/types'

/**
 * Tambah / ubah lead dari sisi ERP (bukan dari katalog publik).
 * Sales penerima diusulkan otomatis dari beban kerja yang paling lengang, tetapi tetap bisa diganti.
 */
export function FormLead({
  terbuka,
  onTutup,
  lead,
}: {
  terbuka: boolean
  onTutup: () => void
  lead?: Lead
}) {
  const tambahLead = useSesi((s) => s.tambahLead)
  const ubahDataLead = useSesi((s) => s.ubahDataLead)
  const mode = lead ? 'ubah' : 'tambah'

  const unitSiap = dataset.vehicles.filter((v) => v.status === 'READY')
  const salesPalingLengang =
    [...bebanSales()].sort((a, b) => a.aktif - b.aktif)[0]?.sales ?? dataset.salesTeam[0].nama

  const [f, setF] = useState(() => ({
    nama: lead?.nama ?? '',
    telepon: lead?.telepon ?? '',
    sumber: (lead?.sumber ?? 'WhatsApp') as SumberLead,
    vehicleId: lead?.vehicleId ?? unitSiap[0]?.id ?? '',
    budget: String(lead?.budget ?? unitSiap[0]?.listingPrice ?? 0),
    bayar: (lead?.preferensiPembayaran ?? 'Kredit') as TipePembayaran,
    salesPIC: lead?.salesPIC ?? salesPalingLengang,
    catatan: lead?.catatan ?? '',
  }))
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (kunci: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [kunci]: e.target.value }))

  const unitDipilih = dataset.vehicles.find((v) => v.id === f.vehicleId)

  const simpan = () => {
    const masalah: string[] = []
    if (f.nama.trim().length < 2) masalah.push('Nama minimal 2 huruf.')
    if (f.telepon.replace(/\D/g, '').length < 9) masalah.push('Nomor telepon minimal 9 angka.')
    if (!f.vehicleId) masalah.push('Pilih unit yang diminati.')
    const budget = Number(f.budget.replace(/[^\d]/g, '')) || 0
    if (budget < 10_000_000) masalah.push('Perkiraan budget minimal Rp10 juta.')
    setGalat(masalah)
    if (masalah.length) return

    const label = `${unitDipilih ? `${unitDipilih.brand} ${unitDipilih.model}` : f.vehicleId}`
    if (mode === 'tambah') {
      tambahLead({
        nama: f.nama,
        telepon: f.telepon,
        sumber: f.sumber,
        vehicleId: f.vehicleId,
        vehicleLabel: label,
        budget,
        preferensiPembayaran: f.bayar,
        salesPIC: f.salesPIC,
        catatan: f.catatan,
      })
    } else if (lead) {
      ubahDataLead(
        lead.id,
        {
          nama: f.nama.trim(),
          telepon: f.telepon.trim(),
          sumber: f.sumber,
          vehicleId: f.vehicleId,
          vehicleLabel: label,
          budget,
          preferensiPembayaran: f.bayar,
          salesPIC: f.salesPIC,
          catatan: f.catatan.trim(),
        },
        f.nama.trim(),
      )
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={mode === 'tambah' ? 'Tambah lead' : `Ubah lead · ${lead?.id}`}
      keterangan={
        mode === 'tambah'
          ? 'Lead baru masuk ke kolom "Lead Baru" di papan CRM dan langsung ikut dihitung pada KPI pipeline.'
          : 'Perubahan langsung terlihat di papan CRM, halaman customer, dan laporan sumber lead.'
      }
      catatanBawah="Sama seperti seluruh demo ini: tersimpan pada sesi tab ini dan bisa dikembalikan lewat spanduk di atas."
    >
      <BadanDialog>
        <Kolom label="Nama" lebar="separuh" galat={galat.find((g) => g.includes('Nama'))}>
          <Masukan value={f.nama} onChange={ubah('nama')} placeholder="Nama calon pembeli" />
        </Kolom>
        <Kolom label="Nomor WhatsApp / telepon" lebar="separuh" galat={galat.find((g) => g.includes('telepon'))}>
          <Masukan value={f.telepon} onChange={ubah('telepon')} inputMode="tel" placeholder="0812…" />
        </Kolom>
        <Kolom label="Sumber lead" lebar="separuh">
          <Pilihan value={f.sumber} onChange={ubah('sumber')} aria-label="Sumber lead">
            {dataset.sumberLeadMaster.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Diminati pembayaran" lebar="separuh">
          <Pilihan value={f.bayar} onChange={ubah('bayar')} aria-label="Diminati pembayaran">
            <option value="Cash">Tunai (Cash)</option>
            <option value="Kredit">Kredit</option>
          </Pilihan>
        </Kolom>
        <Kolom
          label="Unit yang diminati"
          galat={galat.find((g) => g.includes('unit'))}
          petunjuk={unitDipilih ? `Harga penawaran ${rupiah(unitDipilih.listingPrice)}` : undefined}
        >
          <Pilihan value={f.vehicleId} onChange={ubah('vehicleId')} aria-label="Unit yang diminati">
            {unitSiap.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.tahun} · {v.id}
              </option>
            ))}
            {unitSiap.length === 0 && <option value="">Tidak ada unit berstatus siap</option>}
          </Pilihan>
        </Kolom>
        <Kolom label="Perkiraan budget (Rp)" lebar="separuh" galat={galat.find((g) => g.includes('budget'))}>
          <Masukan value={f.budget} onChange={ubah('budget')} inputMode="numeric" />
        </Kolom>
        <Kolom
          label="Sales penanggung jawab"
          lebar="separuh"
          petunjuk={mode === 'tambah' ? 'Diusulkan dari beban kerja paling lengang.' : undefined}
        >
          <Pilihan value={f.salesPIC} onChange={ubah('salesPIC')} aria-label="Sales penanggung jawab">
            {dataset.salesTeam.map((s) => (
              <option key={s.id} value={s.nama}>{s.nama}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Catatan kebutuhan pembeli">
          <TeksPanjang value={f.catatan} onChange={ubah('catatan')} rows={2} placeholder="Contoh: minta warna putih, tukar tambah Avanza 2017." />
        </Kolom>

        <DaftarGalat galat={galat} />
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          {mode === 'tambah' ? 'Simpan lead' : 'Simpan perubahan'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
