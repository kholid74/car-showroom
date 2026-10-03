import raw from './dataset.json'

/**
 * Nilai dasar dari dataset yang jarang berubah. Dipisah dari index.ts supaya store sesi
 * bisa memakai tanggal acuan tanpa membuat impor melingkar (store → data → store).
 */
export const DEMO_TODAY: string = raw.meta.demoToday
export const bulanIni: string = DEMO_TODAY.slice(0, 7)
export const namaShowroom: string = raw.meta.namaShowroom
export const cabang: string[] = raw.meta.cabang
export const catatanDemo: string = raw.meta.catatan
