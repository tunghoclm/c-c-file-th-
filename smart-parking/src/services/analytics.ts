import { eachDayOfInterval, format, startOfWeek, subDays } from 'date-fns';
import type { Database, Transaction } from '@/types';
import { dateInput, inRange } from '@/utils/format';
export function dashboardData(db: Database, end: string, days: number) {
  const from = dateInput(subDays(new Date(end + 'T12:00:00'), days - 1));
  const inside = db.sessions.filter((s) => !s.exitAt);
  const entries = db.sessions.filter((s) => inRange(s.entryAt, from, end));
  const exits = db.sessions.filter((s) => inRange(s.exitAt, from, end));
  const transactions = db.transactions.filter(
    (t) => t.status === 'Đã thanh toán' && inRange(t.time, from, end),
  );
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: String(h).padStart(2, '0') + ':00',
    Vào: entries.filter((s) => new Date(s.entryAt).getHours() === h).length,
    Ra: exits.filter((s) => new Date(s.exitAt).getHours() === h).length,
  }));
  const revenue = eachDayOfInterval({
    start: subDays(new Date(end + 'T12:00:00'), 6),
    end: new Date(end + 'T12:00:00'),
  }).map((d) => ({
    date: format(d, 'dd/MM'),
    revenue: db.transactions
      .filter((t) => t.status === 'Đã thanh toán' && t.time.startsWith(dateInput(d)))
      .reduce((s, t) => s + t.amount, 0),
  }));
  const types = ['Ô tô', 'Xe máy'].map((type) => ({
    name: type,
    value: entries.filter((s) => s.type === type).length,
  }));
  const areas = db.settings.areas.map((a) => ({
    ...a,
    occupied: inside.filter((s) => s.area === a.name).length,
  }));
  return {
    inside,
    entries,
    exits,
    transactions,
    hourly,
    revenue,
    types,
    areas,
    from,
    capacity: areas.reduce((s, a) => s + a.capacity, 0),
    income: transactions.reduce((s, t) => s + t.amount, 0),
  };
}
export function groupTransactions(transactions: Transaction[], period: string) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const d = new Date(t.time);
    const key =
      period === 'month'
        ? format(d, 'yyyy-MM')
        : period === 'week'
          ? dateInput(startOfWeek(d, { weekStartsOn: 1 }))
          : dateInput(d);
    map.set(key, (map.get(key) || 0) + t.amount);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, revenue]) => ({
      date:
        period === 'month'
          ? key.slice(5) + '/' + key.slice(0, 4)
          : format(new Date(key + 'T12:00:00'), 'dd/MM'),
      revenue,
    }));
}
