import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Car } from 'lucide-react'
import { dataset } from '@/data'


/**
 * Kerangka katalog publik: sisi yang dilihat calon pembeli.
 * Serapan terbatas Arah B — kanvas putih dan bilah gelap — tetapi tetap memakai
 * keluarga token yang sama dengan ERP, bukan sistem desain kedua.
 */
export function PublicShell() {
  return (
    <div className="flex min-h-screen flex-col bg-pub-canvas">
      <header className="sticky top-0 z-20 bg-pub-chrome">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/katalog" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-pub-accent">
              <Car size={16} className="text-white" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold tracking-tight text-white">
                {dataset.meta.namaShowroom}
              </span>
              <span className="block truncate text-2xs text-white/60">
                Katalog unit tersedia · {dataset.meta.cabang.join(' & ')}
              </span>
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/katalog"
              className="rounded-control px-2.5 py-1.5 text-2xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              Semua unit
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-control bg-white/10 px-2.5 py-1.5 text-2xs text-white hover:bg-white/20"
            >
              <ArrowLeft size={13} />
              Ruang kerja showroom
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-hairline bg-pub-panel">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <p className="text-2xs font-medium text-ink-2">
            {dataset.meta.namaShowroom} · demo katalog publik
          </p>
          <p className="mt-1 max-w-3xl text-2xs leading-relaxed text-ink-3">
            Stok dan transaksi pada situs ini merupakan data contoh. Foto merupakan ilustrasi model; tahun, warna, dan varian dapat berbeda. <a href="/photo-credits.html" className="underline">Kredit & lisensi foto</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}
