import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, CircleParking, Headphones, PanelLeftClose } from 'lucide-react';
import { useState } from 'react';
import { navigation } from './navigation';
import { routesByRole } from '@/services/domain';
import { useParkingStore, useUser } from '@/stores/useParkingStore';
import { toast } from 'sonner';
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useUser(),
    db = useParkingStore((s) => s.db),
    [subOpen, setSubOpen] = useState(true),
    location = useLocation();
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <NavLink to="/dashboard" className="brand">
        <span className="brand-mark">
          <CircleParking size={30} />
        </span>
        <span>
          Smart<span className="brand-blue">Parking</span>
          <small>QUẢN LÝ BÃI XE THÔNG MINH</small>
        </span>
      </NavLink>
      <div className="workspace-label">
        <span className="workspace-symbol">
          {db.settings.logo ? <img src={db.settings.logo} alt="Logo bãi xe" /> : 'SP'}
        </span>
        <div>
          <b>{db.settings.name}</b>
          <small>
            <span className="live-dot" />
            Đang hoạt động
          </small>
        </div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {navigation
          .filter(
            (n) =>
              user && db.permissions[user.role].view && routesByRole[user.role].includes(n.path),
          )
          .map((n) => (
            <div key={n.path}>
              {n.group && <div className="nav-group">{n.group}</div>}
              <NavLink
                title={n.label}
                to={'/' + n.path}
                className={({ isActive }) => 'nav-item ' + (isActive ? 'active' : '')}
              >
                <n.icon size={19} />
                <span>{n.label}</span>
                {n.path === 'alerts' && (
                  <b className="nav-count">
                    {db.alerts.filter((a) => a.status === 'Chưa xử lý').length}
                  </b>
                )}
                {n.path === 'settings' && (
                  <button
                    type="button"
                    aria-label="Đóng/mở mục cài đặt"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSubOpen(!subOpen);
                    }}
                  >
                    <ChevronDown size={15} className={subOpen ? '' : 'rotate'} />
                  </button>
                )}
              </NavLink>
              {n.path === 'settings' &&
                location.pathname === '/settings' &&
                subOpen &&
                !collapsed && (
                  <div className="subnav">
                    {[
                      ['general', 'Thông tin bãi xe'],
                      ['fees', 'Cấu hình giá vé'],
                      ['accounts', 'Tài khoản'],
                      ['permissions', 'Phân quyền'],
                      ['security', 'Bảo mật'],
                      ['logs', 'Nhật ký'],
                    ].map(([tab, label]) => (
                      <NavLink key={tab} to={'/settings?tab=' + tab}>
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
            </div>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className="help-card"
          onClick={() =>
            toast.info('Hỗ trợ vận hành: ' + db.settings.email + ' · ' + db.settings.phone)
          }
        >
          <Headphones size={20} />
          <span>
            <b>Cần hỗ trợ?</b>
            <small>Liên hệ đội ngũ quản trị</small>
          </span>
        </button>
        <div className="sidebar-foot">
          <span>
            Smart Parking <b>v1.0</b>
          </span>
          <button aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} onClick={onToggle}>
            {collapsed ? <ChevronLeft size={19} /> : <PanelLeftClose size={19} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
