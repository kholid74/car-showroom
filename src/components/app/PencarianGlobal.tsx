import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { cariGlobal, contohPencarian } from '@/data/agregat-laporan'

const WARNA_TIPE: Record<string, string> = {
  Unit: 'bg-accent-soft text-accent',
  Lead: 'bg-st-baru/10 text-st-baru',
  Customer: 'bg-st-inspeksi/10 text-st-inspeksi',
  Invoice: 'bg-money-pos/10 text-money-pos',
  Booking: 'bg-st-booked/10 text-st-booked',
  Biaya: 'bg-attention/10 text-attention',
}

export function PencarianGlobal() {
  const [terbuka, setTerbuka] = useState(false)
  const [kata, setKata] = useState('')
  const [sorot, setSorot] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const hasil = useMemo(() => cariGlobal(kata), [kata])
  const contoh = useMemo(() => contohPencarian(), [])

  // pintasan papan ketik: Ctrl/Cmd + K membuka, Esc menutup
  useEffect(() => {
    const padaTombol = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setTerbuka((v) => !v)
      } else if (e.key === 'Escape') {
        setTerbuka(false)
      }
    }
    window.addEventListener('keydown', padaTombol)
    return () => window.removeEventListener('keydown', padaTombol)
  }, [])

  useEffect(() => {
    if (!terbuka) return
    setKata('')
    setSorot(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [terbuka])

  useEffect(() => setSorot(0), [kata])

  const buka = (ke: string) => {
    setTerbuka(false)
    navigate(ke)
  }

  const padaInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSorot((s) => Math.min(s + 1, Math.max(0, hasil.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSorot((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter' && hasil[sorot]) {
      e.preventDefault()
      buka(hasil[sorot].ke)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        aria-label="Cari di seluruh sistem"
        title="Cari unit, lead, customer, invoice (Ctrl+K)"
        className="inline-flex h-7 items-center gap-2 rounded-control border border-hairline-strong bg-panel px-2 text-2xs text-ink-3 hover:bg-sunken hover:text-ink"
      >
        <Search size={14} />
        <span className="hidden md:inline">Cari unit, lead, invoice…</span>
        <span className="hidden rounded border border-hairline px-1 py-0.5 text-2xs text-ink-3 lg:inline">Ctrl K</span>
      </button>

      {terbuka && (
        <div
          role="dialog"
          aria-label="Pencarian global"
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/25 px-4 pt-20"
          onClick={() => setTerbuka(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-panel border border-hairline-strong bg-panel shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
              <Search size={15} className="shrink-0 text-ink-3" />
              <input
                ref={inputRef}
                value={kata}
                onChange={(e) => setKata(e.target.value)}
                onKeyDown={padaInput}
                placeholder="Ketik minimal 2 huruf: ID unit, nama, nomor invoice, vendor…"
                aria-label="Kata kunci pencarian"
                className="h-7 min-w-0 flex-1 bg-transparent text-xs text-ink placeholder:text-ink-3 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                aria-label="Tutup pencarian"
                className="shrink-0 rounded-control p-1 text-ink-3 hover:bg-sunken hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {kata.trim().length < 2 ? (
                <div className="px-3 py-3">
                  <p className="text-2xs text-ink-3">
                    Pencarian mencakup unit, lead, customer, invoice, booking, dan biaya operasional.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {contoh.map((c) => (
                      <button
                        key={c.q}
                        type="button"
                        onClick={() => setKata(c.q)}
                        className="rounded-pill border border-hairline px-2 py-1 text-2xs text-ink-2 hover:bg-sunken hover:text-ink"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : hasil.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-ink-3">
                  Tidak ada yang cocok dengan "{kata.trim()}". Coba potongan ID, nama customer, atau nomor polisi.
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {hasil.map((h, i) => (
                    <li key={`${h.tipe}-${h.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setSorot(i)}
                        onClick={() => buka(h.ke)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${
                          i === sorot ? 'bg-accent-soft' : 'hover:bg-sunken'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`shrink-0 rounded-pill px-1.5 py-0.5 text-2xs font-medium ${WARNA_TIPE[h.tipe] ?? 'bg-sunken text-ink-2'}`}>
                            {h.tipe}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs text-ink">{h.judul}</span>
                            <span className="mt-0.5 block truncate text-2xs text-ink-3">{h.keterangan}</span>
                          </span>
                        </span>
                        {i === sorot && <CornerDownLeft size={13} className="shrink-0 text-accent" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-hairline px-3 py-2 text-2xs text-ink-3">
              <span>↑ ↓ pilih · Enter buka · Esc tutup</span>
              <span>{hasil.length > 0 && `${hasil.length} hasil`}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
