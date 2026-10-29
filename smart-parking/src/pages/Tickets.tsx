import { useMemo, useState } from 'react';
import { addMonths } from 'date-fns';
import {
  CalendarClock,
  CircleCheck,
  CreditCard,
  LockKeyhole,
  RotateCcw,
  Ticket,
  UnlockKeyhole,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResourcePage } from '@/components/common/ResourcePage';
import { ConfirmDialog, StatCard, StatusBadge } from '@/components/common/Elements';
import { FormDialog } from '@/components/common/FormDialog';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { dateInput, dateOnly, money, plateValid } from '@/utils/format';
import { ticketStatus } from '@/services/domain';
import type { Ticket as TicketModel, TicketType } from '@/types';
import { Button } from '@/components/ui/button';
export function Tickets() {
  const { db, renew, ticketAction } = useParkingStore(),
    can = useCan('edit', 'tickets');
  const [renewing, setRenewing] = useState<TicketModel | null>(null),
    [action, setAction] = useState<{ id: string; kind: 'lock' | 'return' | 'unlock' } | null>(null);
  const renewValues = useMemo(
    () => ({
      date: dateInput(
        addMonths(
          new Date(renewing && renewing.expiresAt > dateInput() ? renewing.expiresAt : new Date()),
          1,
        ),
      ),
      amount: String(renewing?.price || 150000),
      method: 'Chuyển khoản',
    }),
    [renewing],
  );
  return (
    <>
      <ResourcePage
        config={{
          key: 'tickets',
          title: 'Quản lý vé xe',
          description: 'Cấp vé, quản lý thẻ và gia hạn vé tháng cho khách hàng.',
          singular: 'vé xe',
          stats: (
            <div className="stats-grid four">
              <StatCard title="Tổng vé / thẻ" value={db.tickets.length} icon={Ticket} />
              <StatCard
                title="Vé đang hiệu lực"
                value={
                  db.tickets.filter((t) => ticketStatus(t, dateInput()) === 'Hoạt động').length
                }
                icon={CircleCheck}
                tone="green"
              />
              <StatCard
                title="Vé tháng"
                value={db.tickets.filter((t) => t.type === 'Vé tháng').length}
                icon={CreditCard}
                tone="purple"
              />
              <StatCard
                title="Hết hạn / bị khóa"
                value={
                  db.tickets.filter((t) =>
                    ['Hết hạn', 'Bị khóa'].includes(ticketStatus(t, dateInput())),
                  ).length
                }
                icon={CalendarClock}
                tone="amber"
              />
            </div>
          ),
          columns: [
            { key: 'id', label: 'Mã vé', value: (r) => r.id },
            { key: 'card', label: 'Mã thẻ', value: (r) => r.cardId },
            { key: 'vehicle', label: 'Mã xe', value: (r) => r.vehicleId },
            {
              key: 'plate',
              label: 'Biển số',
              value: (r) => r.plate,
              render: (r) => <span className="plate-small">{r.plate}</span>,
            },
            {
              key: 'type',
              label: 'Loại vé',
              value: (r) => r.type,
              render: (r) => (
                <span className={'tag ' + (r.type === 'Vé tháng' ? 'tag-purple' : '')}>
                  {r.type}
                </span>
              ),
            },
            {
              key: 'customer',
              label: 'Khách hàng',
              value: (r) =>
                db.customers.find((c) => c.id === r.customerId)?.name || 'Khách vãng lai',
            },
            { key: 'start', label: 'Ngày bắt đầu', value: (r) => dateOnly(r.startsAt) },
            {
              key: 'expiry',
              label: 'Ngày hết hạn',
              value: (r) => (r.type === 'Vé tháng' ? dateOnly(r.expiresAt) : 'Theo lượt gửi'),
            },
            {
              key: 'price',
              label: 'Giá tiền (VNĐ)',
              value: (r) => r.price,
              render: (r) => money(r.price),
            },
            {
              key: 'status',
              label: 'Trạng thái',
              value: (r) => ticketStatus(r, dateInput()),
              render: (r) => <StatusBadge value={ticketStatus(r, dateInput())} />,
            },
          ],
          fields: [
            {
              name: 'plate',
              label: 'Biển số',
              required: true,
              validate: (v) => (plateValid(v) ? undefined : 'Ví dụ: 30A-123.45'),
            },
            { name: 'cardId', label: 'Mã thẻ', hint: 'Có thể để trống nếu cấp vé điện tử.' },
            {
              name: 'type',
              label: 'Loại vé',
              type: 'select',
              required: true,
              options: ['Vé lượt', 'Vé tháng'].map((value) => ({ value, label: value })),
            },
            {
              name: 'price',
              label: 'Số tiền thu (VNĐ)',
              type: 'number',
              required: true,
              min: 0,
              hint: 'Cấp vé tháng mới sẽ ghi nhận thanh toán demo.',
            },
            { name: 'startsAt', label: 'Ngày bắt đầu', type: 'date', required: true },
            {
              name: 'expiresAt',
              label: 'Ngày hết hạn',
              type: 'date',
              hint: 'Chỉ áp dụng cho vé tháng. Vé lượt không giới hạn 24 giờ.',
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
            { label: 'Loại vé', options: ['Vé lượt', 'Vé tháng'], value: (r) => r.type },
            {
              label: 'Trạng thái',
              options: ['Hoạt động', 'Hết hạn', 'Bị khóa', 'Đã trả', 'Chưa hiệu lực'],
              value: (r) => ticketStatus(r, dateInput()),
            },
          ],
          defaults: () => ({
            id: '',
            cardId: '',
            vehicleId: '',
            customerId: '',
            plate: '',
            type: 'Vé lượt',
            startsAt: dateInput(),
            expiresAt: dateInput(addMonths(new Date(), 1)),
            price: 0,
            status: 'Hoạt động',
            sessionId: '',
          }),
          parse: (v, old) => ({ ...old, ...v, price: Number(v.price), type: v.type as TicketType }),
          extraActions: (r) =>
            can && (
              <>
                {r.type === 'Vé tháng' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Gia hạn vé tháng"
                    aria-label={'Gia hạn ' + r.id}
                    onClick={() => setRenewing(r)}
                  >
                    <CalendarClock size={16} />
                  </Button>
                )}
                {r.status !== 'Đã trả' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={r.status === 'Bị khóa' ? 'Mở khóa vé' : 'Khóa vé'}
                      aria-label={'Khóa hoặc mở ' + r.id}
                      onClick={() =>
                        setAction({ id: r.id, kind: r.status === 'Bị khóa' ? 'unlock' : 'lock' })
                      }
                    >
                      {r.status === 'Bị khóa' ? (
                        <UnlockKeyhole size={16} />
                      ) : (
                        <LockKeyhole size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Trả thẻ"
                      aria-label={'Trả thẻ ' + r.id}
                      onClick={() => setAction({ id: r.id, kind: 'return' })}
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </>
                )}
              </>
            ),
          detail: (r) => (
            <div className="info-banner">
              Lượt gửi liên kết:{' '}
              {r.sessionId || 'Vé tháng dùng cho nhiều lượt gửi hoặc vé chưa sử dụng.'}
            </div>
          ),
        }}
      />
      <FormDialog
        open={!!renewing}
        onClose={() => setRenewing(null)}
        title={'Gia hạn vé tháng · ' + renewing?.id}
        description="Xác nhận thu tiền mô phỏng và cập nhật thời hạn mới."
        values={renewValues}
        fields={[
          { name: 'date', label: 'Ngày hết hạn mới', type: 'date', required: true },
          { name: 'amount', label: 'Số tiền thu (VNĐ)', type: 'number', required: true, min: 1 },
          {
            name: 'method',
            label: 'Thanh toán',
            type: 'select',
            required: true,
            full: true,
            options: ['Tiền mặt', 'Chuyển khoản'].map((value) => ({ value, label: value })),
          },
        ]}
        onSave={(v) => {
          if (renewing) renew(renewing.id, v.date, Number(v.amount), v.method);
        }}
        submitLabel="Xác nhận thu tiền & gia hạn"
      />
      <ConfirmDialog
        open={!!action}
        onClose={() => setAction(null)}
        title={
          action?.kind === 'return'
            ? 'Trả thẻ?'
            : action?.kind === 'lock'
              ? 'Khóa vé?'
              : 'Mở khóa vé?'
        }
        description={'Thay đổi trạng thái vé ' + action?.id + '. Thao tác sẽ được ghi vào nhật ký.'}
        danger={action?.kind !== 'unlock'}
        onConfirm={() => {
          try {
            if (action) ticketAction(action.id, action.kind);
            toast.success('Đã cập nhật trạng thái vé');
            setAction(null);
          } catch (e) {
            toast.error((e as Error).message);
            setAction(null);
          }
        }}
      />
    </>
  );
}
