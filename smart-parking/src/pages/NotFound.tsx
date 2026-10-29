import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export function NotFound() {
  return (
    <div className="access-denied">
      <strong className="error-code">404</strong>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn không tồn tại trong hệ thống Smart Parking.</p>
      <Button asChild>
        <Link to="/dashboard">Về tổng quan</Link>
      </Button>
    </div>
  );
}
