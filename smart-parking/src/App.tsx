import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Login } from '@/pages/auth/Login';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { NotFound } from '@/pages/NotFound';
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ParkingMonitoring = lazy(() =>
  import('@/pages/ParkingMonitoring').then((m) => ({ default: m.ParkingMonitoring })),
);
const Vehicles = lazy(() => import('@/pages/Vehicles').then((m) => ({ default: m.Vehicles })));
const Customers = lazy(() => import('@/pages/Customers').then((m) => ({ default: m.Customers })));
const Tickets = lazy(() => import('@/pages/Tickets').then((m) => ({ default: m.Tickets })));
const ParkingHistory = lazy(() =>
  import('@/pages/ParkingHistory').then((m) => ({ default: m.ParkingHistory })),
);
const Revenue = lazy(() => import('@/pages/Revenue').then((m) => ({ default: m.Revenue })));
const Alerts = lazy(() => import('@/pages/Alerts').then((m) => ({ default: m.Alerts })));
const Devices = lazy(() => import('@/pages/Devices').then((m) => ({ default: m.Devices })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitoring" element={<ParkingMonitoring />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/history" element={<ParkingHistory />} />
            <Route path="/reports" element={<Revenue />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4500 }} />
    </BrowserRouter>
  );
}
