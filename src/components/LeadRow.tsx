import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Phone, User, Calendar, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Lead } from '../types/Lead';
import { FollowUpUpdates } from './FollowUpUpdates';
import { MeetingSummaries } from './MeetingSummaries';
import { MeetingDetailsPopup } from './MeetingDetailsPopup';
import { MeetingDetailsForm } from './MeetingDetailsForm';
import { logCall, logStatusChange } from '../lib/activityLogger';
import { getDisplayStatus, getDatabaseStatus } from '../utils/statusDisplay';

interface LeadRowProps {
  lead: Lead;
  selectedLeads?: string[];
  onSelectLead?: (leadId: string) => void;
  onUpdateStatus?: (id: string, status: Lead['status']) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRequirement?: (id: string, requirement: string) => void;
  onUpdateFollowUp?: (id: string, followUpDate: string, followUpTime: string) => void;
  onAddFollowUpUpdate?: (leadId: string, content: string) => Promise<void>;
  onAddMeetingSummary?: (leadId: string, content: string) => Promise<void>;
  onDelete?: (id: string) => void;
  currentUser?: { id: string; name: string } | null;
  hideAssignedTo?: boolean;
  onUpdateMeetingDetails?: (id: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => void;
}

export const LeadRow: React.FC<LeadRowProps> = ({
  lead,
  selectedLeads = [],
  onSelectLead,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateRequirement,
  onUpdateFollowUp,
  onAddFollowUpUpdate,
  onAddMeetingSummary,
  onDelete,
  currentUser,
  hideAssignedTo = false,
  onUpdateMeetingDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMeetingPopup, setShowMeetingPopup] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  const handlePhoneClick = async () => {
    // Log the call when phone number is clicked
    if (currentUser?.id) {
      try {
        await logCall({
          employee_id: currentUser.id,
          lead_id: lead.id,
          lead_name: lead.fullName,
          lead_phone: lead.phone,
          call_type: 'outbound',
          notes: `Call initiated from CRM dashboard`
        });
      } catch (error) {
        console.error('Failed to log call:', error);
        // Continue with the call even if logging fails
      }
    }
  };

  const handleStatusChange = async (newStatus: Lead['status']) => {
    const oldStatus = lead.status;

    // Call the original status update function
    if (onUpdateStatus) {
      onUpdateStatus(lead.id, newStatus);
    }

    // Log the status change
    if (currentUser?.id && oldStatus !== newStatus) {
      try {
        await logStatusChange({
          lead_id: lead.id,
          employee_id: currentUser.id,
          lead_name: lead.fullName,
          old_status: oldStatus,
          new_status: newStatus,
          notes: `Status changed from ${oldStatus} to ${newStatus}`
        });
      } catch (error) {
        console.error('Failed to log status change:', error);
        // Continue with the status change even if logging fails
      }
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case '-':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Special Follow-up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Not Connected':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Interested':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Not - Interested':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(`${dateString}T${timeString || '00:00'}`);
      if (isNaN(date.getTime())) return '-';

      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const formattedTime = timeString ? date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '';

      return formattedTime ? `${formattedDate}, ${formattedTime}` : formattedDate;
    } catch {
      return '-';
    }
  };

  const isToday = (dateString: string) => {
    const getCurrentDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = getCurrentDate();
    let normalizedDate = dateString;

    if (normalizedDate && normalizedDate.includes('T')) {
      normalizedDate = normalizedDate.split('T')[0];
    }

    return normalizedDate === today;
  };

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${lead.status === 'Special Follow-up' ? 'bg-orange-50 border-l-4 border-orange-400' :
          isToday(lead.followUpDate) && lead.status === 'Follow-up' ? 'bg-yellow-50' : ''
        }`}>
        {onSelectLead && (
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600"
              checked={selectedLeads.includes(lead.id)}
              onChange={() => onSelectLead(lead.id)}
            />
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap">
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
            <div className="h-10 w-10 flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{lead.fullName}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {lead.followUpUpdates && lead.followUpUpdates.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
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
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              onClick={handlePhoneClick}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline hover:bg-blue-100 border rounded cursor-pointer transition-colors flex items-center gap-1 px-2 py-1"
              title="Click to call"
            >
              <Phone className="h-4 w-4" />
              {lead.phone}
            </a>
            {lead.phone && (
              <a
                href={(function getWhatsAppUrl(phone: string) {
                  const digits = phone.replace(/\D/g, '');
                  if (!digits) return '#';

                  let normalized = digits;
                  if (normalized.length === 11 && normalized.startsWith('0')) {
                    normalized = normalized.slice(1);
                  }
                  if (normalized.length === 10) {
                    normalized = `91${normalized}`;
                  }

                  return `https://wa.me/${normalized}`;
                })(lead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 hover:underline hover:bg-green-100 border rounded cursor-pointer transition-colors flex items-center gap-1 px-2 py-1"
                title="Open WhatsApp chat"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {onUpdateStatus ? (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                {getDisplayStatus(lead.status)}
              </span>
              <select
                className="ml-2 text-sm border rounded px-2 py-1"
                value={getDisplayStatus(lead.status)}
                onChange={(e) => handleStatusChange(getDatabaseStatus(e.target.value))}
              >
                <option value="Pending">Pending</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Special Follow-up">Special Follow-up</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Not Connected">Not Connected</option>
                <option value="Interested">Interested</option>
                <option value="Not - Interested">Not - Interested</option>
                <option value="Meeting">Meeting</option>
              </select>
            </div>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
              {getDisplayStatus(lead.status)}
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-900 max-w-xs truncate">
              {lead.requirement || '-'}
            </div>
            <div className="flex gap-1">
              {onUpdateRequirement && (
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
              {/* Removed Add/Edit Meeting button from Requirement column */}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={`text-sm ${isToday(lead.followUpDate) && (lead.status === 'Follow-up' || lead.status === 'Special Follow-up') ? 'font-bold text-yellow-700' : 'text-gray-900'}`}>
              {formatDateTime(lead.followUpDate, lead.followUpTime)}
              {isToday(lead.followUpDate) && (lead.status === 'Follow-up' || lead.status === 'Special Follow-up') && (
                <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">TODAY</span>
              )}
            </div>
            {onUpdateFollowUp && (
              <button
                onClick={() => {
                  const newDate = window.prompt('Update follow-up date (YYYY-MM-DD):', lead.followUpDate);
                  if (newDate !== null) {
                    const newTime = window.prompt('Update follow-up time (HH:MM):', lead.followUpTime || '09:00');
                    if (newTime !== null) {
                      onUpdateFollowUp(lead.id, newDate, newTime);
                    }
                  }
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-900 max-w-xs truncate">
              {lead.notes || '-'}
            </div>
            {onUpdateNotes && (
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
        <td className="px-6 py-4 whitespace-nowrap">
          {lead.status === 'Meeting' ? (
            <div className="flex items-center gap-2">
              {lead.meetingDate ? (
                <button
                  onClick={() => setShowMeetingPopup(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">View Details</span>
                </button>
              ) : onUpdateMeetingDetails ? (
                <button
                  onClick={() => setShowMeetingForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Meeting</span>
                </button>
              ) : (
                <span className="text-sm text-gray-400">No details</span>
              )}
              {lead.meetingDate && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(lead.meetingDate, lead.meetingTime || '').split(',')[0]}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>
        {!hideAssignedTo && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">
                {lead.assignedUserName || 'Unassigned'}
              </span>
            </div>
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {new Date(lead.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </td>
        {onDelete && (
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
            <button
              onClick={() => onDelete(lead.id)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={onDelete ? (hideAssignedTo ? 9 : 10) : (hideAssignedTo ? 8 : 9)} className="px-6 py-4 bg-gray-50">
            <div className="max-w-4xl space-y-6">
              {/* Follow-up Updates */}
              {onAddFollowUpUpdate && currentUser ? (
                <FollowUpUpdates
                  lead={lead}
                  currentUser={currentUser}
                  onAddUpdate={onAddFollowUpUpdate}
                />
              ) : (
                <div className="text-sm text-gray-500">Follow-up updates not available</div>
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
