import React, { useState, useEffect } from 'react';
import { X, Clock, Download, Calendar, TrendingUp, User, Search } from 'lucide-react';
import { getEmployeeWorkingHours, formatHoursDisplay } from '../lib/attendanceService';
import { formatTimeForDisplay } from '../utils/imageUtils';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface WorkingHoursModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface EmployeeHours {
    userId: string;
    userName: string;
    userRole: string;
    totalHours: number;
    totalMinutes: number;
    formattedHours: string;
    daysWorked: number;
    averageHoursPerDay: string;
    firstLogin: string | null;
    lastLogout: string | null;
    status: string;
}

export const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({ isOpen, onClose }) => {
    const [employeeHours, setEmployeeHours] = useState<EmployeeHours[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [quickFilter, setQuickFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');

    useEffect(() => {
        if (isOpen) {
            // Set default to today
            const today = new Date();
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
            setQuickFilter('today');
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && startDate && endDate) {
            fetchData();
        }
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getEmployeeWorkingHours({
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined
            });
            setEmployeeHours(data);
        } catch (error) {
            console.error('Error fetching working hours:', error);
            toast.error('Failed to fetch working hours');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFilter = (filter: 'today' | 'week' | 'month' | 'custom') => {
        setQuickFilter(filter);
        const today = new Date();

        switch (filter) {
            case 'today':
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                setStartDate(weekStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(monthStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
        }
    };

    const handleExport = () => {
        const exportData = filteredEmployees.map(emp => ({
            'Employee Name': emp.userName,
            'Total Hours': emp.formattedHours,
            'Days Worked': emp.daysWorked,
            'Average Hours/Day': emp.averageHoursPerDay,
            'First Login': emp.firstLogin ? formatTimeForDisplay(emp.firstLogin) : '-',
            'Last Logout': emp.lastLogout ? formatTimeForDisplay(emp.lastLogout) : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Working Hours');
        XLSX.writeFile(wb, `Working_Hours_${startDate}_to_${endDate}.xlsx`);
        toast.success('Exported successfully!');
    };

    const filteredEmployees = employeeHours.filter(emp =>
        emp.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalHours = employeeHours.reduce((sum, emp) => sum + emp.totalMinutes, 0);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Working Hours Report</h2>
                                <p className="text-white/80 text-sm mt-1">Track employee productivity and attendance</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                            <Clock className="h-4 w-4" />
                            <span>Total Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatHoursDisplay(totalHours)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>Average Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {employeeHours.length > 0 ? formatHoursDisplay(Math.floor(totalHours / employeeHours.length)) : '0h 0m'}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 space-y-4 border-b border-gray-200">
                    {/* Quick Filters */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleQuickFilter('today')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${quickFilter === 'today'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleQuickFilter('week')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${quickFilter === 'week'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => handleQuickFilter('month')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${quickFilter === 'month'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setQuickFilter('custom')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${quickFilter === 'custom'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Custom
                        </button>
                    </div>

                    {/* Date Range & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setQuickFilter('custom');
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setQuickFilter('custom');
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={filteredEmployees.length === 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Clock className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium text-gray-500">No data available</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your date range or filters</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Total Hours
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Days Worked
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Avg Hours/Day
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            First Login
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Last Logout
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.userId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                                        <User className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{emp.userName}</p>
                                                        <p className="text-sm text-gray-500">{emp.userRole}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                                    {emp.formattedHours}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {emp.daysWorked}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {emp.averageHoursPerDay}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {emp.firstLogin ? formatTimeForDisplay(emp.firstLogin) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {emp.lastLogout ? formatTimeForDisplay(emp.lastLogout) : '-'}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
