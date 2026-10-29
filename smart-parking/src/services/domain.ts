import type { Database, FeeRule, ParkingSession, Role, Ticket } from '@/types';
import { dateInput, normalizePlate, plateValid } from '@/utils/format';
export const routesByRole: Record<Role, string[]> = {
  Admin: [
    'dashboard',
    'monitoring',
    'vehicles',
    'tickets',
    'customers',
    'history',
    'reports',
    'alerts',
    'devices',
    'settings',
  ],
  'Quản lý': [
    'dashboard',
    'monitoring',
    'vehicles',
    'tickets',
    'customers',
    'history',
    'reports',
    'alerts',
    'devices',
  ],
  'Bảo vệ': ['dashboard', 'monitoring', 'history', 'alerts'],
  'Thu ngân': ['dashboard', 'tickets', 'customers', 'history', 'reports'],
};
export function nextId(prefix: string, items: { id: string }[]) {
  return (
    prefix +
    String(Math.max(0, ...items.map((x) => Number(x.id.replace(prefix, '')) || 0)) + 1).padStart(
      4,
      '0',
    )
  );
}
export function ticketStatus(ticket: Ticket, today = dateInput()) {
  if (['Bị khóa', 'Đã trả'].includes(ticket.status)) return ticket.status;
  if (ticket.type === 'Vé tháng') {
    if (ticket.expiresAt < today) return 'Hết hạn';
    if (ticket.startsAt > today) return 'Chưa hiệu lực';
  }
  return 'Hoạt động';
}
export function calculateFee(
  session: Pick<ParkingSession, 'ticketType' | 'entryAt' | 'rate'>,
  exitAt: string,
) {
  if (session.ticketType === 'Vé tháng') return 0;
  const hours = Math.max(
    0,
    (new Date(exitAt).getTime() - new Date(session.entryAt).getTime()) / 3600000,
  );
  return (
    Math.max(1, Math.ceil(hours / session.rate.hours)) * session.rate.price + session.rate.surcharge
  );
}
export function selectFee(db: Database, type: FeeRule['type'], ticketType: FeeRule['ticketType']) {
  const rate = db.settings.fees.find(
    (f) => f.type === type && f.ticketType === ticketType && f.active,
  );
  if (!rate) throw new Error('Chưa có biểu phí đang áp dụng cho phương tiện này.');
  return { ...rate };
}
export function validateEntry(db: Database, plate: string, area: string) {
  if (!plateValid(plate))
    throw new Error('Biển số chưa đúng định dạng, ví dụ 30A-123.45 hoặc 59B1-123.45.');
  if (db.sessions.some((s) => !s.exitAt && normalizePlate(s.plate) === normalizePlate(plate)))
    throw new Error('Xe này đang ở trong bãi, không thể tạo hai lượt gửi.');
  const target = db.settings.areas.find((a) => a.name === area);
  if (!target || db.sessions.filter((s) => !s.exitAt && s.area === area).length >= target.capacity)
    throw new Error('Khu vực đã hết chỗ trống.');
  if (
    db.alerts.some(
      (a) =>
        a.type === 'Biển số trong danh sách đen' &&
        a.status !== 'Đã xử lý' &&
        normalizePlate(a.subject) === normalizePlate(plate),
    )
  )
    throw new Error('Biển số đang nằm trong danh sách đen.');
  const vehicle = db.vehicles.find((v) => normalizePlate(v.plate) === normalizePlate(plate));
  if (vehicle?.status === 'Bị khóa') throw new Error('Hồ sơ phương tiện đang bị khóa.');
  return vehicle;
}
export function paidRevenue(db: Database) {
  return db.transactions
    .filter((t) => t.status === 'Đã thanh toán')
    .reduce((sum, t) => sum + t.amount, 0);
}
