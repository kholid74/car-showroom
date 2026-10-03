import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronRight, CircleAlert, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'
import { dataset, DEMO_TODAY } from '@/data'
import { Money } from '@/components/ui/Money'
import { Button } from '@/components/ui/Button'
import { SlotFoto } from './KatalogPage'
import { usePermintaanStore } from '@/store/inquiry'
import { jarakHari, kilometer, rupiahRingkas, tanggalPendek } from '@/lib/format'
import type { StatusDokumen, TipePembayaran } from '@/data/types'

const WARNA_DOKUMEN: Record<StatusDokumen, string> = {
  Tersedia: 'bg-money-pos',
  Menunggu: 'bg-attention',
  'Belum Ada': 'bg-danger',
}

export function KatalogDetailPage() {
  const { id } = useParams()
  const kirim = usePermintaanStore((s) => s.kirim)

  const unit = useMemo(() => dataset.vehicles.find((v) => v.id === id), [id])
  const inspeksi = useMemo(() => dataset.inspections.find((i) => i.vehicleId === id), [id])
  const rekon = useMemo(() => dataset.reconditionings.find((r) => r.vehicleId === id), [id])
  const dokumen = useMemo(() => dataset.documents.find((d) => d.vehicleId === id), [id])

  const [nama, setNama] = useState('')
  const [telepon, setTelepon] = useState('')
  const [bayar, setBayar] = useState<TipePembayaran>('Kredit')
  const [pesan, setPesan] = useState('')
  const [galat, setGalat] = useState<string[]>([])
  const [hasil, setHasil] = useState<{ id: string; salesPIC: string; followUp: string } | null>(null)
  const [catatanWa, setCatatanWa] = useState(false)

  if (!unit) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-2">Unit dengan kode {id} tidak ditemukan di katalog.</p>
        <p className="mt-1 text-2xs text-ink-3">Kemungkinan unit sudah terjual atau tautannya tidak lengkap.</p>
        <Link to="/katalog" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          <ArrowLeft size={13} /> Kembali ke semua unit
        </Link>
      </div>
    )
  }

  const serupa = dataset.vehicles
    .filter((v) => v.id !== unit.id && v.status === 'READY' && (v.brand === unit.brand || v.kelas === unit.kelas))
    .sort((a, b) => Math.abs(a.listingPrice - unit.listingPrice) - Math.abs(b.listingPrice - unit.listingPrice))
    .slice(0, 3)

  const temuan = inspeksi?.sections
    .flatMap((s) => s.item.filter((i) => i.hasil !== 'GOOD'))
    .slice(0, 3) ?? []

  const kirimFormulir = () => {
    const masalah: string[] = []
    if (nama.trim().length < 2) masalah.push('Nama minimal 2 huruf.')
    if (telepon.replace(/\D/g, '').length < 9) masalah.push('Nomor telepon minimal 9 angka.')
    setGalat(masalah)
    if (masalah.length) return
    const lead = kirim({
      nama,
      telepon,
      pesan,
      vehicleId: unit.id,
      tipePembayaran: bayar,
      budget: unit.listingPrice,
    })
    setHasil({ id: lead.id, salesPIC: lead.salesPIC, followUp: lead.nextFollowUp ?? DEMO_TODAY })
    setNama('')
    setTelepon('')
    setPesan('')
  }

  return (
    <div className="space-y-6">
      <Link to="/katalog" className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink-2 hover:text-accent">
        <ArrowLeft size={13} /> Semua unit
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-panel border border-hairline bg-pub-panel">
            <SlotFoto unit={unit} tinggi="aspect-[16/9]" />
            <div className="border-t border-hairline p-4">
              <p className="text-2xs text-ink-3">
                {unit.tahun} · {unit.kelas} · {unit.warna} · {unit.cabang}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                {unit.brand} {unit.model}
              </h1>
              <p className="mt-0.5 text-xs text-ink-2">{unit.variant}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-money-pos/10 px-2 py-1 text-2xs font-medium text-money-pos">
                <ShieldCheck size={12} />
                {inspeksi ? `Sudah diinspeksi (skor ${inspeksi.skor}/100) dan direconditioning · siap dijual` : 'Sudah direconditioning · siap dijual'}
              </p>
            </div>
          </div>

          <section className="rounded-panel border border-hairline bg-pub-panel">
            <h2 className="border-b border-hairline px-4 py-2.5 text-xs font-semibold tracking-tight text-ink">
              Spesifikasi unit
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3">
              {[
                { label: 'Tahun', nilai: String(unit.tahun) },
                { label: 'Kilometer', nilai: kilometer(unit.kilometer) },
                { label: 'Transmisi', nilai: unit.transmisi === 'AT' ? 'Matic (AT)' : 'Manual (MT)' },
                { label: 'Bahan bakar', nilai: unit.bahanBakar },
                { label: 'Warna', nilai: unit.warna },
                { label: 'Kelas', nilai: unit.kelas },
                { label: 'Nomor polisi', nilai: unit.nomorPolisi },
                { label: 'Cabang', nilai: unit.cabang },
                { label: 'Kode unit', nilai: unit.id },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-2xs text-ink-3">{s.label}</dt>
                  <dd className="mt-0.5 text-xs text-ink">{s.nilai}</dd>
                </div>
              ))}
            </dl>
          </section>

          {inspeksi && (
            <section className="rounded-panel border border-hairline bg-pub-panel">
              <h2 className="border-b border-hairline px-4 py-2.5 text-xs font-semibold tracking-tight text-ink">
                Hasil inspeksi saat unit masuk
              </h2>
              <div className="p-4">
                <p className="text-2xs leading-relaxed text-ink-3">
                  Ini catatan kondisi unit ketika diterima, bukan kondisi hari ini. Seluruh temuan di bawah sudah
                  ditangani pada tahap reconditioning sebelum unit dinyatakan siap dijual.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span>
                    <span className="block text-2xs text-ink-3">Skor keseluruhan</span>
                    <span className="tnum text-lg font-semibold text-ink">{inspeksi.skor}<span className="text-2xs text-ink-3"> /100</span></span>
                  </span>
                  <span className="text-2xs text-ink-2">
                    {inspeksi.ringkasan.good} item baik · {inspeksi.ringkasan.attention} perlu diperhatikan ·{' '}
                    {inspeksi.ringkasan.repair} perlu perbaikan
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-2">{inspeksi.rekomendasi}</p>

                {temuan.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
                    {temuan.map((t) => (
                      <li key={t.item} className="flex items-start gap-2 text-2xs text-ink-2">
                        <CircleAlert size={12} className="mt-0.5 shrink-0 text-attention" />
                        <span>
                          <span className="text-ink">{t.item}</span> — {t.catatan}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {rekon && (
            <section className="rounded-panel border border-hairline bg-pub-panel">
              <h2 className="flex items-center gap-1.5 border-b border-hairline px-4 py-2.5 text-xs font-semibold tracking-tight text-ink">
                <Wrench size={13} className="text-ink-3" />
                Pekerjaan yang sudah dikerjakan
              </h2>
              <ul className="divide-y divide-hairline">
                {rekon.items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-ink-2">{i.job}</p>
                      <p className="mt-0.5 text-2xs text-ink-3">{i.vendor}</p>
                    </div>
                    <span className="shrink-0 text-2xs text-ink-3">
                      {i.status === 'COMPLETED' ? 'selesai' : i.status === 'IN PROGRESS' ? 'dikerjakan' : 'dijadwalkan'} ·{' '}
                      {tanggalPendek(i.selesai || i.mulai)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
                Rincian biaya perbaikan tidak ditampilkan di katalog publik — informasi itu ada di sistem internal
                showroom karena termasuk harga pokok unit.
              </p>
            </section>
          )}

          {dokumen && (
            <section className="rounded-panel border border-hairline bg-pub-panel">
              <h2 className="border-b border-hairline px-4 py-2.5 text-xs font-semibold tracking-tight text-ink">
                Kelengkapan dokumen
              </h2>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2 p-4 sm:grid-cols-2">
                {dokumen.checklist.map((d) => (
                  <li key={d.nama} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-2xs text-ink-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-pill ${WARNA_DOKUMEN[d.status]}`} />
                      <span className="truncate">{d.nama}</span>
                    </span>
                    <span className="shrink-0 text-2xs text-ink-3">{d.status}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-3">
                Dokumen fisik diperlihatkan saat peninjauan unit dan serah terima. Nomor dokumen tidak ditampilkan di
                katalog publik.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-panel border border-hairline bg-pub-panel p-4">
            <p className="text-2xs text-ink-3">Harga penawaran</p>
            <Money nilai={unit.listingPrice} ukuran="xl" nada="kuat" />
            <p className="mt-1 text-2xs text-ink-3">
              Harga akhir bisa berbeda setelah peninjauan dan negosiasi. Estimasi angsuran tersedia saat pengajuan
              kredit.
            </p>

            {hasil ? (
              <div className="mt-4 rounded-control border border-money-pos/30 bg-money-pos/10 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-money-pos">
                  <CheckCircle2 size={14} />
                  Minat Anda sudah masuk ke CRM
                </p>
                <p className="mt-1.5 text-2xs leading-relaxed text-ink-2">
                  Nomor lead <span className="id-chip text-ink">{hasil.id}</span>, ditugaskan ke{' '}
                  <span className="text-ink">{hasil.salesPIC}</span>, jadwal follow-up{' '}
                  <span className="text-ink">{tanggalPendek(hasil.followUp)}</span> ({jarakHari(hasil.followUp, DEMO_TODAY)}).
                </p>
                <p className="mt-2 text-2xs leading-relaxed text-ink-3">
                  Demo ini tidak punya backend: lead disimpan di tab browser ini (bertahan meski halaman dimuat ulang,
                  hilang saat tab ditutup) dan tidak dikirim ke server mana pun.
                </p>
                <Link
                  to="/crm"
                  className="mt-2 inline-flex items-center gap-1 text-2xs font-medium text-accent hover:underline"
                >
                  Lihat lead di CRM (perlu masuk sebagai sales/owner) <ChevronRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <label className="block">
                  <span className="text-2xs text-ink-2">Nama</span>
                  <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    aria-label="Nama"
                    className="mt-1 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink"
                  />
                </label>
                <label className="block">
                  <span className="text-2xs text-ink-2">Nomor WhatsApp / telepon</span>
                  <input
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    inputMode="tel"
                    aria-label="Nomor telepon"
                    className="mt-1 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink"
                  />
                </label>
                <label className="block">
                  <span className="text-2xs text-ink-2">Rencana pembayaran</span>
                  <select
                    value={bayar}
                    onChange={(e) => setBayar(e.target.value as TipePembayaran)}
                    aria-label="Rencana pembayaran"
                    className="mt-1 h-8 w-full rounded-control border border-hairline-strong bg-panel px-2 text-xs text-ink-2"
                  >
                    <option value="Cash">Tunai (Cash)</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-2xs text-ink-2">Pesan (opsional)</span>
                  <textarea
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    rows={3}
                    aria-label="Pesan"
                    placeholder="Contoh: ingin lihat unit akhir pekan ini, siap DP 20%."
                    className="mt-1 w-full rounded-control border border-hairline-strong bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-3"
                  />
                </label>

                {galat.length > 0 && (
                  <ul className="space-y-1 rounded-control border border-danger/30 bg-danger/5 p-2">
                    {galat.map((g) => (
                      <li key={g} className="text-2xs text-danger">{g}</li>
                    ))}
                  </ul>
                )}

                <Button variant="primary" className="w-full" onClick={kirimFormulir}>
                  Ajukan minat pada unit ini
                </Button>
              </div>
            )}

            {/* tombol WhatsApp tetap tersedia sebelum maupun sesudah mengirim minat */}
            <div className="mt-2.5 space-y-2.5">
              <Button
                variant="secondary"
                className="w-full"
                ikon={<MessageCircle size={14} />}
                onClick={() => setCatatanWa(true)}
              >
                Hubungi via WhatsApp
              </Button>

              {catatanWa && (
                <p className="rounded-control border border-attention/30 bg-attention/5 p-2 text-2xs leading-relaxed text-ink-2">
                  Nomor WhatsApp showroom sengaja tidak diisi pada data demo ini — kami tidak menampilkan nomor
                  karangan. Kirim minat lewat formulir di atas; di sistem nyata tombol ini membuka percakapan WhatsApp
                  yang tercatat otomatis sebagai lead.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-panel border border-hairline bg-pub-panel p-4">
            <p className="text-2xs font-medium text-ink-2">Yang Anda dapat dari sistem ini</p>
            <ul className="mt-2 space-y-1.5 text-2xs leading-relaxed text-ink-3">
              <li>· Riwayat inspeksi dan pekerjaan perbaikan unit ini, bukan hanya klaim "berkualitas".</li>
              <li>· Kelengkapan dokumen apa adanya, termasuk yang masih dalam proses.</li>
              <li>· Follow-up terjadwal: satu sales memegang lead Anda sampai serah terima.</li>
            </ul>
          </div>
        </aside>
      </div>

      {serupa.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-tight text-ink">Unit lain yang mirip</h2>
          <p className="mt-0.5 text-2xs text-ink-3">
            {unit.brand} atau kelas {unit.kelas} dengan harga paling dekat dengan unit ini.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serupa.map((v) => (
              <li key={v.id}>
                <Link
                  to={`/katalog/${v.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-panel border border-hairline bg-pub-panel hover:border-hairline-strong"
                >
                  <SlotFoto unit={v} />
                  <div className="flex flex-1 flex-col p-3.5">
                    <p className="text-2xs text-ink-3">{v.tahun} · {kilometer(v.kilometer)} · {v.transmisi}</p>
                    <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-ink group-hover:text-accent">
                      {v.brand} {v.model}
                    </h3>
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-hairline pt-3">
                      <Money nilai={v.listingPrice} ukuran="md" nada="kuat" />
                      <span className="text-2xs text-ink-3">
                        {Math.abs(v.listingPrice - unit.listingPrice) < 2_000_000
                          ? 'harga hampir sama'
                          : `${v.listingPrice > unit.listingPrice ? 'lebih mahal' : 'lebih murah'} ${rupiahRingkas(Math.abs(v.listingPrice - unit.listingPrice))}`}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-2xs text-ink-3">
        Data unit, inspeksi, dan dokumen di halaman ini sintetis dan berasal dari dataset yang sama dengan sistem
        internal showroom — bukan berkas pemasaran terpisah.
      </p>
    </div>
  )
}
