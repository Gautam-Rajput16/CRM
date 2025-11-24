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
    AlertCircle
} from 'lucide-react';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceFilters, DailyAttendance } from '../types/Attendance';
import { formatTimeForDisplay, formatDateForDisplay } from '../utils/imageUtils';
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
                    <button
                        onClick={handleExportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Employees</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalEmployees}</p>
                        </div>
                        <Users className="h-10 w-10 text-blue-600" />
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 font-medium">Present Today</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{summary.presentToday}</p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">Late Today</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-2">{summary.lateToday}</p>
                        </div>
                        <AlertCircle className="h-10 w-10 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 font-medium">Absent Today</p>
                            <p className="text-3xl font-bold text-red-900 mt-2">{summary.absentToday}</p>
                        </div>
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Filters and View Mode Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 border-2 border-gray-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('today')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${viewMode === 'today'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Today's Attendance
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${viewMode === 'history'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
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
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Date Range Filters (only for history view) */}
                    {viewMode === 'history' && (
                        <>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading attendance data...</p>
                </div>
            ) : viewMode === 'today' ? (
                /* Today's Attendance View */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Today's Attendance - {formatDateForDisplay(new Date().toISOString())}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Login Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Login Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logout Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logout Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Work Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTodayAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No attendance records for today
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTodayAttendance.map((attendance) => (
                                        <tr key={attendance.userId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{attendance.userName}</div>
                                                    <div className="text-sm text-gray-500">{attendance.userRole}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {attendance.loginTime ? formatTimeForDisplay(attendance.loginTime) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attendance.loginImage ? (
                                                    <button
                                                        onClick={() => setSelectedImage(attendance.loginImage!)}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No image</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {attendance.logoutTime ? formatTimeForDisplay(attendance.logoutTime) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attendance.logoutImage ? (
                                                    <button
                                                        onClick={() => setSelectedImage(attendance.logoutImage!)}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No image</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {attendance.workDuration || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(attendance.status)} flex items-center gap-2 w-fit`}>
                                                    {getStatusIcon(attendance.status)}
                                                    {attendance.status.toUpperCase()}
                                                </span>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Event Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Browser
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No attendance records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{record.userName}</div>
                                                    <div className="text-sm text-gray-500">{record.userRole}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.eventType === 'login'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {record.eventType === 'login' ? 'Login' : 'Logout'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {formatDateForDisplay(record.timestamp)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatTimeForDisplay(record.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.imageData ? (
                                                    <button
                                                        onClick={() => setSelectedImage(record.imageData!)}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No image</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {record.browserInfo || '-'}
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 p-2 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Attendance"
                            className="w-full h-auto rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
