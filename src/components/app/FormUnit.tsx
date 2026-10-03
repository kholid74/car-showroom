import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { AksiDialog, BadanDialog, DaftarGalat, Kolom, Masukan, Pilihan, TeksPanjang } from '@/components/ui/Formulir'
import { dataset } from '@/data'
import { useSesi, type MasukanUnit } from '@/store/sesi'
import { rupiah } from '@/lib/format'
import type { SumberUnit, Vehicle } from '@/data/types'

const SUMBER_UNIT: SumberUnit[] = ['Individu', 'Dealer', 'Lelang', 'Tukar Tambah']
const TRANSMISI = ['AT', 'MT']
const BAHAN_BAKAR = ['Bensin', 'Diesel', 'Hybrid', 'Listrik']
const KELAS = ['city', 'mpv', 'suv', 'premium']

const angka = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0

/**
 * Dua mode dalam satu komponen:
 * - 'tambah'  : unit baru masuk dari pembelian (status awal BARU MASUK)
 * - 'ubah'    : memperbarui data unit yang sudah ada, termasuk angka modal dan harga
 *
 * Pada mode ubah, biaya dihitung ulang dari komponennya (beli + reconditioning + biaya lain)
 * sehingga laba estimasi tidak pernah menyimpang dari modal yang tampil.
 */
