import type { Dataset } from './types'
import raw from './dataset.json'

/**
 * SATU sumber data untuk seluruh aplikasi.
 * Dataset dihasilkan scripts/generate-dataset.mjs dan diverifikasi
 * scripts/verify-dataset.mjs — setiap halaman membaca dari sini, tidak ada
 * data dummy terpisah per modul.
 */
export const dataset = raw as unknown as Dataset

/** Tanggal acuan demo — seluruh perhitungan umur/aging mengacu ke tanggal ini. */
export const DEMO_TODAY: string = dataset.meta.demoToday

export const bulanIni: string = DEMO_TODAY.slice(0, 7)

/** ID tampilan unit, mis. VH-2026-0012 */
export const refUnit = (vehicleId: string) => vehicleId

export * from './types'
