import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { akunDemo, useAuth } from '@/store/auth'
import { dataset } from '@/data'

import { Car, ArrowRight, ChartNoAxesCombined, ClipboardCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VehiclePhoto } from '@/components/ui/VehiclePhoto'

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

  const roleInfo = [
    { title: 'Owner & manajemen', text: 'Pantau stok, penjualan, dan keuntungan.', icon: ChartNoAxesCombined },
    { title: 'Admin operasional', text: 'Kelola unit dari pembelian sampai siap jual.', icon: ClipboardCheck },
    { title: 'Tim sales', text: 'Tindak lanjuti pelanggan hingga transaksi.', icon: Users },
  ]
  return (
    <main className="grid min-h-screen bg-panel lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#17272c] p-7 text-white lg:min-h-screen lg:p-12">
        <VehiclePhoto unit={{ brand: 'Toyota', model: 'Fortuner' }} priority className="absolute inset-0 h-full w-full opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101f25] via-[#14292f]/35 to-[#101f25]/65" />
        <div className="relative flex items-center gap-3"><Car size={30} /><span className="text-xl font-semibold">Kalsara Motor<span className="text-[#e9c49a]">.</span></span></div>
        <div className="relative max-w-lg py-10 lg:pb-16">
          <p className="mb-5 text-xs font-medium tracking-[0.2em] text-[#e9c49a]">SETIAP UNIT PUNYA CERITA</p>
          <h1 className="text-[38px] font-semibold leading-[1.12] tracking-tight sm:text-[52px]">Dari unit masuk.<br />Sampai untung<br />terhitung.</h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/80">Satu ruang kerja untuk seluruh perjalanan bisnis showroom Anda.</p>
          <div className="mt-8 flex gap-7 border-t border-white/20 pt-6"><div><p className="text-2xl font-semibold">{dataset.vehicles.length}</p><p className="mt-1 text-xs text-white/65">Kendaraan terhubung</p></div><div><p className="text-2xl font-semibold">3</p><p className="mt-1 text-xs text-white/65">Peran, satu sistem</p></div><div><p className="text-2xl font-semibold">5–10</p><p className="mt-1 text-xs text-white/65">Menit untuk mencoba</p></div></div>
        </div>
        <p className="relative text-xs text-white/60">A showcase by Kalsara Digital Studio · Foto ilustrasi model</p>
      </section>
      <section className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />DEMO INTERAKTIF</span>
          <h2 className="mt-6 text-3xl font-semibold text-ink">Kenali showroom Anda<br />dari sudut yang baru.</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">Pilih peran untuk mulai menjelajah. Semua sudah siap, tanpa perlu membuat akun.</p>
          <div className="mt-7 space-y-3">{akunDemo.map((a, i) => {
            const info = roleInfo[i]; const Icon = info.icon
            return <button key={a.role} onClick={() => masukCepat(a.email, a.password)} className={'group flex w-full items-center gap-4 rounded-panel border p-4 text-left transition-colors ' + (i === 0 ? 'border-accent bg-accent text-white hover:bg-accent-hover' : 'border-hairline bg-panel text-ink hover:border-accent hover:bg-accent-soft')}>
              <span className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + (i === 0 ? 'bg-white/10' : 'bg-sunken')}><Icon size={22} /></span><span className="flex-1"><span className="block text-sm font-semibold">{info.title}</span><span className={'mt-1 block text-xs ' + (i === 0 ? 'text-white/80' : 'text-ink-3')}>{info.text}</span></span><ArrowRight size={19} />
            </button>
          })}</div>
          <div className="mt-6 flex items-center justify-between gap-4 text-xs"><span className="text-ink-3">Ingin melihat sisi pelanggan?</span><Link to="/katalog" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">Jelajahi katalog <ArrowRight size={14} /></Link></div>
          <details className="mt-7 border-t border-hairline pt-5"><summary className="cursor-pointer text-xs text-ink-3">Masuk dengan akun demo</summary>
            <form onSubmit={kirim} className="mt-4 space-y-3">
              <label className="block text-xs text-ink-2">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" className="mt-1 h-10 w-full rounded-control border border-hairline-strong px-3" required /></label>
              <label className="block text-xs text-ink-2">Kata sandi<input type="password" value={sandi} onChange={e => setSandi(e.target.value)} autoComplete="current-password" className="mt-1 h-10 w-full rounded-control border border-hairline-strong px-3" required /></label>
              <Button type="submit" variant="primary" className="w-full" disabled={sedang}>Masuk</Button>
            </form>
          </details>
          {galat && <p role="alert" className="mt-3 text-sm text-danger">{galat}</p>}
          <p className="mt-6 text-xs leading-relaxed text-ink-3">Data contoh untuk eksplorasi. Perubahan tersimpan selama tab ini terbuka dan dapat direset kapan saja.</p>
        </div>
      </section>
    </main>
  )
}
