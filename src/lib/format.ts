/** Format angka & tanggal Indonesia. Semua nilai uang tampil dalam Rupiah penuh. */

const nf = new Intl.NumberFormat('id-ID')

export const angka = (n: number) => nf.format(n)

/** Rp449.000.000 — dipakai di tabel, kartu unit, transaksi. Negatif: -Rp7.000.000 */
export const rupiah = (n: number) => {
  const v = Math.round(n)
  return v < 0 ? `-Rp${nf.format(Math.abs(v))}` : `Rp${nf.format(v)}`
}

/** Bentuk ringkas untuk KPI dan label sempit: Rp8,0 M · Rp449 jt · Rp7,5 jt · Rp850 rb */
export function rupiahRingkas(n: number): string {
  const abs = Math.abs(n)
  const tanda = n < 0 ? '−' : ''
  const id = (v: number, suffix: string, desimal: number) =>
    `${tanda}Rp${v.toFixed(desimal).replace('.', ',')} ${suffix}`
  if (abs >= 1_000_000_000) return id(abs / 1_000_000_000, 'M', 1)
  if (abs >= 10_000_000) return id(abs / 1_000_000, 'jt', 0)
  if (abs >= 1_000_000) return id(abs / 1_000_000, 'jt', 1)
  if (abs >= 1_000) return id(abs / 1_000, 'rb', 0)
  return `${tanda}Rp${nf.format(abs)}`
}

export const kilometer = (km: number) => `${nf.format(km)} km`
export const persen = (rasio: number, desimal = 1) =>
  `${(rasio * 100).toFixed(desimal).replace('.', ',')}%`

const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const parse = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`)

/** 3 Oktober 2026 */
export function tanggalPanjang(iso: string): string {
  const t = parse(iso)
  return `${t.getUTCDate()} ${BULAN_PANJANG[t.getUTCMonth()]} ${t.getUTCFullYear()}`
}

/** 03 Okt 2026 — untuk kolom tabel */
export function tanggalPendek(iso: string): string {
  const t = parse(iso)
  return `${String(t.getUTCDate()).padStart(2, '0')} ${BULAN_PENDEK[t.getUTCMonth()]} ${t.getUTCFullYear()}`
}

/** 03/10 — untuk grafik dan label sempit */
export function tanggalSempit(iso: string): string {
  const t = parse(iso)
  return `${String(t.getUTCDate()).padStart(2, '0')}/${String(t.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Okt 2026 */
export function bulanLabel(bulanKey: string): string {
  const [tahun, bulan] = bulanKey.split('-')
  return `${BULAN_PENDEK[Number(bulan) - 1]} ${tahun}`
}

/** Selasa, 3 Oktober 2026 */
export function tanggalLengkap(iso: string): string {
  const t = parse(iso)
  return `${HARI[t.getUTCDay()]}, ${tanggalPanjang(iso)}`
}

/** 14:30 — dari timestamp ISO dengan offset */
export function jam(timestamp: string): string {
  return timestamp.slice(11, 16)
}

/** "hari ini" · "kemarin" · "3 hari lalu" · "12 hari lagi" — relatif terhadap hari demo */
export function jarakHari(iso: string, hariIni: string): string {
  const selisih = Math.round((parse(iso).getTime() - parse(hariIni).getTime()) / 86400000)
  if (selisih === 0) return 'hari ini'
  if (selisih === 1) return 'besok'
  if (selisih === -1) return 'kemarin'
  if (selisih > 0) return `${selisih} hari lagi`
  return `${Math.abs(selisih)} hari lalu`
}

/** selisih hari antara dua tanggal ISO (b − a) */
export const selisihHari = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
