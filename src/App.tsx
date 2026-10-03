import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './app/AppShell'
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
import { ModulBerikutnya } from '@/routes/ModulBerikutnya'
import type { ReactNode } from 'react'

function ButuhMasuk({ children }: { children: ReactNode }) {
  const { pengguna } = useAuth()
  const lokasi = useLocation()
  if (!pengguna) return <Navigate to="/login" state={{ dari: lokasi.pathname }} replace />
  return <>{children}</>
}

/** Modul yang antarmukanya dibangun pada fase berikutnya (dihapus pada F10). */
const JALUR_MENYUSUL = [
  '/booking', '/penjualan', '/finance', '/biaya', '/laporan', '/performa',
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="/procurement" element={<ProcurementPage />} />
          <Route path="/inspeksi" element={<InspeksiPage />} />
          <Route path="/reconditioning" element={<ReconditioningPage />} />
          <Route path="/dokumen" element={<DokumenPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/crm/:leadId" element={<LeadDetailPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/customer/:customerId" element={<CustomerDetailPage />} />
          {JALUR_MENYUSUL.map((jalur) => (
            <Route key={jalur} path={jalur} element={<ModulBerikutnya jalur={jalur} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
