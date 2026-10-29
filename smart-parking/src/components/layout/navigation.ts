import {
  LayoutDashboard,
  Monitor,
  CarFront,
  Ticket,
  UsersRound,
  History,
  ChartNoAxesCombined,
  BellRing,
  Cctv,
  Settings,
} from 'lucide-react';
export const navigation = [
  { path: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, group: 'VẬN HÀNH' },
  { path: 'monitoring', label: 'Giám sát bãi xe', icon: Monitor },
  { path: 'vehicles', label: 'Quản lý xe', icon: CarFront },
  { path: 'tickets', label: 'Quản lý vé xe', icon: Ticket },
  { path: 'customers', label: 'Khách hàng', icon: UsersRound },
  { path: 'history', label: 'Lịch sử vào / ra', icon: History, group: 'THỐNG KÊ & QUẢN TRỊ' },
  { path: 'reports', label: 'Doanh thu & báo cáo', icon: ChartNoAxesCombined },
  { path: 'alerts', label: 'Cảnh báo & sự kiện', icon: BellRing },
  { path: 'devices', label: 'Quản lý thiết bị', icon: Cctv },
  { path: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
];
