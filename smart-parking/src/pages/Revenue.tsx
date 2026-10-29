import { useState } from 'react';
import { subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CarFront, CreditCard, Printer, Receipt, Ticket, Wallet } from 'lucide-react';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { Button } from '@/components/ui/button';
import {
  ChartCard,
  DateRangePicker,
  DetailDialog,
  PageHeading,
  StatCard,
  StatusBadge,
} from '@/components/common/Elements';
import { DataTable } from '@/components/common/DataTable';
import { dateInput, dateTime, inRange, money } from '@/utils/format';
import { groupTransactions } from '@/services/analytics';
export function Revenue() {
  const db = useParkingStore((s) => s.db),
    can = useCan('export', 'reports');
  const [from, setFrom] = useState(dateInput(subDays(new Date(), 29))),
    [to, setTo] = useState(dateInput()),
    [period, setPeriod] = useState('day'),
    [detail, setDetail] = useState(''),
    [breakdown, setBreakdown] = useState('ticket');
  const rows = db.transactions.filter((t) => inRange(t.time, from, to)),
    paid = rows.filter((t) => t.status === 'Đã thanh toán'),
    total = paid.reduce((s, t) => s + t.amount, 0);
  const categories = (breakdown === 'ticket' ? ['Vé lượt', 'Vé tháng'] : ['Ô tô', 'Xe máy']).map(
    (name) => ({
      name,
      value: paid
        .filter((t) => (breakdown === 'ticket' ? t.ticketType : t.vehicleType) === name)
        .reduce((s, t) => s + t.amount, 0),
    }),
  );
  const selected = rows.find((t) => t.id === detail);
  return (
    <>
      <PageHeading
        title="Doanh thu & báo cáo"
        description="Theo dõi dòng tiền và hiệu quả vận hành từ các giao dịch đã thanh toán."
      >
        {can && (
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={17} />
            In báo cáo
          </Button>
        )}
      </PageHeading>
      <div className="panel date-filter-panel">
        <DateRangePicker from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <span>Đơn vị tiền tệ: VNĐ</span>
        <div className="segmented">
          {[
            [7, '7 ngày'],
            [30, '30 ngày'],
            [90, '90 ngày'],
          ].map(([n, label]) => (
            <button
              key={n}
              onClick={() => {
                setFrom(dateInput(subDays(new Date(), Number(n) - 1)));
                setTo(dateInput());
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="stats-grid five">
        <StatCard title="Tổng doanh thu" value={money(total)} icon={Wallet} tone="green" />
        <StatCard
          title="Doanh thu vé lượt"
          value={money(
            paid.filter((t) => t.ticketType === 'Vé lượt').reduce((s, t) => s + t.amount, 0),
          )}
          icon={Ticket}
        />
        <StatCard
          title="Doanh thu vé tháng"
          value={money(
            paid.filter((t) => t.ticketType === 'Vé tháng').reduce((s, t) => s + t.amount, 0),
          )}
          icon={CreditCard}
          tone="purple"
        />
        <StatCard title="Giao dịch thanh toán" value={paid.length} icon={Receipt} tone="amber" />
        <StatCard
          title="Lượt xe vào"
          value={db.sessions.filter((s) => inRange(s.entryAt, from, to)).length}
          icon={CarFront}
        />
      </div>
      <div className="report-charts">
        <ChartCard
          title="Biểu đồ doanh thu"
          subtitle="Chỉ tính giao dịch hợp lệ đã thanh toán"
          action={
            <select
              aria-label="Nhóm biểu đồ doanh thu"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          }
        >
          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupTransactions(paid, period)}
                margin={{ left: 0, right: 15, top: 15 }}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#edf1f7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => `${v / 1000000}tr`}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#0875f9"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard
          title="Cơ cấu doanh thu"
          action={
            <select
              aria-label="Phân loại doanh thu"
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value)}
            >
              <option value="ticket">Theo loại vé</option>
              <option value="vehicle">Theo loại xe</option>
            </select>
          }
        >
          <div className="chart-height">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {categories.map((c, i) => (
                    <Cell key={c.name} fill={['#0875f9', '#8c77de'][i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="report-legend">
              {categories.map((c, i) => (
                <div key={c.name}>
                  <span>
                    <i style={{ background: ['#0875f9', '#8c77de'][i] }} />
                    {c.name}
                  </span>
                  <b>{money(c.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
      <DataTable
        title="Danh sách giao dịch"
        rows={rows}
        exportName="bao-cao-doanh-thu"
        columns={[
          { key: 'id', label: 'Mã giao dịch', value: (r) => r.id },
          { key: 'ref', label: 'Lượt gửi / vé', value: (r) => r.sessionId || r.ticketId },
          { key: 'plate', label: 'Biển số', value: (r) => r.plate },
          { key: 'method', label: 'Thanh toán', value: (r) => r.method },
          {
            key: 'amount',
            label: 'Số tiền (VNĐ)',
            value: (r) => r.amount,
            render: (r) => <b>{money(r.amount)}</b>,
          },
          { key: 'time', label: 'Thời gian', value: (r) => dateTime(r.time) },
          { key: 'employee', label: 'Nhân viên', value: (r) => r.employee },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => r.status,
            render: (r) => <StatusBadge value={r.status} />,
          },
        ]}
        onRow={(r) => setDetail(r.id)}
        actions={(r) => (
          <Button variant="ghost" size="sm" onClick={() => setDetail(r.id)}>
            Chi tiết
          </Button>
        )}
      />
      <DetailDialog
        open={!!selected}
        onClose={() => setDetail('')}
        title={'Chi tiết giao dịch · ' + selected?.id}
        items={
          selected
            ? [
                { label: 'Mã lượt gửi', value: selected.sessionId },
                { label: 'Mã vé', value: selected.ticketId },
                { label: 'Biển số', value: selected.plate },
                { label: 'Loại vé', value: selected.ticketType },
                { label: 'Số tiền', value: money(selected.amount) },
                { label: 'Thanh toán', value: selected.method },
                { label: 'Thời gian', value: dateTime(selected.time) },
                { label: 'Nhân viên', value: selected.employee },
                { label: 'Trạng thái', value: <StatusBadge value={selected.status} /> },
              ]
            : []
        }
      />
    </>
  );
}
