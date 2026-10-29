import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useParkingStore } from '@/stores/useParkingStore';
export function ForgotPassword() {
  const settings = useParkingStore((s) => s.db.settings);
  return (
    <main className="auth-help">
      <div className="panel">
        <span className="help-icon">
          <ShieldCheck size={34} />
        </span>
        <h1>Hỗ trợ tài khoản</h1>
        <p>
          Để khôi phục mật khẩu hoặc được cấp tài khoản, hãy liên hệ quản trị viên bãi xe. Cung cấp
          tên đăng nhập và thông tin nhân viên để được hỗ trợ.
        </p>
        <a href={'mailto:' + settings.email}>
          <Mail size={19} />
          {settings.email}
        </a>
        <a href={'tel:' + settings.phone.replace(/\s/g, '')}>
          <Phone size={19} />
          {settings.phone}
        </a>
        <div className="info-banner">
          Đây là môi trường demo. Hệ thống không gửi email hoặc SMS tự động. Tài khoản ban đầu:
          admin / Admin@123.
        </div>
        <Button asChild>
          <Link to="/login">
            <ArrowLeft size={17} />
            Quay lại đăng nhập
          </Link>
        </Button>
      </div>
    </main>
  );
}
