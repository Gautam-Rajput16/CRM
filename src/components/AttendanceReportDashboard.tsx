import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    Clock,
    Download,
    Search,
    Image as ImageIcon,
    X,
    CheckCircle,
    XCircle,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceFilters, DailyAttendance } from '../types/Attendance';
import { formatTimeForDisplay, formatDateForDisplay } from '../utils/imageUtils';
import { deleteAttendanceRecord, bulkDeleteAttendanceRecordsByDateRange } from '../lib/attendanceService';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export const AttendanceReportDashboard: React.FC = () => {
    const [filters, setFilters] = useState<AttendanceFilters>({
        eventType: 'all'
    });
    const [selectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleteStartDate, setBulkDeleteStartDate] = useState('');
    const [bulkDeleteEndDate, setBulkDeleteEndDate] = useState('');
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const { records, todayAttendance, summary, isLoading, fetchRecords, fetchTodayAttendance, fetchSummary } = useAttendance();

    // Fetch data when filters change
    useEffect(() => {
        if (viewMode === 'history') {
            fetchRecords(filters);
        } else {
            fetchTodayAttendance();
        }
        fetchSummary();
    }, [filters, viewMode, fetchRecords, fetchTodayAttendance, fetchSummary]);

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        setFilters(prev => ({
            ...prev,
            [type === 'start' ? 'startDate' : 'endDate']: value
        }));
    };

    const handleExportToExcel = () => {
        try {
            let dataToExport: any[] = [];

            if (viewMode === 'today') {
                dataToExport = todayAttendance.map(attendance => ({
                    'Employee Name': attendance.userName,
                    'Role': attendance.userRole,
                    'Login Time': attendance.loginTime ? formatTimeForDisplay(attendance.loginTime) : '-',
                    'Logout Time': attendance.logoutTime ? formatTimeForDisplay(attendance.logoutTime) : '-',
                    'Work Duration': attendance.workDuration || '-',
                    'Status': attendance.status.toUpperCase(),
                    'Date': formatDateForDisplay(selectedDate)
                }));
            } else {
                dataToExport = records.map(record => ({
                    'Employee Name': record.userName,
                    'Role': record.userRole,
                    'Event Type': record.eventType === 'login' ? 'Login' : 'Logout',
                    'Time': formatTimeForDisplay(record.timestamp),
                    'Date': formatDateForDisplay(record.timestamp),
                    'Browser': record.browserInfo || '-'
                }));
            }

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
            XLSX.writeFile(workbook, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success('Attendance report exported successfully!');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const handleDeleteRecord = async (recordId: string, userName: string) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the attendance record for ${userName}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingRecordId(recordId);
        try {
            const result = await deleteAttendanceRecord(recordId);

            if (result.success) {
                toast.success('Attendance record deleted successfully');
                // Refresh data
                if (viewMode === 'history') {
                    fetchRecords(filters);
                } else {
                    fetchTodayAttendance();
                }
                fetchSummary();
            } else {
                toast.error(result.error || 'Failed to delete record');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            toast.error('Failed to delete record');
        } finally {
            setDeletingRecordId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (!bulkDeleteStartDate || !bulkDeleteEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        const start = new Date(bulkDeleteStartDate);
        const end = new Date(bulkDeleteEndDate);

        if (start > end) {
            toast.error('Start date must be before end date');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete all attendance records from ${bulkDeleteStartDate} to ${bulkDeleteEndDate}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setIsBulkDeleting(true);
        try {
            const result = await bulkDeleteAttendanceRecordsByDateRange(
                bulkDeleteStartDate,
                bulkDeleteEndDate
            );

            if (result.success) {
                toast.success(`Successfully deleted ${result.count || 0} attendance record(s)`);
                setShowBulkDeleteModal(false);
                setBulkDeleteStartDate('');
                setBulkDeleteEndDate('');
                // Refresh data
                if (viewMode === 'history') {
                    fetchRecords(filters);
                } else {
                    fetchTodayAttendance();
                }
                fetchSummary();
            } else {
                toast.error(result.error || 'Failed to delete records');
            }
        } catch (error) {
            console.error('Error bulk deleting records:', error);
            toast.error('Failed to delete records');
        } finally {
            setIsBulkDeleting(false);
        }
    };


    const filteredTodayAttendance = todayAttendance.filter(attendance =>
        attendance.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRecords = records.filter(record =>
        record.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: DailyAttendance['status']) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'late':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'absent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'partial':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: DailyAttendance['status']) => {
        switch (status) {
            case 'present':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'late':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case 'absent':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'partial':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
                        <p className="text-gray-600 mt-1">Monitor employee attendance and work hours</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                            Bulk Delete
                        </button>
                        <button
                            onClick={handleExportToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Employees</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalEmployees}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and View Mode Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setViewMode('today')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${viewMode === 'today'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Today's Attendance
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${viewMode === 'history'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Date Range Filters (only for history view) */}
                    {viewMode === 'history' && (
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                    className="pl-3 pr-2 py-1.5 bg-transparent border-none focus:ring-0 text-sm text-gray-600"
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                    className="pl-2 pr-3 py-1.5 bg-transparent border-none focus:ring-0 text-sm text-gray-600"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4 font-medium">Loading attendance data...</p>
                </div>
            ) : viewMode === 'today' ? (
                /* Today's Attendance View */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">
                            Today's Attendance
                        </h2>
                        <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            {formatDateForDisplay(new Date().toISOString())}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Login Image</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Logout Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Logout Image</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Duration</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTodayAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Users className="h-12 w-12 mb-3 opacity-20" />
                                                <p className="text-lg font-medium text-gray-500">No attendance records for today</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTodayAttendance.map((attendance) => (
                                        <tr key={attendance.userId} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                        {attendance.userName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{attendance.userName}</div>
                                                        <div className="text-xs text-gray-500">{attendance.userRole}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                {attendance.loginTime ? formatTimeForDisplay(attendance.loginTime) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attendance.loginImage ? (
                                                    <button
                                                        onClick={() => setSelectedImage(attendance.loginImage!)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Login Image"
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                {attendance.logoutTime ? formatTimeForDisplay(attendance.logoutTime) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attendance.logoutImage ? (
                                                    <button
                                                        onClick={() => setSelectedImage(attendance.logoutImage!)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Logout Image"
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {attendance.workDuration ? (
                                                    <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium text-gray-700">
                                                        {attendance.workDuration}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 font-mono">
                                                    {attendance.ipAddress || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteRecord(attendance.userId, attendance.userName)}
                                                    disabled={deletingRecordId === attendance.userId}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* History View */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">Attendance History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Browser</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Search className="h-12 w-12 mb-3 opacity-20" />
                                                <p className="text-lg font-medium text-gray-500">No attendance records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                        {record.userName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{record.userName}</div>
                                                        <div className="text-xs text-gray-500">{record.userRole}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${record.eventType === 'login'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                    {record.eventType === 'login' ? 'Login' : 'Logout'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatDateForDisplay(record.timestamp)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimeForDisplay(record.timestamp)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.imageData ? (
                                                    <button
                                                        onClick={() => setSelectedImage(record.imageData!)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Image"
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <span className="truncate max-w-xs block" title={record.browserInfo}>
                                                    {record.browserInfo || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteRecord(record.id, record.userName)}
                                                    disabled={deletingRecordId === record.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-md"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Attendance"
                            className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-white/20"
                        />
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
                    onClick={() => setShowBulkDeleteModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Bulk Delete by Date Range</h3>
                            <button
                                onClick={() => setShowBulkDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Select a date range to delete all attendance records within that period. This action cannot be undone.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={bulkDeleteStartDate}
                                    onChange={(e) => setBulkDeleteStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={bulkDeleteEndDate}
                                    onChange={(e) => setBulkDeleteEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowBulkDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting || !bulkDeleteStartDate || !bulkDeleteEndDate}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBulkDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Delete Records
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
