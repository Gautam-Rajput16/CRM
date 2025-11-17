import React, { useState, useEffect } from 'react';
import { Phone, Activity, Search, Clock, ArrowRight, Filter, User } from 'lucide-react';
import { getCallLogs, getStatusChangeLogs } from '../../lib/activityLogger';
import { supabase } from '../../lib/supabase';
import { getDisplayStatus } from '../../utils/statusDisplay';

interface ActivityLogsViewerProps {
  employeeId?: string;
  leadId?: string;
  startDate?: string;
  endDate?: string;
}

interface Profile {
  id: string;
  name: string;
  role?: string;
}

interface CallLog {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_role?: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  call_timestamp: string;
  call_type: 'outbound' | 'inbound';
  notes?: string;
  previous_call_date?: string | null;
  previous_status_date?: string | null;
}

interface StatusChangeLog {
  id: string;
  lead_id: string;
  employee_id: string;
  employee_name?: string;
  employee_role?: string;
  lead_name: string;
  old_status: string;
  new_status: string;
  change_timestamp: string;
  notes?: string;
  previous_call_date?: string | null;
  previous_status_date?: string | null;
}

export const ActivityLogsViewer: React.FC<ActivityLogsViewerProps> = ({
  employeeId,
  leadId,
  startDate,
  endDate
}) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState({
    start: startDate || '',
    end: endDate || ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchLogs();
  }, [employeeId, leadId, dateFilter.start, dateFilter.end]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('role', 'user')
        .order('name');

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        employeeId,
        leadId,
        startDate: dateFilter.start,
        endDate: dateFilter.end
      };

      const [calls, statusChanges] = await Promise.all([
        getCallLogs(filters),
        getStatusChangeLogs(filters)
      ]);

      setCallLogs(calls as CallLog[]);
      setStatusLogs(statusChanges as StatusChangeLog[]);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const allActivities = [
    ...callLogs.map(log => ({
      ...log,
      type: 'call' as const,
      timestamp: log.call_timestamp,
      activity_id: `call-${log.id}`
    })),
    ...statusLogs.map(log => ({
      ...log,
      type: 'status' as const,
      timestamp: log.change_timestamp,
      activity_id: `status-${log.id}`
    }))
  ];

  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.type === 'call' && activity.lead_phone.includes(searchTerm)) ||
      (activity.employee_name && activity.employee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDateRange = (!startDate || new Date(activity.timestamp) >= new Date(startDate)) &&
                            (!endDate || new Date(activity.timestamp) <= new Date(endDate + 'T23:59:59'));
    
    const matchesEmployee = !selectedEmployee || activity.employee_id === selectedEmployee;
    
    return matchesSearch && matchesDateRange && matchesEmployee;
  });

  // Group activities by lead
  const groupedByLead = filteredActivities.reduce((acc, activity) => {
    const leadKey = activity.lead_id;
    if (!acc[leadKey]) {
      acc[leadKey] = {
        lead_id: activity.lead_id,
        lead_name: activity.lead_name,
        lead_phone: activity.type === 'call' ? activity.lead_phone : '',
        activities: [],
        lastCallDate: null as string | null,
        lastStatusDate: null as string | null,
        totalCalls: 0,
        totalStatusChanges: 0
      };
    }
    
    acc[leadKey].activities.push(activity);
    
    if (activity.type === 'call') {
      acc[leadKey].totalCalls++;
      if (!acc[leadKey].lastCallDate || new Date(activity.timestamp) > new Date(acc[leadKey].lastCallDate!)) {
        acc[leadKey].lastCallDate = activity.timestamp;
      }
      if (!acc[leadKey].lead_phone) {
        acc[leadKey].lead_phone = activity.lead_phone;
      }
    } else {
      acc[leadKey].totalStatusChanges++;
      if (!acc[leadKey].lastStatusDate || new Date(activity.timestamp) > new Date(acc[leadKey].lastStatusDate!)) {
        acc[leadKey].lastStatusDate = activity.timestamp;
      }
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Convert to array and sort by most recent activity
  const leadActivities = Object.values(groupedByLead).map((lead: any) => {
    lead.activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const mostRecentActivity = lead.activities[0];
    return {
      ...lead,
      mostRecentTimestamp: mostRecentActivity.timestamp
    };
  }).sort((a: any, b: any) => new Date(b.mostRecentTimestamp).getTime() - new Date(a.mostRecentTimestamp).getTime());

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case '-':
        return 'bg-gray-100 text-gray-800';
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Special Follow-up':
        return 'bg-orange-100 text-orange-800';
      case 'Not Connected':
        return 'bg-red-100 text-red-800';
      case 'Interested':
        return 'bg-blue-100 text-blue-800';
      case 'Not - Interested':
        return 'bg-red-100 text-red-800';
      case 'Meeting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Activity Logs
          </h2>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar - Full Width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="inline h-4 w-4 mr-1" />
                Filter by Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Indicator */}
        {selectedEmployee && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <Filter className="inline h-4 w-4 mr-1" />
              Filtered by employee: <span className="font-medium">
                {employees.find(emp => emp.id === selectedEmployee)?.name || 'Unknown'}
              </span>
            </p>
          </div>
        )}

        {/* Activity Summary */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span>{leadActivities.reduce((sum, lead) => sum + lead.totalCalls, 0)} Calls</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span>{leadActivities.reduce((sum, lead) => sum + lead.totalStatusChanges, 0)} Status Changes</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span>{leadActivities.length} Leads with Activity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Unified Timeline */}
      <div className="p-6">
        <div className="space-y-6">
          {leadActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p>No call logs or status changes match your current filters.</p>
            </div>
          ) : (
            leadActivities.map((lead) => {
              const isExpanded = expandedLeads.has(lead.lead_id);
              const toggleExpanded = () => {
                const newExpanded = new Set(expandedLeads);
                if (isExpanded) {
                  newExpanded.delete(lead.lead_id);
                } else {
                  newExpanded.add(lead.lead_id);
                }
                setExpandedLeads(newExpanded);
              };

              return (
                <div key={lead.lead_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Lead Header - Always Visible */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={toggleExpanded}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{lead.lead_name}</h3>
                            {lead.lead_phone && (
                              <p className="text-gray-600 font-medium">{lead.lead_phone}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Activity Summary */}
                        <div className="flex items-center gap-4 ml-6">
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{lead.totalCalls} calls</span>
                          </div>
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                            <Activity className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{lead.totalStatusChanges} status changes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Last Activity Info */}
                        <div className="text-right text-sm">
                          {lead.lastCallDate && (
                            <p className="text-blue-600 font-medium">
                              Last called: {formatDateTime(lead.lastCallDate)}
                            </p>
                          )}
                          {lead.lastStatusDate && (
                            <p className="text-green-600 font-medium">
                              Last status update: {formatDateTime(lead.lastStatusDate)}
                            </p>
                          )}
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Activities */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h4>
                        <div className="space-y-4">
                          {lead.activities.map((activity: any) => (
                            <div key={activity.activity_id} className={`bg-white border rounded-lg p-4 ${
                              activity.type === 'call' ? 'border-blue-200' : 'border-green-200'
                            }`}>
                              {activity.type === 'call' ? (
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Phone className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">Call Made</p>
                                      <p className="text-sm text-gray-600">By: {activity.employee_name || 'Unknown'}</p>
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                        activity.call_type === 'outbound' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {activity.call_type} call
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-gray-500">
                                    <p>{formatDateTime(activity.timestamp)}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Activity className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">Status Changed</p>
                                      <p className="text-sm text-gray-600">By: {activity.employee_name || 'Unknown'}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.old_status)}`}>
                                          {getDisplayStatus(activity.old_status)}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-gray-400" />
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.new_status)}`}>
                                          {getDisplayStatus(activity.new_status)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-gray-500">
                                    <p>{formatDateTime(activity.timestamp)}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Notes */}
                              {activity.notes && (
                                <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                  <p className="text-sm text-yellow-800">{activity.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
