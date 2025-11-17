import React, { useState } from 'react';
import { X, Phone, User, Calendar, AlertTriangle, Clock, CheckCircle, Filter } from 'lucide-react';
import { Lead } from '../../types/Lead';

interface Profile {
  id: string;
  name: string;
  role?: string;
}

interface FollowUpTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  currentUserId?: string;
  userRole?: string;
  profiles?: Profile[];
}

export const FollowUpTimelineModal: React.FC<FollowUpTimelineModalProps> = ({
  isOpen,
  onClose,
  leads,
  currentUserId,
  userRole,
  profiles = [],
}) => {
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming'>('overdue');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  // Filter employees with "user" role only
  const userEmployees = profiles.filter(profile => 
    profile.role === 'user'
  );

  // Categorize leads by follow-up date
  const categorizeLeads = () => {
    const overdue: Lead[] = [];
    const todayLeads: Lead[] = [];
    const upcoming: Lead[] = [];

    leads.forEach(lead => {
      // Only consider leads with "Follow-up" or "Special Follow-up" status
      if (lead.status !== 'Follow-up' && lead.status !== 'Special Follow-up') return;
      if (!lead.followUpDate) return;
      
      // Role-based filtering
      if (userRole === 'sales_executive') {
        // Sales executives can only see leads assigned to them
        if (lead.assignedUserId !== currentUserId) return;
      }

      // Employee filter
      if (selectedEmployee && lead.assignedUserId !== selectedEmployee) return;
      
      const followUpDate = new Date(lead.followUpDate).toISOString().split('T')[0];
      
      if (followUpDate < today) {
        overdue.push(lead);
      } else if (followUpDate === today) {
        todayLeads.push(lead);
      } else {
        upcoming.push(lead);
      }
    });

    return { overdue, todayLeads, upcoming };
  };

  const { overdue, todayLeads, upcoming } = categorizeLeads();

  const calculateDaysOverdue = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = today.getTime() - followUp.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDaysUntil = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'overdue':
        return { leads: overdue, title: 'Overdue Follow-ups', icon: AlertTriangle, color: 'red' };
      case 'today':
        return { leads: todayLeads, title: "Today's Follow-ups", icon: Clock, color: 'green' };
      case 'upcoming':
        return { leads: upcoming, title: 'Upcoming Follow-ups', icon: CheckCircle, color: 'blue' };
    }
  };

  const { leads: currentLeads, title, icon: TabIcon, color } = getTabData();

  const renderLeadCard = (lead: Lead) => {
    const isOverdue = activeTab === 'overdue';
    const isUpcoming = activeTab === 'upcoming';
    const daysOverdue = isOverdue ? calculateDaysOverdue(lead.followUpDate) : 0;
    const daysUntil = isUpcoming ? calculateDaysUntil(lead.followUpDate) : 0;

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
                <span className="font-medium text-gray-900">{lead.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{lead.phone}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Follow-up: {lead.followUpDate}</span>
                {lead.followUpTime && <span>at {lead.followUpTime}</span>}
              </div>
            </div>

            {lead.assignedUserName && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <User className="h-4 w-4" />
                <span>Assigned to: {lead.assignedUserName}</span>
              </div>
            )}
            
            {lead.notes && (
              <div className="text-sm text-gray-600 mb-1">
                <strong>Notes:</strong> {lead.notes}
              </div>
            )}
            
            {lead.requirement && (
              <div className="text-sm text-gray-600">
                <strong>Requirement:</strong> {lead.requirement}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {isOverdue && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                daysOverdue >= 7 ? 'text-red-600 bg-red-50' :
                daysOverdue >= 3 ? 'text-orange-600 bg-orange-50' :
                'text-yellow-600 bg-yellow-50'
              }`}>
                {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
              </span>
            )}
            
            {isUpcoming && (
              <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
              </span>
            )}
            
            {!lead.assignedUserName && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                Unassigned
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Follow-up Timeline</h2>
              <p className="text-sm text-gray-600">
                Manage your follow-up schedule across all time periods
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
                Filtered by employee
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overdue'
                ? 'border-red-500 text-red-600 bg-red-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Overdue ({overdue.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'today'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Today ({todayLeads.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Upcoming ({upcoming.length})</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TabIcon className={`h-5 w-5 text-${color}-600`} />
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <span className="text-sm text-gray-500">({currentLeads.length} leads)</span>
            </div>

            {currentLeads.length === 0 ? (
              <div className="text-center py-12">
                <TabIcon className={`h-12 w-12 text-${color}-400 mx-auto mb-4`} />
                <p className="text-gray-500">No {activeTab} follow-ups found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentLeads.map(renderLeadCard)}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{overdue.length + todayLeads.length + upcoming.length}</span> follow-up leads
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
