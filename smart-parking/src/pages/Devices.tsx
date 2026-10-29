import { Cctv, Wifi, WifiOff, Power } from 'lucide-react';
import { toast } from 'sonner';
import { ResourcePage } from '@/components/common/ResourcePage';
import { StatCard, StatusBadge } from '@/components/common/Elements';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { dateTime, nowISO } from '@/utils/format';
import { Button } from '@/components/ui/button';
export function Devices() {
  const { db, toggleDevice } = useParkingStore(),
    can = useCan('edit', 'devices');
  const types = [
    'Camera',
    'Barrier',
    'Đầu đọc thẻ',
    'Máy tính',
    'Bộ điều khiển',
    'Cổng vào/ra',
    'Làn xe',
    'Bảng LED',
  ];
  return (
    <ResourcePage
      config={{
        key: 'devices',
        title: 'Quản lý thiết bị',
        description: 'Theo dõi cấu hình và tình trạng thiết bị. Tất cả kết nối đều được mô phỏng.',
        singular: 'thiết bị',
        stats: (
          <div className="stats-grid three">
            <StatCard title="Tổng thiết bị" value={db.devices.length} icon={Cctv} />
            <StatCard
              title="Đang trực tuyến"
              value={db.devices.filter((d) => d.status === 'Trực tuyến').length}
              icon={Wifi}
              tone="green"
            />
            <StatCard
              title="Cần kiểm tra"
              value={db.devices.filter((d) => d.status !== 'Trực tuyến').length}
              icon={WifiOff}
              tone="red"
            />
          </div>
        ),
        columns: [
          { key: 'id', label: 'Mã thiết bị', value: (r) => r.id },
          { key: 'name', label: 'Tên thiết bị', value: (r) => r.name },
          { key: 'type', label: 'Loại', value: (r) => r.type },
          { key: 'area', label: 'Khu vực', value: (r) => r.area },
          { key: 'address', label: 'IP / COM', value: (r) => r.address },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => r.status,
            render: (r) => <StatusBadge value={r.status} />,
          },
          { key: 'updated', label: 'Cập nhật gần nhất', value: (r) => dateTime(r.updatedAt) },
        ],
        fields: [
          { name: 'name', label: 'Tên thiết bị', required: true },
          {
            name: 'type',
            label: 'Loại thiết bị',
            type: 'select',
            required: true,
            options: types.map((value) => ({ value, label: value })),
          },
          {
            name: 'area',
            label: 'Khu vực',
            type: 'select',
            required: true,
            options: db.settings.areas.map((a) => ({ value: a.name, label: a.name })),
          },
          {
            name: 'address',
            label: 'Địa chỉ IP hoặc COM',
            required: true,
            validate: (v) =>
              /^COM\d+$/i.test(v) ||
              (/^(\d{1,3}\.){3}\d{1,3}$/.test(v) && v.split('.').every((n) => +n <= 255))
                ? undefined
                : 'Nhập IPv4 hợp lệ hoặc COM3.',
          },
          {
            name: 'status',
            label: 'Trạng thái',
            type: 'select',
            required: true,
            options: ['Trực tuyến', 'Mất kết nối'].map((value) => ({ value, label: value })),
          },
        ],
        filters: [
          { label: 'Loại thiết bị', options: types, value: (r) => r.type },
          { label: 'Trạng thái', options: ['Trực tuyến', 'Mất kết nối'], value: (r) => r.status },
        ],
        defaults: () => ({
          id: '',
          name: '',
          type: 'Camera',
          area: db.settings.areas[0].name,
          address: '192.168.1.',
          status: 'Trực tuyến',
          updatedAt: nowISO(),
        }),
        parse: (v, old) => ({ ...old, ...v, updatedAt: nowISO() }),
        extraActions: (r) =>
          can && (
            <Button
              variant="ghost"
              size="icon"
              title={r.status === 'Trực tuyến' ? 'Mô phỏng mất kết nối' : 'Khôi phục kết nối'}
              aria-label={'Đổi kết nối ' + r.id}
              onClick={() => {
                try {
                  toggleDevice(r.id);
                  toast.success('Đã cập nhật trạng thái mô phỏng');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <Power size={17} />
            </Button>
          ),
      }}
    />
  );
}
