import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CarFront,
  CircleParking,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  Leaf,
  LockKeyhole,
  LogIn,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useParkingStore } from '@/stores/useParkingStore';
const schema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
  remember: z.boolean(),
});
const features = [
  {
    icon: ShieldCheck,
    title: 'An toàn',
    text: 'Giám sát 24/7',
    en: 'Secure',
    sub: '24/7 monitoring',
  },
  {
    icon: Clock3,
    title: 'Nhanh chóng',
    text: 'Tự động nhận diện xe',
    en: 'Fast',
    sub: 'Automatic recognition',
  },
  {
    icon: Settings2,
    title: 'Hiệu quả',
    text: 'Quản lý tập trung',
    en: 'Efficient',
    sub: 'Centralized management',
  },
  {
    icon: Leaf,
    title: 'Thân thiện',
    text: 'Trải nghiệm hiện đại',
    en: 'Friendly',
    sub: 'A modern experience',
  },
];
export function Login() {
  const { auth, login, db } = useParkingStore(),
    navigate = useNavigate(),
    [visible, setVisible] = useState(false),
    [language, setLanguage] = useState('vi'),
    [error, setError] = useState('');
  const vi = language === 'vi';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', remember: true },
  });
  if (
    auth &&
    auth.expiresAt > Date.now() &&
    db.accounts.some((a) => a.id === auth.accountId && a.status === 'Hoạt động')
  )
    return <Navigate to="/dashboard" replace />;
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-photo" />
        <div className="login-shade" />
        <div className="login-brand">
          <div className="login-logo">
            <CircleParking size={59} />
            <CarFront size={34} />
          </div>
          <div>
            <h1>
              Smart <em>Parking</em>
            </h1>
            <p>
              {vi
                ? 'Hệ Thống Quản Lý Bãi Đỗ Xe Thông Minh'
                : 'Intelligent Parking Management System'}
            </p>
          </div>
        </div>
        <div className="visual-copy">
          <span>
            <span className="live-dot" />
            {vi ? 'KẾT NỐI THÔNG MINH · VẬN HÀNH AN TÂM' : 'SMART CONNECTIONS · PEACE OF MIND'}
          </span>
          <h2>
            {vi ? (
              <>
                Mỗi hành trình.
                <br />
                Một trải nghiệm tốt hơn.
              </>
            ) : (
              <>
                Every journey.
                <br />A better experience.
              </>
            )}
          </h2>
        </div>
        <div className="login-features">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon />
              <h3>{vi ? f.title : f.en}</h3>
              <p>{vi ? f.text : f.sub}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="login-form-side">
        <div className="language-select">
          <Globe2 size={20} />
          <select
            aria-label="Ngôn ngữ / Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="login-card">
          <div className="login-heading">
            <span className="welcome-pill">SMART PARKING MANAGEMENT</span>
            <h2>{vi ? 'Đăng nhập' : 'Welcome back'}</h2>
            <p>
              {vi
                ? 'Truy cập hệ thống quản lý bãi đỗ xe thông minh'
                : 'Sign in to your intelligent parking workspace'}
            </p>
          </div>
          <form
            noValidate
            onSubmit={handleSubmit((v) => {
              try {
                setError('');
                login(v.username, v.password, v.remember);
                navigate('/dashboard');
                toast.success(
                  vi ? 'Chào mừng trở lại Smart Parking!' : 'Welcome back to Smart Parking!',
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
              }
            })}
          >
            <label className="login-input">
              <UserRound size={22} />
              <input
                aria-label="Tên đăng nhập hoặc email"
                placeholder={vi ? 'Tên đăng nhập hoặc email' : 'Username or email'}
                autoComplete="username"
                {...register('username')}
              />
            </label>
            {errors.username && (
              <p className="field-error">
                {vi ? errors.username.message : 'Please enter your username.'}
              </p>
            )}
            <label className="login-input">
              <LockKeyhole size={22} />
              <input
                aria-label="Mật khẩu"
                placeholder={vi ? 'Mật khẩu' : 'Password'}
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <Eye size={21} /> : <EyeOff size={21} />}
              </button>
            </label>
            {errors.password && (
              <p className="field-error">
                {vi ? errors.password.message : 'Please enter your password.'}
              </p>
            )}
            <div className="login-options">
              <label>
                <input type="checkbox" {...register('remember')} />
                {vi ? 'Ghi nhớ đăng nhập' : 'Remember me'}
              </label>
              <Link to="/forgot-password">{vi ? 'Quên mật khẩu?' : 'Forgot password?'}</Link>
            </div>
            {error && (
              <div role="alert" className="error-banner">
                {error}
              </div>
            )}
            <Button className="login-submit" type="submit" disabled={isSubmitting}>
              <LogIn size={22} />
              {vi ? 'Đăng nhập' : 'Sign in'}
            </Button>
          </form>
          <div className="or-divider">
            <span>{vi ? 'hoặc tiếp tục với' : 'or continue with'}</span>
          </div>
          <div className="social-buttons">
            <button onClick={() => toast.info('Tính năng chưa được kết nối')}>
              <span className="google-g">G</span>
              <span>Google</span>
            </button>
            <button onClick={() => toast.info('Tính năng chưa được kết nối')}>
              <Smartphone size={26} />
              <span>{vi ? 'Số điện thoại' : 'Phone'}</span>
            </button>
            <button onClick={() => toast.info('Tính năng chưa được kết nối')}>
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.2 12.8c0-2 1.6-3.1 1.7-3.2-1-1.5-2.6-1.7-3.2-1.7-1.4-.2-2.7.8-3.4.8-.7 0-1.8-.8-3-.8C7.8 8 6.4 8.9 5.6 10.2c-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.2 2.9 2.1 1.2 0 1.6-.7 3.1-.7s1.9.7 3.1.7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.2-2.5 1.3-2.6-.1 0-2.8-1.1-2.8-3.9zM15 6.4c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
          <div className="login-contact">
            <span>{vi ? 'Bạn chưa có tài khoản?' : 'Need an account?'}</span>
            <Link to="/forgot-password">
              {vi
                ? 'Liên hệ quản trị viên để được cấp tài khoản.'
                : 'Contact your administrator to get started.'}
            </Link>
          </div>
          <div className="demo-credentials">
            <ShieldCheck size={15} />
            <span>
              {vi ? 'Tài khoản trải nghiệm' : 'Demo account'}: <b>admin</b> / <b>Admin@123</b>
            </span>
          </div>
        </div>
        <p className="login-copyright">
          © {new Date().getFullYear()} Smart Parking ·{' '}
          {vi ? 'Giải pháp quản lý bãi xe thông minh' : 'Intelligent parking management'}
        </p>
      </section>
    </main>
  );
}
