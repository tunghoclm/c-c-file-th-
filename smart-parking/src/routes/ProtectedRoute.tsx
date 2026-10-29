import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useParkingStore } from '@/stores/useParkingStore';
import { routesByRole } from '@/services/domain';
import { ShieldX } from 'lucide-react';
export function ProtectedRoute() {
  const { auth, db } = useParkingStore(),
    location = useLocation();
  const user = db.accounts.find((a) => a.id === auth?.accountId);
  if (!auth || auth.expiresAt <= Date.now() || !user || user.status !== 'Hoạt động')
    return <Navigate to="/login" replace />;
  const route = location.pathname.split('/')[1];
  if (!db.permissions[user.role].view || !routesByRole[user.role].includes(route))
    return (
      <div className="access-denied">
        <ShieldX size={50} />
        <h1>Không có quyền truy cập</h1>
        <p>Vai trò hiện tại chưa được cấp quyền xem màn hình này.</p>
        <a href="/dashboard">Về tổng quan</a>
        <button onClick={() => useParkingStore.getState().logout()}>Đăng xuất</button>
      </div>
    );
  return <Outlet />;
}
