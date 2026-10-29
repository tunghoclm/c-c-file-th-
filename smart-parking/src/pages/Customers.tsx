import { Link } from 'react-router-dom';
import { UsersRound, Building2, UserRoundCheck } from 'lucide-react';
import { ResourcePage } from '@/components/common/ResourcePage';
import { StatCard, StatusBadge } from '@/components/common/Elements';
import { useParkingStore } from '@/stores/useParkingStore';
import { dateTime, nowISO } from '@/utils/format';
import { Button } from '@/components/ui/button';
export function Customers() {
  const db = useParkingStore((s) => s.db);
  return (
    <ResourcePage
      config={{
        key: 'customers',
        title: 'Quản lý khách hàng',
        description: 'Kết nối khách hàng, phương tiện và lịch sử gửi xe trong một nơi.',
        singular: 'khách hàng',
        stats: (
          <div className="stats-grid three">
            <StatCard title="Tổng khách hàng" value={db.customers.length} icon={UsersRound} />
            <StatCard
              title="Khách hàng hoạt động"
              value={db.customers.filter((c) => c.status === 'Hoạt động').length}
              icon={UserRoundCheck}
              tone="green"
            />
            <StatCard
              title="Khách hàng doanh nghiệp"
              value={db.customers.filter((c) => c.group === 'Doanh nghiệp').length}
              icon={Building2}
              tone="purple"
            />
          </div>
        ),
        columns: [
          { key: 'id', label: 'Mã khách hàng', value: (r) => r.id },
          {
            key: 'name',
            label: 'Họ tên',
            value: (r) => r.name,
            render: (r) => (
              <span className="person-cell">
                <span className="mini-avatar">{r.name.split(' ').at(-1)?.[0]}</span>
                <b>{r.name}</b>
              </span>
            ),
          },
          { key: 'phone', label: 'Số điện thoại', value: (r) => r.phone },
          { key: 'email', label: 'Email', value: (r) => r.email },
          { key: 'group', label: 'Nhóm khách hàng', value: (r) => r.group },
          {
            key: 'vehicles',
            label: 'Xe đăng ký',
            value: (r) => db.vehicles.filter((v) => v.customerId === r.id).length,
          },
          { key: 'created', label: 'Ngày tạo', value: (r) => dateTime(r.createdAt) },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => r.status,
            render: (r) => <StatusBadge value={r.status} />,
          },
        ],
        fields: [
          { name: 'name', label: 'Họ và tên', required: true },
          { name: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          {
            name: 'group',
            label: 'Nhóm khách hàng',
            type: 'select',
            required: true,
            options: ['Cư dân', 'Nhân viên', 'Doanh nghiệp', 'Khách vãng lai'].map((value) => ({
              value,
              label: value,
            })),
          },
          {
            name: 'status',
            label: 'Trạng thái',
            type: 'select',
            required: true,
            options: ['Hoạt động', 'Bị khóa'].map((value) => ({ value, label: value })),
          },
        ],
        filters: [
          {
            label: 'Nhóm khách hàng',
            options: ['Cư dân', 'Nhân viên', 'Doanh nghiệp', 'Khách vãng lai'],
            value: (r) => r.group,
          },
          { label: 'Trạng thái', options: ['Hoạt động', 'Bị khóa'], value: (r) => r.status },
        ],
        defaults: () => ({
          id: '',
          name: '',
          phone: '',
          email: '',
          group: 'Cư dân',
          status: 'Hoạt động',
          createdAt: nowISO(),
        }),
        parse: (v, old) => ({ ...old, ...v }),
        detail: (r, data) => (
          <div className="related-list">
            <h3>Phương tiện & lịch sử gửi xe</h3>
            {data.vehicles
              .filter((v) => v.customerId === r.id)
              .map((v) => (
                <div key={v.id}>
                  <span className="plate-small">{v.plate}</span>
                  <span>{v.type}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to={'/history?q=' + encodeURIComponent(v.plate)}>Xem lịch sử</Link>
                  </Button>
                </div>
              ))}
            {!data.vehicles.some((v) => v.customerId === r.id) && (
              <p>Khách hàng chưa có phương tiện đăng ký.</p>
            )}
          </div>
        ),
      }}
    />
  );
}
