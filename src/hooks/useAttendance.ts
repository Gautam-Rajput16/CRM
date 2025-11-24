import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, AttendanceFilters, AttendanceSummary, DailyAttendance } from '../types/Attendance';
import { getAttendanceRecords, getTodayAttendance, getAttendanceSummary } from '../lib/attendanceService';

export const useAttendance = (initialFilters?: AttendanceFilters) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<DailyAttendance[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary>({
        totalEmployees: 0,
        presentToday: 0,
        lateToday: 0,
        absentToday: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecords = useCallback(async (filters?: AttendanceFilters) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getAttendanceRecords(filters);
            setRecords(data);
        } catch (err: any) {
            console.error('Error fetching attendance records:', err);
            setError(err.message || 'Failed to fetch attendance records');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTodayAttendance = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getTodayAttendance();
            setTodayAttendance(data);
        } catch (err: any) {
            console.error('Error fetching today\'s attendance:', err);
            setError(err.message || 'Failed to fetch today\'s attendance');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async (startDate?: string, endDate?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getAttendanceSummary(startDate, endDate);
            setSummary(data);
        } catch (err: any) {
            console.error('Error fetching attendance summary:', err);
            setError(err.message || 'Failed to fetch attendance summary');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(() => {
        fetchRecords(initialFilters);
        fetchTodayAttendance();
        fetchSummary();
    }, [initialFilters, fetchRecords, fetchTodayAttendance, fetchSummary]);

    useEffect(() => {
        fetchRecords(initialFilters);
        fetchTodayAttendance();
        fetchSummary();
    }, [initialFilters, fetchRecords, fetchTodayAttendance, fetchSummary]);

    return {
        records,
        todayAttendance,
        summary,
        isLoading,
        error,
        fetchRecords,
        fetchTodayAttendance,
        fetchSummary,
        refresh
    };
};
