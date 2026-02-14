export interface Mantra {
  id: string;
  name: string;
  malaSize: number;
  practiceDays: number[];
  reminderEnabled: boolean;
  reminderTime: string;
  sound: string;
  totalCount: number;
  todayCount: number;
  createdAt: string;
  lastUpdated: number;
  dailyHistory: DailyHistory[];
  isDefault?: boolean;
}

export interface DailyHistory {
  date: string;
  dayName?: string;
  mantraCount: number;
  malaCount: number;
  beadsPerMala: number;
  remark: string;
  remarks?: string[];
  status: HistoryStatus;
  lastUpdated?: number;
}

export interface HistoryStatus {
  practiced: boolean;
  beadsUpdated: boolean;
  settingsUpdated: boolean;
  missed: boolean;
  isPracticeDay?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  dailyReminders: boolean;
  malaAlerts: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  countVibration: boolean;
  malaVibration: boolean;
  notificationVibration: boolean;
}

export interface AppSettings {
  autoResetTime: string;
  vibrationEnabled: boolean;
  darkMode: boolean;
  sound: string;
  defaultLandingPage: 'dashboard' | 'defaultMantra';
}

export type ViewType = 
  | 'dashboard' 
  | 'addMantra' 
  | 'savedMantras' 
  | 'counting' 
  | 'mantraDetails' 
  | 'settings'
  | 'editMantra'
  | 'history';

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'total-malas' | 'today-malas';