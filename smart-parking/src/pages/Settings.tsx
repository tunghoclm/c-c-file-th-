import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  FileClock,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParkingStore } from '@/stores/useParkingStore';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, PageHeading, StatusBadge } from '@/components/common/Elements';
import { ResourcePage } from '@/components/common/ResourcePage';
import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import { dateTime } from '@/utils/format';
import type { Account, Action, Role } from '@/types';
const tabs = [
  { id: 'general', label: 'Thông tin bãi xe', icon: Building2 },
  { id: 'fees', label: 'Cấu hình giá vé', icon: Wallet },
  { id: 'accounts', label: 'Tài khoản', icon: UsersRound },
  { id: 'permissions', label: 'Phân quyền', icon: ShieldCheck },
  { id: 'security', label: 'Bảo mật', icon: LockKeyhole },
  { id: 'logs', label: 'Nhật ký hệ thống', icon: FileClock },
];
const roles: Role[] = ['Admin', 'Quản lý', 'Bảo vệ', 'Thu ngân'];
const infoSchema = z.object({
  name: z.string().min(2, 'Nhập tên bãi xe.'),
  address: z.string().min(5, 'Nhập địa chỉ bãi xe.'),
  phone: z.string().regex(/^0[\d\s]{8,13}$/, 'Số điện thoại chưa hợp lệ.'),
  email: z.email('Email chưa hợp lệ.'),
});
function Accounts() {
  const { db, save } = useParkingStore(),
    [resetting, setResetting] = useState<Account | null>(null);
  return (
    <>
      <ResourcePage
        config={{
          key: 'accounts',
          title: 'Tài khoản nhân viên',
          description: '',
          singular: 'tài khoản',
          embedded: true,
          columns: [
            { key: 'id', label: 'Mã', value: (r) => r.id },
            { key: 'name', label: 'Họ tên', value: (r) => r.name },
            { key: 'username', label: 'Tên đăng nhập', value: (r) => r.username },
            { key: 'email', label: 'Email', value: (r) => r.email },
            { key: 'phone', label: 'Điện thoại', value: (r) => r.phone },
            { key: 'role', label: 'Vai trò', value: (r) => r.role },
            {
              key: 'status',
              label: 'Trạng thái',
              value: (r) => r.status,
              render: (r) => <StatusBadge value={r.status} />,
            },
          ],
          fields: [
            { name: 'name', label: 'Họ tên', required: true },
            {
              name: 'username',
              label: 'Tên đăng nhập',
              required: true,
              validate: (v) =>
                /^[a-zA-Z0-9_.-]{3,32}$/.test(v)
                  ? undefined
                  : 'Từ 3–32 ký tự: chữ, số, dấu chấm, gạch dưới.',
            },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Điện thoại', type: 'tel', required: true },
            {
              name: 'role',
              label: 'Vai trò',
              type: 'select',
              required: true,
              options: roles.map((value) => ({ value, label: value })),
            },
            {
              name: 'status',
              label: 'Trạng thái',
              type: 'select',
              required: true,
              options: ['Hoạt động', 'Bị khóa'].map((value) => ({ value, label: value })),
            },
            {
              name: 'password',
              label: 'Mật khẩu demo',
              type: 'password',
              required: true,
              full: true,
              validate: (v) =>
                v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v)
                  ? undefined
                  : 'Tối thiểu 8 ký tự, có chữ hoa và số.',
            },
          ],
          filters: [
            { label: 'Vai trò', options: roles, value: (r) => r.role },
            { label: 'Trạng thái', options: ['Hoạt động', 'Bị khóa'], value: (r) => r.status },
          ],
          defaults: () => ({
            id: '',
            name: '',
            username: '',
            email: '',
            phone: '',
            role: 'Bảo vệ',
            status: 'Hoạt động',
            password: 'Admin@123',
          }),
          parse: (v, old) => ({ ...old, ...v, role: v.role as Role }),
          extraActions: (r) => (
            <Button
              variant="ghost"
              size="icon"
              title="Đặt lại mật khẩu demo"
              aria-label={'Đặt lại mật khẩu ' + r.id}
              onClick={() => setResetting(r)}
            >
              <KeyRound size={16} />
            </Button>
          ),
        }}
      />
      <ConfirmDialog
        open={!!resetting}
        onClose={() => setResetting(null)}
        title="Đặt lại mật khẩu demo?"
        description={`Mật khẩu của ${resetting?.username} sẽ được đặt về Admin@123.`}
        onConfirm={() => {
          try {
            if (resetting) {
              const account = db.accounts.find((a) => a.id === resetting.id)!;
              save('accounts', { ...account, password: 'Admin@123' });
            }
            setResetting(null);
            toast.success('Đã đặt lại mật khẩu demo');
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </>
  );
}
export function Settings() {
  const { db, updateSettings, updatePermissions, changePassword, reset, logout } =
      useParkingStore(),
    [params, setParams] = useSearchParams(),
    tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab')! : 'general';
  const [draft, setDraft] = useState(() => structuredClone(db.settings)),
    [confirmReset, setConfirmReset] = useState(false),
    [password, setPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: db.settings,
  });
  useEffect(() => {
    setDraft(structuredClone(db.settings));
    resetForm(db.settings);
  }, [db.settings, resetForm]);
  const saveSettings = () => {
    try {
      updateSettings(draft);
      toast.success('Đã lưu cấu hình');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="Cài đặt hệ thống"
        description="Cấu hình bãi xe, biểu phí và quyền truy cập của nhân viên."
      />
      <div className="settings-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'active' : ''}
            key={t.id}
            onClick={() => setParams({ tab: t.id })}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'general' && (
        <div className="settings-columns">
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h2>Thông tin bãi xe</h2>
                <p>Thông tin hiển thị trên toàn bộ hệ thống.</p>
              </div>
            </div>
            <form
              noValidate
              onSubmit={handleSubmit((v) => {
                try {
                  updateSettings({ ...draft, ...v });
                  toast.success('Đã lưu thông tin bãi xe');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              })}
            >
              <div className="logo-upload">
                <div>
                  {draft.logo ? (
                    <img src={draft.logo} alt="Logo bãi xe" />
                  ) : (
                    <Building2 size={34} />
                  )}
                </div>
                <label className="btn btn-outline">
                  <Upload size={16} />
                  Tải logo lên
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (
                        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
                        file.size > 500000
                      ) {
                        toast.error('Chọn ảnh PNG/JPG/WebP dưới 500 KB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setDraft({ ...draft, logo: String(reader.result) });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <small>PNG, JPG, WebP · Tối đa 500 KB</small>
              </div>
              <div className="form-grid">
                {(
                  [
                    { key: 'name', label: 'Tên bãi xe' },
                    { key: 'address', label: 'Địa chỉ' },
                    { key: 'phone', label: 'Số điện thoại' },
                    { key: 'email', label: 'Email quản trị' },
                  ] as const
                ).map((f) => (
                  <div
                    className={'form-field ' + (['name', 'address'].includes(f.key) ? 'full' : '')}
                    key={f.key}
                  >
                    <label htmlFor={'setting-' + f.key}>{f.label} *</label>
                    <input id={'setting-' + f.key} {...register(f.key)} />
                    {errors[f.key] && <span className="field-error">{errors[f.key]?.message}</span>}
                  </div>
                ))}
              </div>
              <div className="section-divider" />
              <h3>Khu vực & sức chứa</h3>
              <p className="muted">
                Tổng sức chứa: {draft.areas.reduce((s, a) => s + a.capacity, 0)} chỗ
              </p>
              <div className="area-config">
                {draft.areas.map((a, i) => (
                  <div className="form-field" key={a.id}>
                    <label htmlFor={'capacity-' + a.id}>{a.name}</label>
                    <input
                      id={'capacity-' + a.id}
                      type="number"
                      min="1"
                      max="100000"
                      value={a.capacity}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          areas: draft.areas.map((x, j) =>
                            j === i ? { ...x, capacity: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
                    <small>chỗ đỗ</small>
                  </div>
                ))}
              </div>
              <div className="dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(structuredClone(db.settings));
                    resetForm(db.settings);
                  }}
                >
                  Hủy thay đổi
                </Button>
                <Button type="submit">
                  <Save size={16} />
                  Lưu thông tin
                </Button>
              </div>
            </form>
          </section>
          <div>
            <section className="panel settings-note">
              <ShieldCheck size={30} />
              <h3>Quản lý tập trung</h3>
              <p>Mọi thay đổi được áp dụng ngay cho Dashboard và màn hình giám sát.</p>
              <div>
                <b>{db.settings.areas.length}</b>
                <span>Khu vực hoạt động</span>
              </div>
              <div>
                <b>{db.devices.length}</b>
                <span>Thiết bị mô phỏng</span>
              </div>
            </section>
            <section className="panel reset-panel">
              <h3>Khôi phục dữ liệu mẫu</h3>
              <p>Xóa thay đổi trong bản demo, khôi phục dữ liệu ban đầu và đăng xuất.</p>
              <Button variant="destructive" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} />
                Khôi phục demo
              </Button>
            </section>
          </div>
        </div>
      )}
      {tab === 'fees' && (
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Biểu phí gửi xe</h2>
              <p>
                Vé lượt: làm tròn lên mỗi khoảng thời gian, cộng phụ phí một lần. Vé tháng: giá cho
                một kỳ.
              </p>
            </div>
          </div>
          <div className="info-banner">
            Biểu phí được chốt khi xe vào. Lượt đang gửi và giao dịch đã hoàn tất giữ nguyên biểu
            phí lịch sử. Giá mới áp dụng cho lượt gửi mới.
          </div>
          <div className="table-scroll">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Loại xe</th>
                  <th>Hình thức</th>
                  <th>Khoảng thời gian (giờ)</th>
                  <th>Đơn giá (VNĐ)</th>
                  <th>Phụ phí (VNĐ)</th>
                  <th>Áp dụng</th>
                </tr>
              </thead>
              <tbody>
                {draft.fees.map((f, i) => (
                  <tr key={f.id}>
                    <td>
                      <b>{f.type}</b>
                    </td>
                    <td>{f.ticketType}</td>
                    {(['hours', 'price', 'surcharge'] as const).map((k) => (
                      <td key={k}>
                        <input
                          type="number"
                          min={k === 'hours' ? 1 : 0}
                          aria-label={`${f.type} ${f.ticketType} ${k}`}
                          value={f[k]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              fees: draft.fees.map((r, j) =>
                                i === j ? { ...r, [k]: Number(e.target.value) } : r,
                              ),
                            })
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        type="checkbox"
                        aria-label={'Áp dụng ' + f.id}
                        checked={f.active}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            fees: draft.fees.map((r, j) =>
                              i === j ? { ...r, active: e.target.checked } : r,
                            ),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dialog-footer">
            <Button variant="outline" onClick={() => setDraft(structuredClone(db.settings))}>
              Hủy thay đổi
            </Button>
            <Button onClick={saveSettings}>
              <Save size={17} />
              Lưu biểu phí
            </Button>
          </div>
        </section>
      )}
      {tab === 'accounts' && <Accounts />}
      {tab === 'permissions' && (
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Vai trò & quyền hạn</h2>
              <p>Quyền thao tác áp dụng trên các màn hình được cấp cho từng vai trò.</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="permission-table">
              <thead>
                <tr>
                  <th>Vai trò</th>
                  {['Xem', 'Thêm', 'Sửa', 'Xóa', 'Xuất báo cáo', 'Quản lý hệ thống'].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role}>
                    <td>
                      <b>{role}</b>
                    </td>
                    {(['view', 'create', 'edit', 'delete', 'export', 'system'] as Action[]).map(
                      (action) => (
                        <td key={action}>
                          <input
                            type="checkbox"
                            aria-label={`${role}: ${action}`}
                            checked={db.permissions[role][action]}
                            disabled={role === 'Admin' || action === 'system'}
                            onChange={(e) => {
                              try {
                                updatePermissions(role, action, e.target.checked);
                                toast.success('Đã cập nhật quyền');
                              } catch (err) {
                                toast.error((err as Error).message);
                              }
                            }}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="role-descriptions">
            <p>
              <b>Quản lý:</b> Các trang vận hành, dữ liệu và báo cáo.
            </p>
            <p>
              <b>Bảo vệ:</b> Tổng quan, giám sát, lịch sử và cảnh báo.
            </p>
            <p>
              <b>Thu ngân:</b> Tổng quan, vé xe, khách hàng, lịch sử và báo cáo.
            </p>
          </div>
          <div className="info-banner">
            Phân quyền chỉ mô phỏng trên trình duyệt. Quyền quản lý hệ thống dành riêng cho Admin;
            bản demo không thay thế kiểm soát truy cập ở server.
          </div>
        </section>
      )}
      {tab === 'security' && (
        <div className="settings-columns">
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h2>Bảo mật tài khoản demo</h2>
                <p>Quản lý mật khẩu và thời hạn phiên đăng nhập.</p>
              </div>
            </div>
            <div className="security-row">
              <div>
                <h3>Mật khẩu đăng nhập</h3>
                <p>Tối thiểu 8 ký tự, có chữ hoa và số.</p>
              </div>
              <Button variant="outline" onClick={() => setPassword(true)}>
                <KeyRound size={16} />
                Đổi mật khẩu
              </Button>
            </div>
            <div className="security-row">
              <div>
                <h3>Thời hạn phiên đăng nhập</h3>
                <p>
                  Áp dụng từ lần đăng nhập tiếp theo. Ghi nhớ dùng localStorage; không ghi nhớ dùng
                  sessionStorage.
                </p>
              </div>
              <select
                aria-label="Thời hạn phiên đăng nhập"
                value={draft.sessionMinutes}
                onChange={(e) => setDraft({ ...draft, sessionMinutes: Number(e.target.value) })}
              >
                <option value={30}>30 phút</option>
                <option value={120}>2 giờ</option>
                <option value={480}>8 giờ</option>
                <option value={1440}>24 giờ</option>
                <option value={10080}>7 ngày</option>
              </select>
            </div>
            <div className="dialog-footer">
              <Button variant="outline" onClick={logout}>
                Đăng xuất
              </Button>
              <Button onClick={saveSettings}>
                <Save size={16} />
                Lưu cài đặt
              </Button>
            </div>
          </section>
          <section className="panel settings-note">
            <ShieldCheck size={30} />
            <h3>Môi trường trải nghiệm</h3>
            <p>
              Dữ liệu và mật khẩu demo nằm trong trình duyệt. Không dùng thông tin nhạy cảm hoặc mật
              khẩu thật.
            </p>
            <p>Bản triển khai thực tế cần máy chủ xác thực, mã hóa và kiểm tra quyền truy cập.</p>
          </section>
        </div>
      )}
      {tab === 'logs' && (
        <DataTable
          rows={db.logs}
          title="Nhật ký hệ thống"
          exportName="nhat-ky-he-thong"
          columns={[
            { key: 'time', label: 'Thời gian', value: (r) => dateTime(r.time) },
            { key: 'user', label: 'Người dùng', value: (r) => r.user },
            { key: 'action', label: 'Hành động', value: (r) => r.action },
            { key: 'content', label: 'Nội dung', value: (r) => r.content },
            {
              key: 'status',
              label: 'Trạng thái',
              value: (r) => r.status,
              render: (r) => <StatusBadge value={r.status} />,
            },
          ]}
        />
      )}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Khôi phục toàn bộ dữ liệu demo?"
        description="Tất cả thay đổi, giao dịch và cấu hình hiện tại sẽ được thay bằng dữ liệu mẫu. Bạn sẽ được đăng xuất. Thao tác này không thể hoàn tác."
        onConfirm={() => {
          try {
            reset();
            toast.success('Đã khôi phục dữ liệu mẫu');
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
      <FormDialog
        open={password}
        onClose={() => setPassword(false)}
        title="Đổi mật khẩu demo"
        values={{ old: '', password: '' }}
        fields={[
          { name: 'old', label: 'Mật khẩu hiện tại', type: 'password', required: true, full: true },
          { name: 'password', label: 'Mật khẩu mới', type: 'password', required: true, full: true },
        ]}
        onSave={(v) => changePassword(v.old, v.password)}
      />
    </>
  );
}
