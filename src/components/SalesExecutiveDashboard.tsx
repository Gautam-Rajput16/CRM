import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  TrendingUp,
  LogOut,
  Clock,
  Phone,
  Calendar,
  MessageSquare,
  Save,
  X,
  FileText,
  Edit3,
  MapPin,
  ListTodo
} from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfiles';
import { LeadsTable } from './LeadsTable';
import { SearchAndFilter } from './SearchAndFilter';
import { MeetingDetailsPopup } from './MeetingDetailsPopup';
import { MeetingDetailsForm } from './MeetingDetailsForm';
import { TaskManagement } from './TaskManagement';
import { TaskNotificationBell } from './TaskNotificationBell';
import { toast } from 'react-hot-toast';
import { Lead } from '../types/Lead';
import { getDisplayStatus } from '../utils/statusDisplay';

interface SalesExecutiveDashboardProps {
  onLogout?: () => void;
}

interface MeetingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (leadId: string, summary: string) => Promise<void>;
}

const MeetingSummaryModal: React.FC<MeetingSummaryModalProps> = ({ isOpen, onClose, lead, onSave }) => {
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!lead || !summary.trim()) {
      toast.error('Please enter a meeting summary');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(lead.id, summary.trim());
      setSummary('');
      onClose();
      toast.success('Meeting summary saved successfully');
    } catch (error) {
      toast.error('Failed to save meeting summary');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Add Meeting Summary</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
            {/* Lead Info */}
            <div className="bg-gray-50 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Lead Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{lead.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2 font-medium">{lead.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">{lead.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Follow-up Date:</span>
                  <span className="ml-2 font-medium">{lead.followUpDate || 'Not set'}</span>
                </div>
              </div>
            </div>

            {/* Meeting Summary Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Summary *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full h-32 lg:h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm lg:text-base"
                placeholder="Enter details about the meeting, discussion points, outcomes, and next steps..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what was discussed, any decisions made, and follow-up actions needed.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 lg:p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !summary.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Summary
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const SalesExecutiveDashboard: React.FC<SalesExecutiveDashboardProps> = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMeetingSummaryModal, setShowMeetingSummaryModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showMeetingDetailsPopup, setShowMeetingDetailsPopup] = useState(false);
  const [showMeetingDetailsForm, setShowMeetingDetailsForm] = useState(false);
  const [meetingDetailsLead, setMeetingDetailsLead] = useState<Lead | null>(null);

  const {
    leads,
    isLoading,
    updateLeadStatus,
    updateLeadNotes,
    updateLeadRequirement,
    updateMeetingDetails,
    addFollowUpUpdate,
    addMeetingSummary,
    updateMeetingStatus
  } = useLeads();

  // Add updateMeetingDetails function
  const handleUpdateMeetingDetails = async (leadId: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => {
    try {
      await updateMeetingDetails(leadId, meetingDescription, meetingDate, meetingTime, meetingLocation);
      toast.success('Meeting details updated successfully');
      // Close the form
      setShowMeetingDetailsForm(false);
      setMeetingDetailsLead(null);
    } catch (error: any) {
      console.error('Error updating meeting details:', error);
      toast.error(error.message || 'Failed to update meeting details');
    }
  };

  const { user } = useAuth();
  const { profiles } = useProfiles(true);

  // Get current user profile
  const currentUserProfile = profiles.find(profile => profile.id === user?.id);

  // Filter leads - show leads assigned to this sales executive OR meetings assigned to them
  const myLeads = leads.filter(lead => {
    const isAssigned = lead.assignedUserId === user?.id;
    const isMeetingAssigned = lead.meetingAssignedUserId === user?.id;
    return isAssigned || isMeetingAssigned;
  });


  // Apply search and status filters
  const filteredLeads = myLeads.filter(lead => {
    const matchesSearch = !searchQuery ||
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats for assigned leads
  const stats = {
    total: myLeads.length,
    pending: myLeads.filter(lead => lead.status === '-').length,
    followUp: myLeads.filter(lead => lead.status === 'Follow-up').length,
    specialFollowUp: myLeads.filter(lead => lead.status === 'Special Follow-up').length,
    confirmed: myLeads.filter(lead => lead.status === 'Confirmed').length,
    notConnected: myLeads.filter(lead => lead.status === 'Not Connected').length,
    interested: myLeads.filter(lead => lead.status === 'Interested').length,
    notInterested: myLeads.filter(lead => lead.status === 'Not - Interested').length,
    meeting: myLeads.filter(lead => lead.status === 'Meeting').length,
    meetingConducted: myLeads.filter(lead => lead.status === 'Meeting' && lead.meetingStatus === 'conducted').length,
    meetingNotConducted: myLeads.filter(lead => lead.status === 'Meeting' && lead.meetingStatus === 'not_conducted').length,
  };

  const handleAddMeetingSummary = (lead: Lead) => {
    setSelectedLead(lead);
    setShowMeetingSummaryModal(true);
  };

  const handleUpdateMeetingStatus = async (leadId: string, status: 'conducted' | 'not_conducted') => {
    try {
      await updateMeetingStatus(leadId, status);
      toast.success(`Meeting marked as ${status === 'conducted' ? 'conducted' : 'not conducted'}`);
    } catch (error: any) {
      console.error('Error updating meeting status:', error);
      toast.error(error.message || 'Failed to update meeting status');
    }
  };

  const handleAddMeetingSummaryFromTable = async (leadId: string, content: string) => {
    await addMeetingSummary(leadId, content);
  };

  const handleSaveMeetingSummary = async (leadId: string, summary: string) => {
    try {
      await addMeetingSummary(leadId, summary);
      // Small delay to ensure database update is reflected
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error saving meeting summary:', error);
    }
  };

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'leads',
      label: 'My Leads',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: <ListTodo className="h-5 w-5" />
    },
    {
      id: 'analytics',
      label: 'My Performance',
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {currentUserProfile?.name || 'Sales Executive'}!
        </h2>
        <p className="text-blue-100">
          Manage your assigned leads and track your performance
        </p>
      </div>


      {/* Recent Leads */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Leads & Meetings</h3>
        </div>
        <div className="p-6">
          {myLeads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leads or meetings assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  {/* Header with name and status */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-lg">{lead.fullName}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                          title="Click to call"
                        >
                          {lead.phone}
                        </a>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${lead.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'Special Follow-up' ? 'bg-orange-100 text-orange-800' :
                                lead.status === 'Not Connected' ? 'bg-cyan-100 text-cyan-800' :
                                  lead.status === 'Meeting' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                          }`}>
                          {getDisplayStatus(lead.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Meeting Details Button */}
                      {lead.status === 'Meeting' && (lead.meetingDate || lead.meetingTime || lead.meetingLocation || lead.meetingDescription) && (
                        <button
                          onClick={() => {
                            setMeetingDetailsLead(lead);
                            setShowMeetingDetailsPopup(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto justify-center"
                        >
                          <MapPin className="h-4 w-4" />
                          View Meeting
                        </button>
                      )}

                      <button
                        onClick={() => handleAddMeetingSummary(lead)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Add Summary
                      </button>

                      {lead.meetingStatus !== 'conducted' && (
                        <button
                          onClick={() => handleUpdateMeetingStatus(lead.id, 'conducted')}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
                        >
                          <Calendar className="h-4 w-4" />
                          Conducted
                        </button>
                      )}

                      {lead.meetingStatus !== 'not_conducted' && (
                        <button
                          onClick={() => handleUpdateMeetingStatus(lead.id, 'not_conducted')}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto justify-center"
                        >
                          <X className="h-4 w-4" />
                          Not Conducted
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lead Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                    {/* Requirement */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <FileText className="h-3 w-3" />
                        Requirement
                      </div>
                      <p className="text-sm text-gray-900 break-words">
                        {lead.requirement || 'Not specified'}
                      </p>
                    </div>

                    {/* Meeting Date & Time */}
                    {(lead.meetingDate || lead.meetingTime || lead.followUpDate || lead.followUpTime) && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          <Calendar className="h-3 w-3" />
                          {lead.status === 'Meeting' && (lead.meetingDate || lead.meetingTime) ? 'Meeting Schedule' : 'Follow-up Schedule'}
                        </div>
                        <div className="text-sm text-gray-900">
                          {/* Show meeting details if it's a meeting with meeting date/time */}
                          {lead.status === 'Meeting' && (lead.meetingDate || lead.meetingTime) ? (
                            <>
                              {lead.meetingDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  {new Date(lead.meetingDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                              {lead.meetingTime && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  {(() => {
                                    try {
                                      const [hours, minutes] = lead.meetingTime.split(':');
                                      const date = new Date();
                                      date.setHours(parseInt(hours), parseInt(minutes));
                                      return date.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      });
                                    } catch {
                                      return lead.meetingTime;
                                    }
                                  })()}
                                </div>
                              )}
                              {lead.meetingLocation && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  {lead.meetingLocation}
                                </div>
                              )}
                            </>
                          ) : (
                            /* Show follow-up details for non-meetings or meetings without meeting date/time */
                            <>
                              {lead.followUpDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  {new Date(lead.followUpDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                              {lead.followUpTime && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  {(() => {
                                    try {
                                      const [hours, minutes] = lead.followUpTime.split(':');
                                      const date = new Date();
                                      date.setHours(parseInt(hours), parseInt(minutes));
                                      return date.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      });
                                    } catch {
                                      return lead.followUpTime;
                                    }
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <Edit3 className="h-3 w-3" />
                        Notes
                      </div>
                      <p className="text-sm text-gray-900 break-words">
                        {lead.notes || 'No notes added'}
                      </p>
                    </div>

                    {/* Meeting Summaries */}
                    {lead.meetingSummaries && lead.meetingSummaries.length > 0 && (
                      <div className="space-y-1 sm:col-span-full">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          <MessageSquare className="h-3 w-3" />
                          Meeting Summaries ({lead.meetingSummaries.length})
                        </div>
                        <div className="space-y-2">
                          {lead.meetingSummaries.slice(0, 2).map((summary, index) => (
                            <div key={summary.id || index} className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                              <p className="text-sm text-gray-800 break-words">
                                {summary.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(summary.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                          {lead.meetingSummaries.length > 2 && (
                            <p className="text-xs text-gray-500 italic">
                              +{lead.meetingSummaries.length - 2} more summaries
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="space-y-6">
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading leads...</p>
        </div>
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onUpdateStatus={updateLeadStatus}
          onUpdateNotes={updateLeadNotes}
          onUpdateRequirement={updateLeadRequirement}
          onUpdateMeetingDetails={updateMeetingDetails}
          onAddFollowUpUpdate={addFollowUpUpdate}
          onAddMeetingSummary={handleAddMeetingSummaryFromTable}
          selectedLeads={[]}
          onSelectLead={() => { }}
          hideAssignedTo={true}
        />
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 lg:mb-6">My Performance Overview</h3>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
          <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs lg:text-sm text-gray-500">Total Leads</div>
          </div>

          <div className="text-center p-3 lg:p-4 bg-green-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-xs lg:text-sm text-gray-500">Confirmed</div>
          </div>

          <div className="text-center p-3 lg:p-4 bg-blue-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">{stats.interested}</div>
            <div className="text-xs lg:text-sm text-gray-500">Interested</div>
          </div>

          <div className="text-center p-3 lg:p-4 bg-red-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-red-600">{stats.notInterested}</div>
            <div className="text-xs lg:text-sm text-gray-500">Not Interested</div>
          </div>

          <div className="text-center p-3 lg:p-4 bg-emerald-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-emerald-600">{stats.meetingConducted}</div>
            <div className="text-xs lg:text-sm text-gray-500">Conducted</div>
          </div>

          <div className="text-center p-3 lg:p-4 bg-rose-50 rounded-lg">
            <div className="text-xl lg:text-2xl font-bold text-rose-600">{stats.meetingNotConducted}</div>
            <div className="text-xs lg:text-sm text-gray-500">Not Conducted</div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200">
            <h4 className="text-base lg:text-md font-medium text-gray-900 mb-3 lg:mb-4">Conversion Rates</h4>
            <div className="space-y-2 lg:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmation Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {((stats.confirmed / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interest Rate</span>
                <span className="text-sm font-medium text-blue-600">
                  {((stats.interested / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Not Interested Rate</span>
                <span className="text-sm font-medium text-red-600">
                  {((stats.notInterested / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meeting Rate</span>
                <span className="text-sm font-medium text-purple-600">
                  {((stats.meeting / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meeting Conducted Rate</span>
                <span className="text-sm font-medium text-emerald-600">
                  {stats.meeting > 0 ? ((stats.meetingConducted / stats.meeting) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meeting Not Conducted Rate</span>
                <span className="text-sm font-medium text-rose-600">
                  {stats.meeting > 0 ? ((stats.meetingNotConducted / stats.meeting) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sales Executive</h1>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TrendingUp className="h-3 w-3" />
            Sales Executive
          </span>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <nav className="flex overflow-x-auto p-2 space-x-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 bg-white shadow-lg flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Executive</h1>
              <p className="text-sm text-gray-500">CRM Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
              <p className="text-gray-600">Manage your assigned leads efficiently</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Sales Executive
              </span>
              <TaskNotificationBell />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'leads' && renderLeads()}
          {activeSection === 'tasks' && <TaskManagement viewMode="employee" />}
          {activeSection === 'analytics' && renderAnalytics()}
        </div>
      </div>

      {/* Meeting Summary Modal */}
      <MeetingSummaryModal
        isOpen={showMeetingSummaryModal}
        onClose={() => setShowMeetingSummaryModal(false)}
        lead={selectedLead}
        onSave={handleSaveMeetingSummary}
      />

      {/* Meeting Details Popup */}
      {meetingDetailsLead && (
        <MeetingDetailsPopup
          lead={meetingDetailsLead}
          isOpen={showMeetingDetailsPopup}
          onClose={() => {
            setShowMeetingDetailsPopup(false);
            setMeetingDetailsLead(null);
          }}
          onEdit={() => {
            setShowMeetingDetailsPopup(false);
            setShowMeetingDetailsForm(true);
          }}
        />
      )}

      {/* Meeting Details Form */}
      {meetingDetailsLead && (
        <MeetingDetailsForm
          lead={meetingDetailsLead}
          isOpen={showMeetingDetailsForm}
          onClose={() => {
            setShowMeetingDetailsForm(false);
            setMeetingDetailsLead(null);
          }}
          onSave={handleUpdateMeetingDetails}
        />
      )}
    </div>
  );
};

export default SalesExecutiveDashboard;
