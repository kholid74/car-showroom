import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { akunDemo, LABEL_PERAN, useAuth } from '@/store/auth'
import { dataset } from '@/data'
import { tanggalPanjang } from '@/lib/format'
import type { Role } from '@/data/types'

export function LoginPage() {
  const { masuk } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(akunDemo[0].email)
  const [sandi, setSandi] = useState(akunDemo[0].password)
  const [galat, setGalat] = useState<string | null>(null)
  const [sedang, setSedang] = useState(false)

  const kirim = (e: React.FormEvent) => {
    e.preventDefault()
    setSedang(true)
    setGalat(null)
    const hasil = masuk(email, sandi)
    setSedang(false)
    if (hasil.berhasil) navigate('/', { replace: true })
    else setGalat(hasil.pesan ?? 'Tidak bisa masuk.')
  }

  const masukCepat = (target: string, sandiAkun: string) => {
    const hasil = masuk(target, sandiAkun)
    if (hasil.berhasil) navigate('/', { replace: true })
    else setGalat(hasil.pesan ?? 'Tidak bisa masuk.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
        <header>
          <p className="id-chip text-ink-3">SHOWROOM-DEMO</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{dataset.meta.namaShowroom}</h1>
          <p className="mt-1 text-xs text-ink-2">
            Sistem manajemen showroom mobil bekas — pembelian unit, inspeksi, reconditioning, inventory, CRM,
            penjualan, sampai profit, dalam satu sistem.
          </p>
        </header>

        <form onSubmit={kirim} className="mt-6 border border-hairline bg-panel rounded-panel p-4">
          <div className="space-y-3">
            <label className="block">
              <span className="label-caps">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="mt-1 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink hover:bg-sunken focus-visible:bg-panel"
                required
              />
            </label>
            <label className="block">
              <span className="label-caps">Kata sandi</span>
              <input
                type="password"
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                autoComplete="current-password"
                className="mt-1 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink hover:bg-sunken focus-visible:bg-panel"
                required
              />
            </label>
          </div>

          {galat && (
            <p role="alert" className="mt-3 rounded-control bg-danger/10 px-2 py-1.5 text-2xs font-medium text-danger">
              {galat}
            </p>
          )}

          <Button type="submit" variant="primary" className="mt-4 w-full" disabled={sedang}>
            {sedang ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="rule flex-1" />
            <span className="label-caps">Masuk cepat untuk demo</span>
            <span className="rule flex-1" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {akunDemo.map((a) => (
              <Button
                key={a.role}
                variant="secondary"
                size="sm"
                onClick={() => masukCepat(a.email, a.password)}
                className="h-auto flex-col items-start py-2 text-left"
              >
                <span className="text-2xs font-semibold text-ink">{LABEL_PERAN[a.role as Role]}</span>
                <span className="text-2xs text-ink-3">{a.nama}</span>
              </Button>
            ))}
          </div>

          <p className="mt-4 text-2xs leading-relaxed text-ink-3">
            Hari demo: {tanggalPanjang(dataset.meta.demoToday)}. Seluruh data pada demo ini sintetis —
            tidak ada data pelanggan, dokumen, atau kendaraan yang nyata.
          </p>
        </div>
      </main>
    </div>
  )
}
