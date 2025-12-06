import React, { useState, useEffect } from 'react';
import { Phone, Activity, User, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { getCallLogs, getStatusChangeLogs } from '../../lib/activityLogger';
import { EmployeeActivityModal } from './EmployeeActivityModal';
import { getDisplayStatus } from '../../utils/statusDisplay';

interface DailyActivityReportProps {
  selectedDate?: string;
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

interface EmployeeActivity {
  employee_id: string;
  employee_name: string;
  employee_role?: string;
  activities: Array<{
    type: 'call' | 'status';
    timestamp: string;
    lead_name: string;
    lead_phone?: string;
    call_type?: 'outbound' | 'inbound';
    old_status?: string;
    new_status?: string;
    notes?: string;
    id: string;
  }>;
  lastCallDate: string | null;
  lastStatusDate: string | null;
  totalCalls: number;
  totalStatusChanges: number;
  mostRecentTimestamp: string;
}

export const DailyActivityReport: React.FC<DailyActivityReportProps> = ({
  selectedDate = new Date().toISOString().split('T')[0]
}) => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [employeeActivities, setEmployeeActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetchActivityData();
  }, [selectedDate]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const [calls, statusChanges] = await Promise.all([
        getCallLogs(),
        getStatusChangeLogs()
      ]);

      // Filter by selected date
      const filteredCalls = calls.filter((call: any) => {
        const callDate = new Date(call.call_timestamp).toISOString().split('T')[0];
        return callDate === selectedDate;
      });

      const filteredStatusChanges = statusChanges.filter((status: any) => {
        const statusDate = new Date(status.change_timestamp).toISOString().split('T')[0];
        return statusDate === selectedDate;
      });

      setCallLogs(calls as CallLog[]);
      setStatusLogs(statusChanges as StatusChangeLog[]);

      // Group activities by employee
      const allActivities = [
        ...filteredCalls.map((log: any) => ({
          ...log,
          type: 'call' as const,
          timestamp: log.call_timestamp,
          activity_id: `call-${log.id}`
        })),
        ...filteredStatusChanges.map((log: any) => ({
          ...log,
          type: 'status' as const,
          timestamp: log.change_timestamp,
          activity_id: `status-${log.id}`
        }))
      ];

      const groupedByEmployee = allActivities.reduce((acc: any, activity: any) => {
        const employeeKey = activity.employee_id || 'unknown';
        if (!acc[employeeKey]) {
          acc[employeeKey] = {
            employee_id: activity.employee_id || 'unknown',
            employee_name: activity.employee_name || 'Unknown Employee',
            employee_role: activity.employee_role || 'Unknown Role',
            activities: [],
            lastCallDate: null,
            lastStatusDate: null,
            totalCalls: 0,
            totalStatusChanges: 0
          };
        }

        acc[employeeKey].activities.push({
          type: activity.type,
          timestamp: activity.timestamp,
          lead_name: activity.lead_name,
          lead_phone: activity.lead_phone,
          call_type: activity.call_type,
          old_status: activity.old_status,
          new_status: activity.new_status,
          notes: activity.notes,
          id: activity.activity_id
        });

        if (activity.type === 'call') {
          acc[employeeKey].totalCalls++;
          if (!acc[employeeKey].lastCallDate || new Date(activity.timestamp) > new Date(acc[employeeKey].lastCallDate)) {
            acc[employeeKey].lastCallDate = activity.timestamp;
          }
        } else {
          acc[employeeKey].totalStatusChanges++;
          if (!acc[employeeKey].lastStatusDate || new Date(activity.timestamp) > new Date(acc[employeeKey].lastStatusDate)) {
            acc[employeeKey].lastStatusDate = activity.timestamp;
          }
        }

        return acc;
      }, {});

      // Convert to array and sort by most recent activity
      const employeeActivitiesArray = Object.values(groupedByEmployee).map((employee: any) => {
        employee.activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const mostRecentActivity = employee.activities[0];
        return {
          ...employee,
          mostRecentTimestamp: mostRecentActivity.timestamp
        };
      }).sort((a: any, b: any) => new Date(b.mostRecentTimestamp).getTime() - new Date(a.mostRecentTimestamp).getTime());

      setEmployeeActivities(employeeActivitiesArray as EmployeeActivity[]);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCalls = employeeActivities.reduce((sum, employee) => sum + employee.totalCalls, 0);
  const totalStatusChanges = employeeActivities.reduce((sum, employee) => sum + employee.totalStatusChanges, 0);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Activity Report
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalCalls}</p>
            <p className="text-sm text-blue-700">Total Calls</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalStatusChanges}</p>
            <p className="text-sm text-green-700">Status Changes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{employeeActivities.length}</p>
            <p className="text-sm text-purple-700">Active Employees</p>
          </div>
        </div>
      </div>

      {/* Employee Activities */}
      <div className="p-6">
        <div className="space-y-6">
          {employeeActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p>No activities found for the selected date.</p>
            </div>
          ) : (
            employeeActivities.map((employee) => {
              const isExpanded = expandedEmployees.has(employee.employee_id);
              const toggleExpanded = () => {
                const newExpanded = new Set(expandedEmployees);
                if (isExpanded) {
                  newExpanded.delete(employee.employee_id);
                } else {
                  newExpanded.add(employee.employee_id);
                }
                setExpandedEmployees(newExpanded);
              };

              return (
                <div key={employee.employee_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Employee Header - Always Visible */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={toggleExpanded}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{employee.employee_name}</h3>
                            <p className="text-gray-600 font-medium capitalize">{employee.employee_role?.replace('_', ' ')}</p>
                          </div>
                        </div>

                        {/* Activity Summary */}
                        <div className="flex items-center gap-4 ml-6">
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{employee.totalCalls} calls</span>
                          </div>
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                            <Activity className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{employee.totalStatusChanges} status changes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Last Activity Info */}
                        <div className="text-right text-sm">
                          {employee.lastCallDate && (
                            <p className="text-blue-600 font-medium">
                              Last call: {formatDateTime(employee.lastCallDate)}
                            </p>
                          )}
                          {employee.lastStatusDate && (
                            <p className="text-green-600 font-medium">
                              Last status update: {formatDateTime(employee.lastStatusDate)}
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
                          {employee.activities.map((activity) => (
                            <div key={activity.id} className={`bg-white border rounded-lg p-4 ${activity.type === 'call' ? 'border-blue-200' : 'border-green-200'
                              }`}>
                              {activity.type === 'call' ? (
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Phone className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">Call to: {activity.lead_name}</p>
                                      {activity.lead_phone && (
                                        <p className="text-sm text-gray-600">{activity.lead_phone}</p>
                                      )}
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${activity.call_type === 'outbound'
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
                                      <p className="font-medium text-gray-900">Status changed for: {activity.lead_name}</p>
                                      {activity.lead_phone && (
                                        <p className="text-sm text-gray-600">{activity.lead_phone}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.old_status || '')}`}>
                                          {getDisplayStatus((activity.old_status || '') as any)}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-gray-400" />
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.new_status || '')}`}>
                                          {getDisplayStatus((activity.new_status || '') as any)}
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

      {/* Employee Modal */}
      {selectedEmployee && (
        <EmployeeActivityModal
          isOpen={showEmployeeModal}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          employeeRole={selectedEmployee.role}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};
