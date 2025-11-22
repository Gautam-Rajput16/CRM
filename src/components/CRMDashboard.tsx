import React, { useEffect, useState } from 'react';
import { LogOut, User, Bell, Calendar, Users as UsersIcon, ListTodo, AlertTriangle } from 'lucide-react';
import { SearchAndFilter } from './SearchAndFilter';
import { LeadsTable } from './LeadsTable';
import { NotificationBell } from './NotificationBell';
import { MeetingNotificationBell } from './MeetingNotificationBell';
import { TaskManagement } from './TaskManagement';
import { TaskNotificationBell } from './TaskNotificationBell';
import { PerformanceCalendarModal } from './PerformanceCalendarModal';
import { useLeads } from '../hooks/useLeads';
import { useNotifications } from '../hooks/useNotifications';
import { User as UserType } from '../types/User';
import { OverdueLeadsModal } from './analytics/OverdueLeadsModal';

interface CRMDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export const CRMDashboard: React.FC<CRMDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'tasks'>('leads');
  const [showPerformanceCalendar, setShowPerformanceCalendar] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const {
    leads,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    updateLeadStatus,
    updateLeadNotes,
    updateLeadRequirement,
    updateLeadFollowUp,
    updateMeetingDetails,
    addFollowUpUpdate,
    getMyLeads,
  } = useLeads();

  // Only show leads assigned to the logged-in user, and apply search & status filter
  const myLeads = getMyLeads(user.id).filter(lead => {
    const matchesSearch =
      searchQuery === '' ||
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayDateStr = new Date().toISOString().split('T')[0];

  const overdueLeads = myLeads.filter(lead => {
    if (lead.status !== 'Follow-up' && lead.status !== 'Special Follow-up') {
      return false;
    }

    let leadDate = lead.followUpDate;
    if (!leadDate) return false;
    leadDate = String(leadDate);
    if (leadDate.includes('T')) {
      leadDate = leadDate.split('T')[0];
    }

    return leadDate < todayDateStr;
  });

  const {
    isSupported,
    permission,
    requestPermission,
    checkTodaysFollowUps,
  } = useNotifications();

  // Request notification permission and check for today's follow-ups on component mount
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isSupported && permission !== 'granted') {
        await requestPermission();
      }
      
      // Check for today's follow-ups and show notifications
      if (leads.length > 0) {
        checkTodaysFollowUps(leads);
      }
    };

    initializeNotifications();
  }, [isSupported, permission, requestPermission, checkTodaysFollowUps, leads]);

  const handleLogout = async () => {
    await onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mini CRM</h1>
              <p className="text-gray-600">Manage your leads efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPerformanceCalendar(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                title="Open performance calendar"
              >
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="hidden md:inline">Performance Calendar</span>
              </button>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-5 w-5" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showPerformanceCalendar && (
          <PerformanceCalendarModal
            isOpen={showPerformanceCalendar}
            onClose={() => setShowPerformanceCalendar(false)}
            userId={user.id}
          />
        )}
        <OverdueLeadsModal
          isOpen={showOverdueModal}
          onClose={() => setShowOverdueModal(false)}
          overdueLeads={overdueLeads}
        />
        {/* Notification Permission Banner */}
        {isSupported && permission !== 'granted' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-blue-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Enable Notifications</h3>
                  <p className="text-sm text-blue-700">
                    Allow notifications to get reminders for today's follow-ups.
                  </p>
                </div>
              </div>
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Today's Follow-ups Banner */}
        {(() => {
          const getCurrentDate = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          const today = getCurrentDate();
          const todaysFollowUps = myLeads.filter(lead => {
            let leadDate = lead.followUpDate;
            if (!leadDate) return false;
            leadDate = String(leadDate);
            if (leadDate.includes('T')) {
              leadDate = leadDate.split('T')[0];
            }
            return leadDate === today && lead.status === 'Follow-up';
          });
          
          if (todaysFollowUps.length > 0) {
            return (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Today's Follow-ups ({todaysFollowUps.length})
                    </h3>
                    <p className="text-sm text-yellow-700">
                      You have {todaysFollowUps.length} lead{todaysFollowUps.length > 1 ? 's' : ''} to follow up with today.
                    </p>
                    <div className="mt-2">
                      {todaysFollowUps.map(lead => (
                        <span key={lead.id} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                          {lead.fullName} ({lead.phone})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Today's Meetings Banner */}
        {(() => {
          const getCurrentDate = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          const today = getCurrentDate();
          const todaysMeetings = myLeads.filter(lead => {
            // RESTRICTIVE FILTERING: Only show meetings assigned to current user
            // Check if user is assigned to the meeting (either assignedUserId or meetingAssignedUserId)
            const isAssignedToUser = lead.assignedUserId === user.id || lead.meetingAssignedUserId === user.id;
            if (!isAssignedToUser) return false;
            
            // Check if lead has meeting date OR is a Meeting status lead
            let meetingDate = lead.meetingDate;
            
            // If no meeting date but status is "Meeting", check follow-up date
            if (!meetingDate && lead.status === 'Meeting') {
              meetingDate = lead.followUpDate;
            }
            
            if (!meetingDate) return false;
            meetingDate = String(meetingDate);
            if (meetingDate.includes('T')) {
              meetingDate = meetingDate.split('T')[0];
            }
            return meetingDate === today;
          });
          
          if (todaysMeetings.length > 0) {
            return (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Today's Meetings ({todaysMeetings.length})
                    </h3>
                    <p className="text-sm text-green-700">
                      You have {todaysMeetings.length} meeting{todaysMeetings.length > 1 ? 's' : ''} scheduled for today.
                    </p>
                    <div className="mt-2">
                      {todaysMeetings.map(lead => (
                        <span key={lead.id} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                          {lead.fullName} ({lead.phone}) {lead.meetingTime && `- ${lead.meetingTime}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* All Leads Banner */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">All Leads Dashboard</h3>
              <p className="text-sm text-green-700">
                Viewing all leads in the system. You can update status, follow-up dates, times, and notes.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'leads'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                My Leads
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ListTodo className="h-5 w-5" />
                My Tasks
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <button
                onClick={() => setShowOverdueModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs sm:text-sm text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={overdueLeads.length === 0}
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium">Overdue Follow-ups</span>
                {overdueLeads.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] w-5 h-5">
                    {overdueLeads.length}
                  </span>
                )}
              </button>
              <TaskNotificationBell />
              <NotificationBell leads={leads} currentUserId={user.id} />
              <MeetingNotificationBell leads={leads} currentUserId={user.id} />
            </div>
          </div>
          
          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'leads' ? (
            <>
              {/* Search and Filter */}
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            </>
          ) : null}
        </div>

        {/* Content Area */}
        {activeTab === 'leads' ? (
          /* Leads Table */
          <LeadsTable 
            leads={myLeads} 
            onUpdateStatus={updateLeadStatus}
            onUpdateNotes={updateLeadNotes}
            onUpdateRequirement={updateLeadRequirement}
            onUpdateFollowUp={updateLeadFollowUp}
            onUpdateMeetingDetails={updateMeetingDetails}
            onAddFollowUpUpdate={addFollowUpUpdate}
            currentUser={user}
            hideAssignedTo={true}
          />
        ) : (
          /* Tasks View */
          <TaskManagement viewMode="employee" />
        )}
      </div>
    </div>
  );
};