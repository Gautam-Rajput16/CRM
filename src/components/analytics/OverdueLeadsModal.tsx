import React, { useState } from 'react';
import { X, Phone, User, Calendar, AlertTriangle, Filter } from 'lucide-react';
import { Lead } from '../../types/Lead';

interface Profile {
  id: string;
  name: string;
  role?: string;
}

interface OverdueLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueLeads: Lead[];
  profiles?: Profile[];
}

export const OverdueLeadsModal: React.FC<OverdueLeadsModalProps> = ({
  isOpen,
  onClose,
  overdueLeads,
  profiles = [],
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  if (!isOpen) return null;

  // Filter employees with "user" role only
  const userEmployees = profiles.filter(profile => 
    profile.role === 'user'
  );

  // Filter overdue leads based on selected employee
  const filteredLeads = selectedEmployee 
    ? overdueLeads.filter(lead => lead.assignedUserId === selectedEmployee)
    : overdueLeads;

  const calculateDaysOverdue = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = today.getTime() - followUp.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue >= 7) return 'text-red-600 bg-red-50';
    if (daysOverdue >= 3) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Overdue Follow-ups ({selectedEmployee ? filteredLeads.length : overdueLeads.length})
              </h2>
              <p className="text-sm text-gray-600">
                Leads that require immediate attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filter by Employee:</label>
            </div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Employees</option>
              {userEmployees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <span className="text-sm text-gray-600">
                Showing {filteredLeads.length} of {overdueLeads.length} leads
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedEmployee ? 'No overdue follow-ups found for selected employee' : 'No overdue follow-ups found'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredLeads.map((lead) => {
                  const daysOverdue = calculateDaysOverdue(lead.followUpDate);
                  const priorityClass = getPriorityColor(daysOverdue);
                  
                  return (
                    <div
                      key={lead.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {lead.fullName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{lead.phone}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Follow-up: {lead.followUpDate}</span>
                            </div>
                            {lead.assignedUserName && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Assigned to: {lead.assignedUserName}</span>
                              </div>
                            )}
                          </div>
                          
                          {lead.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Notes:</strong> {lead.notes}
                            </div>
                          )}
                          
                          {lead.requirement && (
                            <div className="mt-1 text-sm text-gray-600">
                              <strong>Requirement:</strong> {lead.requirement}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </span>
                          
                          {!lead.assignedUserName && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedEmployee ? (
              <>
                <span className="font-medium text-red-600">{filteredLeads.length}</span> of{' '}
                <span className="font-medium text-red-600">{overdueLeads.length}</span> overdue follow-ups for selected employee
              </>
            ) : (
              <>
                <span className="font-medium text-red-600">{overdueLeads.length}</span> overdue follow-ups requiring attention
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
