import { supabase } from './supabase';
import { AttendanceRecord, AttendanceFilters, AttendanceSummary, DailyAttendance } from '../types/Attendance';
import { formatImageForStorage, getBrowserInfo, getCurrentTimestamp } from '../utils/imageUtils';

/**
 * Record attendance event (login or logout)
 */
export const recordAttendance = async (
    userId: string,
    userName: string,
    userRole: string,
    eventType: 'login' | 'logout',
    imageData?: string,
    ipAddress?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Don't record attendance for admin users
        if (userRole === 'admin') {
            return { success: true }; // Silently skip for admins
        }

        // Format image data if provided
        let formattedImage: string | undefined;
        if (imageData) {
            try {
                formattedImage = await formatImageForStorage(imageData);
            } catch (error) {
                console.error('Error formatting image:', error);
                // Continue without image if formatting fails
                formattedImage = undefined;
            }
        }

        const browserInfo = getBrowserInfo();
        const timestamp = getCurrentTimestamp();

        const { error } = await supabase
            .from('attendance_records')
            .insert({
                user_id: userId,
                user_name: userName,
                user_role: userRole,
                event_type: eventType,
                timestamp: timestamp,
                image_data: formattedImage,
                browser_info: browserInfo,
                ip_address: ipAddress
            });

        if (error) {
            console.error('Error recording attendance:', error);
            return { success: false, error: error.message };
        }

        console.log(`Attendance recorded: ${eventType} for ${userName}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to record attendance:', error);
        return { success: false, error: error.message || 'Failed to record attendance' };
    }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord = async (
    recordId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);

        if (error) {
            console.error('Error deleting attendance record:', error);
            return { success: false, error: error.message };
        }

        console.log(`Attendance record deleted: ${recordId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete attendance record:', error);
        return { success: false, error: error.message || 'Failed to delete attendance record' };
    }
};

/**
 * Bulk delete attendance records by date range
 */
export const bulkDeleteAttendanceRecordsByDateRange = async (
    startDate: string,
    endDate: string
): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
        // Convert dates to ISO format for comparison
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('attendance_records')
            .delete()
            .gte('timestamp', start.toISOString())
            .lte('timestamp', end.toISOString())
            .select();

        if (error) {
            console.error('Error bulk deleting attendance records:', error);
            return { success: false, error: error.message };
        }

        const count = data?.length || 0;
        console.log(`Bulk deleted ${count} attendance records from ${startDate} to ${endDate}`);
        return { success: true, count };
    } catch (error: any) {
        console.error('Failed to bulk delete attendance records:', error);
        return { success: false, error: error.message || 'Failed to bulk delete attendance records' };
    }
};

/**
 * Helper function to calculate working minutes between login and logout
 */
const calculateWorkingMinutes = (loginTime: string, logoutTime: string): number => {
    const login = new Date(loginTime).getTime();
    const logout = new Date(logoutTime).getTime();
    return Math.floor((logout - login) / (1000 * 60)); // Convert to minutes
};

/**
 * Helper function to format minutes as "Xh Ym"
 */
export const formatHoursDisplay = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

/**
 * Get working hours summary for today
 */
export const getWorkingHoursSummary = async (): Promise<{ totalHours: number; totalMinutes: number }> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .gte('timestamp', today.toISOString())
            .lt('timestamp', tomorrow.toISOString())
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching working hours summary:', error);
            return { totalHours: 0, totalMinutes: 0 };
        }

        // Group by user and calculate working hours
        const userSessions: { [key: string]: { login?: string; logout?: string }[] } = {};

        data?.forEach(record => {
            if (!userSessions[record.user_id]) {
                userSessions[record.user_id] = [];
            }

            const lastSession = userSessions[record.user_id][userSessions[record.user_id].length - 1];

            if (record.event_type === 'login') {
                userSessions[record.user_id].push({ login: record.timestamp });
            } else if (record.event_type === 'logout' && lastSession && lastSession.login && !lastSession.logout) {
                lastSession.logout = record.timestamp;
            }
        });

        let totalMinutes = 0;
        Object.values(userSessions).forEach(sessions => {
            sessions.forEach(session => {
                if (session.login && session.logout) {
                    totalMinutes += calculateWorkingMinutes(session.login, session.logout);
                }
            });
        });

        return {
            totalHours: Math.floor(totalMinutes / 60),
            totalMinutes
        };
    } catch (error) {
        console.error('Failed to fetch working hours summary:', error);
        return { totalHours: 0, totalMinutes: 0 };
    }
};

