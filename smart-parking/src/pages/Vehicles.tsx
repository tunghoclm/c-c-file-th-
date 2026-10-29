import { CarFront, CircleCheck, Ticket, CalendarCheck } from 'lucide-react';
import { ResourcePage } from '@/components/common/ResourcePage';
import { StatCard, StatusBadge } from '@/components/common/Elements';
import { useParkingStore } from '@/stores/useParkingStore';
import { dateTime, nowISO, plateValid } from '@/utils/format';
import type { TicketType, VehicleType } from '@/types';
const opts = (list: string[]) => list.map((value) => ({ value, label: value }));
export function Vehicles() {
  const db = useParkingStore((s) => s.db);
  return (
    <ResourcePage
      config={{
        key: 'vehicles',
        title: 'Quản lý xe',
        description: 'Quản lý hồ sơ phương tiện và thông tin đăng ký tại bãi xe.',
        singular: 'xe',
        stats: (
          <div className="stats-grid four">
            <StatCard title="Tổng xe đăng ký" value={db.vehicles.length} icon={CarFront} />
            <StatCard
              title="Đang hoạt động"
              value={db.vehicles.filter((v) => v.status === 'Hoạt động').length}
              icon={CircleCheck}
              tone="green"
            />
            <StatCard
              title="Xe gửi lượt"
              value={db.vehicles.filter((v) => v.ticketType === 'Vé lượt').length}
              icon={Ticket}
              tone="purple"
            />
            <StatCard
              title="Xe gửi tháng"
              value={db.vehicles.filter((v) => v.ticketType === 'Vé tháng').length}
              icon={CalendarCheck}
              tone="amber"
            />
          </div>
        ),
        columns: [
          { key: 'index', label: 'STT', value: (r) => db.vehicles.indexOf(r) + 1 },
          { key: 'id', label: 'Mã xe', value: (r) => r.id },
          {
            key: 'plate',
            label: 'Biển số',
            value: (r) => r.plate,
            render: (r) => <span className="plate-small">{r.plate}</span>,
          },
          { key: 'type', label: 'Loại xe', value: (r) => r.type },
          { key: 'owner', label: 'Chủ xe', value: (r) => r.owner },
          { key: 'phone', label: 'Điện thoại', value: (r) => r.phone },
          { key: 'ticketType', label: 'Hình thức gửi', value: (r) => r.ticketType },
          { key: 'date', label: 'Ngày đăng ký', value: (r) => dateTime(r.createdAt) },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => r.status,
            render: (r) => <StatusBadge value={r.status} />,
          },
        ],
        fields: [
          {
            name: 'plate',
            label: 'Biển số',
            required: true,
            validate: (v) => (plateValid(v) ? undefined : 'Ví dụ: 30A-123.45 hoặc 59B1-123.45'),
          },
          {
            name: 'type',
            label: 'Loại xe',
            type: 'select',
            required: true,
            options: opts(['Ô tô', 'Xe máy']),
          },
          {
            name: 'customerId',
            label: 'Khách hàng liên kết',
            type: 'select',
            options: db.customers
              .filter((c) => c.status === 'Hoạt động')
              .map((c) => ({ value: c.id, label: c.id + ' · ' + c.name })),
            full: true,
          },
          { name: 'owner', label: 'Tên chủ xe', hint: 'Tự điền theo khách hàng liên kết.' },
          { name: 'phone', label: 'Số điện thoại', type: 'tel' },
          {
            name: 'ticketType',
            label: 'Hình thức gửi',
            type: 'select',
            required: true,
            options: opts(['Vé lượt', 'Vé tháng']),
          },
          {
            name: 'status',
            label: 'Trạng thái',
            type: 'select',
            required: true,
            options: opts(['Hoạt động', 'Bị khóa']),
          },
          { name: 'note', label: 'Ghi chú', type: 'textarea', full: true },
        ],
        filters: [
          { label: 'Loại xe', options: ['Ô tô', 'Xe máy'], value: (r) => r.type },
          { label: 'Trạng thái', options: ['Hoạt động', 'Bị khóa'], value: (r) => r.status },
        ],
        defaults: () => ({
          id: '',
          plate: '',
          type: 'Ô tô',
          customerId: '',
          owner: '',
          phone: '',
          ticketType: 'Vé lượt',
          createdAt: nowISO(),
          status: 'Hoạt động',
          note: '',
        }),
        parse: (v, old) => ({
          ...old,
          ...v,
          type: v.type as VehicleType,
          ticketType: v.ticketType as TicketType,
        }),
        detail: (r) => (
          <div className="info-banner">
            {r.note ||
              'Hồ sơ phương tiện đăng ký. Lượt gửi được quản lý riêng trong Lịch sử vào / ra.'}
          </div>
        ),
      }}
    />
  );
}
