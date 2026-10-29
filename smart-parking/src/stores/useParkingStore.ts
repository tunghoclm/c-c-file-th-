import { create } from 'zustand';
import { createSeed } from '@/data/seed';
import type {
  Account,
  Action,
  AuthSession,
  Database,
  Entity,
  EntityKey,
  ParkingSession,
  Role,
  Ticket,
  VehicleType,
} from '@/types';
import {
  calculateFee,
  nextId,
  routesByRole,
  selectFee,
  ticketStatus,
  validateEntry,
} from '@/services/domain';
import { dateInput, normalizePlate, nowISO, plateValid } from '@/utils/format';

const DATA_KEY = 'smart-parking:data:v1';
const AUTH_KEY = 'smart-parking:auth:v1';
function readDb(): Database {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const db = JSON.parse(raw) as Database;
      if (
        db.settings?.fees &&
        db.permissions?.Admin &&
        [
          'vehicles',
          'customers',
          'tickets',
          'sessions',
          'transactions',
          'devices',
          'alerts',
          'accounts',
          'logs',
        ].every((k) => Array.isArray(db[k as EntityKey]))
      )
        return db;
    }
  } catch {
    /* The demo can recover when stored JSON is invalid. */
  }
  return createSeed();
}
function readAuth(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
    if (raw) {
      const auth = JSON.parse(raw) as AuthSession;
      if (auth.expiresAt > Date.now()) return auth;
    }
  } catch {
    /* Start signed out if storage cannot be read. */
  }
  return null;
}
interface ParkingStore {
  db: Database;
  auth: AuthSession | null;
  login: (username: string, password: string, remember: boolean) => void;
  logout: () => void;
  save: <K extends EntityKey>(key: K, entity: Entity<K>) => void;
  remove: (key: EntityKey, id: string) => void;
  enter: (
    plate: string,
    type: VehicleType,
    area: string,
    lane: string,
    ticketId?: string,
  ) => string;
  exit: (id: string, method: string, lane: string) => void;
  renew: (id: string, date: string, amount: number, method: string) => void;
  ticketAction: (id: string, action: 'lock' | 'return' | 'unlock') => void;
  resolveAlert: (id: string, note: string) => void;
  toggleDevice: (id: string) => void;
  barrier: (lane: string, open: boolean) => void;
  updateSettings: (settings: Database['settings']) => void;
  updatePermissions: (role: Role, action: Action, value: boolean) => void;
  changePassword: (old: string, password: string) => void;
  reset: () => void;
}
const prefixes: Record<EntityKey, string> = {
  vehicles: 'VEH',
  customers: 'CUS',
  tickets: 'TKT',
  devices: 'DEV',
  accounts: 'USR',
};
export const useParkingStore = create<ParkingStore>((set, get) => {
  const current = () => get().db.accounts.find((a) => a.id === get().auth?.accountId);
  const requirePermission = (action: Action, route?: string) => {
    const user = current();
    if (!user || user.status !== 'Hoạt động' || !get().auth || get().auth!.expiresAt <= Date.now())
      throw new Error('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
    if (
      !get().db.permissions[user.role][action] ||
      (route && !routesByRole[user.role].includes(route))
    )
      throw new Error('Tài khoản không có quyền thực hiện thao tác này.');
    return user;
  };
  const commit = (db: Database, action: string, content: string) => {
    const log = {
      id: nextId('LOG', db.logs),
      time: nowISO(),
      user: current()?.name || 'Hệ thống',
      action,
      content,
      status: 'Thành công',
    };
    const next = { ...db, logs: [log, ...db.logs] };
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
    } catch {
      throw new Error('Không lưu được dữ liệu. Vui lòng kiểm tra dung lượng/quyền localStorage.');
    }
    set({ db: next });
  };
  return {
    db: readDb(),
    auth: readAuth(),
    login(username, password, remember) {
      const user = get().db.accounts.find(
        (a) =>
          (a.username.toLowerCase() === username.trim().toLowerCase() ||
            a.email.toLowerCase() === username.trim().toLowerCase()) &&
          a.password === password &&
          a.status === 'Hoạt động',
      );
      if (!user)
        throw new Error('Tên đăng nhập hoặc mật khẩu chưa đúng, hoặc tài khoản đã bị khóa.');
      const auth = {
        accountId: user.id,
        expiresAt: Date.now() + get().db.settings.sessionMinutes * 60000,
      };
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_KEY);
      (remember ? localStorage : sessionStorage).setItem(AUTH_KEY, JSON.stringify(auth));
      set({ auth });
      commit(get().db, 'Đăng nhập', `Tài khoản ${user.username}`);
    },
    logout() {
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_KEY);
      set({ auth: null });
    },
    save(key, entity) {
      const db = get().db;
      const exists = db[key].some((e) => e.id === entity.id);
      requirePermission(exists ? 'edit' : 'create', key === 'accounts' ? 'settings' : key);
      let value = { ...entity, id: entity.id || nextId(prefixes[key], db[key]) } as Entity<
        typeof key
      >;
      if (key === 'vehicles') {
        const v = value as Entity<'vehicles'>;
        if (!plateValid(v.plate)) throw new Error('Biển số không đúng định dạng.');
        if (
          db.vehicles.some(
            (x) =>
              x.id !== v.id &&
              x.status === 'Hoạt động' &&
              v.status === 'Hoạt động' &&
              normalizePlate(x.plate) === normalizePlate(v.plate),
          )
        )
          throw new Error('Đã tồn tại hồ sơ xe đang hiệu lực với biển số này.');
        const old = db.vehicles.find((x) => x.id === v.id);
        if (
          old &&
          old.plate !== v.plate &&
          (db.sessions.some((s) => s.vehicleId === v.id && !s.exitAt) ||
            db.tickets.some((t) => t.vehicleId === v.id && ticketStatus(t) === 'Hoạt động'))
        )
          throw new Error('Không thể đổi biển số khi xe đang gửi hoặc còn vé hiệu lực.');
        const c = db.customers.find((x) => x.id === v.customerId);
        if (v.customerId && !c) throw new Error('Khách hàng không tồn tại.');
        value = {
          ...v,
          plate: v.plate.toUpperCase(),
          owner: c?.name || v.owner,
          phone: c?.phone || v.phone,
        };
      }
      if (key === 'customers') {
        const c = value as Entity<'customers'>;
        if (db.customers.some((x) => x.id !== c.id && x.phone === c.phone))
          throw new Error('Số điện thoại đã có trong danh sách khách hàng.');
      }
      if (key === 'tickets') {
        const t = value as Ticket;
        if (!plateValid(t.plate)) throw new Error('Biển số không đúng định dạng.');
        if (t.type === 'Vé tháng' && (!t.expiresAt || t.expiresAt < t.startsAt))
          throw new Error('Ngày hết hạn phải bằng hoặc sau ngày bắt đầu.');
        if (
          t.cardId &&
          db.tickets.some((x) => x.id !== t.id && x.cardId === t.cardId && x.status !== 'Đã trả')
        )
          throw new Error('Mã thẻ đang được sử dụng.');
        const old = db.tickets.find((x) => x.id === t.id);
        if (
          old &&
          db.sessions.some((s) => s.ticketId === t.id && !s.exitAt) &&
          (old.plate !== t.plate || old.type !== t.type || old.cardId !== t.cardId)
        )
          throw new Error('Không thể đổi biển số, loại vé hoặc mã thẻ đang được dùng trong bãi.');
        if (
          t.type === 'Vé tháng' &&
          t.status === 'Hoạt động' &&
          db.tickets.some(
            (x) =>
              x.id !== t.id &&
              x.type === 'Vé tháng' &&
              x.status === 'Hoạt động' &&
              normalizePlate(x.plate) === normalizePlate(t.plate) &&
              x.startsAt <= t.expiresAt &&
              x.expiresAt >= t.startsAt,
          )
        )
          throw new Error('Xe đã có vé tháng trùng thời hạn.');
        const v = db.vehicles.find((v) => normalizePlate(v.plate) === normalizePlate(t.plate));
        value = {
          ...t,
          vehicleId: v?.id || '',
          customerId: v?.customerId || '',
          expiresAt: t.type === 'Vé lượt' ? '' : t.expiresAt,
          sessionId: old?.sessionId || '',
        };
      }
      if (key === 'accounts') {
        const a = value as Account;
        if (
          db.accounts.some(
            (x) =>
              x.id !== a.id &&
              (x.username.toLowerCase() === a.username.toLowerCase() ||
                x.email.toLowerCase() === a.email.toLowerCase()),
          )
        )
          throw new Error('Tên đăng nhập hoặc email đã được sử dụng.');
        if (a.id === get().auth?.accountId && (a.status !== 'Hoạt động' || a.role !== 'Admin'))
          throw new Error('Không thể tự khóa hoặc hạ quyền tài khoản đang sử dụng.');
      }
      const list = exists
        ? db[key].map((e) => (e.id === value.id ? value : e))
        : [value, ...db[key]];
      const next = { ...db, [key]: list };
      if (key === 'customers') {
        const c = value as Entity<'customers'>;
        next.vehicles = db.vehicles.map((v) =>
          v.customerId === c.id ? { ...v, owner: c.name, phone: c.phone } : v,
        );
      }
      if (key === 'tickets' && !exists) {
        const t = value as Ticket;
        if (t.type === 'Vé tháng' && t.price > 0) {
          const v = db.vehicles.find((v) => v.id === t.vehicleId);
          next.transactions = [
            {
              id: nextId('TRX', db.transactions),
              sessionId: '',
              ticketId: t.id,
              plate: t.plate,
              ticketType: t.type,
              vehicleType: v?.type || 'Ô tô',
              method: 'Chuyển khoản',
              amount: t.price,
              time: nowISO(),
              employee: current()!.name,
              status: 'Đã thanh toán',
            },
            ...db.transactions,
          ];
        }
      }
      commit(next, exists ? 'Cập nhật' : 'Thêm mới', `${key}: ${value.id}`);
    },
    remove(key, id) {
      requirePermission('delete', key === 'accounts' ? 'settings' : key);
      const db = get().db;
      if (
        key === 'customers' &&
        (db.vehicles.some((v) => v.customerId === id) ||
          db.tickets.some((t) => t.customerId === id))
      )
        throw new Error('Khách hàng còn xe hoặc vé liên kết. Hãy gỡ liên kết trước khi xóa.');
      if (
        key === 'vehicles' &&
        (db.sessions.some((s) => s.vehicleId === id) || db.tickets.some((t) => t.vehicleId === id))
      )
        throw new Error('Xe đã có lịch sử hoặc vé liên kết. Có thể khóa hồ sơ để giữ dữ liệu.');
      if (
        key === 'tickets' &&
        (db.sessions.some((s) => s.ticketId === id) ||
          db.transactions.some((t) => t.ticketId === id))
      )
        throw new Error('Vé có lịch sử liên kết. Hãy dùng chức năng trả thẻ.');
      if (key === 'accounts' && get().auth?.accountId === id)
        throw new Error('Không thể xóa tài khoản đang đăng nhập.');
      commit({ ...db, [key]: db[key].filter((e) => e.id !== id) }, 'Xóa', `${key}: ${id}`);
    },
    enter(plate, type, area, lane, ticketId) {
      const user = requirePermission('create', 'monitoring'),
        db = get().db;
      const v = validateEntry(db, plate, area);
      const t = ticketId
        ? db.tickets.find((t) => t.id === ticketId)
        : db.tickets.find(
            (t) =>
              t.type === 'Vé tháng' &&
              normalizePlate(t.plate) === normalizePlate(plate) &&
              ticketStatus(t, dateInput()) === 'Hoạt động',
          );
      if (ticketId && !t) throw new Error('Không tìm thấy vé/thẻ.');
      if (
        t &&
        (normalizePlate(t.plate) !== normalizePlate(plate) ||
          ticketStatus(t, dateInput()) !== 'Hoạt động')
      )
        throw new Error('Thẻ không đúng biển số, bị khóa hoặc chưa/còn hiệu lực.');
      if (t?.type === 'Vé lượt' && t.sessionId)
        throw new Error('Vé lượt này đã được sử dụng. Hãy cấp vé mới.');
      const ticketType = t?.type || 'Vé lượt';
      const actualType = v?.type || type;
      const rate = selectFee(db, actualType, ticketType);
      const sessionId = nextId('SES', db.sessions),
        newTicketId = t?.id || nextId('TKT', db.tickets),
        time = nowISO();
      const session: ParkingSession = {
        id: sessionId,
        vehicleId: v?.id || '',
        ticketId: newTicketId,
        plate: plate.trim().toUpperCase(),
        type: actualType,
        ticketType,
        entryAt: time,
        exitAt: '',
        entryLane: lane,
        exitLane: '',
        area,
        employee: user.name,
        amount: 0,
        payment: 'Chưa thanh toán',
        entryImage: '/images/parking-reference.png',
        exitImage: '',
        rate,
      };
      const tickets = t
        ? db.tickets.map((x) => (x.id === t.id && x.type === 'Vé lượt' ? { ...x, sessionId } : x))
        : [
            {
              id: newTicketId,
              cardId: '',
              vehicleId: v?.id || '',
              customerId: v?.customerId || '',
              plate: session.plate,
              type: ticketType,
              startsAt: dateInput(),
              expiresAt: '',
              price: 0,
              status: 'Hoạt động',
              sessionId,
            },
            ...db.tickets,
          ];
      commit(
        { ...db, sessions: [session, ...db.sessions], tickets },
        'Xe vào',
        `${plate} · ${sessionId} · ${area}`,
      );
      return sessionId;
    },
    exit(id, method, lane) {
      const user = requirePermission('edit', 'monitoring'),
        db = get().db,
        s = db.sessions.find((x) => x.id === id);
      if (!s || s.exitAt) throw new Error('Lượt gửi không còn mở.');
      const time = nowISO(),
        amount = calculateFee(s, time);
      const updated = {
        ...s,
        exitAt: time,
        exitLane: lane,
        amount,
        payment: s.ticketType === 'Vé tháng' ? 'Vé tháng' : 'Đã thanh toán',
        exitImage: '/images/parking-reference.png',
        employee: user.name,
      };
      const transactions =
        amount > 0
          ? [
              {
                id: nextId('TRX', db.transactions),
                sessionId: s.id,
                ticketId: s.ticketId,
                plate: s.plate,
                ticketType: s.ticketType,
                vehicleType: s.type,
                method,
                amount,
                time,
                employee: user.name,
                status: 'Đã thanh toán',
              },
              ...db.transactions,
            ]
          : db.transactions;
      commit(
        { ...db, sessions: db.sessions.map((x) => (x.id === id ? updated : x)), transactions },
        'Xe ra & thanh toán',
        `${s.plate} · ${amount} VNĐ`,
      );
    },
    renew(id, date, amount, method) {
      const user = requirePermission('edit', 'tickets'),
        db = get().db,
        t = db.tickets.find((t) => t.id === id);
      if (!t || t.type !== 'Vé tháng') throw new Error('Chỉ gia hạn vé tháng.');
      if (['Bị khóa', 'Đã trả'].includes(t.status))
        throw new Error('Cần mở khóa/cấp lại vé trước khi gia hạn.');
      if (date <= t.expiresAt || date < dateInput() || amount <= 0)
        throw new Error('Hạn mới phải sau hạn cũ, không ở quá khứ; số tiền phải lớn hơn 0.');
      if (
        db.tickets.some(
          (other) =>
            other.id !== t.id &&
            other.type === 'Vé tháng' &&
            other.status === 'Hoạt động' &&
            normalizePlate(other.plate) === normalizePlate(t.plate) &&
            other.startsAt <= date &&
            other.expiresAt >= t.startsAt,
        )
      )
        throw new Error('Thời gian gia hạn trùng với một vé tháng khác của phương tiện.');
      const v = db.vehicles.find((v) => v.id === t.vehicleId);
      commit(
        {
          ...db,
          tickets: db.tickets.map((x) =>
            x.id === id ? { ...x, expiresAt: date, status: 'Hoạt động' } : x,
          ),
          transactions: [
            {
              id: nextId('TRX', db.transactions),
              sessionId: '',
              ticketId: id,
              plate: t.plate,
              ticketType: 'Vé tháng',
              vehicleType: v?.type || 'Ô tô',
              method,
              amount,
              time: nowISO(),
              employee: user.name,
              status: 'Đã thanh toán',
            },
            ...db.transactions,
          ],
        },
        'Gia hạn vé',
        `${id} đến ${date}`,
      );
    },
    ticketAction(id, action) {
      requirePermission('edit', 'tickets');
      const db = get().db,
        t = db.tickets.find((t) => t.id === id);
      if (!t) throw new Error('Không tìm thấy vé.');
      if (action === 'return' && db.sessions.some((s) => s.ticketId === id && !s.exitAt))
        throw new Error('Xe còn trong bãi. Vui lòng xác nhận xe ra trước khi trả thẻ.');
      const status = action === 'return' ? 'Đã trả' : action === 'lock' ? 'Bị khóa' : 'Hoạt động';
      commit(
        { ...db, tickets: db.tickets.map((t) => (t.id === id ? { ...t, status } : t)) },
        'Cập nhật thẻ',
        `${id}: ${status}`,
      );
    },
    resolveAlert(id, note) {
      const user = requirePermission('edit', 'alerts');
      const db = get().db;
      commit(
        {
          ...db,
          alerts: db.alerts.map((a) =>
            a.id === id ? { ...a, status: 'Đã xử lý', handler: user.name, note } : a,
          ),
        },
        'Xử lý cảnh báo',
        id,
      );
    },
    toggleDevice(id) {
      requirePermission('edit', 'devices');
      const db = get().db,
        d = db.devices.find((d) => d.id === id);
      if (!d) return;
      const status = d.status === 'Trực tuyến' ? 'Mất kết nối' : 'Trực tuyến';
      const alert = {
        id: nextId('ALT', db.alerts),
        time: nowISO(),
        type: d.type === 'Camera' ? 'Camera mất kết nối' : 'Thiết bị mất kết nối',
        subject: d.name,
        deviceId: d.id,
        severity: 'Cảnh báo',
        status: 'Chưa xử lý',
        handler: '',
        note: 'Mô phỏng thay đổi trạng thái kết nối.',
      };
      commit(
        {
          ...db,
          devices: db.devices.map((x) => (x.id === id ? { ...x, status, updatedAt: nowISO() } : x)),
          alerts: status === 'Mất kết nối' ? [alert, ...db.alerts] : db.alerts,
        },
        'Kết nối thiết bị',
        `${d.name}: ${status}`,
      );
    },
    barrier(lane, open) {
      const user = requirePermission('edit', 'monitoring'),
        db = get().db;
      commit(
        {
          ...db,
          alerts: [
            {
              id: nextId('ALT', db.alerts),
              time: nowISO(),
              type: 'Mở barrier thủ công',
              subject: lane,
              deviceId: db.devices.find((d) => d.type === 'Barrier')?.id || '',
              severity: 'Thông tin',
              status: 'Đã xử lý',
              handler: user.name,
              note: open ? 'Mở barrier mô phỏng' : 'Đóng barrier mô phỏng',
            },
            ...db.alerts,
          ],
        },
        open ? 'Mở barrier' : 'Đóng barrier',
        lane,
      );
    },
    updateSettings(settings) {
      requirePermission('system', 'settings');
      const db = get().db;
      if (!settings.name.trim() || settings.sessionMinutes < 5 || settings.sessionMinutes > 43200)
        throw new Error('Tên bãi bắt buộc; thời hạn phiên từ 5 đến 43200 phút.');
      for (const a of settings.areas)
        if (a.capacity < db.sessions.filter((s) => !s.exitAt && s.area === a.name).length)
          throw new Error(`${a.name}: sức chứa không thể nhỏ hơn số xe đang gửi.`);
      if (settings.areas.some((a) => !Number.isInteger(a.capacity) || a.capacity < 1))
        throw new Error('Số chỗ đỗ phải là số nguyên dương.');
      if (
        settings.fees.some(
          (f) =>
            f.hours <= 0 ||
            f.price < 0 ||
            f.surcharge < 0 ||
            ![f.hours, f.price, f.surcharge].every(Number.isFinite),
        )
      )
        throw new Error('Biểu phí không hợp lệ.');
      commit({ ...db, settings }, 'Lưu cài đặt', 'Cấu hình bãi xe và biểu phí');
    },
    updatePermissions(role, action, value) {
      requirePermission('system', 'settings');
      if (role === 'Admin') throw new Error('Quyền Admin được giữ để quản trị hệ thống.');
      const db = get().db;
      commit(
        {
          ...db,
          permissions: { ...db.permissions, [role]: { ...db.permissions[role], [action]: value } },
        },
        'Phân quyền',
        `${role} / ${action}: ${value}`,
      );
    },
    changePassword(old, password) {
      const user = current();
      if (!user || old !== user.password) throw new Error('Mật khẩu hiện tại chưa đúng.');
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
        throw new Error('Mật khẩu tối thiểu 8 ký tự, có chữ hoa và số.');
      commit(
        {
          ...get().db,
          accounts: get().db.accounts.map((a) => (a.id === user.id ? { ...a, password } : a)),
        },
        'Đổi mật khẩu',
        'Thay đổi mật khẩu demo',
      );
    },
    reset() {
      requirePermission('system', 'settings');
      commit(createSeed(), 'Khôi phục dữ liệu', 'Khôi phục bộ dữ liệu demo ban đầu');
      get().logout();
    },
  };
});
export function useUser() {
  const { db, auth } = useParkingStore();
  return db.accounts.find((a) => a.id === auth?.accountId);
}
export function useCan(action: Action, route?: string) {
  const { db, auth } = useParkingStore();
  const u = db.accounts.find((a) => a.id === auth?.accountId);
  return (
    !!u &&
    u.status === 'Hoạt động' &&
    db.permissions[u.role][action] &&
    (!route || routesByRole[u.role].includes(route))
  );
}
