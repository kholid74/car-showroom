import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, X, CircleAlert, RotateCcw, Car } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { jumlahPerubahan, ringkasPerubahan, useSesi } from '@/store/sesi'
import { PencarianGlobal } from '@/components/app/PencarianGlobal'
import { LoncengNotifikasi } from '@/components/app/LoncengNotifikasi'
import { navigasiUntukPeran, semuaItemNav, type GrupNav } from './nav'
import { useAuth } from '@/store/auth'
import { dataset } from '@/data'
import { tanggalPanjang } from '@/lib/format'
import type { Role } from '@/data/types'

const PERAN: Role[] = ['OWNER', 'ADMIN', 'SALES']

/** Label pendek khusus pemilih di header — di layar sempit label panjang terpotong jadi tidak terbaca. */
const PERAN_SINGKAT: Record<Role, string> = { OWNER: 'Owner', ADMIN: 'Admin', SALES: 'Sales' }

/**
 * Isi sidebar dipakai dua kali: sebagai kolom tetap di layar lebar, dan sebagai laci
 * geser di layar sempit. Dulu sidebar hanya punya `hidden md:flex`, sehingga di ponsel
 * seluruh navigasi hilang tanpa cara apa pun untuk membukanya.
 */
function IsiSidebar({
  grup,
  onPilih,
  ringkas = false,
}: {
  grup: GrupNav[]
  onPilih?: () => void
  ringkas?: boolean
}) {
  return (
    <>
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-3 py-2"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white"><Car size={23} /></span><div><p className="text-base font-semibold tracking-tight text-ink">Kalsara Motor<span className="text-[#e2b98c]">.</span></p>
        <p className="mt-0.5 text-[10px] tracking-[0.18em] text-ink-3">RUANG KERJA SHOWROOM</p></div></div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Navigasi utama">
        {grup.map((g) => (
          <div key={g.judul} className="mb-4">
            <p className="label-caps px-2 pb-1.5">{g.judul}</p>
            <ul className="space-y-0.5">
              {g.item.map((item) => (
                <li key={item.ke}>
                  <NavLink
                    to={item.ke}
                    end={item.ke === '/'}
                    onClick={onPilih}
                    className={({ isActive }) =>
                      [
                        'group relative flex h-10 items-center gap-3 rounded-control px-3 text-xs transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
                        isActive
                          ? 'bg-accent-soft font-medium text-accent'
                          : 'text-ink-2 hover:bg-sunken hover:text-ink',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          // penanda pemilihan aktif (bukan dekorasi): menjelaskan "Anda di sini"
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-pill bg-accent" aria-hidden />
                        )}
                        <item.ikon size={15} className={isActive ? 'text-accent' : 'text-ink-3'} />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={`border-t border-hairline ${ringkas ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <a
          href="/katalog"
          className="inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:underline"
        >
          <ExternalLink size={12} />
          Lihat katalog publik
        </a>
        {!ringkas && (
          <p className="mt-1 text-2xs leading-relaxed text-ink-3">
            Jelajahi stok dan coba kirim minat ke tim sales.
          </p>
        )}
      </div>

      {/* di laci ponsel blok ini disembunyikan agar seluruh menu muat tanpa perlu di-scroll */}
      {!ringkas && (
        <div className="border-t border-hairline px-4 py-3">
          <p className="label-caps">Hari demo</p>
          <p className="mt-0.5 text-2xs text-ink-2">{tanggalPanjang(dataset.meta.demoToday)}</p>
          <p className="mt-2 text-2xs text-ink-3">
            {dataset.vehicles.length} unit · {dataset.leads.length} lead · {dataset.sales.length} transaksi
          </p>
        </div>
      )}
    </>
  )
}

export function AppShell() {
  const { pengguna, keluar, gantiPeran } = useAuth()
  const sesi = useSesi()
  const jumlahUbah = jumlahPerubahan(sesi)
  const lokasi = useLocation()
  const role = pengguna?.role ?? 'OWNER'
  const grup = navigasiUntukPeran(role)
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const refTombolMenu = useRef<HTMLButtonElement>(null)
  const refTombolTutup = useRef<HTMLButtonElement>(null)

  // judul halaman diambil dari daftar navigasi agar sidebar dan header tidak pernah menyimpang
  const aktif =
    semuaItemNav.find((i) => i.ke === lokasi.pathname) ??
    semuaItemNav.find((i) => i.ke !== '/' && lokasi.pathname.startsWith(i.ke))

  // halaman detail unit bukan halaman daftar: judulnya harus menyebut unit yang sedang dibuka
  const detailUnit = lokasi.pathname.match(/^\/inventory\/(VH-[\d-]+)$/)
  const judul = detailUnit ? 'Detail Unit' : (aktif?.label ?? 'Dashboard')
  const keterangan = detailUnit
    ? `${detailUnit[1]} · pembelian, inspeksi, reconditioning, lead, penjualan, dan profitnya`
    : (aktif?.keterangan ?? dataset.meta.namaShowroom)

  const tutupMenu = () => {
    setMenuTerbuka(false)
    refTombolMenu.current?.focus()
  }

  // laci menutup sendiri saat pindah halaman
  useEffect(() => setMenuTerbuka(false), [lokasi.pathname])

  // Esc menutup, fokus pindah ke tombol tutup saat dibuka, dan halaman di belakang tidak ikut ter-scroll
  useEffect(() => {
    if (!menuTerbuka) return
    const padaTombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tutupMenu()
    }
    document.addEventListener('keydown', padaTombol)
    const overflowAsli = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const fokus = window.setTimeout(() => refTombolTutup.current?.focus(), 40)
    return () => {
      document.removeEventListener('keydown', padaTombol)
      document.body.style.overflow = overflowAsli
      window.clearTimeout(fokus)
    }
  }, [menuTerbuka])

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---------------- Sidebar tetap: hanya layar lebar ---------------- */}
      <aside className="app-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col md:flex">
        <IsiSidebar grup={grup} />
      </aside>

      {/* ---------------- Laci navigasi: hanya layar sempit ---------------- */}
      {menuTerbuka && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={tutupMenu}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
          />
          <div className="app-sidebar absolute inset-y-0 left-0 flex w-[280px] max-w-[85%] flex-col shadow-drawer">
            <button
              ref={refTombolTutup}
              type="button"
              onClick={tutupMenu}
              aria-label="Tutup menu navigasi"
              className="absolute right-2 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-3 hover:bg-sunken hover:text-ink"
            >
              <X size={16} />
            </button>
            <IsiSidebar grup={grup} onPilih={() => setMenuTerbuka(false)} ringkas />
          </div>
        </div>
      )}

      {/* ---------------- Area utama ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-2 border-b border-hairline bg-panel/95 px-3 backdrop-blur md:gap-4 md:px-7">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={refTombolMenu}
              type="button"
              onClick={() => setMenuTerbuka(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={menuTerbuka}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-hairline-strong text-ink-2 hover:bg-sunken hover:text-ink md:hidden"
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-ink md:text-xl">{judul}</h1>
              <p className="truncate text-2xs text-ink-3">{keterangan}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <PencarianGlobal />
            <LoncengNotifikasi />

            <span className="hidden text-2xs text-ink-3 lg:inline">
              Cabang {pengguna?.cabang ?? dataset.meta.cabang[0]}
            </span>

            <label className="flex items-center gap-2">
              <span className="label-caps hidden sm:inline">Peran</span>
              <select
                value={role}
                onChange={(e) => gantiPeran(e.target.value as Role)}
                aria-label="Ganti peran"
                className="h-7 max-w-28 rounded-control border border-hairline-strong bg-panel px-1.5 text-2xs text-ink-2 hover:bg-sunken focus-visible:bg-panel sm:max-w-none sm:px-2"
                title="Ganti peran untuk kebutuhan demo"
              >
                {PERAN.map((r) => (
                  <option key={r} value={r}>
                    {PERAN_SINGKAT[r]}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden items-center gap-2 border-l border-hairline pl-3 xl:flex">
              <div className="text-right">
                <p className="text-2xs font-medium text-ink">{pengguna?.nama}</p>
                <p className="text-2xs text-ink-3">{pengguna?.jabatan}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={keluar}
              // label teksnya disembunyikan di layar sempit, jadi nama aksesibelnya harus eksplisit
              aria-label="Keluar"
              title="Keluar"
              className="inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-2xs text-ink-2 hover:bg-sunken hover:text-ink"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Spanduk sesi: satu tempat untuk semua modul, supaya tidak ada layar yang
            menulis data tanpa menyatakan bahwa penyimpanannya hanya bertahan selama tab ini. */}
        {jumlahUbah > 0 && (
          <div className="border-b border-attention/30 bg-attention/5 px-4 py-2 md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-start gap-2 text-2xs leading-relaxed text-ink-2">
                <CircleAlert size={13} className="mt-0.5 shrink-0 text-attention" />
                <span>
                  <span className="font-medium text-ink">{jumlahUbah} perubahan pada sesi ini</span>
                  {ringkasPerubahan(sesi) ? ` — ${ringkasPerubahan(sesi)}` : ''}.
                </span>
              </p>
              <Button variant="secondary" size="sm" onClick={sesi.reset} ikon={<RotateCcw size={13} />}>
                Kembalikan ke data demo
              </Button>
            </div>
          </div>
        )}

        <main key={sesi.versi} className="min-w-0 flex-1 px-4 py-5 md:px-7 md:py-7">
          <Outlet />
        </main>

        <footer className="border-t border-hairline px-4 py-3 md:px-5">
          <p className="text-2xs text-ink-3">Kalsara Digital Studio · Mode demo · Data contoh <a href="/photo-credits.html" className="ml-2 underline">Kredit foto</a></p>
        </footer>
      </div>
    </div>
  )
}
