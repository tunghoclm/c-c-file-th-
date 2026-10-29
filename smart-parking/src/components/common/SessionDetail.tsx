import type { ParkingSession } from '@/types';
import { DetailDialog, ImagePreview, StatusBadge } from './Elements';
import { dateTime, duration, money } from '@/utils/format';
import { useParkingStore } from '@/stores/useParkingStore';
export function SessionDetail({
  session,
  onClose,
}: {
  session: ParkingSession | undefined;
  onClose: () => void;
}) {
  const tickets = useParkingStore((s) => s.db.tickets);
  return (
    <DetailDialog
      open={!!session}
      onClose={onClose}
      title={'Chi tiết lượt gửi · ' + (session?.id || '')}
      items={
        session
          ? [
              { label: 'Biển số', value: <span className="plate-small">{session.plate}</span> },
              { label: 'Loại xe / vé', value: session.type + ' · ' + session.ticketType },
              { label: 'Mã xe', value: session.vehicleId || 'Khách vãng lai' },
              {
                label: 'Mã vé / thẻ',
                value:
                  session.ticketId +
                  ' / ' +
                  (tickets.find((t) => t.id === session.ticketId)?.cardId || 'Vé điện tử'),
              },
              { label: 'Thời gian vào', value: dateTime(session.entryAt) },
              { label: 'Thời gian ra', value: dateTime(session.exitAt) },
              { label: 'Thời gian gửi', value: duration(session.entryAt, session.exitAt) },
              { label: 'Phí đã ghi nhận', value: money(session.amount) },
              {
                label: 'Làn vào / ra',
                value: session.entryLane + ' / ' + (session.exitLane || '—'),
              },
              { label: 'Khu vực', value: session.area },
              { label: 'Nhân viên', value: session.employee },
              { label: 'Thanh toán', value: <StatusBadge value={session.payment} /> },
              {
                label: 'Trạng thái',
                value: <StatusBadge value={session.exitAt ? 'Đã ra' : 'Đang trong bãi'} />,
              },
            ]
          : []
      }
    >
      {session && (
        <div className="session-images">
          <ImagePreview label="Hình ảnh xe vào" plate={session.plate} />
          {session.exitAt ? (
            <ImagePreview label="Hình ảnh xe ra" plate={session.plate} />
          ) : (
            <div className="awaiting-exit">
              Xe đang trong bãi
              <br />
              <small>Ảnh xe ra hiển thị sau khi hoàn tất lượt gửi.</small>
            </div>
          )}
        </div>
      )}
    </DetailDialog>
  );
}
