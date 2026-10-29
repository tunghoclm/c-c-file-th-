import { addDays, subDays, format } from 'date-fns';
import type { Account, Database, Device, ParkingSession, Ticket, Transaction } from '@/types';
const stamp = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");
const names = [
  'Nguyễn Minh Anh',
  'Trần Hoàng Nam',
  'Lê Thị Thu Hà',
  'Phạm Quốc Huy',
  'Hoàng Thanh Tùng',
  'Vũ Ngọc Linh',
  'Đặng Hải Đăng',
  'Bùi Phương Thảo',
  'Đỗ Thành Đạt',
  'Ngô Khánh Vy',
  'Dương Tuấn Kiệt',
  'Võ Minh Châu',
  'Nguyễn Quỳnh Chi',
  'Trần Đức Anh',
  'Lê Bảo Ngọc',
  'Phạm Gia Bảo',
  'Hoàng Kim Ngân',
  'Vũ Nhật Minh',
  'Đặng Thùy Dương',
  'Bùi Anh Khoa',
  'Đỗ Mai Phương',
  'Ngô Hữu Phúc',
  'Dương Lan Anh',
  'Võ Trung Hiếu',
  'Nguyễn Thanh Trúc',
  'Trần Tiến Dũng',
  'Lê Hà My',
  'Phạm Quang Vinh',
  'Hoàng Ngọc Hân',
  'Vũ Đức Long',
];
const id = (prefix: string, n: number) => prefix + String(n + 1).padStart(4, '0');
export function createSeed(base = new Date()): Database {
  const today = format(base, 'yyyy-MM-dd');
  const settings: Database['settings'] = {
    name: 'Smart Parking Central',
    address: '128 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
    phone: '028 7300 8888',
    email: 'admin@smartparking.demo',
    logo: '',
    sessionMinutes: 480,
    areas: [
      { id: 'A', name: 'Khu A', capacity: 30 },
      { id: 'B', name: 'Khu B', capacity: 40 },
      { id: 'C', name: 'Khu C', capacity: 50 },
    ],
    fees: [
      {
        id: 'FEE01',
        type: 'Xe máy',
        ticketType: 'Vé lượt',
        hours: 4,
        price: 5000,
        surcharge: 0,
        active: true,
      },
      {
        id: 'FEE02',
        type: 'Ô tô',
        ticketType: 'Vé lượt',
        hours: 1,
        price: 20000,
        surcharge: 0,
        active: true,
      },
      {
        id: 'FEE03',
        type: 'Xe máy',
        ticketType: 'Vé tháng',
        hours: 720,
        price: 150000,
        surcharge: 0,
        active: true,
      },
      {
        id: 'FEE04',
        type: 'Ô tô',
        ticketType: 'Vé tháng',
        hours: 720,
        price: 1200000,
        surcharge: 0,
        active: true,
      },
    ],
  };
  const customers = names.map((name, i) => ({
    id: id('CUS', i),
    name,
    phone: '09' + String(12000000 + i * 123).padStart(8, '0'),
    email: `khachhang${i + 1}@example.com`,
    group: ['Cư dân', 'Nhân viên', 'Doanh nghiệp'][i % 3],
    createdAt: stamp(subDays(base, 60 + i)),
    status: i === 29 ? 'Bị khóa' : 'Hoạt động',
  }));
  const vehicles = Array.from({ length: 50 }, (_, i) => ({
    id: id('VEH', i),
    plate: `${i % 2 ? '59B1' : '30A'}-${String(12345 + i * 137).slice(0, 3)}.${String(12345 + i * 137).slice(3)}`,
    type: i % 2 ? ('Xe máy' as const) : ('Ô tô' as const),
    customerId: customers[i % 30].id,
    owner: customers[i % 30].name,
    phone: customers[i % 30].phone,
    ticketType: i < 15 ? ('Vé tháng' as const) : ('Vé lượt' as const),
    createdAt: stamp(subDays(base, 40 + i)),
    status: i === 49 ? 'Bị khóa' : 'Hoạt động',
    note: '',
  }));
  const tickets: Ticket[] = Array.from({ length: 60 }, (_, i) => {
    const v = vehicles[i % 50];
    return {
      id: id('TKT', i),
      cardId: id('CARD', i),
      vehicleId: i < 50 ? v.id : '',
      customerId: i < 50 ? v.customerId : '',
      plate: i < 50 ? v.plate : `51F-${410 + i}.88`,
      type: i < 15 ? 'Vé tháng' : 'Vé lượt',
      startsAt: format(subDays(base, 30), 'yyyy-MM-dd'),
      expiresAt: i < 15 ? format(addDays(base, i === 0 ? -2 : 8 + i), 'yyyy-MM-dd') : '',
      price: i < 15 ? (v.type === 'Ô tô' ? 1200000 : 150000) : 0,
      status: i === 59 ? 'Bị khóa' : 'Hoạt động',
      sessionId: '',
    };
  });
  const sessions: ParkingSession[] = Array.from({ length: 100 }, (_, i) => {
    const t = tickets[i < 45 ? i + 15 : (i - 45) % 15];
    const v = vehicles.find((v) => v.id === t.vehicleId);
    const active = i < 8 || i >= 88;
    const recent = !active && i >= 8 && i < 20;
    const entry = active
      ? new Date(base.getTime() - (45 + i * 3) * 60000)
      : recent
        ? new Date(base.getTime() - (i - 7) * 20 * 60000 - (1 + (i % 7)) * 3600000)
        : subDays(base, Math.floor((99 - i) / 4) + 1);
    if (!active && !recent) entry.setHours(7 + (i % 10), (i * 7) % 60, 0, 0);
    if (active && t.type === 'Vé tháng' && t.expiresAt < today)
      entry.setTime(subDays(base, 3).getTime());
    const type = v?.type || 'Ô tô';
    const rate = { ...settings.fees.find((f) => f.type === type && f.ticketType === t.type)! };
    const exit = active ? '' : stamp(new Date(entry.getTime() + (1 + (i % 7)) * 3600000));
    const amount = t.type === 'Vé tháng' ? 0 : Math.ceil((1 + (i % 7)) / rate.hours) * rate.price;
    if (t.type === 'Vé lượt') t.sessionId = id('SES', i);
    return {
      id: id('SES', i),
      vehicleId: v?.id || '',
      ticketId: t.id,
      plate: t.plate,
      type,
      ticketType: t.type,
      entryAt: stamp(entry),
      exitAt: exit,
      entryLane: 'Làn vào 0' + ((i % 2) + 1),
      exitLane: active ? '' : 'Làn ra 01',
      area: settings.areas[i % 3].name,
      employee: 'Trần Hoàng Nam',
      amount: active ? 0 : amount,
      payment: active
        ? 'Chưa thanh toán'
        : t.type === 'Vé tháng'
          ? 'Vé tháng'
          : i < 43
            ? 'Đã thanh toán'
            : 'Chưa thanh toán',
      entryImage: '/images/parking-reference.png',
      exitImage: active ? '' : '/images/parking-reference.png',
      rate,
    };
  });
  const transactions: Transaction[] = sessions
    .filter((s) => s.payment === 'Đã thanh toán')
    .map((s, i) => ({
      id: id('TRX', i),
      sessionId: s.id,
      ticketId: s.ticketId,
      plate: s.plate,
      ticketType: s.ticketType,
      vehicleType: s.type,
      method: i % 3 ? 'Tiền mặt' : 'Chuyển khoản',
      amount: s.amount,
      time: s.exitAt,
      employee: s.employee,
      status: 'Đã thanh toán',
    }));
  tickets
    .slice(0, 15)
    .forEach((t, i) =>
      transactions.push({
        id: id('TRX', transactions.length),
        sessionId: '',
        ticketId: t.id,
        plate: t.plate,
        ticketType: 'Vé tháng',
        vehicleType: vehicles[i].type,
        method: 'Chuyển khoản',
        amount: t.price,
        time: stamp(subDays(base, i % 7)),
        employee: 'Lê Thị Thu Hà',
        status: 'Đã thanh toán',
      }),
    );
  const deviceTypes = [
    'Camera',
    'Barrier',
    'Đầu đọc thẻ',
    'Máy tính',
    'Bộ điều khiển',
    'Cổng vào/ra',
    'Làn xe',
    'Bảng LED',
  ];
  const devices: Device[] = Array.from({ length: 15 }, (_, i) => ({
    id: id('DEV', i),
    name: `${deviceTypes[i % 8]} ${String(i + 1).padStart(2, '0')}`,
    type: deviceTypes[i % 8],
    area: settings.areas[i % 3].name,
    address: i % 8 === 2 ? `COM${i + 1}` : `192.168.1.${100 + i}`,
    status: i === 4 || i === 9 ? 'Mất kết nối' : 'Trực tuyến',
    updatedAt: stamp(base),
  }));
  const eventTypes = [
    'Biển số trong danh sách đen',
    'Thẻ hết hạn',
    'Thẻ bị khóa',
    'Biển số vào/ra không khớp',
    'Camera mất kết nối',
    'Barrier gặp lỗi',
    'Mở barrier thủ công',
    'Giao dịch bất thường',
  ];
  const alerts = Array.from({ length: 20 }, (_, i) => ({
    id: id('ALT', i),
    time: stamp(new Date(base.getTime() - i * 3700000)),
    type: eventTypes[i % 8],
    subject: i % 8 === 0 ? '51F-999.99' : i % 8 < 4 ? tickets[i].cardId : devices[i % 15].name,
    deviceId: devices[i % 15].id,
    severity: ['Nghiêm trọng', 'Cảnh báo', 'Thông tin'][i % 3],
    status: i < 7 ? 'Chưa xử lý' : 'Đã xử lý',
    handler: i < 7 ? '' : 'Nguyễn Minh Anh',
    note: 'Sự kiện mô phỏng để kiểm tra quy trình vận hành.',
  }));
  const accounts: Account[] = Array.from({ length: 10 }, (_, i) => ({
    id: id('USR', i),
    name: i === 0 ? 'Nguyễn Minh Anh' : names[i],
    username: ['admin', 'manager', 'guard', 'cashier'][i] || `staff${i + 1}`,
    email: `${['admin', 'manager', 'guard', 'cashier'][i] || 'staff' + (i + 1)}@smartparking.demo`,
    phone: customers[i].phone,
    role: (['Admin', 'Quản lý', 'Bảo vệ', 'Thu ngân'] as const)[i === 0 ? 0 : 1 + ((i - 1) % 3)],
    status: 'Hoạt động',
    password: 'Admin@123',
  }));
  return {
    vehicles,
    customers,
    tickets,
    sessions,
    transactions,
    devices,
    alerts,
    accounts,
    settings,
    permissions: {
      Admin: { view: true, create: true, edit: true, delete: true, export: true, system: true },
      'Quản lý': {
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
        system: false,
      },
      'Bảo vệ': {
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: false,
        system: false,
      },
      'Thu ngân': {
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
        system: false,
      },
    },
    logs: Array.from({ length: 10 }, (_, i) => ({
      id: id('LOG', i),
      time: `${today}T${String(Math.max(0, 8 - i)).padStart(2, '0')}:00:00`,
      user: accounts[i % 4].name,
      action: ['Đăng nhập', 'Cấp vé', 'Kiểm tra thiết bị', 'Gia hạn vé'][i % 4],
      content: 'Khởi tạo hoạt động mẫu của hệ thống',
      status: 'Thành công',
    })),
  };
}