/**
 * Get detailed working hours per employee with date range filter
 */
export const getEmployeeWorkingHours = async (filters?: {
    startDate?: string;
    endDate?: string;
}): Promise<any[]> => {
    try {
        let startDate = filters?.startDate;
        let endDate = filters?.endDate;

        if (!startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today.toISOString();
        }

        if (!endDate) {
            const tomorrow = new Date(startDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            endDate = tomorrow.toISOString();
        } else {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            endDate = end.toISOString();
        }

        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching employee working hours:', error);
            return [];
        }

        // Group by user
        const userWorkingHours: { [key: string]: any } = {};

        data?.forEach(record => {
            if (!userWorkingHours[record.user_id]) {
                userWorkingHours[record.user_id] = {
                    userId: record.user_id,
                    userName: record.user_name,
                    userRole: record.user_role,
                    sessions: [],
                    totalMinutes: 0,
                    daysWorked: new Set(),
                    firstLogin: null,
                    lastLogout: null
                };
            }

            const userData = userWorkingHours[record.user_id];
            const recordDate = new Date(record.timestamp).toDateString();
            userData.daysWorked.add(recordDate);

            if (record.event_type === 'login') {
                userData.sessions.push({ login: record.timestamp, logout: null });
                if (!userData.firstLogin || new Date(record.timestamp) < new Date(userData.firstLogin)) {
                    userData.firstLogin = record.timestamp;
                }
            } else if (record.event_type === 'logout') {
                const lastSession = userData.sessions[userData.sessions.length - 1];
                if (lastSession && lastSession.login && !lastSession.logout) {
                    lastSession.logout = record.timestamp;
                    userData.totalMinutes += calculateWorkingMinutes(lastSession.login, lastSession.logout);
                }
                if (!userData.lastLogout || new Date(record.timestamp) > new Date(userData.lastLogout)) {
                    userData.lastLogout = record.timestamp;
                }
            }
        });

        // Convert to array and calculate stats
        return Object.values(userWorkingHours).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userRole: user.userRole,
            totalHours: Math.floor(user.totalMinutes / 60),
            totalMinutes: user.totalMinutes,
            formattedHours: formatHoursDisplay(user.totalMinutes),
            daysWorked: user.daysWorked.size,
            averageHoursPerDay: user.daysWorked.size > 0
                ? formatHoursDisplay(Math.floor(user.totalMinutes / user.daysWorked.size))
                : '0h 0m',
            firstLogin: user.firstLogin,
            lastLogout: user.lastLogout,
            status: user.totalMinutes > 0 ? 'Active' : 'Inactive'
        })).sort((a, b) => b.totalMinutes - a.totalMinutes);
    } catch (error) {
        console.error('Failed to fetch employee working hours:', error);
        return [];
    }
};




/**
 * Get attendance records with filters
 */
