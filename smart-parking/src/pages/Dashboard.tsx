import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
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
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CarFront,
  CircleParking,
  MapPin,
  Monitor,
  Wallet,
  Zap,
} from 'lucide-react';
import { useCan, useParkingStore, useUser } from '@/stores/useParkingStore';
import { Button } from '@/components/ui/button';
import { ChartCard, PageHeading, StatCard, StatusBadge } from '@/components/common/Elements';
import { DataTable } from '@/components/common/DataTable';
import { SessionDetail } from '@/components/common/SessionDetail';
import { dateInput, dateTime, money } from '@/utils/format';
import { dashboardData } from '@/services/analytics';
const tooltipStyle = { border: '1px solid #e1e8f2', borderRadius: 12, fontSize: 12 };
export function Dashboard() {
  const db = useParkingStore((s) => s.db),
    user = useUser(),
    canMonitor = useCan('view', 'monitoring');
  const [days, setDays] = useState(1),
    [end, setEnd] = useState(dateInput()),
    [detail, setDetail] = useState('');
  const d = dashboardData(db, end, days);
  return (
    <>
      <PageHeading
        title="Tổng quan bãi xe"
        description={`Chào ${user?.name.split(' ').at(-1)}, đây là tình hình hoạt động bãi xe của bạn.`}
      >
        <div className="segmented">
          {[
            [1, 'Hôm nay'],
            [7, '7 ngày'],
            [30, '30 ngày'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={days === value ? 'selected' : ''}
              onClick={() => setDays(Number(value))}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="date-control"
          type="date"
          aria-label="Ngày thống kê"
          value={end}
          onChange={(e) => e.target.value && setEnd(e.target.value)}
        />
      </PageHeading>
      <div className="overview-banner">
        <div>
          <span className="banner-eyebrow">
            <span className="live-dot" />
            TRUNG TÂM ĐIỀU HÀNH
          </span>
          <h2>Mọi hoạt động, trong tầm kiểm soát.</h2>
          <p>
            <MapPin size={15} />
            {db.settings.name}
            <span>·</span>
            {db.devices.filter((x) => x.status === 'Trực tuyến').length}/{db.devices.length} thiết
            bị trực tuyến
          </p>
        </div>
        <div className="banner-right">
          <div>
            <span className="capacity-number">
              {Math.round((d.inside.length / d.capacity) * 100)}
              <small>%</small>
            </span>
            <span>Công suất hiện tại</span>
          </div>
          {canMonitor && (
            <Button asChild>
              <Link to="/monitoring">
                <Monitor size={18} />
                Giám sát trực tiếp
                <ArrowRight size={16} />
              </Link>
            </Button>
          )}
        </div>
        <div className="banner-decoration">
          <CircleParking />
        </div>
      </div>
      <div className="stats-grid six">
        <StatCard
          title="Tổng số chỗ đỗ"
          value={d.capacity}
          detail={`${db.settings.areas.length} khu vực đang vận hành`}
          icon={CircleParking}
        />
        <StatCard
          title="Xe đang trong bãi"
          value={d.inside.length}
          detail="Trạng thái hiện tại"
          icon={CarFront}
          tone="purple"
        />
        <StatCard
          title="Chỗ còn trống"
          value={d.capacity - d.inside.length}
          detail="Sẵn sàng đón phương tiện"
          icon={MapPin}
          tone="green"
        />
        <StatCard
          title={'Lượt xe vào' + (days === 1 ? ' hôm nay' : '')}
          value={d.entries.length}
          detail={`Trong khoảng ${days} ngày đã chọn`}
          icon={ArrowDownToLine}
        />
        <StatCard
          title={'Lượt xe ra' + (days === 1 ? ' hôm nay' : '')}
          value={d.exits.length}
          detail="Lượt gửi đã hoàn tất"
          icon={ArrowUpFromLine}
          tone="amber"
        />
        <StatCard
          title={'Doanh thu' + (days === 1 ? ' hôm nay' : '')}
          value={money(d.income)}
          detail={`${d.transactions.length} giao dịch đã thanh toán`}
          icon={Wallet}
          tone="green"
        />
      </div>
      <div className="dashboard-charts">
        <ChartCard
          title="Lưu lượng xe vào / ra"
          subtitle="Phân bố lượt xe theo giờ trong khoảng ngày đã chọn"
          action={
            <div className="chart-legend">
              <span>
                <i />
                Xe vào
              </span>
              <span>
                <i className="cyan" />
                Xe ra
              </span>
            </div>
          }
        >
          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.hourly} margin={{ top: 16, right: 15, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="entryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0875f9" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0875f9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#edf1f7" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#8b9bb3' }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#8b9bb3' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="Vào"
                  stroke="#0875f9"
                  strokeWidth={3}
                  fill="url(#entryGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="Ra"
                  stroke="#37bdc7"
                  strokeWidth={2.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Doanh thu 7 ngày" subtitle={`7 ngày kết thúc tại ngày đã chọn · VNĐ`}>
          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.revenue} margin={{ top: 16, right: 8, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#edf1f7" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#8b9bb3' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}tr` : `${v / 1000}k`)}
                  tick={{ fontSize: 11, fill: '#8b9bb3' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#0875f9"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="dashboard-bottom">
        <ChartCard
          title="Tình trạng khu vực"
          subtitle="Số chỗ đang sử dụng theo thời gian thực"
          action={
            <span className="subtle-icon">
              <MapPin size={18} />
            </span>
          }
        >
          <div className="area-list">
            {d.areas.map((a, i) => (
              <div className="area-row" key={a.id}>
                <span className={'area-icon area-' + i}>
                  <CarFront size={20} />
                </span>
                <div>
                  <div>
                    <b>{a.name}</b>
                    <span>
                      <strong>{a.occupied}</strong> / {a.capacity} chỗ
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      style={{
                        width: `${(a.occupied / a.capacity) * 100}%`,
                        background: ['#0875f9', '#7961db', '#35b5bb'][i % 3],
                      }}
                    />
                  </div>
                  <small>{a.capacity - a.occupied} chỗ trống</small>
                </div>
                <b>{Math.round((a.occupied / a.capacity) * 100)}%</b>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Cơ cấu phương tiện" subtitle="Theo lượt xe vào trong khoảng đã chọn">
          <div className="donut-wrap">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={d.types}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={4}
                    stroke="none"
                  >
                    {d.types.map((x, i) => (
                      <Cell key={x.name} fill={['#0875f9', '#9dc9ff'][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <b>{d.entries.length}</b>
                <span>lượt xe</span>
              </div>
            </div>
            <div className="donut-legend">
              {d.types.map((t, i) => (
                <div key={t.name}>
                  <i style={{ background: ['#0875f9', '#9dc9ff'][i] }} />
                  <span>{t.name}</span>
                  <b>{t.value}</b>
                </div>
              ))}
              <p>
                <Zap size={14} />
                Tự động đồng bộ
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
      <DataTable
        title="Hoạt động gần đây"
        rows={db.sessions
          .filter((s) => d.entries.some((e) => e.id === s.id) || d.exits.some((e) => e.id === s.id))
          .sort((a, b) => (b.exitAt || b.entryAt).localeCompare(a.exitAt || a.entryAt))}
        pageSize={5}
        columns={[
          { key: 'id', label: 'Mã lượt gửi', value: (r) => r.id },
          {
            key: 'plate',
            label: 'Biển số',
            value: (r) => r.plate,
            render: (r) => <span className="plate-small">{r.plate}</span>,
          },
          { key: 'type', label: 'Loại xe', value: (r) => r.type },
          { key: 'time', label: 'Thời gian', value: (r) => dateTime(r.exitAt || r.entryAt) },
          {
            key: 'action',
            label: 'Hoạt động',
            value: (r) => (r.exitAt ? 'Xe ra' : 'Xe vào'),
            render: (r) => (
              <span className={'activity ' + (r.exitAt ? 'exit' : 'entry')}>
                {r.exitAt ? <ArrowUpFromLine size={15} /> : <ArrowDownToLine size={15} />}{' '}
                {r.exitAt ? 'Xe ra' : 'Xe vào'}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Trạng thái',
            value: (r) => (r.exitAt ? 'Hoàn tất' : 'Đang trong bãi'),
            render: (r) => <StatusBadge value={r.exitAt ? r.payment : 'Đang trong bãi'} />,
          },
        ]}
        onRow={(r) => setDetail(r.id)}
        actions={(r) => (
          <Button variant="ghost" size="sm" onClick={() => setDetail(r.id)}>
            Chi tiết
            <ArrowRight size={14} />
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
