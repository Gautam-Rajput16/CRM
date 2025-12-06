import React, { useState, useEffect } from 'react';
import { X, Phone, Activity, Clock, User, Calendar, ArrowRight } from 'lucide-react';
import { getCallLogs, getStatusChangeLogs } from '../../lib/activityLogger';

interface EmployeeActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  selectedDate: string;
}

interface CallLog {
  id: string;
  employee_id: string;
  employee_name?: string;
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
  lead_name: string;
  old_status: string;
  new_status: string;
  change_timestamp: string;
  notes?: string;
  previous_call_date?: string | null;
  previous_status_date?: string | null;
}

export const EmployeeActivityModal: React.FC<EmployeeActivityModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employeeRole,
  selectedDate
}) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployeeActivity();
    }
  }, [isOpen, employeeId, selectedDate]);

  const fetchEmployeeActivity = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedDate}T00:00:00`;
      const endDate = `${selectedDate}T23:59:59`;

      const [calls, statusChanges] = await Promise.all([
        getCallLogs({
          employeeId,
          startDate,
          endDate
        }),
        getStatusChangeLogs({
          employeeId,
          startDate,
          endDate
        })
      ]);

      setCallLogs(calls as CallLog[]);
      setStatusLogs(statusChanges as StatusChangeLog[]);
    } catch (error) {
      console.error('Error fetching employee activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Special Follow-up':
        return 'bg-orange-100 text-orange-800';
      case 'Not Connected':
        return 'bg-cyan-100 text-cyan-800';
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

  // Combine and sort all activities by timestamp
  const allActivities = [
    ...callLogs.map(log => ({
      ...log,
      type: 'call' as const,
      timestamp: log.call_timestamp
    })),
    ...statusLogs.map(log => ({
      ...log,
      type: 'status' as const,
      timestamp: log.change_timestamp
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // All activities in chronological order (no filtering by type)
  const filteredActivities = allActivities;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{employeeName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize">{employeeRole.replace('_', ' ')}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{callLogs.length}</p>
              <p className="text-sm text-blue-700">Total Calls</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{statusLogs.length}</p>
              <p className="text-sm text-green-700">Status Changes</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{allActivities.length}</p>
              <p className="text-sm text-purple-700">Total Activities</p>
            </div>
          </div>

          {/* Activity Timeline Header */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Timeline</h3>
            <p className="text-sm text-gray-600">All activities for {employeeName} on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No activities found for this date</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`}>
                  {activity.type === 'call' ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Phone className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{activity.lead_name}</h4>
                            <p className="text-gray-600 text-sm">{activity.lead_phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${activity.call_type === 'outbound'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {activity.call_type} call
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
                        </div>
                      </div>

                      {/* Previous Activity - Vertical Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Last Called</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            {activity.previous_call_date
                              ? new Date(activity.previous_call_date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                              })
                              : 'No previous calls'
                            }
                          </p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Last Status Update</span>
                          </div>
                          <p className="text-sm text-green-700">
                            {activity.previous_status_date
                              ? new Date(activity.previous_status_date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                              })
                              : 'No previous updates'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {activity.notes && (
                        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                          <p className="text-sm text-yellow-700">{activity.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Activity className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{activity.lead_name}</h4>
                            <p className="text-gray-600 text-sm">Status Change</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatTime(activity.timestamp)}</p>
                        </div>
                      </div>

                      {/* Status Change */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Status Change</p>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(activity.old_status)}`}>
                            {activity.old_status}
                          </span>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(activity.new_status)}`}>
                            {activity.new_status}
                          </span>
                        </div>
                      </div>

                      {/* Previous Activity - Vertical Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Last Called</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            {activity.previous_call_date
                              ? new Date(activity.previous_call_date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                              })
                              : 'No previous calls'
                            }
                          </p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Previous Status Update</span>
                          </div>
                          <p className="text-sm text-green-700">
                            {activity.previous_status_date
                              ? new Date(activity.previous_status_date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                              })
                              : 'No previous updates'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {activity.notes && (
                        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                          <p className="text-sm text-yellow-700">{activity.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {filteredActivities.length} activities for {employeeName}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
