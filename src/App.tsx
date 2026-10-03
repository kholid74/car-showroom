import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { peranUntukJalur } from './app/nav'
import { TidakBerhak } from '@/routes/TidakBerhak'
import { useAuth } from '@/store/auth'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { InventoryPage } from '@/routes/InventoryPage'
import { VehicleDetailPage } from '@/routes/VehicleDetailPage'
import { ProcurementPage } from '@/routes/ProcurementPage'
import { InspeksiPage } from '@/routes/InspeksiPage'
import { ReconditioningPage } from '@/routes/ReconditioningPage'
import { DokumenPage } from '@/routes/DokumenPage'
import { CrmPage } from '@/routes/CrmPage'
import { LeadDetailPage } from '@/routes/LeadDetailPage'
import { CustomerPage } from '@/routes/CustomerPage'
import { CustomerDetailPage } from '@/routes/CustomerDetailPage'
import { BookingPage } from '@/routes/BookingPage'
import { PenjualanPage } from '@/routes/PenjualanPage'
import { FinancePage } from '@/routes/FinancePage'
import { BiayaPage } from '@/routes/BiayaPage'
import { LaporanPage } from '@/routes/LaporanPage'
import { PerformaPage } from '@/routes/PerformaPage'
import { PublicShell } from '@/app/PublicShell'
import { KatalogPage } from '@/routes/public/KatalogPage'
import { KatalogDetailPage } from '@/routes/public/KatalogDetailPage'
import type { ReactNode } from 'react'

function ButuhMasuk({ children }: { children: ReactNode }) {
  const { pengguna } = useAuth()
  const lokasi = useLocation()
  if (!pengguna) return <Navigate to="/login" state={{ dari: lokasi.pathname }} replace />
  return <>{children}</>
}

/** Penjaga peran untuk satu jalur — daftar perannya diambil dari nav.ts, bukan ditulis ulang. */
function Berhak({ jalur, children }: { jalur: string; children: ReactNode }) {
  const { pengguna } = useAuth()
  const peran = peranUntukJalur(jalur)
  if (peran && pengguna && !peran.includes(pengguna.role)) {
    return <TidakBerhak jalur={jalur} peran={peran} />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Sisi publik: katalog yang dilihat calon pembeli, tanpa login */}
        <Route element={<PublicShell />}>
          <Route path="/katalog" element={<KatalogPage />} />
          <Route path="/katalog/:id" element={<KatalogDetailPage />} />
        </Route>

        <Route
          element={
            <ButuhMasuk>
              <AppShell />
            </ButuhMasuk>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/:id" element={<VehicleDetailPage />} />
          <Route path="/procurement" element={<Berhak jalur="/procurement"><ProcurementPage /></Berhak>} />
          <Route path="/inspeksi" element={<Berhak jalur="/inspeksi"><InspeksiPage /></Berhak>} />
          <Route path="/reconditioning" element={<Berhak jalur="/reconditioning"><ReconditioningPage /></Berhak>} />
          <Route path="/dokumen" element={<Berhak jalur="/dokumen"><DokumenPage /></Berhak>} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/crm/:leadId" element={<LeadDetailPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/customer/:customerId" element={<CustomerDetailPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/penjualan" element={<PenjualanPage />} />
          <Route path="/finance" element={<Berhak jalur="/finance"><FinancePage /></Berhak>} />
          <Route path="/biaya" element={<Berhak jalur="/biaya"><BiayaPage /></Berhak>} />
          <Route path="/laporan" element={<Berhak jalur="/laporan"><LaporanPage /></Berhak>} />
          <Route path="/performa" element={<Berhak jalur="/performa"><PerformaPage /></Berhak>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
