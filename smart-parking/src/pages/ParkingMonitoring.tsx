import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Camera,
  CarFront,
  ChevronRight,
  CircleParking,
  CreditCard,
  DoorOpen,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { ConfirmDialog, PageHeading, StatusBadge } from '@/components/common/Elements';
import { calculateFee, ticketStatus } from '@/services/domain';
import { dateInput, dateTime, duration, money, normalizePlate, nowISO } from '@/utils/format';
import type { VehicleType } from '@/types';
export function ParkingMonitoring() {
  const { db, enter, exit, barrier } = useParkingStore(),
    canEnter = useCan('create', 'monitoring'),
    canExit = useCan('edit', 'monitoring');
  const [plate, setPlate] = useState(''),
    [type, setType] = useState<VehicleType>('Ô tô'),
    [area, setArea] = useState(db.settings.areas[0].name),
    [entryLane, setEntryLane] = useState('Làn vào 01'),
    [exitLane, setExitLane] = useState('Làn ra 01'),
    [ticket, setTicket] = useState(''),
    [selected, setSelected] = useState(''),
    [method, setMethod] = useState('Tiền mặt'),
    [openEntry, setOpenEntry] = useState(false),
    [openExit, setOpenExit] = useState(false),
    [confirm, setConfirm] = useState(false),
    [clock, setClock] = useState(nowISO());
  useEffect(() => {
    const id = setInterval(() => setClock(nowISO()), 1000);
    return () => clearInterval(id);
  }, []);
  const inside = db.sessions.filter((s) => !s.exitAt);
  const session = inside.find((s) => s.id === selected);
  const capacity = db.settings.areas.reduce((s, a) => s + a.capacity, 0);
  const matched = db.tickets.filter(
    (t) => normalizePlate(t.plate) === normalizePlate(plate) && t.status !== 'Đã trả',
  );
  const auto = matched.find(
    (t) => t.type === 'Vé tháng' && ticketStatus(t, dateInput()) === 'Hoạt động',
  );
  const selectedTicket = db.tickets.find((t) => t.id === (ticket || auto?.id));
  const fee = session ? calculateFee(session, clock) : 0;
  const toggleBarrier = (isEntry: boolean) => {
    try {
      barrier(isEntry ? entryLane : exitLane, isEntry ? !openEntry : !openExit);
      if (isEntry) setOpenEntry(!openEntry);
      else setOpenExit(!openExit);
      toast.success(
        'Đã ' + ((isEntry ? !openEntry : !openExit) ? 'mở' : 'đóng') + ' barrier mô phỏng',
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="Giám sát bãi xe"
        description="Trung tâm điều hành làn vào / ra và kiểm soát phương tiện."
      >
        <span className="simulation-label">
          <span className="live-dot" />
          CHẾ ĐỘ MÔ PHỎNG
        </span>
        <span className="live-clock">{dateTime(clock)}</span>
      </PageHeading>
      <div className="monitor-summary">
        <div>
          <span className="stat-icon blue">
            <CircleParking size={23} />
          </span>
          <span>
            <small>Tổng sức chứa</small>
            <b>{capacity} chỗ</b>
          </span>
        </div>
        <div>
          <span className="stat-icon purple">
            <CarFront size={23} />
          </span>
          <span>
            <small>Đang trong bãi</small>
            <b>{inside.length} xe</b>
          </span>
        </div>
        <div>
          <span className="stat-icon green">
            <ShieldCheck size={23} />
          </span>
          <span>
            <small>Sẵn sàng tiếp nhận</small>
            <b>{capacity - inside.length} chỗ trống</b>
          </span>
        </div>
        <div className="monitor-area-summary">
          {db.settings.areas.map((a) => (
            <span key={a.id}>
              {a.name}
              <b>{a.capacity - inside.filter((s) => s.area === a.name).length} trống</b>
            </span>
          ))}
        </div>
      </div>
      <div className="lanes-grid">
        <section className="panel lane-panel">
          <div className="lane-heading">
            <div>
              <span className="lane-icon entry">
                <ArrowDownToLine size={22} />
              </span>
              <div>
                <h2>Kiểm soát xe vào</h2>
                <p>Nhận diện & xác nhận phương tiện</p>
              </div>
            </div>
            <select
              aria-label="Làn vào"
              value={entryLane}
              onChange={(e) => setEntryLane(e.target.value)}
            >
              <option>Làn vào 01</option>
              <option>Làn vào 02</option>
            </select>
          </div>
          <div className="camera-frame">
            <div className="camera-photo" />
            <div className="camera-top">
              <span>
                <Camera size={14} />
                CAM IN · {entryLane}
              </span>
              <b>
                <span />
                DEMO
              </b>
            </div>
            <div className="scan-corners" />
            <div className="camera-timestamp">{dateTime(clock)}</div>
            <div className="camera-bottom">
              <span>Biển số nhận diện</span>
              <strong className="plate">{plate || 'CHỜ PHƯƠNG TIỆN'}</strong>
            </div>
          </div>
          <div className="lane-content">
            <div className="capture-details">
              <div>
                <ScanLine size={20} />
                <span>
                  Ảnh biển số<strong className="plate-small">{plate || '—'}</strong>
                </span>
              </div>
              <div>
                <CreditCard size={20} />
                <span>
                  Trạng thái thẻ
                  <StatusBadge
                    value={
                      selectedTicket ? ticketStatus(selectedTicket, dateInput()) : 'Vé lượt tự cấp'
                    }
                  />
                </span>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="entry-plate">Biển số phương tiện *</label>
                <input
                  id="entry-plate"
                  placeholder="30A-123.45"
                  value={plate}
                  onChange={(e) => {
                    setPlate(e.target.value.toUpperCase());
                    setTicket('');
                  }}
                />
              </div>
              <div className="form-field">
                <label htmlFor="entry-type">Loại phương tiện</label>
                <select
                  id="entry-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as VehicleType)}
                >
                  <option>Ô tô</option>
                  <option>Xe máy</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="entry-area">Khu vực đỗ</label>
                <select id="entry-area" value={area} onChange={(e) => setArea(e.target.value)}>
                  {db.settings.areas.map((a) => (
                    <option key={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="entry-ticket">Vé / thẻ</label>
                <select
                  id="entry-ticket"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                >
                  <option value="">
                    {auto ? 'Tự nhận vé tháng ' + auto.id : 'Tự cấp vé lượt mới'}
                  </option>
                  {matched.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.cardId || t.id} · {ticketStatus(t, dateInput())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="barrier-strip">
              <span className={'barrier-symbol ' + (openEntry ? 'open' : '')} />
              <span>
                Barrier làn vào <b>{openEntry ? 'Đang mở' : 'Đang đóng'}</b>
              </span>
              {canExit && (
                <button onClick={() => toggleBarrier(true)}>
                  <DoorOpen size={16} />
                  {openEntry ? 'Đóng barrier' : 'Mở barrier'}
                </button>
              )}
            </div>
            <div className="lane-actions">
              {canEnter && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const vehicle = db.vehicles.find(
                        (v) =>
                          v.status === 'Hoạt động' &&
                          !inside.some((s) => normalizePlate(s.plate) === normalizePlate(v.plate)),
                      );
                      setPlate(
                        vehicle?.plate ||
                          `51F-${String(10000 + db.sessions.length).slice(0, 3)}.${String(10000 + db.sessions.length).slice(3)}`,
                      );
                      setType(vehicle?.type || 'Ô tô');
                      setTicket('');
                      toast.info('Đã nhận diện phương tiện mô phỏng. Kiểm tra và xác nhận xe vào.');
                    }}
                  >
                    <Sparkles size={17} />
                    Mô phỏng xe vào
                  </Button>
                  <Button
                    disabled={!plate}
                    onClick={() => {
                      try {
                        const id = enter(plate, type, area, entryLane, ticket || undefined);
                        setOpenEntry(true);
                        setSelected(id);
                        toast.success('Xe ' + plate + ' đã vào bãi · ' + id);
                        setPlate('');
                        setTicket('');
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <ArrowDownToLine size={18} />
                    Xác nhận xe vào
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="panel lane-panel">
          <div className="lane-heading">
            <div>
              <span className="lane-icon exit">
                <ArrowUpFromLine size={22} />
              </span>
              <div>
                <h2>Kiểm soát xe ra</h2>
                <p>Đối chiếu & thanh toán lượt gửi</p>
              </div>
            </div>
            <select
              aria-label="Làn ra"
              value={exitLane}
              onChange={(e) => setExitLane(e.target.value)}
            >
              <option>Làn ra 01</option>
              <option>Làn ra 02</option>
            </select>
          </div>
          <div className="camera-frame exit-camera">
            <div className="camera-photo" />
            <div className="camera-top">
              <span>
                <Camera size={14} />
                CAM OUT · {exitLane}
              </span>
              <b>
                <span />
                DEMO
              </b>
            </div>
            <div className="scan-corners" />
            <div className="camera-timestamp">{dateTime(clock)}</div>
            <div className="camera-bottom">
              <span>Đối chiếu biển số vào / ra</span>
              <strong className="plate">{session?.plate || 'CHỜ PHƯƠNG TIỆN'}</strong>
            </div>
          </div>
          <div className="lane-content">
            <div className="form-field">
              <label htmlFor="exit-session">Chọn phương tiện đang trong bãi</label>
              <select
                id="exit-session"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Chọn biển số / lượt gửi</option>
                {inside.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.plate} · {s.id} · {s.area}
                  </option>
                ))}
              </select>
            </div>
            <div className="exit-info">
              <div>
                <span>Thời gian vào</span>
                <b>{session ? dateTime(session.entryAt) : '—'}</b>
              </div>
              <div>
                <span>Thời gian ra dự kiến</span>
                <b>{session ? dateTime(clock) : '—'}</b>
              </div>
              <div>
                <span>Thời gian gửi</span>
                <b>{session ? duration(session.entryAt, clock) : '—'}</b>
              </div>
              <div>
                <span>Loại vé</span>
                <b>{session?.ticketType || '—'}</b>
              </div>
            </div>
            {session && (
              <div className="comparison-images">
                <div>
                  <div className="camera-photo" />
                  <span>Ảnh xe lúc vào · mô phỏng</span>
                </div>
                <div>
                  <div className="camera-photo" />
                  <span>Ảnh xe lúc ra · mô phỏng</span>
                </div>
              </div>
            )}
            <div className="payment-strip">
              <div>
                <span>Phí gửi xe dự kiến</span>
                <strong>{money(fee)}</strong>
                <small>
                  {session?.ticketType === 'Vé tháng'
                    ? 'Đã được bao gồm trong vé tháng'
                    : 'Áp dụng biểu phí được ghi nhận khi xe vào'}
                </small>
              </div>
              <select
                aria-label="Phương thức thanh toán"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
              </select>
            </div>
            <div className="barrier-strip">
              <span className={'barrier-symbol ' + (openExit ? 'open' : '')} />
              <span>
                Barrier làn ra <b>{openExit ? 'Đang mở' : 'Đang đóng'}</b>
              </span>
              {canExit && (
                <button onClick={() => toggleBarrier(false)}>
                  <DoorOpen size={16} />
                  {openExit ? 'Đóng barrier' : 'Mở barrier'}
                </button>
              )}
            </div>
            <div className="lane-actions">
              {canExit && (
                <>
                  <Button
                    variant="outline"
                    disabled={!inside.length}
                    onClick={() => {
                      setSelected(inside[0].id);
                      toast.info('Đã chọn phương tiện mô phỏng ra bãi.');
                    }}
                  >
                    <Sparkles size={17} />
                    Mô phỏng xe ra
                  </Button>
                  <Button disabled={!session} onClick={() => setConfirm(true)}>
                    <ArrowUpFromLine size={18} />
                    Thanh toán & xe ra
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
      <div className="info-banner">
        <ShieldCheck size={18} />
        <span>
          Camera và barrier trong màn hình này là mô phỏng. Mỗi lần xác nhận sẽ cập nhật lịch sử, số
          chỗ trống và doanh thu.
        </span>
        <ChevronRight size={17} />
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Xác nhận thanh toán & cho xe ra?"
        description={`${session?.plate} · ${money(fee)} · ${method}. Phí được tính đến thời điểm xác nhận. Giao dịch demo sẽ được ghi nhận và lượt gửi sẽ đóng.`}
        danger={false}
        onConfirm={() => {
          try {
            exit(selected, method, exitLane);
            toast.success('Đã thanh toán và xác nhận xe ra');
            setOpenExit(true);
            setSelected('');
            setConfirm(false);
          } catch (e) {
            toast.error((e as Error).message);
            setConfirm(false);
          }
        }}
      />
    </>
  );
}
