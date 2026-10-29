import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Inbox, LoaderCircle, Search } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCan } from '@/stores/useParkingStore';
import type { Action } from '@/types';
export function StatusBadge({ value }: { value: string }) {
  const tone = /^(Hoạt động|Trực tuyến|Đã thanh toán|Đã xử lý|Thành công|Vé tháng)$/.test(value)
    ? 'green'
    : /khóa|Nghiêm trọng|Mất kết nối|Hết hạn|lỗi/i.test(value)
      ? 'red'
      : /Chưa|Cảnh báo|Đang/.test(value)
        ? 'amber'
        : 'blue';
  return (
    <span className={`badge badge-${tone}`}>
      <span />
      {value}
    </span>
  );
}
export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string;
  value: ReactNode;
  detail?: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon ${tone}`}>
          <Icon size={21} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-detail">
        <ArrowUpRight size={14} />
        {detail || 'Dữ liệu được đồng bộ tức thời'}
      </div>
    </div>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel chart-card">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
export function DateRangePicker({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="date-range">
      <label>
        Từ ngày
        <input
          type="date"
          aria-label="Từ ngày"
          value={from}
          max={to || undefined}
          onChange={(e) => onFrom(e.target.value)}
        />
      </label>
      <span>—</span>
      <label>
        Đến ngày
        <input
          type="date"
          aria-label="Đến ngày"
          min={from || undefined}
          value={to}
          onChange={(e) => onTo(e.target.value)}
        />
      </label>
    </div>
  );
}
export function EmptyState({
  text = 'Không tìm thấy dữ liệu',
  description = 'Thử thay đổi từ khóa hoặc bộ lọc.',
}: {
  text?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <Inbox size={36} />
      <h3>{text}</h3>
      <p>{description}</p>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" />
      Đang tải dữ liệu...
    </div>
  );
}
export function PermissionGuard({
  action,
  route,
  children,
}: {
  action: Action;
  route?: string;
  children: ReactNode;
}) {
  return useCan(action, route) ? children : null;
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose} title={title} description={description}>
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>
          Xác nhận
        </Button>
      </div>
    </Dialog>
  );
}
export function DetailDialog({
  open,
  onClose,
  title,
  items,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { label: string; value: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose} title={title} wide>
      <div className="detail-grid">
        {items.map((item, i) => (
          <div key={i}>
            <span>{item.label}</span>
            <strong>{item.value || '—'}</strong>
          </div>
        ))}
      </div>
      {children}
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Dialog>
  );
}
export function ImagePreview({ label, plate }: { label: string; plate: string }) {
  return (
    <div className="image-preview">
      <div className="camera-photo" role="img" aria-label={`Ảnh minh họa ${label}`} />
      <span className="camera-label">{label} · MÔ PHỎNG</span>
      <strong className="plate">{plate}</strong>
    </div>
  );
}
