import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataset } from '@/data'
import type { Role, User } from '@/data/types'

export interface SesiPengguna {
  id: string
  nama: string
  email: string
  role: Role
  jabatan: string
  cabang: string
}

interface AuthState {
  pengguna: SesiPengguna | null
  masuk: (email: string, password: string) => { berhasil: boolean; pesan?: string }
  keluar: () => void
  gantiPeran: (role: Role) => void
}

const keSesi = (u: User): SesiPengguna => ({
  id: u.id,
  nama: u.nama,
  email: u.email,
  role: u.role,
  jabatan: u.jabatan,
  cabang: u.cabang,
})

/**
 * Autentikasi demo. Tidak ada backend: akun diperiksa terhadap dataset demo,
 * dan sesi disimpan di localStorage.
 *
 * Catatan arsitektur: peran HANYA menyaring navigasi dan tampilan; seluruh logika
 * bisnis tetap membaca dataset yang sama. Ini agar Kalsara bisa menambah akun
 * akses demo per calon klien tanpa menyentuh logika aplikasi.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      pengguna: null,
      masuk: (email, password) => {
        const user = dataset.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!user) return { berhasil: false, pesan: 'Email tidak terdaftar pada demo ini.' }
        if (user.password !== password) return { berhasil: false, pesan: 'Kata sandi salah.' }
        set({ pengguna: keSesi(user) })
        return { berhasil: true }
      },
      keluar: () => set({ pengguna: null }),
      gantiPeran: (role) => {
        const sekarang = get().pengguna
        const target = dataset.users.find((u) => u.role === role)
        if (!target) return
        // pertahankan akun bila emailnya memang berbeda peran; kalau tidak, pakai akun peran itu
        const akun = dataset.users.find((u) => u.role === role && u.id === sekarang?.id) ?? target
        set({ pengguna: keSesi(akun) })
      },
    }),
    { name: 'showroom-demo-sesi' },
  ),
)

export const akunDemo = dataset.users.map((u) => ({
  role: u.role,
  nama: u.nama,
  jabatan: u.jabatan,
  email: u.email,
  password: u.password,
}))

export const LABEL_PERAN: Record<Role, string> = {
  OWNER: 'Owner / Management',
  ADMIN: 'Admin Operational',
  SALES: 'Sales',
}
