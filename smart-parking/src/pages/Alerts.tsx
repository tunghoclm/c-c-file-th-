import { useMemo, useState } from 'react';
import { BellRing, CheckCheck, CircleAlert, Eye } from 'lucide-react';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { DataTable } from '@/components/common/DataTable';
import {
  DetailDialog,
  FilterSelect,
  PageHeading,
  StatCard,
  StatusBadge,
} from '@/components/common/Elements';
import { FormDialog } from '@/components/common/FormDialog';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/utils/format';
export function Alerts() {
  const { db, resolveAlert } = useParkingStore(),
    can = useCan('edit', 'alerts');
  const [severity, setSeverity] = useState(''),
    [status, setStatus] = useState(''),
    [detail, setDetail] = useState(''),
    [resolving, setResolving] = useState('');
  const selected = db.alerts.find((a) => a.id === detail);
  const values = useMemo(
    () => ({ note: db.alerts.find((a) => a.id === resolving)?.note || '' }),
    [resolving, db.alerts],
  );
  return (
    <>
      <PageHeading
        title="Cảnh báo & sự kiện"
        description="Phát hiện bất thường, theo dõi sự kiện và xử lý kịp thời."
      />
      <div className="stats-grid three">
        <StatCard title="Tổng sự kiện" value={db.alerts.length} icon={BellRing} />
        <StatCard
          title="Cần xử lý"
          value={db.alerts.filter((a) => a.status === 'Chưa xử lý').length}
          icon={CircleAlert}
          tone="amber"
        />
        <StatCard
          title="Đã xử lý"
          value={db.alerts.filter((a) => a.status === 'Đã xử lý').length}
          icon={CheckCheck}
          tone="green"
        />
      </div>
      <DataTable
        rows={db.alerts.filter(
          (a) => (!severity || a.severity === severity) && (!status || a.status === status),
        )}
        title="Nhật ký cảnh báo"
        exportName="canh-bao"
        filters={
          <>
            <FilterSelect
              label="Mức độ"
              value={severity}
              onChange={setSeverity}
              options={['Nghiêm trọng', 'Cảnh báo', 'Thông tin']}
            />
            <FilterSelect
              label="Trạng thái"
              value={status}
              onChange={setStatus}
              options={['Chưa xử lý', 'Đã xử lý']}
            />
          </>
        }
        columns={[
          { key: 'id', label: 'Mã', value: (r) => r.id },
          { key: 'time', label: 'Thời gian', value: (r) => dateTime(r.time) },
          { key: 'type', label: 'Loại sự kiện', value: (r) => r.type },
          { key: 'subject', label: 'Đối tượng', value: (r) => r.subject },
          {
            key: 'device',
            label: 'Thiết bị',
            value: (r) => db.devices.find((d) => d.id === r.deviceId)?.name || r.deviceId,
          },
          {
            key: 'severity',
            label: 'Mức độ',
            value: (r) => r.severity,
            render: (r) => <StatusBadge value={r.severity} />,
          },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => r.status,
            render: (r) => <StatusBadge value={r.status} />,
          },
          { key: 'handler', label: 'Người xử lý', value: (r) => r.handler },
        ]}
        onRow={(r) => setDetail(r.id)}
        actions={(r) => (
          <>
            <Button
              variant="ghost"
              size="icon"
              title="Xem chi tiết"
              aria-label={'Xem ' + r.id}
              onClick={() => setDetail(r.id)}
            >
              <Eye size={16} />
            </Button>
            {can && r.status !== 'Đã xử lý' && (
              <Button variant="outline" size="sm" onClick={() => setResolving(r.id)}>
                <CheckCheck size={15} />
                Xử lý
              </Button>
            )}
          </>
        )}
      />
      <DetailDialog
        open={!!selected}
        onClose={() => setDetail('')}
        title={'Chi tiết cảnh báo · ' + selected?.id}
        items={
          selected
            ? [
                { label: 'Loại', value: selected.type },
                { label: 'Thời gian', value: dateTime(selected.time) },
                { label: 'Đối tượng', value: selected.subject },
                { label: 'Mức độ', value: <StatusBadge value={selected.severity} /> },
                { label: 'Trạng thái', value: <StatusBadge value={selected.status} /> },
                { label: 'Người xử lý', value: selected.handler },
                { label: 'Ghi chú xử lý', value: selected.note },
              ]
            : []
        }
      />
      <FormDialog
        open={!!resolving}
        onClose={() => setResolving('')}
        title={'Xử lý cảnh báo · ' + resolving}
        values={values}
        fields={[
          { name: 'note', label: 'Nội dung xử lý', type: 'textarea', full: true, required: true },
        ]}
        onSave={(v) => resolveAlert(resolving, v.note)}
        submitLabel="Đánh dấu đã xử lý"
      />
    </>
  );
}
