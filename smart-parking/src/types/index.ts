export type VehicleType = 'Ô tô' | 'Xe máy';
export type TicketType = 'Vé lượt' | 'Vé tháng';
export type Role = 'Admin' | 'Quản lý' | 'Bảo vệ' | 'Thu ngân';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'system';
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  group: string;
  createdAt: string;
  status: string;
}
export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  customerId: string;
  owner: string;
  phone: string;
  ticketType: TicketType;
  createdAt: string;
  status: string;
  note: string;
}
export interface Ticket {
  id: string;
  cardId: string;
  vehicleId: string;
  customerId: string;
  plate: string;
  type: TicketType;
  startsAt: string;
  expiresAt: string;
  price: number;
  status: string;
  sessionId: string;
}
export interface ParkingSession {
  id: string;
  vehicleId: string;
  ticketId: string;
  plate: string;
  type: VehicleType;
  ticketType: TicketType;
  entryAt: string;
  exitAt: string;
  entryLane: string;
  exitLane: string;
  area: string;
  employee: string;
  amount: number;
  payment: string;
  entryImage: string;
  exitImage: string;
  rate: FeeRule;
}
export interface Transaction {
  id: string;
  sessionId: string;
  ticketId: string;
  plate: string;
  ticketType: TicketType;
  vehicleType: VehicleType;
  method: string;
  amount: number;
  time: string;
  employee: string;
  status: string;
}
export interface Device {
  id: string;
  name: string;
  type: string;
  area: string;
  address: string;
  status: string;
  updatedAt: string;
}
export interface Alert {
  id: string;
  time: string;
  type: string;
  subject: string;
  deviceId: string;
  severity: string;
  status: string;
  handler: string;
  note: string;
}
export interface Account {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  password: string;
}
export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  content: string;
  status: string;
}
export interface FeeRule {
  id: string;
  type: VehicleType;
  ticketType: TicketType;
  hours: number;
  price: number;
  surcharge: number;
  active: boolean;
}
export interface Area {
  id: string;
  name: string;
  capacity: number;
}
export interface Settings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  areas: Area[];
  fees: FeeRule[];
  sessionMinutes: number;
}
export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  system: boolean;
}
export interface Database {
  vehicles: Vehicle[];
  customers: Customer[];
  tickets: Ticket[];
  sessions: ParkingSession[];
  transactions: Transaction[];
  devices: Device[];
  alerts: Alert[];
  accounts: Account[];
  logs: AuditLog[];
  settings: Settings;
  permissions: Record<Role, Permission>;
}
export type EntityKey = 'vehicles' | 'customers' | 'tickets' | 'devices' | 'accounts';
export type Entity<K extends EntityKey> = Database[K][number];
export interface AuthSession {
  accountId: string;
  expiresAt: number;
}
