import React, { useState, useMemo } from 'react';
import { X, Filter, Users, Phone, User, FileText, ChevronDown } from 'lucide-react';
import { Lead } from '../../types/Lead';

interface Profile {
  id: string;
  name: string;
  role?: string;
}

interface LeadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  status: string;
  profiles: Profile[];
}

export const LeadStatusModal: React.FC<LeadStatusModalProps> = ({
  isOpen,
  onClose,
  leads,
  status,
  profiles,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Filter leads by status and employee
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => lead.status === status);
    
    if (selectedEmployee) {
      filtered = filtered.filter(lead => lead.assignedUserId === selectedEmployee);
    }
    
    return filtered;
  }, [leads, status, selectedEmployee]);

  // Get employees with 'user' role for filtering
  const employees = profiles.filter(profile => profile.role === 'user');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Follow-up':
        return 'text-yellow-600 bg-yellow-100';
      case 'Confirmed':
        return 'text-green-600 bg-green-100';
      case 'Not Connected':
        return 'text-red-600 bg-red-100';
      case 'Interested':
        return 'text-blue-600 bg-blue-100';
      case 'Not - Interested':
        return 'text-orange-600 bg-orange-100';
      case 'Meeting':
        return 'text-purple-600 bg-purple-100';
      case 'Special Follow-up':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAssignedUserName = (assignedUserId: string | null | undefined) => {
    if (!assignedUserId) return 'Unassigned';
    const profile = profiles.find(p => p.id === assignedUserId);
    return profile?.name || 'Unknown User';
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Not set';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Leads with Status: {status === '-' ? 'Pending' : status}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedEmployee ? 
                  `Showing ${filteredLeads.length} of ${leads.filter(l => l.status === status).length} leads` :
                  `Total: ${filteredLeads.length} leads`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Employee:</span>
            <div className="relative">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {selectedEmployee && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Filtered by employee
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600">
                {selectedEmployee 
                  ? `No leads with status "${status}" assigned to the selected employee.`
                  : `No leads found with status "${status}".`
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Lead Info */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-900">{lead.fullName}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {lead.phone}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Assigned to:</span>
                        <div className="font-medium text-gray-900">
                          {getAssignedUserName(lead.assignedUserId)}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Follow-up Date:</span>
                        <div className="font-medium text-gray-900">
                          {formatDate(lead.followUpDate)}
                        </div>
                      </div>
                    </div>

                    {/* Requirement */}
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Requirement:</span>
                        <div className="font-medium text-gray-900 truncate" title={lead.requirement}>
                          {lead.requirement || 'Not specified'}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium text-gray-900">
                          {formatDate(lead.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500">Notes:</span>
                          <div className="text-sm text-gray-900 mt-1 line-clamp-3">
                            {lead.notes || 'No notes available'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedEmployee ? (
              <>Showing {filteredLeads.length} of {leads.filter(l => l.status === status).length} leads for selected employee</>
            ) : (
              <>Total {filteredLeads.length} leads with status "{status}"</>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
