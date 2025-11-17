import React from 'react';
import { User, Calendar, Users, ArrowRight } from 'lucide-react';
import { Lead } from '../../types/Lead';

interface Profile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface EmployeeAnalyticsCardProps {
  employee: Profile;
  leads: Lead[];
  onClick?: () => void;
}

export const EmployeeAnalyticsCard: React.FC<EmployeeAnalyticsCardProps> = ({
  employee,
  leads,
  onClick
}) => {
  // Filter leads assigned to this employee
  const employeeLeads = leads.filter(lead => lead.assignedUserId === employee.id);
  
  // Calculate statistics
  const stats = {
    total: employeeLeads.length,
    pending: employeeLeads.filter(lead => lead.status === '-').length,
    followUp: employeeLeads.filter(lead => lead.status === 'Follow-up').length,
    specialFollowUp: employeeLeads.filter(lead => lead.status === 'Special Follow-up').length,
    confirmed: employeeLeads.filter(lead => lead.status === 'Confirmed').length,
    notConnected: employeeLeads.filter(lead => lead.status === 'Not Connected').length,
    interested: employeeLeads.filter(lead => lead.status === 'Interested').length,
    notInterested: employeeLeads.filter(lead => lead.status === 'Not - Interested').length,
    meeting: employeeLeads.filter(lead => lead.status === 'Meeting').length,
  };

  // Get today's date for follow-up calculations
  const today = new Date().toISOString().split('T')[0];
  const todaysFollowUps = employeeLeads.filter(lead => 
    (lead.status === 'Follow-up' || lead.status === 'Special Follow-up') && 
    lead.followUpDate === today
  ).length;

  const todaysMeetings = employeeLeads.filter(lead => 
    lead.meetingDate === today || 
    (lead.status === 'Meeting' && lead.followUpDate === today)
  ).length;

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-blue-200 cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Employee Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {employee.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{employee.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="capitalize">{employee.role || 'User'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>{employee.email}</span>
            </div>
          </div>
        </div>
        {onClick && (
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
        )}
      </div>

      {/* Total Leads */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Leads</div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Pending */}
        <div className="text-center">
          <div className="text-xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>

        {/* Follow-up */}
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-600">{stats.followUp}</div>
          <div className="text-xs text-gray-600">Follow-up</div>
        </div>

        {/* Confirmed */}
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-xs text-gray-600">Confirmed</div>
        </div>

        {/* Not Connected */}
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{stats.notConnected}</div>
          <div className="text-xs text-gray-600">Not Connected</div>
        </div>

        {/* Interested */}
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{stats.interested}</div>
          <div className="text-xs text-gray-600">Interested</div>
        </div>

        {/* Not Interested */}
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">{stats.notInterested}</div>
          <div className="text-xs text-gray-600">Not - Interested</div>
        </div>

        {/* Meeting */}
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">{stats.meeting}</div>
          <div className="text-xs text-gray-600">Meeting</div>
        </div>
      </div>

      {/* Today's Activities */}
      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{todaysFollowUps}</div>
              <div className="text-xs text-gray-600">Today's Follow-ups</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{todaysMeetings}</div>
              <div className="text-xs text-gray-600">Today's Meetings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
