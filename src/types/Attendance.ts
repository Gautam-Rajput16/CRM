export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    eventType: 'login' | 'logout';
    timestamp: string;
    imageData?: string;
    browserInfo?: string;
    createdAt: string;
}

export interface AttendanceFilters {
    userId?: string;
    startDate?: string;
    endDate?: string;
    eventType?: 'login' | 'logout' | 'all';
}

export interface AttendanceSummary {
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
}

export interface DailyAttendance {
    userId: string;
    userName: string;
    userRole: string;
    loginTime?: string;
    loginImage?: string;
    logoutTime?: string;
    logoutImage?: string;
    status: 'present' | 'late' | 'absent' | 'partial';
    workDuration?: string;
}