export const getAttendanceRecords = async (
    filters?: AttendanceFilters
): Promise<AttendanceRecord[]> => {
    try {
        let query = supabase
            .from('attendance_records')
            .select('*')
            .order('timestamp', { ascending: false });

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }

        if (filters?.eventType && filters.eventType !== 'all') {
            query = query.eq('event_type', filters.eventType);
        }

        if (filters?.startDate) {
            query = query.gte('timestamp', filters.startDate);
        }

        if (filters?.endDate) {
            // Add one day and use lt to include the entire end date
            const endDateTime = new Date(filters.endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            query = query.lt('timestamp', endDateTime.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching attendance records:', error);
            throw error;
        }

        if (!data) return [];

        // Map to AttendanceRecord type
        return data.map(record => ({
            id: record.id,
            userId: record.user_id,
            userName: record.user_name,
            userRole: record.user_role,
            eventType: record.event_type as 'login' | 'logout',
            timestamp: record.timestamp,
            imageData: record.image_data,
            browserInfo: record.browser_info,
            ipAddress: record.ip_address,
            createdAt: record.created_at
        }));
    } catch (error) {
        console.error('Failed to fetch attendance records:', error);
        return [];
    }
};

/**
 * Get today's attendance summary
 */
export const getTodayAttendance = async (): Promise<DailyAttendance[]> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .gte('timestamp', today.toISOString())
            .lt('timestamp', tomorrow.toISOString())
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching today\'s attendance:', error);
            throw error;
        }

        if (!data || data.length === 0) return [];

        // Group by user
        const userAttendance: { [userId: string]: DailyAttendance } = {};

        data.forEach(record => {
            const userId = record.user_id;

            if (!userAttendance[userId]) {
                userAttendance[userId] = {
                    userId: record.user_id,
                    userName: record.user_name,
                    userRole: record.user_role,
                    status: 'absent'
                };
            }

            if (record.event_type === 'login') {
                userAttendance[userId].loginTime = record.timestamp;
                userAttendance[userId].loginImage = record.image_data;
                userAttendance[userId].status = 'present';
                userAttendance[userId].ipAddress = record.ip_address;
            } else if (record.event_type === 'logout') {
                userAttendance[userId].logoutTime = record.timestamp;
                userAttendance[userId].logoutImage = record.image_data;
            }
        });

        // Calculate work duration and determine status
        Object.values(userAttendance).forEach(attendance => {
            if (attendance.loginTime && attendance.logoutTime) {
                const login = new Date(attendance.loginTime);
                const logout = new Date(attendance.logoutTime);
                const diffMs = logout.getTime() - login.getTime();
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                attendance.workDuration = `${hours}h ${minutes}m`;
            } else if (attendance.loginTime && !attendance.logoutTime) {
                attendance.status = 'partial';
            }

            // Determine if late (login after 9:30 AM)
            if (attendance.loginTime) {
                const loginTime = new Date(attendance.loginTime);
                const cutoffTime = new Date(loginTime);
                cutoffTime.setHours(9, 30, 0, 0);

                if (loginTime > cutoffTime) {
                    attendance.status = 'late';
                }
            }
        });

        return Object.values(userAttendance);
    } catch (error) {
        console.error('Failed to fetch today\'s attendance:', error);
        return [];
    }
};

/**
 * Get user attendance report for a date range
 */
export const getUserAttendanceReport = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<AttendanceRecord[]> => {
    return getAttendanceRecords({
        userId,
        startDate,
        endDate
    });
};

/**
 * Get attendance summary statistics
 */
export const getAttendanceSummary = async (): Promise<AttendanceSummary> => {
    try {
        // Get all users from profiles (non-admin)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .neq('role', 'admin');

        if (profileError) {
            console.error('Error fetching profiles:', profileError);
            throw profileError;
        }

        const totalEmployees = profiles?.length || 0;

        // Get today's attendance
        const todayAttendance = await getTodayAttendance();

        const presentToday = todayAttendance.filter(a =>
            a.status === 'present' || a.status === 'partial'
        ).length;

        const lateToday = todayAttendance.filter(a => a.status === 'late').length;
        const absentToday = totalEmployees - presentToday - lateToday;

        return {
            totalEmployees,
            presentToday,
            lateToday,
            absentToday
        };
    } catch (error) {
        console.error('Failed to fetch attendance summary:', error);
        return {
            totalEmployees: 0,
            presentToday: 0,
            lateToday: 0,
            absentToday: 0
        };
    }
};

/**
 * Check if user has logged in today
 */
export const hasLoggedInToday = async (userId: string): Promise<boolean> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('user_id', userId)
            .eq('event_type', 'login')
            .gte('timestamp', today.toISOString())
            .limit(1);

        if (error) {
            console.error('Error checking login status:', error);
            return false;
        }

        return (data && data.length > 0);
    } catch (error) {
        console.error('Failed to check login status:', error);
        return false;
    }
};
