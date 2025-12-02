import React, { useState, useEffect } from 'react';
import { Phone, Activity, Search, Clock, ArrowRight, Filter, User, Trash2, X } from 'lucide-react';
import { getCallLogs, getStatusChangeLogs, deleteCallLog, deleteStatusChangeLog, bulkDeleteCallLogsByDateRange, bulkDeleteStatusChangeLogsByDateRange } from '../../lib/activityLogger';
import { supabase } from '../../lib/supabase';
import { getDisplayStatus } from '../../utils/statusDisplay';
import { toast } from 'react-hot-toast';

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
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteStartDate, setBulkDeleteStartDate] = useState('');
  const [bulkDeleteEndDate, setBulkDeleteEndDate] = useState('');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteType, setBulkDeleteType] = useState<'calls' | 'status' | 'both'>('both');

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

  const handleDeleteLog = async (logId: string, logType: 'call' | 'status', leadName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${logType} log for ${leadName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingLogId(logId);
    try {
      const result = logType === 'call'
        ? await deleteCallLog(logId)
        : await deleteStatusChangeLog(logId);

      if (result.success) {
        toast.success(`${logType === 'call' ? 'Call' : 'Status change'} log deleted successfully`);
        fetchLogs();
      } else {
        toast.error(result.error || 'Failed to delete log');
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    } finally {
      setDeletingLogId(null);
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

    const typeText = bulkDeleteType === 'both' ? 'all activity logs' :
      bulkDeleteType === 'calls' ? 'call logs' : 'status change logs';

    const confirmed = window.confirm(
      `Are you sure you want to delete ${typeText} from ${bulkDeleteStartDate} to ${bulkDeleteEndDate}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      let totalCount = 0;

      if (bulkDeleteType === 'calls' || bulkDeleteType === 'both') {
        const result = await bulkDeleteCallLogsByDateRange(bulkDeleteStartDate, bulkDeleteEndDate);
        if (result.success) {
          totalCount += result.count || 0;
        } else {
          toast.error(result.error || 'Failed to delete call logs');
          return;
        }
      }

      if (bulkDeleteType === 'status' || bulkDeleteType === 'both') {
        const result = await bulkDeleteStatusChangeLogsByDateRange(bulkDeleteStartDate, bulkDeleteEndDate);
        if (result.success) {
          totalCount += result.count || 0;
        } else {
          toast.error(result.error || 'Failed to delete status change logs');
          return;
        }
      }

      toast.success(`Successfully deleted ${totalCount} log(s)`);
      setShowBulkDeleteModal(false);
      setBulkDeleteStartDate('');
      setBulkDeleteEndDate('');
      fetchLogs();
    } catch (error) {
      console.error('Error bulk deleting logs:', error);
      toast.error('Failed to delete logs');
    } finally {
      setIsBulkDeleting(false);
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
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete
          </button>
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
                            <div key={activity.activity_id} className={`bg-white border rounded-lg p-4 ${activity.type === 'call' ? 'border-blue-200' : 'border-green-200'
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
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${activity.call_type === 'outbound'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {activity.call_type} call
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right text-sm text-gray-500">
                                      <p>{formatDateTime(activity.timestamp)}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteLog(activity.id, 'call', activity.lead_name)}
                                      disabled={deletingLogId === activity.id}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete Log"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
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
                                  <div className="flex items-center gap-2">
                                    <div className="text-right text-sm text-gray-500">
                                      <p>{formatDateTime(activity.timestamp)}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteLog(activity.id, 'status', activity.lead_name)}
                                      disabled={deletingLogId === activity.id}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete Log"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
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
              <h3 className="text-xl font-bold text-gray-900">Bulk Delete Activity Logs</h3>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select a date range and log type to delete. This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Log Type
                </label>
                <select
                  value={bulkDeleteType}
                  onChange={(e) => setBulkDeleteType(e.target.value as 'calls' | 'status' | 'both')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="both">All Activity Logs</option>
                  <option value="calls">Call Logs Only</option>
                  <option value="status">Status Change Logs Only</option>
                </select>
              </div>

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
                    Delete Logs
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
