import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, ExternalLink } from 'lucide-react'
import { PencarianGlobal } from '@/components/app/PencarianGlobal'
import { LoncengNotifikasi } from '@/components/app/LoncengNotifikasi'
import { navigasiUntukPeran, semuaItemNav } from './nav'
import { LABEL_PERAN, useAuth } from '@/store/auth'
import { dataset } from '@/data'
import { tanggalPanjang } from '@/lib/format'
import type { Role } from '@/data/types'

const PERAN: Role[] = ['OWNER', 'ADMIN', 'SALES']

export function AppShell() {
  const { pengguna, keluar, gantiPeran } = useAuth()
  const lokasi = useLocation()
  const role = pengguna?.role ?? 'OWNER'
  const grup = navigasiUntukPeran(role)

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

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-panel md:flex">
        <div className="border-b border-hairline px-4 py-3">
          <p className="text-xs font-semibold tracking-tight text-ink">{dataset.meta.namaShowroom}</p>
          <p className="mt-0.5 text-2xs text-ink-3">Sistem manajemen showroom · demo</p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {grup.map((g) => (
            <div key={g.judul} className="mb-4">
              <p className="label-caps px-2 pb-1.5">{g.judul}</p>
              <ul className="space-y-0.5">
                {g.item.map((item) => (
                  <li key={item.ke}>
                    <NavLink
                      to={item.ke}
                      end={item.ke === '/'}
                      className={({ isActive }) =>
                        [
                          'group relative flex h-8 items-center gap-2 rounded-control px-2 text-xs transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
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

        <div className="border-t border-hairline px-4 py-3">
          <a
            href="/katalog"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-2xs font-medium text-accent hover:underline"
          >
            <ExternalLink size={12} />
            Lihat katalog publik
          </a>
          <p className="mt-1 text-2xs leading-relaxed text-ink-3">
            Halaman yang dilihat calon pembeli — minat dari sana masuk ke CRM sebagai lead baru.
          </p>
        </div>

        <div className="border-t border-hairline px-4 py-3">
          <p className="label-caps">Hari demo</p>
          <p className="mt-0.5 text-2xs text-ink-2">{tanggalPanjang(dataset.meta.demoToday)}</p>
          <p className="mt-2 text-2xs text-ink-3">
            {dataset.vehicles.length} unit · {dataset.leads.length} lead · {dataset.sales.length} transaksi
          </p>
        </div>
      </aside>

      {/* ---------------- Area utama ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-panel px-4 md:px-5">
          <div className="min-w-0">
            <h1 className="truncate text-xs font-semibold tracking-tight text-ink">{judul}</h1>
            <p className="truncate text-2xs text-ink-3">{keterangan}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
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
                className="h-7 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-2 hover:bg-sunken focus-visible:bg-panel"
                title="Ganti peran untuk kebutuhan demo"
              >
                {PERAN.map((r) => (
                  <option key={r} value={r}>
                    {LABEL_PERAN[r]}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden items-center gap-2 border-l border-hairline pl-3 sm:flex">
              <div className="text-right">
                <p className="text-2xs font-medium text-ink">{pengguna?.nama}</p>
                <p className="text-2xs text-ink-3">{pengguna?.jabatan}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={keluar}
              className="inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-2xs text-ink-2 hover:bg-sunken hover:text-ink"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-4 md:px-5 md:py-5">
          <Outlet />
        </main>

        <footer className="border-t border-hairline px-4 py-3 md:px-5">
          <p className="text-2xs text-ink-3">{dataset.meta.catatan}</p>
        </footer>
      </div>
    </div>
  )
}
