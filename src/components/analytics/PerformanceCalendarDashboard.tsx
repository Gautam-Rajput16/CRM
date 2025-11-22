import React, { useMemo, useState } from 'react';
import { Calendar, Users, Search, Filter, TrendingUp } from 'lucide-react';
import { useDailyPerformance } from '../../hooks/useDailyPerformance';
import { useProfiles, Profile } from '../../hooks/useProfiles';
import { PerformanceCalendarModal } from '../PerformanceCalendarModal';
import { EmployeeConversionFunnelDashboard } from './EmployeeConversionFunnelDashboard';

interface EmployeePerformanceRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  meetingsScheduled: number;
  meetingsDone: number;
  quotationsSent: number;
  confirmations: number;
  daysWithData: number;
  lastUpdateDate?: string | null;
}

export const PerformanceCalendarDashboard: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split('T')[0];
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState<'day' | 'month' | 'all'>('day');
  const [dayFilter, setDayFilter] = useState<string>(todayStr);
  const [monthFilter, setMonthFilter] = useState<string>(defaultMonth);
  const [activeTab, setActiveTab] = useState<'performance' | 'funnel'>('performance');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [showUserCalendar, setShowUserCalendar] = useState(false);

  const { entries, isLoading } = useDailyPerformance();
  const { profiles, isLoading: profilesLoading } = useProfiles(true);

  const dateFilteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (viewMode === 'day') {
        return entry.date === dayFilter;
      }
      if (viewMode === 'month') {
        return entry.date.startsWith(monthFilter);
      }
      return true;
    });
  }, [entries, viewMode, dayFilter, monthFilter]);

  const statsByUserId = useMemo(() => {
    const map: Record<
      string,
      {
        meetingsScheduled: number;
        meetingsDone: number;
        quotationsSent: number;
        confirmations: number;
        days: Set<string>;
        lastDate: string | null;
      }
    > = {};

    dateFilteredEntries.forEach(entry => {
      const existing = map[entry.userId] || {
        meetingsScheduled: 0,
        meetingsDone: 0,
        quotationsSent: 0,
        confirmations: 0,
        days: new Set<string>(),
        lastDate: null as string | null,
      };
      existing.meetingsScheduled += entry.meetingsScheduled;
      existing.meetingsDone += entry.meetingsDone;
      existing.quotationsSent += entry.quotationsSent;
      existing.confirmations += entry.confirmations;
      existing.days.add(entry.date);
      if (!existing.lastDate || entry.date > existing.lastDate) {
        existing.lastDate = entry.date;
      }
      map[entry.userId] = existing;
    });

    return map;
  }, [dateFilteredEntries]);

  const roleOptions: string[] = useMemo(() => {
    const roles = new Set<string>();
    profiles.forEach(p => {
      if (p.role) {
        roles.add(p.role);
      }
    });
    return Array.from(roles).sort();
  }, [profiles]);

  const rows: EmployeePerformanceRow[] = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase();

    const enriched: EmployeePerformanceRow[] = Object.entries(statsByUserId).map(
      ([userId, stats]) => {
        const profile: Profile | undefined = profiles.find(p => p.id === userId);
        const daysWithData = stats.days.size;

        return {
          userId,
          name: profile?.name || 'Unknown User',
          email: profile?.email || '-',
          role: profile?.role || '-',
          meetingsScheduled: stats.meetingsScheduled,
          meetingsDone: stats.meetingsDone,
          quotationsSent: stats.quotationsSent,
          confirmations: stats.confirmations,
          daysWithData,
          lastUpdateDate: stats.lastDate,
        };
      }
    );

    return enriched
      .filter(row => {
        if (roleFilter !== 'all' && row.role !== roleFilter) {
          return false;
        }
        if (!lowerSearch) return true;
        return (
          row.name.toLowerCase().includes(lowerSearch) ||
          row.email.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => b.confirmations - a.confirmations);
  }, [statsByUserId, profiles, roleFilter, searchQuery]);

  const overallTotals = useMemo(() => {
    let totalMeetingsScheduled = 0;
    let totalMeetingsDone = 0;
    let totalQuotationsSent = 0;
    let totalConfirmations = 0;

    dateFilteredEntries.forEach(entry => {
      totalMeetingsScheduled += entry.meetingsScheduled;
      totalMeetingsDone += entry.meetingsDone;
      totalQuotationsSent += entry.quotationsSent;
      totalConfirmations += entry.confirmations;
    });

    return { totalMeetingsScheduled, totalMeetingsDone, totalQuotationsSent, totalConfirmations };
  }, [dateFilteredEntries]);

  const loading = isLoading || profilesLoading;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <div className="text-gray-600">Loading performance calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-7 w-7 text-blue-600" />
              <span>Performance Calendar</span>
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              View daily meetings and sales pipeline stages for every employee with calendar-based filters.
            </p>
          </div>

          {/* Period Toggle & Date / Month Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                All
              </button>
            </div>

            {viewMode === 'day' && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dayFilter}
                  onChange={e => setDayFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {viewMode === 'month' && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {viewMode === 'all' && (
              <div className="text-xs text-gray-500">Showing all available performance data</div>
            )}
          </div>
        </div>

        {/* Inner Tabs: Performance / Conversion Funnel */}
        <div className="mt-6 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('funnel')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'funnel'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            Conversion Funnel
          </button>
        </div>
      </div>

      {/* Performance Tab Content */}
      {activeTab === 'performance' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'day'
                      ? 'Total Meetings Scheduled (Selected Day)'
                      : viewMode === 'month'
                      ? 'Total Meetings Scheduled (Selected Month)'
                      : 'Total Meetings Scheduled (All Time)'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{overallTotals.totalMeetingsScheduled}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'day'
                      ? 'Total Meetings Done (Selected Day)'
                      : viewMode === 'month'
                      ? 'Total Meetings Done (Selected Month)'
                      : 'Total Meetings Done (All Time)'}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">{overallTotals.totalMeetingsDone}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'day'
                      ? 'Total Confirmations (Selected Day)'
                      : viewMode === 'month'
                      ? 'Total Confirmations (Selected Month)'
                      : 'Total Confirmations (All Time)'}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">{overallTotals.totalConfirmations}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search employees by name or email..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full md:w-56">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm appearance-none"
                  >
                    <option value="all">All Roles</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Showing {rows.length} employee{rows.length === 1 ? '' : 's'} with performance data.
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-3">
                <Calendar className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium">No performance data for the selected period</p>
                <p className="text-xs">
                  Try changing the day or month filter, or ask employees to log their meetings and pipeline updates.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Meetings Scheduled</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Meetings Done</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Quotation Sent</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Confirm</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Days Active</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Last Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map(row => (
                      <tr
                        key={row.userId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedUserId(row.userId);
                          setSelectedUserName(row.name);
                          setShowUserCalendar(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{row.name}</span>
                            <span className="text-xs text-gray-500">{row.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 capitalize">
                          {row.role ? row.role.replace(/_/g, ' ') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                          {row.meetingsScheduled}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                          {row.meetingsDone}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                          {row.quotationsSent}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                          {row.confirmations}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {row.daysWithData}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500">
                          {row.lastUpdateDate
                            ? new Date(row.lastUpdateDate).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                              })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Conversion Funnel Tab Content */}
      {activeTab === 'funnel' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <EmployeeConversionFunnelDashboard
            initialDate={viewMode === 'day' ? dayFilter : undefined}
          />
        </div>
      )}

      {showUserCalendar && selectedUserId && (
        <PerformanceCalendarModal
          isOpen={showUserCalendar}
          onClose={() => setShowUserCalendar(false)}
          userId={selectedUserId}
          canEdit={false}
          title={selectedUserName ? `Performance – ${selectedUserName}` : 'Employee Performance'}
          subtitle="View meetings and pipeline stages logged by this employee."
        />
      )}
    </div>
  );
};
