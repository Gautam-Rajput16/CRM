import React, { useState } from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import { Lead } from '../types/Lead';
import { MeetingRow } from './MeetingRow';

interface MeetingsViewProps {
  leads: Lead[];
  profiles: { id: string; name: string; role?: string }[];
  currentUser?: { id: string; name: string } | null;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRequirement?: (id: string, requirement: string) => void;
  onUpdateMeetingDetails?: (id: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => void;
  onAddFollowUpUpdate?: (leadId: string, content: string) => Promise<void>;
  onAddMeetingSummary?: (leadId: string, content: string) => Promise<void>;
  onAssignMeeting?: (leadId: string, userId: string) => Promise<void>;
  canEdit?: boolean;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ 
  leads, 
  profiles, 
  currentUser,
  onUpdateNotes,
  onUpdateRequirement,
  onUpdateMeetingDetails,
  onAddFollowUpUpdate,
  onAddMeetingSummary,
  onAssignMeeting,
  canEdit = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [salesExecutiveFilter, setSalesExecutiveFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filter leads to only show those with "Meeting" status
  const meetingLeads = leads.filter(lead => lead.status === 'Meeting');

  // Filter profiles to only show sales executives for assignment
  const salesExecutives = profiles.filter(profile => profile.role === 'sales_executive');
  
  // Filter profiles to only show users with "user" role for employee filter
  const userEmployees = profiles.filter(profile => profile.role === 'user');

  // Apply additional filters
  const filteredMeetings = meetingLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.requirement.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmployee = !employeeFilter || lead.assignedUserId === employeeFilter;
    
    const matchesSalesExecutive = !salesExecutiveFilter || lead.meetingAssignedUserId === salesExecutiveFilter;

    let matchesDate = true;
    if (dateFilter && lead.meetingDate) {
      const meetingDate = new Date(lead.meetingDate);
      const now = new Date();
      
      // Normalize dates to start of day for accurate comparison
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // If meeting date is invalid, don't match any date filters
      if (isNaN(meetingDate.getTime())) {
        matchesDate = false;
      } else {
        switch (dateFilter) {
          case '1d':
            // Last 1 day: meetings from yesterday to today (inclusive)
            const yesterdayOnly = new Date(todayOnly);
            yesterdayOnly.setDate(yesterdayOnly.getDate() - 1);
            matchesDate = meetingDateOnly >= yesterdayOnly && meetingDateOnly <= todayOnly;
            break;
          case '7d':
            // Last week: meetings from 7 days ago to today (inclusive)
            const oneWeekAgoOnly = new Date(todayOnly);
            oneWeekAgoOnly.setDate(oneWeekAgoOnly.getDate() - 7);
            matchesDate = meetingDateOnly >= oneWeekAgoOnly && meetingDateOnly <= todayOnly;
            break;
          case '15d':
            // Last 15 days: meetings from 15 days ago to today (inclusive)
            const fifteenDaysAgoOnly = new Date(todayOnly);
            fifteenDaysAgoOnly.setDate(fifteenDaysAgoOnly.getDate() - 15);
            matchesDate = meetingDateOnly >= fifteenDaysAgoOnly && meetingDateOnly <= todayOnly;
            break;
          case '1m':
            // Last month: meetings from 1 month ago to today (inclusive)
            const oneMonthAgoOnly = new Date(todayOnly);
            oneMonthAgoOnly.setMonth(oneMonthAgoOnly.getMonth() - 1);
            matchesDate = meetingDateOnly >= oneMonthAgoOnly && meetingDateOnly <= todayOnly;
            break;
          case 'today':
            // Today only: meetings scheduled for today
            matchesDate = meetingDateOnly.getTime() === todayOnly.getTime();
            break;
          case 'upcoming':
            // Upcoming: meetings from today onwards (future meetings)
            matchesDate = meetingDateOnly >= todayOnly;
            break;
          default:
            matchesDate = true;
        }
      }
    } else if (dateFilter && !lead.meetingDate) {
      // If no meeting date is set, don't match any date filters
      matchesDate = false;
    }

    return matchesSearch && matchesEmployee && matchesSalesExecutive && matchesDate;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Scheduled Meetings</h2>
          </div>
          <div className="bg-blue-50 px-3 py-1 rounded-full">
            <span className="text-blue-700 font-medium">{filteredMeetings.length} meetings</span>
          </div>
        </div>
        <p className="text-gray-600">View and manage all leads with scheduled meetings</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Search & Filter Meetings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          {userEmployees.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">All Employees</option>
                {userEmployees.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {salesExecutives.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={salesExecutiveFilter}
                onChange={(e) => setSalesExecutiveFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">All Sales Executives</option>
                {salesExecutives.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="1d">Last 1 Day</option>
              <option value="7d">Last Week</option>
              <option value="15d">Last 15 Days</option>
              <option value="1m">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Meeting Schedule</h3>
        </div>
        
        {filteredMeetings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No meetings found</p>
            <p className="text-gray-400">
              {meetingLeads.length === 0 
                ? "No leads have meetings scheduled yet" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requirement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow Up Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Assigned
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetings.map((lead) => (
                  <MeetingRow
                    key={lead.id}
                    lead={lead}
                    currentUser={currentUser}
                    onUpdateNotes={onUpdateNotes}
                    onUpdateRequirement={onUpdateRequirement}
                    onUpdateMeetingDetails={onUpdateMeetingDetails}
                    onAddFollowUpUpdate={onAddFollowUpUpdate}
                    onAddMeetingSummary={onAddMeetingSummary}
                    onAssignMeeting={onAssignMeeting}
                    salesExecutives={salesExecutives}
                    canEdit={canEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
