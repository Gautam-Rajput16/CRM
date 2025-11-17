import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Phone, User, FileText, Clock, MapPin } from 'lucide-react';
import { Lead } from '../types/Lead';
import { FollowUpUpdates } from './FollowUpUpdates';
import { MeetingSummaries } from './MeetingSummaries';
import { MeetingDetailsPopup } from './MeetingDetailsPopup';
import { MeetingDetailsForm } from './MeetingDetailsForm';

interface MeetingRowProps {
  lead: Lead;
  currentUser?: { id: string; name: string } | null;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRequirement?: (id: string, requirement: string) => void;
  onUpdateMeetingDetails?: (id: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => void;
  onAddFollowUpUpdate?: (leadId: string, content: string) => Promise<void>;
  onAddMeetingSummary?: (leadId: string, content: string) => Promise<void>;
  onAssignMeeting?: (leadId: string, userId: string) => Promise<void>;
  salesExecutives?: { id: string; name: string; role?: string }[];
  canEdit?: boolean;
}

export const MeetingRow: React.FC<MeetingRowProps> = ({
  lead,
  currentUser,
  onUpdateNotes,
  onUpdateRequirement,
  onUpdateMeetingDetails,
  onAddFollowUpUpdate,
  onAddMeetingSummary,
  onAssignMeeting,
  salesExecutives = [],
  canEdit = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMeetingPopup, setShowMeetingPopup] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 hover:bg-gray-50">
          <div className="flex items-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {lead.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {lead.followUpUpdates && lead.followUpUpdates.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {lead.followUpUpdates.length} update{lead.followUpUpdates.length > 1 ? 's' : ''}
                  </div>
                )}
                {lead.meetingSummaries && lead.meetingSummaries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {lead.meetingSummaries.length} meeting{lead.meetingSummaries.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Calendar className="h-3 w-3 mr-1" />
                  Meeting
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center text-sm text-blue-700 hover:underline"
            title={`Call ${lead.phone}`}
          >
            <Phone className="h-4 w-4 text-gray-400 mr-2" />
            {lead.phone}
          </a>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-900 max-w-xs truncate" title={lead.requirement}>
              {lead.requirement || 'No requirement specified'}
            </div>
            {canEdit && onUpdateRequirement && (
              <button
                onClick={() => {
                  const newRequirement = window.prompt('Update requirement:', lead.requirement);
                  if (newRequirement !== null) {
                    onUpdateRequirement(lead.id, newRequirement);
                  }
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              {formatDate(lead.followUpDate)}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              {formatTime(lead.followUpTime)}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {lead.assignedUserName ? (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                {lead.assignedUserName}
              </div>
            ) : (
              <span className="text-gray-400 italic">Unassigned</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {lead.meetingAssignedUserName ? (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                {lead.meetingAssignedUserName}
              </div>
            ) : (
              <span className="text-gray-400 italic">Not assigned</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {lead.meetingDate ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMeetingPopup(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">View Details</span>
              </button>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(lead.meetingDate)}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">No details</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-900 max-w-xs">
              {lead.notes ? (
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="truncate" title={lead.notes}>
                    {lead.notes}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 italic">No notes</span>
              )}
            </div>
            {canEdit && onUpdateNotes && (
              <button
                onClick={() => {
                  const newNotes = window.prompt('Update notes:', lead.notes);
                  if (newNotes !== null) {
                    onUpdateNotes(lead.id, newNotes);
                  }
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit
              </button>
            )}
          </div>
        </td>
        {canEdit && onAssignMeeting && (
          <td className="px-6 py-4 whitespace-nowrap">
            <select
              className="text-sm border rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={lead.meetingAssignedUserId || ''}
              onChange={(e) => {
                if (e.target.value && onAssignMeeting) {
                  onAssignMeeting(lead.id, e.target.value);
                }
              }}
            >
              <option value="">Select Sales Executive</option>
              {salesExecutives.map((executive) => (
                <option key={executive.id} value={executive.id}>
                  {executive.name}
                </option>
              ))}
            </select>
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={canEdit ? 9 : 8} className="px-6 py-4 bg-gray-50 sticky left-0 z-10">
            <div className="max-w-4xl space-y-6">
              {/* Follow-up Updates */}
              {onAddFollowUpUpdate && currentUser && (
                <FollowUpUpdates
                  lead={lead}
                  currentUser={currentUser}
                  onAddUpdate={onAddFollowUpUpdate}
                />
              )}
              
              {/* Meeting Summaries */}
              {onAddMeetingSummary && currentUser && (
                <MeetingSummaries
                  lead={lead}
                  currentUser={currentUser}
                  onAddSummary={onAddMeetingSummary}
                />
              )}
            </div>
          </td>
        </tr>
      )}
      
      {/* Meeting Details Popup */}
      <MeetingDetailsPopup
        lead={lead}
        isOpen={showMeetingPopup}
        onClose={() => setShowMeetingPopup(false)}
        onEdit={onUpdateMeetingDetails ? () => setShowMeetingForm(true) : undefined}
      />
      
      {/* Meeting Details Form */}
      {onUpdateMeetingDetails && (
        <MeetingDetailsForm
          lead={lead}
          isOpen={showMeetingForm}
          onClose={() => setShowMeetingForm(false)}
          onSave={onUpdateMeetingDetails}
        />
      )}
    </>
  );
};
