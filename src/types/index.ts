// src/types/index.ts

export type ViewType = 
  | 'dashboard' 
  | 'addMantra' 
  | 'mantraDetails' 
  | 'counting' 
  | 'editMantra'
  | 'history' 
  | 'settings' 
  | 'savedMantras';

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'total-malas' | 'today-malas';

// Daily History Status
export interface DailyStatus {
  practiced: boolean;
  beadsUpdated: boolean;
  settingsUpdated: boolean;
  missed: boolean;
  isPracticeDay: boolean;
  malaCompleted?: boolean;
  isFirstDay?: boolean;
  streakDay?: number;
}

// Daily History
export interface DailyHistory {
  date: string;
  dayName?: string;
  mantraCount: number;
  malaCount: number;
  beadsPerMala: number;
  remark: string;
  status: DailyStatus;
  lastUpdated?: number;
}

// Mantra
export interface Mantra {
  id: string;
  userId: string;
  name: string;
  totalCount: number;
  todayCount: number;
  malaSize: number;
  createdAt: string;
  lastUpdated?: string;
  practiceDays: number[];
  dailyHistory: DailyHistory[];
  lastActivityTime?: number;
  reminderEnabled?: boolean;
  reminderTime?: string;
  sound?: string;
  isDefault?: boolean;
  lastResetDate?: string;
}

// App Settings
export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  autoResetTime: string;
  language: 'en' | 'hi';
  defaultLandingPage: 'dashboard' | 'defaultMantra';
  sound: string;
  defaultMantraId: string | null;
}

// Notification Settings
export interface NotificationSettings {
  enabled: boolean;
  dailyReminders: boolean;
  malaAlerts: boolean;
  pushNotifications: boolean;
  countVibration: boolean;
  malaVibration: boolean;
  soundEnabled?: boolean;
  notificationVibration?: boolean;
}

// User Profile
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
