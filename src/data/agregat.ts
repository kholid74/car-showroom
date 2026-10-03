import { dataset, DEMO_TODAY } from './index'
import { selisihHari } from '@/lib/format'
import type { Vehicle } from './types'

/* ------------------------------------------------------------------ *
 * Agregasi lintas modul — semua diturunkan dari dataset yang sama.
 * ------------------------------------------------------------------ */

/** Procurement: ringkasan negosiasi dan posisi harga terhadap acuan pasar. */
export function ringkasanProcurement() {
  const daftar = dataset.procurements
  const deal = daftar.reduce((s, p) => s + p.hargaDeal, 0)
  const penawaran = daftar.reduce((s, p) => s + p.hargaPenawaran, 0)
  const selisih = penawaran - deal
  const bawahAcuan = daftar.filter((p) => p.nilaiPasarAcuan >= p.hargaDeal)
  return {
    jumlah: daftar.length,
    totalDeal: deal,
    totalPenawaran: penawaran,
    selisihNego: selisih,
    rataSelisihNego: daftar.length ? selisih / daftar.length : 0,
    diBawahAcuan: bawahAcuan.length,
    nilaiBawahAcuan: bawahAcuan.reduce((s, p) => s + (p.nilaiPasarAcuan - p.hargaDeal), 0),
  }
}

/** Procurement per sumber unit (Individu / Dealer / Lelang / Tukar Tambah). */
export function procurementPerSumber() {
  return dataset.sumberUnitMaster
    .map((sumber) => {
      const daftar = dataset.procurements.filter((p) => p.sumber === sumber)
      return {
        sumber,
        jumlah: daftar.length,
        nilai: daftar.reduce((s, p) => s + p.hargaDeal, 0),
        rataSelisih: daftar.length
          ? daftar.reduce((s, p) => s + (p.hargaPenawaran - p.hargaDeal), 0) / daftar.length
          : 0,
      }
    })
    .sort((a, b) => b.nilai - a.nilai)
}

/** Inspeksi: ringkasan skor dan temuan. */
export function ringkasanInspeksi() {
  const daftar = dataset.inspections
  const totalItem = daftar.reduce(
    (s, i) => s + i.ringkasan.good + i.ringkasan.attention + i.ringkasan.repair,
    0,
  )
  const attention = daftar.reduce((s, i) => s + i.ringkasan.attention, 0)
  const repair = daftar.reduce((s, i) => s + i.ringkasan.repair, 0)
  return {
    jumlah: daftar.length,
    rataSkor: daftar.length ? daftar.reduce((s, i) => s + i.skor, 0) / daftar.length : 0,
    skorTerendah: daftar.length ? Math.min(...daftar.map((i) => i.skor)) : 0,
    perluPerbaikanMenyeluruh: daftar.filter((i) => i.rekomendasi === 'PERLU PERBAIKAN MENYELURUH').length,
    attention,
    repair,
    totalItem,
    persenBaik: totalItem ? (totalItem - attention - repair) / totalItem : 0,
  }
}

/** Kategori inspeksi dengan temuan terbanyak — dipakai untuk prioritas perbaikan. */
export function kategoriTemuan() {
  const peta = new Map<string, { kategori: string; baik: number; attention: number; repair: number }>()
  dataset.inspections.forEach((i) => {
    i.sections.forEach((s) => {
      const baris = peta.get(s.kategori) ?? { kategori: s.kategori, baik: 0, attention: 0, repair: 0 }
      s.item.forEach((it) => {
        if (it.hasil === 'GOOD') baris.baik += 1
        else if (it.hasil === 'ATTENTION') baris.attention += 1
        else baris.repair += 1
      })
      peta.set(s.kategori, baris)
    })
  })
  return [...peta.values()]
    .map((b) => ({ ...b, temuan: b.attention + b.repair, total: b.baik + b.attention + b.repair }))
    .sort((a, b) => b.temuan - a.temuan)
}

/** Reconditioning: ringkasan biaya dan progres pekerjaan. */
export function ringkasanReconditioning() {
  const daftar = dataset.reconditionings
  const semuaItem = daftar.flatMap((r) => r.items)
  const menunggu = daftar.filter((r) => r.status !== 'COMPLETED')
  return {
    unit: daftar.length,
    totalBiaya: daftar.reduce((s, r) => s + r.total, 0),
    rataBiaya: daftar.length ? daftar.reduce((s, r) => s + r.total, 0) / daftar.length : 0,
    pekerjaan: semuaItem.length,
    berjalan: semuaItem.filter((i) => i.status === 'IN PROGRESS').length,
    direncanakan: semuaItem.filter((i) => i.status === 'PLANNED').length,
    selesai: semuaItem.filter((i) => i.status === 'COMPLETED').length,
    unitBelumSelesai: menunggu.length,
    unitBelumSelesaiNilai: menunggu.reduce((s, r) => s + r.total, 0),
  }
}

