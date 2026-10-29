import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useParkingStore } from '@/stores/useParkingStore';
import { toast } from 'sonner';
import { LoadingState } from '@/components/common/Elements';
export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false),
    location = useLocation(),
    { auth, logout } = useParkingStore();
  useEffect(() => {
    const id = setInterval(() => {
      if (auth && auth.expiresAt <= Date.now()) {
        logout();
        toast.info('Phiên đăng nhập đã hết hạn.');
      }
    }, 10000);
    return () => clearInterval(id);
  }, [auth, logout]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="app-body">
        <Header onToggle={() => setCollapsed(!collapsed)} />
        <main className="main-content">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
          <footer className="page-footer">
            <span>
              © {new Date().getFullYear()} Smart Parking. Quản lý thông minh, vận hành an tâm.
            </span>
            <span>
              <span className="live-dot" />
              Môi trường demo
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
