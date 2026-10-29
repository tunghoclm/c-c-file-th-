import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeed } from '@/data/seed';
import { calculateFee, nextId, paidRevenue, ticketStatus, validateEntry } from './domain';
import { normalizePlate } from '@/utils/format';
import { useParkingStore } from '@/stores/useParkingStore';
import type { Database } from '@/types';
const storage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
    clear: () => values.clear(),
  };
};
let db: Database;
beforeEach(() => {
  vi.stubGlobal('localStorage', storage());
  vi.stubGlobal('sessionStorage', storage());
  db = createSeed();
  useParkingStore.setState({ db, auth: null });
});
const login = () => useParkingStore.getState().login('admin', 'Admin@123', true);
describe('Bộ dữ liệu và liên kết', () => {
  it('khởi tạo đúng số lượng yêu cầu, ID duy nhất', () => {
    for (const [key, count] of Object.entries({
      vehicles: 50,
      customers: 30,
      tickets: 60,
      sessions: 100,
      transactions: 50,
      devices: 15,
      alerts: 20,
      accounts: 10,
      logs: 10,
    })) {
      const rows = db[key as keyof Database] as { id: string }[];
      expect(rows).toHaveLength(count);
      expect(new Set(rows.map((x) => x.id)).size).toBe(count);
    }
  });
  it('mỗi lượt gửi liên kết đúng vé, xe và khách hàng', () => {
    for (const s of db.sessions) {
      expect(db.tickets.some((t) => t.id === s.ticketId && t.plate === s.plate)).toBe(true);
      if (s.vehicleId)
        expect(db.vehicles.some((v) => v.id === s.vehicleId && v.plate === s.plate)).toBe(true);
    }
    for (const v of db.vehicles) expect(db.customers.some((c) => c.id === v.customerId)).toBe(true);
  });
  it('một biển số chỉ có một lượt đang mở', () => {
    const open = db.sessions.filter((s) => !s.exitAt);
    expect(new Set(open.map((s) => normalizePlate(s.plate))).size).toBe(open.length);
  });
  it('mỗi vé lượt liên kết duy nhất một lượt gửi', () => {
    for (const t of db.tickets.filter((t) => t.type === 'Vé lượt')) {
      const sessions = db.sessions.filter((s) => s.ticketId === t.id);
      expect(sessions.length).toBeLessThanOrEqual(1);
      if (sessions.length) expect(t.sessionId).toBe(sessions[0].id);
    }
  });
  it('giao dịch thanh toán khớp số tiền của lịch sử', () => {
    for (const t of db.transactions.filter((t) => t.sessionId)) {
      const s = db.sessions.find((s) => s.id === t.sessionId)!;
      expect(s.exitAt).toBeTruthy();
      expect(s.payment).toBe('Đã thanh toán');
      expect(s.amount).toBe(t.amount);
    }
  });
});
describe('Quy tắc vé và phí', () => {
  it('vé tháng hết hạn theo ngày, vé lượt không tự hết hạn sau 24 giờ', () => {
    expect(ticketStatus({ ...db.tickets[0], expiresAt: '2026-01-01' }, '2026-02-01')).toBe(
      'Hết hạn',
    );
    expect(ticketStatus({ ...db.tickets[15], startsAt: '2020-01-01' }, '2026-02-01')).toBe(
      'Hoạt động',
    );
  });
  it('khóa thẻ ưu tiên hơn trạng thái hết hạn', () =>
    expect(ticketStatus({ ...db.tickets[0], status: 'Bị khóa', expiresAt: '2020-01-01' })).toBe(
      'Bị khóa',
    ));
  it('tính phí theo mỗi block và phụ phí một lần', () => {
    const s = {
      ticketType: 'Vé lượt' as const,
      entryAt: '2026-10-01T08:00:00',
      rate: { ...db.settings.fees[0], hours: 4, price: 5000, surcharge: 2000 },
    };
    expect(calculateFee(s, '2026-10-01T12:00:00')).toBe(7000);
    expect(calculateFee(s, '2026-10-01T12:00:01')).toBe(12000);
    expect(calculateFee({ ...s, ticketType: 'Vé tháng' }, '2026-10-02T12:00:00')).toBe(0);
  });
  it('không cộng giao dịch chưa thanh toán vào doanh thu', () => {
    const sum = paidRevenue(db);
    db.transactions.push({
      ...db.transactions[0],
      id: 'TRX9999',
      amount: 999999,
      status: 'Chưa thanh toán',
    });
    expect(paidRevenue(db)).toBe(sum);
  });
  it('không cấp trùng ID khi danh sách không theo thứ tự', () =>
    expect(nextId('SES', [{ id: 'SES0100' }, { id: 'SES0001' }])).toBe('SES0101'));
});
describe('Các thao tác đồng bộ dữ liệu', () => {
  it('xe vãng lai vào, trả tiền, ra bãi và lưu dữ liệu', () => {
    login();
    const initial = useParkingStore.getState().db;
    const total = paidRevenue(initial);
    const id = useParkingStore.getState().enter('51F-888.88', 'Ô tô', 'Khu A', 'Làn vào 01');
    let state = useParkingStore.getState();
    expect(state.db.sessions).toHaveLength(101);
    expect(state.db.vehicles).toHaveLength(50);
    const added = state.db.sessions.find((s) => s.id === id)!;
    expect(added.vehicleId).toBe('');
    expect(added.ticketId).toBe('TKT0061');
    expect(() => state.enter('51F88888', 'Ô tô', 'Khu A', 'Làn vào 01')).toThrow(
      'đang ở trong bãi',
    );
    state.exit(id, 'Tiền mặt', 'Làn ra 01');
    state = useParkingStore.getState();
    expect(state.db.sessions.find((s) => s.id === id)?.exitAt).toBeTruthy();
    expect(state.db.transactions).toHaveLength(51);
    expect(paidRevenue(state.db)).toBe(total + 20000);
    expect(JSON.parse(localStorage.getItem('smart-parking:data:v1')!).sessions).toHaveLength(101);
    expect(() => state.exit(id, 'Tiền mặt', 'Làn ra 01')).toThrow('không còn mở');
  });
  it('sức chứa khu vực được kiểm tra trước khi nhận xe', () => {
    const count = db.sessions.filter((s) => !s.exitAt && s.area === 'Khu A').length;
    db.settings.areas[0].capacity = count;
    expect(() => validateEntry(db, '51F-888.88', 'Khu A')).toThrow('hết chỗ');
  });
  it('biển số đen và biển số không hợp lệ bị từ chối', () => {
    expect(() => validateEntry(db, '51F-999.99', 'Khu A')).toThrow('danh sách đen');
    expect(() => validateEntry(db, 'invalid', 'Khu A')).toThrow('định dạng');
  });
  it('không thay đổi phí cũ khi lưu biểu phí mới', () => {
    login();
    const store = useParkingStore.getState();
    const id = store.enter('51F-888.88', 'Ô tô', 'Khu A', 'Làn vào 01');
    const settings = structuredClone(store.db.settings);
    settings.fees[1].price = 50000;
    useParkingStore.getState().updateSettings(settings);
    const id2 = useParkingStore.getState().enter('51F-888.89', 'Ô tô', 'Khu A', 'Làn vào 01');
    expect(useParkingStore.getState().db.sessions.find((s) => s.id === id)?.rate.price).toBe(20000);
    expect(useParkingStore.getState().db.sessions.find((s) => s.id === id2)?.rate.price).toBe(
      50000,
    );
  });
  it('gia hạn vé cập nhật ngày, doanh thu và nhật ký', () => {
    login();
    const state = useParkingStore.getState(),
      t = state.db.tickets[1];
    state.renew(t.id, '2030-12-31', 150000, 'Tiền mặt');
    const after = useParkingStore.getState().db;
    expect(after.tickets.find((x) => x.id === t.id)?.expiresAt).toBe('2030-12-31');
    expect(after.transactions).toHaveLength(51);
    expect(after.logs[0].action).toBe('Gia hạn vé');
  });
  it('không trả thẻ khi xe còn trong bãi', () => {
    login();
    const state = useParkingStore.getState();
    const s = state.db.sessions.find((s) => !s.exitAt)!;
    expect(() => state.ticketAction(s.ticketId, 'return')).toThrow('còn trong bãi');
  });
  it('CRUD khách hàng mới và nhật ký, bảo vệ hồ sơ có liên kết', () => {
    login();
    const state = useParkingStore.getState();
    state.save('customers', {
      ...db.customers[0],
      id: '',
      name: 'Khách kiểm thử',
      phone: '0900000001',
    });
    const created = useParkingStore.getState().db.customers[0];
    expect(created.id).toBe('CUS0031');
    state.save('customers', { ...created, name: 'Khách đã sửa' });
    expect(useParkingStore.getState().db.customers[0].name).toBe('Khách đã sửa');
    state.remove('customers', created.id);
    expect(useParkingStore.getState().db.customers).toHaveLength(30);
    expect(() => state.remove('customers', 'CUS0001')).toThrow('liên kết');
  });
  it('không cho tạo xe đang hiệu lực trùng biển số', () => {
    login();
    expect(() =>
      useParkingStore.getState().save('vehicles', { ...db.vehicles[0], id: '' }),
    ).toThrow('Đã tồn tại');
  });
  it('mô phỏng mất kết nối tạo cảnh báo', () => {
    login();
    useParkingStore.getState().toggleDevice('DEV0001');
    const next = useParkingStore.getState().db;
    expect(next.devices[0].status).toBe('Mất kết nối');
    expect(next.alerts).toHaveLength(21);
  });
});
describe('Đăng nhập và phân quyền demo', () => {
  it('sai mật khẩu không đăng nhập được', () =>
    expect(() => useParkingStore.getState().login('admin', 'wrong', true)).toThrow('chưa đúng'));
  it('ghi nhớ dùng localStorage, không ghi nhớ dùng sessionStorage', () => {
    login();
    expect(localStorage.getItem('smart-parking:auth:v1')).toBeTruthy();
    useParkingStore.getState().logout();
    useParkingStore.getState().login('guard', 'Admin@123', false);
    expect(localStorage.getItem('smart-parking:auth:v1')).toBeNull();
    expect(sessionStorage.getItem('smart-parking:auth:v1')).toBeTruthy();
  });
  it('bảo vệ không được sửa biểu phí hoặc xóa dữ liệu', () => {
    useParkingStore.getState().login('guard', 'Admin@123', false);
    expect(() => useParkingStore.getState().updateSettings(db.settings)).toThrow('không có quyền');
    expect(() => useParkingStore.getState().remove('vehicles', 'VEH0050')).toThrow(
      'không có quyền',
    );
  });
  it('thu ngân không được thao tác làn xe', () => {
    useParkingStore.getState().login('cashier', 'Admin@123', false);
    expect(() =>
      useParkingStore.getState().enter('51F-888.88', 'Ô tô', 'Khu A', 'Làn vào 01'),
    ).toThrow('không có quyền');
  });
  it('khóa tài khoản làm vô hiệu phiên hiện tại', () => {
    login();
    useParkingStore.setState({
      db: {
        ...useParkingStore.getState().db,
        accounts: db.accounts.map((a) => (a.id === 'USR0001' ? { ...a, status: 'Bị khóa' } : a)),
      },
    });
    expect(() => useParkingStore.getState().updateSettings(db.settings)).toThrow('Phiên đăng nhập');
  });
  it('khôi phục demo và đăng xuất', () => {
    login();
    useParkingStore.getState().reset();
    expect(useParkingStore.getState().auth).toBeNull();
    expect(useParkingStore.getState().db.sessions).toHaveLength(100);
    expect(useParkingStore.getState().db.accounts[0].password).toBe('Admin@123');
  });
});
