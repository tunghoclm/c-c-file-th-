import { differenceInMinutes, format, parseISO } from 'date-fns';
export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const number = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
export const dateTime = (value: string) =>
  value ? format(parseISO(value), 'dd/MM/yyyy HH:mm') : '—';
export const dateOnly = (value: string) => (value ? format(parseISO(value), 'dd/MM/yyyy') : '—');
export const dateInput = (value = new Date()) => format(value, 'yyyy-MM-dd');
export const duration = (start: string, end: string) => {
  const mins = Math.max(0, differenceInMinutes(new Date(end || Date.now()), new Date(start)));
  return `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
};
export const normalizePlate = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const plateValid = (value: string) =>
  /^\d{2}[A-Z]{1,2}\d?[- .]?\d{3}[. ]?\d{2}$/i.test(value.trim());
export const searchText = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
export const inRange = (time: string, from: string, to: string) =>
  !!time && (!from || time >= `${from}T00:00:00`) && (!to || time <= `${to}T23:59:59.999`);
export const nowISO = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
