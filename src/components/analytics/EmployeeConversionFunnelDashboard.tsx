import React, { useEffect, useMemo, useState } from 'react';
import { Users, Phone, Search, TrendingUp, Calendar } from 'lucide-react';
import { useProfiles } from '../../hooks/useProfiles';
import { useDailyPerformance } from '../../hooks/useDailyPerformance';
import { getCallLogs, getStatusChangeLogs } from '../../lib/activityLogger';
import { DailyPerformance } from '../../types/DailyPerformance';

interface EmployeeConversionFunnelDashboardProps {
  initialDate?: string;
}

interface FunnelMetrics {
  employeeId: string;
  name: string;
  email?: string;
  role?: string;
  totalCalls: number;
  followUps: number;
  meetingsScheduled: number;
  meetingsDone: number;
  quotationsSent: number;
  confirmations: number;
}

export const EmployeeConversionFunnelDashboard: React.FC<EmployeeConversionFunnelDashboardProps> = ({
  initialDate,
}) => {
  const { profiles, isLoading: profilesLoading } = useProfiles(true);
  const { entries, isLoading: performanceLoading } = useDailyPerformance();
  const [startDate, setStartDate] = useState(
    () => initialDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    () => initialDate || new Date().toISOString().split('T')[0]
  );
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (endDate && endDate < value) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!startDate || !endDate) {
        setCallLogs([]);
        setStatusLogs([]);
        return;
      }

      setLoading(true);
      try {
        const start = `${startDate}T00:00:00`;
        const end = `${endDate}T23:59:59`;

        const [calls, statuses] = await Promise.all([
          getCallLogs({ startDate: start, endDate: end }),
          getStatusChangeLogs({ startDate: start, endDate: end }),
        ]);

        setCallLogs(Array.isArray(calls) ? calls : []);
        setStatusLogs(Array.isArray(statuses) ? statuses : []);
      } catch (error) {
        console.error('Failed to load activity for conversion funnel', error);
        setCallLogs([]);
        setStatusLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [startDate, endDate]);

  const employeeProfiles = useMemo(() => {
    return profiles.filter(profile => profile.role === 'user');
  }, [profiles]);

  const filteredEmployeeIds = useMemo(() => {
    return new Set(
      employeeProfiles
        .filter(profile => {
          if (!searchQuery) return true;
          const lower = searchQuery.toLowerCase();
          return (
            profile.name.toLowerCase().includes(lower) ||
            (profile as any).email?.toLowerCase().includes(lower)
          );
        })
        .map(profile => profile.id)
    );
  }, [employeeProfiles, searchQuery]);

  const funnels: FunnelMetrics[] = useMemo(() => {
    const map = new Map<string, FunnelMetrics>();

    employeeProfiles.forEach(profile => {
      if (!filteredEmployeeIds.has(profile.id)) return;
      map.set(profile.id, {
        employeeId: profile.id,
        name: profile.name,
        email: (profile as any).email,
        role: profile.role,
        totalCalls: 0,
        followUps: 0,
        meetingsScheduled: 0,
        meetingsDone: 0,
        quotationsSent: 0,
        confirmations: 0,
      });
    });

    callLogs.forEach(log => {
      const employeeId = log.employee_id;
      if (!filteredEmployeeIds.has(employeeId)) return;
      const existing = map.get(employeeId);
      if (!existing) return;
      existing.totalCalls += 1;
    });

    statusLogs.forEach(log => {
      const employeeId = log.employee_id;
      if (!filteredEmployeeIds.has(employeeId)) return;
      const existing = map.get(employeeId);
      if (!existing) return;
      const status = (log.new_status || '').toString();
      if (status === 'Follow-up' || status === 'Special Follow-up') {
        existing.followUps += 1;
      }
    });

    const performanceInRange: DailyPerformance[] = entries.filter(entry => {
      if (!startDate || !endDate) return false;
      return entry.date >= startDate && entry.date <= endDate;
    });

    performanceInRange.forEach(entry => {
      if (!filteredEmployeeIds.has(entry.userId)) return;
      const existing = map.get(entry.userId);
      if (!existing) return;
      existing.meetingsScheduled += entry.meetingsScheduled;
      existing.meetingsDone += entry.meetingsDone;
      existing.quotationsSent += entry.quotationsSent;
      existing.confirmations += entry.confirmations;
    });

    const result = Array.from(map.values());

    return result.sort((a, b) => b.confirmations - a.confirmations || b.totalCalls - a.totalCalls);
  }, [employeeProfiles, filteredEmployeeIds, callLogs, statusLogs, entries, startDate, endDate]);

  const totalSummary = useMemo(() => {
    return funnels.reduce(
      (acc, f) => {
        acc.totalCalls += f.totalCalls;
        acc.followUps += f.followUps;
        acc.meetingsScheduled += f.meetingsScheduled;
        acc.meetingsDone += f.meetingsDone;
        acc.quotationsSent += f.quotationsSent;
        acc.confirmations += f.confirmations;
        return acc;
      },
      {
        totalCalls: 0,
        followUps: 0,
        meetingsScheduled: 0,
        meetingsDone: 0,
        quotationsSent: 0,
        confirmations: 0,
      }
    );
  }, [funnels]);

  const isBusy = loading || profilesLoading || performanceLoading;

  if (isBusy) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            <div className="text-gray-600 text-sm">Loading conversion funnels...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Employee Conversion Funnel
            </h2>
            <p className="text-sm text-gray-600">
              Track how each employee moves leads from calls to confirmations for the selected date range.
            </p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            {startDate && endDate ? (
              <span>
                Data from{' '}
                <span className="font-medium text-gray-700">{startDate}</span> to{' '}
                <span className="font-medium text-gray-700">{endDate}</span>
              </span>
            ) : (
              <span>Select a start and end date</span>
            )}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                Date range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <span className="text-xs text-gray-400 px-1">to</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => handleEndDateChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search employees
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-blue-50 rounded-lg px-2 py-2">
              <div className="text-sm font-semibold text-blue-700">{totalSummary.totalCalls}</div>
              <div className="text-[11px] text-blue-700">Total Calls</div>
            </div>
            <div className="bg-emerald-50 rounded-lg px-2 py-2">
              <div className="text-sm font-semibold text-emerald-700">{totalSummary.confirmations}</div>
              <div className="text-[11px] text-emerald-700">Total Confirmed</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-2 py-2">
              <div className="text-sm font-semibold text-purple-700">{funnels.length}</div>
              <div className="text-[11px] text-purple-700">Employees</div>
            </div>
          </div>
        </div>
      </div>

      {funnels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No activity for the selected date range</p>
          <p className="text-xs text-gray-500">
            Try choosing a different date range or ensure employees are logging calls and daily performance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {funnels.map(funnel => {
            const stages = [
              { key: 'totalCalls', label: 'Total Calls', value: funnel.totalCalls, color: 'bg-blue-500' },
              { key: 'followUps', label: 'Follow-ups', value: funnel.followUps, color: 'bg-yellow-500' },
              { key: 'meetingsScheduled', label: 'Meetings Scheduled', value: funnel.meetingsScheduled, color: 'bg-indigo-500' },
              { key: 'meetingsDone', label: 'Meetings Done', value: funnel.meetingsDone, color: 'bg-green-500' },
              { key: 'quotationsSent', label: 'Quotations Sent', value: funnel.quotationsSent, color: 'bg-orange-500' },
              { key: 'confirmations', label: 'Confirmed', value: funnel.confirmations, color: 'bg-purple-600' },
            ];

            const maxValue = Math.max(...stages.map(s => s.value), 1);
            const conversionRate = funnel.totalCalls > 0 ? (funnel.confirmations / funnel.totalCalls) * 100 : 0;

            return (
              <div
                key={funnel.employeeId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{funnel.name}</div>
                      <div className="text-[11px] text-gray-500 capitalize">
                        {funnel.role ? funnel.role.replace(/_/g, ' ') : 'User'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-semibold">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">Call → Confirm</div>
                  </div>
                </div>

                <div className="space-y-2 mt-1">
                  {stages.map(stage => (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div className="w-32 text-[11px] text-gray-600">{stage.label}</div>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color}`}
                          style={{ width: `${(stage.value / maxValue) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-xs font-semibold text-gray-900">
                        {stage.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
