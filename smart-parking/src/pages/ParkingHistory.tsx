import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useParkingStore } from '@/stores/useParkingStore';
import { DataTable } from '@/components/common/DataTable';
import {
  DateRangePicker,
  FilterSelect,
  PageHeading,
  StatusBadge,
} from '@/components/common/Elements';
import { SessionDetail } from '@/components/common/SessionDetail';
import { Button } from '@/components/ui/button';
import { dateTime, duration, inRange, money } from '@/utils/format';
export function ParkingHistory() {
  const db = useParkingStore((s) => s.db),
    [params] = useSearchParams();
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [type, setType] = useState(''),
    [ticket, setTicket] = useState(''),
    [lane, setLane] = useState(''),
    [status, setStatus] = useState(''),
    [detail, setDetail] = useState('');
  const rows = db.sessions.filter(
    (s) =>
      inRange(s.entryAt, from, to) &&
      (!type || s.type === type) &&
      (!ticket || s.ticketType === ticket) &&
      (!lane || s.entryLane === lane || s.exitLane === lane) &&
      (!status ||
        (status === 'Đang trong bãi'
          ? !s.exitAt
          : status === 'Đã ra'
            ? !!s.exitAt
            : s.payment === status)),
  );
  return (
    <>
      <PageHeading
        title="Lịch sử xe vào / ra"
        description="Tra cứu toàn bộ hành trình, thời gian và thanh toán của từng lượt gửi."
      />
      <div className="panel date-filter-panel">
        <DateRangePicker from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <span>{rows.length} lượt gửi phù hợp</span>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom('');
            setTo('');
            setType('');
            setTicket('');
            setLane('');
            setStatus('');
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>
      <DataTable
        rows={rows}
        title="Lịch sử lượt gửi"
        initialQuery={params.get('q') || ''}
        searchPlaceholder="Tìm biển số, mã lượt gửi, mã xe..."
        exportName="lich-su-vao-ra"
        filters={
          <>
            <FilterSelect
              label="Loại xe"
              value={type}
              onChange={setType}
              options={['Ô tô', 'Xe máy']}
            />
            <FilterSelect
              label="Loại vé"
              value={ticket}
              onChange={setTicket}
              options={['Vé lượt', 'Vé tháng']}
            />
            <FilterSelect
              label="Làn xe"
              value={lane}
              onChange={setLane}
              options={['Làn vào 01', 'Làn vào 02', 'Làn ra 01', 'Làn ra 02']}
            />
            <FilterSelect
              label="Trạng thái"
              value={status}
              onChange={setStatus}
              options={['Đang trong bãi', 'Đã ra', 'Đã thanh toán', 'Chưa thanh toán', 'Vé tháng']}
            />
          </>
        }
        columns={[
          { key: 'id', label: 'Mã lượt gửi', value: (r) => r.id },
          { key: 'vehicle', label: 'Mã xe', value: (r) => r.vehicleId },
          {
            key: 'plate',
            label: 'Biển số',
            value: (r) => r.plate,
            render: (r) => <span className="plate-small">{r.plate}</span>,
          },
          { key: 'type', label: 'Loại xe', value: (r) => r.type },
          { key: 'ticket', label: 'Loại vé', value: (r) => r.ticketType },
          { key: 'entry', label: 'Thời gian vào', value: (r) => dateTime(r.entryAt) },
          { key: 'exit', label: 'Thời gian ra', value: (r) => dateTime(r.exitAt) },
          { key: 'duration', label: 'Thời gian gửi', value: (r) => duration(r.entryAt, r.exitAt) },
          {
            key: 'amount',
            label: 'Số tiền (VNĐ)',
            value: (r) => r.amount,
            render: (r) => money(r.amount),
          },
          {
            key: 'status',
            label: 'Thanh toán',
            value: (r) => r.payment,
            render: (r) => <StatusBadge value={r.payment} />,
          },
        ]}
        onRow={(r) => setDetail(r.id)}
        actions={(r) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={'Xem ' + r.id}
            onClick={() => setDetail(r.id)}
          >
            <Eye size={16} />
          </Button>
        )}
      />
      <SessionDetail
        session={db.sessions.find((s) => s.id === detail)}
        onClose={() => setDetail('')}
      />
    </>
  );
}
