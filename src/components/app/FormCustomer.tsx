import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { useSesi } from '@/store/sesi'
import type { Customer, TipePembayaran } from '@/data/types'

const rupiah = (n: number) => n.toLocaleString('id-ID')

/** Tambah customer baru atau perbarui data customer yang sudah ada. */
export function FormCustomer({
  terbuka,
  onTutup,
  customer,
}: {
  terbuka: boolean
  onTutup: () => void
  customer?: Customer
}) {
  const tambahCustomer = useSesi((s) => s.tambahCustomer)
  const ubahDataCustomer = useSesi((s) => s.ubahDataCustomer)

  const [isi, setIsi] = useState({
    nama: customer?.nama ?? '',
    telepon: customer?.telepon ?? '',
    email: customer?.email && customer.email !== '—' ? customer.email : '',
    kota: customer?.kota ?? dataset.meta.cabang[0] ?? '',
    alamat: customer?.alamat && customer.alamat !== '—' ? customer.alamat : '',
    sumberLead: customer?.sumberLead ?? dataset.sumberLeadMaster[0] ?? 'WhatsApp',
    salesPIC: customer?.salesPIC ?? dataset.salesTeam[0]?.nama ?? '',
    budget: customer ? String(customer.budget) : '',
    preferensiPembayaran: (customer?.preferensiPembayaran ?? 'Cash') as TipePembayaran,
    pekerjaan: customer?.pekerjaan && customer.pekerjaan !== '—' ? customer.pekerjaan : '',
    catatan: customer?.catatan ?? '',
  })
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (k: keyof typeof isi, v: string) => setIsi((s) => ({ ...s, [k]: v }))
  const budget = Number(isi.budget) || 0

  const simpan = () => {
    const g: string[] = []
    if (isi.nama.trim().length < 3) g.push('Nama customer minimal 3 karakter.')
    if (isi.telepon.replace(/\D/g, '').length < 9) g.push('Nomor telepon minimal 9 angka.')
    if (isi.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(isi.email)) g.push('Format email tidak valid.')
    if (!isi.kota.trim()) g.push('Kota wajib diisi.')
    if (!isi.salesPIC) g.push('Sales penanggung jawab wajib dipilih.')
    setGalat(g)
    if (g.length) return

    if (customer) {
      ubahDataCustomer(
        customer.id,
        {
          nama: isi.nama.trim(),
          telepon: isi.telepon.trim(),
          email: isi.email.trim() || '—',
          kota: isi.kota.trim(),
          alamat: isi.alamat.trim() || '—',
          sumberLead: isi.sumberLead,
          salesPIC: isi.salesPIC,
          budget,
          preferensiPembayaran: isi.preferensiPembayaran,
          pekerjaan: isi.pekerjaan.trim() || '—',
          catatan: isi.catatan.trim() || customer.catatan,
        },
        isi.nama.trim(),
      )
    } else {
      tambahCustomer({
        nama: isi.nama,
        telepon: isi.telepon,
        email: isi.email,
        kota: isi.kota,
        alamat: isi.alamat,
        sumberLead: isi.sumberLead,
        salesPIC: isi.salesPIC,
        budget,
        preferensiPembayaran: isi.preferensiPembayaran,
        pekerjaan: isi.pekerjaan,
        catatan: isi.catatan,
      })
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={customer ? `Ubah customer · ${customer.id}` : 'Tambah customer'}
      keterangan={
        customer
          ? 'Perubahan langsung tampil di daftar customer, detail, dan pencarian global.'
          : 'Customer di sini adalah pembeli potensial maupun pembeli yang sudah tercatat.'
      }
      lebar="max-w-2xl"
    >
      <BadanDialog>
        <DaftarGalat galat={galat} />
        <Kolom label="Nama lengkap">
          <Masukan value={isi.nama} onChange={(e) => ubah('nama', e.target.value)} placeholder="Nama customer" />
        </Kolom>
        <Kolom label="Nomor telepon">
          <Masukan inputMode="tel" value={isi.telepon} onChange={(e) => ubah('telepon', e.target.value)} placeholder="08xxxxxxxxxx" />
        </Kolom>
        <Kolom label="Email" petunjuk="boleh dikosongkan">
          <Masukan value={isi.email} onChange={(e) => ubah('email', e.target.value)} placeholder="nama@email.com" />
        </Kolom>
        <Kolom label="Kota">
          <Pilihan value={isi.kota} onChange={(e) => ubah('kota', e.target.value)}>
            {dataset.meta.cabang.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            {!dataset.meta.cabang.includes(isi.kota) && <option value={isi.kota}>{isi.kota}</option>}
          </Pilihan>
        </Kolom>
        <Kolom label="Alamat" petunjuk="boleh dikosongkan">
          <Masukan value={isi.alamat} onChange={(e) => ubah('alamat', e.target.value)} placeholder="Jl. …" />
        </Kolom>
        <Kolom label="Sumber lead">
          <Pilihan value={isi.sumberLead} onChange={(e) => ubah('sumberLead', e.target.value)}>
            {dataset.sumberLeadMaster.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Sales penanggung jawab">
          <Pilihan value={isi.salesPIC} onChange={(e) => ubah('salesPIC', e.target.value)}>
            {dataset.salesTeam.map((s) => (
              <option key={s.id} value={s.nama}>{s.nama}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Anggaran pembelian (Rp)" petunjuk={budget ? `Rp${rupiah(budget)}` : 'angka saja, boleh 0'}>
          <Masukan inputMode="numeric" value={isi.budget} onChange={(e) => ubah('budget', e.target.value.replace(/[^\d]/g, ''))} placeholder="250000000" />
        </Kolom>
        <Kolom label="Preferensi pembayaran">
          <Pilihan value={isi.preferensiPembayaran} onChange={(e) => ubah('preferensiPembayaran', e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Kredit">Kredit</option>
          </Pilihan>
        </Kolom>
        <Kolom label="Pekerjaan" petunjuk="dipakai sales untuk menyesuaikan penawaran">
          <Masukan value={isi.pekerjaan} onChange={(e) => ubah('pekerjaan', e.target.value)} placeholder="mis. Manajer Operasional" />
        </Kolom>
        <Kolom label="Catatan">
          <Masukan value={isi.catatan} onChange={(e) => ubah('catatan', e.target.value)} placeholder="mis. minta dihubungi setelah jam 5 sore" />
        </Kolom>
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          {customer ? 'Simpan perubahan' : 'Tambah customer'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
