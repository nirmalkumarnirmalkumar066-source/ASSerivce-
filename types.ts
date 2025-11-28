export type Role = 'admin' | 'worker';

export type TimeSlot = 'Morning' | 'Noon' | 'Night';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  address?: string;
  phone?: string;
}

export interface WorkItem {
  id: number;
  title: string;
  description: string;
  place: string;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  createdBy: number;
  teamLeaderId?: number | null; // ID of the worker designated as leader/sub-manager
}

export interface WorkerStatus {
  id: number;
  workId: number;
  userId: number;
  interest: boolean | null; // null = pending, true = interested, false = not interested
  attendance: boolean | null; // null = pending, true = come, false = not come
  attendanceTime?: string; // Records the specific time of attendance (e.g. "08:30 AM")
}

export interface Message {
  id: number;
  fromAdminId: number;
  toUserId?: number | null; // null means broadcast to all interested in a work
  workId?: number;
  content: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}