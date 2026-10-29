import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { navigation } from './navigation';
import { useParkingStore, useUser } from '@/stores/useParkingStore';
import { routesByRole } from '@/services/domain';
import { searchText } from '@/utils/format';
import { FormDialog } from '@/components/common/FormDialog';
export function Header({ onToggle }: { onToggle: () => void }) {
  const { db, logout, changePassword } = useParkingStore(),
    user = useUser(),
    location = useLocation(),
    navigate = useNavigate();
  const [query, setQuery] = useState(''),
    [menu, setMenu] = useState(''),
    [password, setPassword] = useState(false);
  const title =
    navigation.find((n) => location.pathname.startsWith('/' + n.path))?.label || 'Smart Parking';
  const alerts = db.alerts.filter((a) => a.status === 'Chưa xử lý');
  const results = navigation.filter(
    (n) =>
      user &&
      routesByRole[user.role].includes(n.path) &&
      searchText(n.label).includes(searchText(query)),
  );
  return (
    <header className="app-header">
      <div className="breadcrumb">
        <button aria-label="Đóng/mở menu" onClick={onToggle}>
          <Menu size={21} />
        </button>
        <span>Hệ thống</span>
        <ChevronRight size={14} />
        <b>{title}</b>
      </div>
      <div className="header-tools">
        <div className="quick-search">
          <Search size={17} />
          <input
            aria-label="Tìm nhanh trang"
            placeholder="Tìm kiếm nhanh..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('');
              if (e.key === 'Enter' && results[0]) {
                navigate('/' + results[0].path);
                setQuery('');
              }
            }}
          />
          <kbd>↵</kbd>
          {query && (
            <div className="popover quick-results">
              {results.length ? (
                results.map((n) => (
                  <button
                    key={n.path}
                    onClick={() => {
                      navigate('/' + n.path);
                      setQuery('');
                    }}
                  >
                    <n.icon size={17} />
                    {n.label}
                    <ChevronRight size={14} />
                  </button>
                ))
              ) : (
                <p>Không tìm thấy trang phù hợp.</p>
              )}
            </div>
          )}
        </div>
        <span className="system-status">
          <span className="live-dot" />
          {db.devices.every((d) => d.status === 'Trực tuyến')
            ? 'Hệ thống ổn định'
            : db.devices.filter((d) => d.status !== 'Trực tuyến').length + ' thiết bị cần kiểm tra'}
        </span>
        <div className="dropdown-wrap">
          <button
            className="notification-button"
            aria-label="Thông báo"
            aria-expanded={menu === 'notifications'}
            onClick={() => setMenu(menu === 'notifications' ? '' : 'notifications')}
          >
            <Bell size={21} />
            {alerts.length > 0 && <i />}
          </button>
          {menu === 'notifications' && (
            <>
              <button
                className="popover-backdrop"
                aria-label="Đóng thông báo"
                onClick={() => setMenu('')}
              />
              <div className="popover notifications">
                <h3>
                  Thông báo <span className="count-pill">{alerts.length}</span>
                </h3>
                {alerts.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to={
                      user && routesByRole[user.role].includes('alerts') ? '/alerts' : '/dashboard'
                    }
                    onClick={() => setMenu('')}
                  >
                    <span className="notice-dot" />
                    <div>
                      <b>{a.type}</b>
                      <small>{a.subject}</small>
                    </div>
                  </Link>
                ))}
                {!alerts.length && <p>Không có thông báo mới.</p>}
              </div>
            </>
          )}
        </div>
        <div className="header-divider" />
        <div className="dropdown-wrap">
          <button
            className="user-button"
            aria-expanded={menu === 'user'}
            onClick={() => setMenu(menu === 'user' ? '' : 'user')}
          >
            <span className="avatar">
              {user?.name
                .split(' ')
                .slice(-2)
                .map((s) => s[0])
                .join('')}
            </span>
            <span>
              <b>{user?.name}</b>
              <small>{user?.role === 'Admin' ? 'Quản trị viên' : user?.role}</small>
            </span>
            <ChevronDown size={15} />
          </button>
          {menu === 'user' && (
            <>
              <button
                className="popover-backdrop"
                aria-label="Đóng menu tài khoản"
                onClick={() => setMenu('')}
              />
              <div className="popover user-menu">
                <div>
                  <UserRound size={17} />
                  {user?.username}
                </div>
                <button
                  onClick={() => {
                    setPassword(true);
                    setMenu('');
                  }}
                >
                  <ShieldCheck size={17} />
                  Đổi mật khẩu demo
                </button>
                <button onClick={logout}>
                  <LogOut size={17} />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <FormDialog
        open={password}
        onClose={() => setPassword(false)}
        title="Đổi mật khẩu demo"
        values={{ old: '', password: '' }}
        fields={[
          { name: 'old', label: 'Mật khẩu hiện tại', type: 'password', required: true, full: true },
          {
            name: 'password',
            label: 'Mật khẩu mới',
            type: 'password',
            required: true,
            full: true,
            hint: 'Tối thiểu 8 ký tự, có chữ hoa và số.',
          },
        ]}
        onSave={(v) => changePassword(v.old, v.password)}
      />
    </header>
  );
}