export function FormUnit({
  terbuka,
  onTutup,
  unit,
}: {
  terbuka: boolean
  onTutup: () => void
  unit?: Vehicle
}) {
  const tambahUnit = useSesi((s) => s.tambahUnit)
  const ubahDataUnit = useSesi((s) => s.ubahDataUnit)
  const mode = unit ? 'ubah' : 'tambah'

  const [f, setF] = useState(() => ({
    brand: unit?.brand ?? '',
    model: unit?.model ?? '',
    variant: unit?.variant ?? '',
    tahun: String(unit?.tahun ?? 2021),
    warna: unit?.warna ?? 'Putih',
    transmisi: unit?.transmisi ?? 'AT',
    bahanBakar: unit?.bahanBakar ?? 'Bensin',
    kelas: unit?.kelas ?? 'mpv',
    kilometer: String(unit?.kilometer ?? 45000),
    nomorPolisi: unit?.nomorPolisi ?? '',
    cabang: unit?.cabang ?? dataset.meta.cabang[0],
    salesPIC: unit?.salesPIC ?? dataset.salesTeam[0].nama,
    sumber: 'Individu' as SumberUnit,
    namaSeller: '',
    kotaSeller: '',
    hargaBeli: String(unit?.purchasePrice ?? 150_000_000),
    recon: String(unit?.reconCost ?? 0),
    biayaLain: String(unit?.otherCost ?? 0),
    hargaList: String(unit?.listingPrice ?? 0),
    catatan: unit?.catatan ?? '',
  }))
  const [galat, setGalat] = useState<string[]>([])

  const ubah = (kunci: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [kunci]: e.target.value }))

  const hitung = useMemo(() => {
    const modal = angka(f.hargaBeli) + angka(f.recon) + angka(f.biayaLain)
    const listing = angka(f.hargaList) || (mode === 'tambah' ? Math.round((modal * 1.09) / 1_000_000) * 1_000_000 : 0)
    return { modal, listing, margin: listing - modal }
  }, [f.hargaBeli, f.recon, f.biayaLain, f.hargaList, mode])

  const simpan = () => {
    const masalah: string[] = []
    if (f.brand.trim().length < 2) masalah.push('Merek minimal 2 huruf.')
    if (f.model.trim().length < 1) masalah.push('Model wajib diisi.')
    const tahun = angka(f.tahun)
    if (tahun < 1990 || tahun > 2026) masalah.push('Tahun harus antara 1990 dan 2026.')
    if (angka(f.kilometer) < 0) masalah.push('Kilometer tidak boleh negatif.')
    if (angka(f.hargaBeli) < 10_000_000) masalah.push('Harga beli minimal Rp10 juta.')
    if (mode === 'ubah' && angka(f.hargaList) <= 0) masalah.push('Harga listing harus lebih dari nol.')
    if (mode === 'tambah' && f.nomorPolisi.trim().length < 3) masalah.push('Nomor polisi wajib diisi.')
    setGalat(masalah)
    if (masalah.length) return

    if (mode === 'tambah') {
      const masukan: MasukanUnit = {
        brand: f.brand,
        model: f.model,
        variant: f.variant,
        tahun: angka(f.tahun),
        warna: f.warna,
        transmisi: f.transmisi,
        bahanBakar: f.bahanBakar,
        kelas: f.kelas,
        kilometer: angka(f.kilometer),
        nomorPolisi: f.nomorPolisi,
        cabang: f.cabang,
        salesPIC: f.salesPIC,
        sumber: f.sumber,
        namaSeller: f.namaSeller,
        kotaSeller: f.kotaSeller,
        hargaDeal: angka(f.hargaBeli),
        biayaLain: angka(f.biayaLain),
        catatan: f.catatan,
      }
      tambahUnit(masukan)
    } else if (unit) {
      const modal = angka(f.hargaBeli) + angka(f.recon) + angka(f.biayaLain)
      const listing = angka(f.hargaList)
      ubahDataUnit(
        unit.id,
        {
          brand: f.brand.trim(),
          model: f.model.trim(),
          variant: f.variant.trim(),
          tahun: angka(f.tahun),
          warna: f.warna,
          transmisi: f.transmisi,
          bahanBakar: f.bahanBakar,
          kelas: f.kelas,
          kilometer: angka(f.kilometer),
          nomorPolisi: f.nomorPolisi.trim(),
          salesPIC: f.salesPIC,
          purchasePrice: angka(f.hargaBeli),
          reconCost: angka(f.recon),
          otherCost: angka(f.biayaLain),
          totalCost: modal,
          listingPrice: listing,
          estimasiMargin: listing - modal,
          catatan: f.catatan.trim(),
        },
        `${f.brand} ${f.model}`,
      )
    }
    onTutup()
  }

  return (
    <Dialog
      terbuka={terbuka}
      onTutup={onTutup}
      judul={mode === 'tambah' ? 'Tambah unit dari pembelian' : `Ubah data unit · ${unit?.id}`}
      keterangan={
        mode === 'tambah'
          ? 'Unit baru masuk berstatus "Baru Masuk" dan belum bisa tayang di katalog sampai lolos inspeksi dan reconditioning.'
          : 'Perubahan langsung dipakai seluruh modul: inventory, aging, laporan, dan katalog publik.'
      }
      lebar="max-w-3xl"
      catatanBawah="Contoh dialog demo: data disimpan pada sesi tab ini dan bisa dikembalikan lewat spanduk di atas."
    >
      <BadanDialog>
        <Kolom label="Merek" galat={galat.find((g) => g.includes('Merek'))}>
          <Masukan value={f.brand} onChange={ubah('brand')} placeholder="Toyota" />
        </Kolom>
        <Kolom label="Model" galat={galat.find((g) => g.includes('Model'))}>
          <Masukan value={f.model} onChange={ubah('model')} placeholder="Avanza" />
        </Kolom>
        <Kolom label="Varian" lebar="separuh">
          <Masukan value={f.variant} onChange={ubah('variant')} placeholder="1.3 G AT" />
        </Kolom>
        <Kolom label="Tahun" lebar="separuh" galat={galat.find((g) => g.includes('Tahun'))}>
          <Masukan value={f.tahun} onChange={ubah('tahun')} inputMode="numeric" />
        </Kolom>
        <Kolom label="Kilometer" lebar="separuh">
          <Masukan value={f.kilometer} onChange={ubah('kilometer')} inputMode="numeric" />
        </Kolom>
        <Kolom label="Nomor polisi" lebar="separuh" galat={galat.find((g) => g.includes('polisi'))}>
          <Masukan value={f.nomorPolisi} onChange={ubah('nomorPolisi')} placeholder="B 1234 XYZ" />
        </Kolom>
        <Kolom label="Warna" lebar="separuh">
          <Masukan value={f.warna} onChange={ubah('warna')} />
        </Kolom>
        <Kolom label="Transmisi" lebar="separuh">
          <Pilihan value={f.transmisi} onChange={ubah('transmisi')} aria-label="Transmisi">
            {TRANSMISI.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Bahan bakar" lebar="separuh">
          <Pilihan value={f.bahanBakar} onChange={ubah('bahanBakar')} aria-label="Bahan bakar">
            {BAHAN_BAKAR.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Kelas" lebar="separuh">
          <Pilihan value={f.kelas} onChange={ubah('kelas')} aria-label="Kelas">
            {KELAS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Cabang" lebar="separuh">
          <Pilihan value={f.cabang} onChange={ubah('cabang')} aria-label="Cabang">
            {dataset.meta.cabang.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom label="Sales penanggung jawab" lebar="separuh">
          <Pilihan value={f.salesPIC} onChange={ubah('salesPIC')} aria-label="Sales penanggung jawab">
            {dataset.salesTeam.map((s) => (
              <option key={s.id} value={s.nama}>{s.nama}</option>
            ))}
          </Pilihan>
        </Kolom>

        {mode === 'tambah' && (
          <>
            <Kolom label="Sumber unit" lebar="separuh">
              <Pilihan value={f.sumber} onChange={ubah('sumber')} aria-label="Sumber unit">
                {SUMBER_UNIT.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Pilihan>
            </Kolom>
            <Kolom label="Nama penjual" lebar="separuh">
              <Masukan value={f.namaSeller} onChange={ubah('namaSeller')} placeholder="Nama pemilik sebelumnya" />
            </Kolom>
            <Kolom label="Kota penjual" lebar="separuh">
              <Masukan value={f.kotaSeller} onChange={ubah('kotaSeller')} placeholder="Depok" />
            </Kolom>
          </>
        )}

        <Kolom label="Harga beli (Rp)" galat={galat.find((g) => g.includes('Harga beli'))}>
          <Masukan value={f.hargaBeli} onChange={ubah('hargaBeli')} inputMode="numeric" />
        </Kolom>
        <Kolom label="Biaya reconditioning (Rp)" lebar="separuh">
          <Masukan value={f.recon} onChange={ubah('recon')} inputMode="numeric" />
        </Kolom>
        <Kolom label="Biaya lain (Rp)" lebar="separuh">
          <Masukan value={f.biayaLain} onChange={ubah('biayaLain')} inputMode="numeric" />
        </Kolom>
        <Kolom
          label="Harga listing (Rp)"
          lebar="separuh"
          galat={galat.find((g) => g.includes('listing'))}
          petunjuk={mode === 'tambah' ? 'Kosongkan untuk harga sementara dari modal + 9%.' : undefined}
        >
          <Masukan value={f.hargaList} onChange={ubah('hargaList')} inputMode="numeric" />
        </Kolom>
        <Kolom label="Catatan kondisi" lebar="separuh">
          <TeksPanjang value={f.catatan} onChange={ubah('catatan')} rows={2} placeholder="Contoh: body mulus, ban depan perlu ganti." />
        </Kolom>

        <div className="col-span-2 rounded-control border border-hairline bg-sunken px-3 py-2.5">
          <p className="text-2xs text-ink-2">
            Modal total <span className="tnum font-medium text-ink">{rupiah(hitung.modal)}</span> · harga listing{' '}
            <span className="tnum font-medium text-ink">{rupiah(hitung.listing)}</span> · estimasi laba{' '}
            <span className={`tnum font-medium ${hitung.margin > 0 ? 'text-money-pos' : 'text-danger'}`}>
              {rupiah(hitung.margin)}
            </span>
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-ink-3">
            Angka di atas dihitung ulang setiap kali Anda mengetik — modal, listing, dan laba tidak pernah dipisah.
          </p>
        </div>

        <DaftarGalat galat={galat} />
      </BadanDialog>

      <AksiDialog>
        <Button variant="ghost" onClick={onTutup}>
          Batal
        </Button>
        <Button variant="primary" onClick={simpan}>
          {mode === 'tambah' ? 'Simpan unit baru' : 'Simpan perubahan'}
        </Button>
      </AksiDialog>
    </Dialog>
  )
}
