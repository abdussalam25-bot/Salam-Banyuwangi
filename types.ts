import { Timestamp } from 'firebase/firestore';

export type UserRole = 'teacher' | 'admin' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: any;
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'WFH' | 'Dinas Luar';

export interface LocationData {
  lat: number;
  lng: number;
}

export interface AttendanceRecord {
  id?: string;
  uid: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  manualStatus: boolean;
  location: LocationData | null;
  createdAt: Timestamp | Date;
  dateStr: string; // YYYY-MM-DD for easy querying
}

export interface AttendanceStats {
  present: number;
  late: number;
  excused: number; // Izin/Sakit
  remote: number; // WFH/Dinas
}