/** Biaya reconditioning per vendor — untuk evaluasi harga vendor. */
export function biayaPerVendor() {
  const peta = new Map<string, { vendor: string; pekerjaan: number; unit: number; biaya: number }>()
  const unitPerVendor = new Map<string, Set<string>>()
  dataset.reconditionings.forEach((r) => {
    r.items.forEach((i) => {
      const baris = peta.get(i.vendor) ?? { vendor: i.vendor, pekerjaan: 0, unit: 0, biaya: 0 }
      baris.pekerjaan += 1
      baris.biaya += i.biaya
      peta.set(i.vendor, baris)
      const set = unitPerVendor.get(i.vendor) ?? new Set<string>()
      set.add(r.vehicleId)
      unitPerVendor.set(i.vendor, set)
    })
  })
  return [...peta.values()]
    .map((b) => ({ ...b, unit: unitPerVendor.get(b.vendor)?.size ?? 0 }))
    .sort((a, b) => b.biaya - a.biaya)
}

/** Pekerjaan reconditioning yang belum selesai, lintas unit. */
export function pekerjaanBerjalan() {
  const hasil: { vehicleId: string; unit: Vehicle; job: string; vendor: string; biaya: number; status: string; mulai: string; selesai: string }[] = []
  dataset.reconditionings.forEach((r) => {
    const unit = dataset.vehicles.find((v) => v.id === r.vehicleId)
    if (!unit) return
    r.items
      .filter((i) => i.status !== 'COMPLETED')
      .forEach((i) => {
        hasil.push({
          vehicleId: r.vehicleId,
          unit,
          job: i.job,
          vendor: i.vendor,
          biaya: i.biaya,
          status: i.status,
          mulai: i.mulai,
          selesai: i.selesai,
        })
      })
  })
  return hasil.sort((a, b) => (a.selesai < b.selesai ? -1 : 1))
}

/** Dokumen: ringkasan kelengkapan berkas. */
export function ringkasanDokumen() {
  const semuaItem = dataset.documents.flatMap((d) => d.checklist)
  const unitBermasalah = dataset.documents.filter((d) => d.checklist.some((c) => c.status !== 'Tersedia'))
  return {
    unit: dataset.documents.length,
    unitLengkap: dataset.documents.length - unitBermasalah.length,
    unitBermasalah: unitBermasalah.length,
    tersedia: semuaItem.filter((c) => c.status === 'Tersedia').length,
    menunggu: semuaItem.filter((c) => c.status === 'Menunggu').length,
    belumAda: semuaItem.filter((c) => c.status === 'Belum Ada').length,
    total: semuaItem.length,
  }
}

/** Rekap per jenis dokumen. */
export function rekapJenisDokumen() {
  const peta = new Map<string, { nama: string; tersedia: number; menunggu: number; belumAda: number }>()
  dataset.documents.forEach((d) =>
    d.checklist.forEach((c) => {
      const baris = peta.get(c.nama) ?? { nama: c.nama, tersedia: 0, menunggu: 0, belumAda: 0 }
      if (c.status === 'Tersedia') baris.tersedia += 1
      else if (c.status === 'Menunggu') baris.menunggu += 1
      else baris.belumAda += 1
      peta.set(c.nama, baris)
    }),
  )
  return [...peta.values()].sort((a, b) => b.menunggu + b.belumAda - (a.menunggu + a.belumAda))
}

/** Unit yang dokumennya bermasalah, beserta rinciannya. */
export function unitDokumenBermasalah() {
  return dataset.documents
    .filter((d) => d.checklist.some((c) => c.status !== 'Tersedia'))
    .map((d) => {
      const unit = dataset.vehicles.find((v) => v.id === d.vehicleId)
      const bermasalah = d.checklist.filter((c) => c.status !== 'Tersedia')
      return { unit, dokumen: d, bermasalah }
    })
    .filter((x): x is { unit: Vehicle; dokumen: typeof x.dokumen; bermasalah: typeof x.bermasalah } => Boolean(x.unit))
    .sort((a, b) => b.bermasalah.length - a.bermasalah.length)
}

/** Unit yang masih dalam rantai proses (belum siap jual) — antrean kerja admin. */
export function antreanOperasional() {
  const tahap: Record<string, Vehicle[]> = {
    'BARU MASUK': [],
    INSPEKSI: [],
    RECONDITIONING: [],
  }
  dataset.vehicles.forEach((v) => {
    if (tahap[v.status]) tahap[v.status].push(v)
  })
  Object.values(tahap).forEach((d) => d.sort((a, z) => (a.tanggalMasuk < z.tanggalMasuk ? 1 : -1)))
  return tahap
}

/** Umur hari di tahap sekarang, untuk unit yang belum siap jual. */
export const hariDiTahap = (v: Vehicle) => selisihHari(v.tanggalMasuk, DEMO_TODAY)
