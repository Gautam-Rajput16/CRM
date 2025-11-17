import React from 'react';
import { X, User, Phone, Calendar, FileText, Target, Users, UserCheck } from 'lucide-react';
import { Lead } from '../types/Lead';

interface TodayMeetingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

export const TodayMeetingsModal: React.FC<TodayMeetingsModalProps> = ({
  isOpen,
  onClose,
  leads
}) => {
  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Filter leads for today's meetings
  const todaysMeetings = leads.filter(lead => {
    if (lead.meetingDate) {
      return lead.meetingDate === today;
    }
    // fallback: some meetings may only have followUpDate
    return lead.status === 'Meeting' && lead.followUpDate === today;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Today's Meetings</h2>
              <p className="text-sm text-gray-600">
                {todaysMeetings.length} meeting{todaysMeetings.length !== 1 ? 's' : ''} scheduled for today
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {todaysMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No meetings scheduled for today</p>
              <p className="text-gray-400 text-sm mt-2">Your calendar is clear! 📅</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysMeetings.map((lead) => (
                <div
                  key={lead.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Lead Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{lead.fullName}</p>
                          <p className="text-sm text-gray-500">Lead Name</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{lead.phone}</p>
                          <p className="text-sm text-gray-500">Phone Number</p>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.meetingDate ? formatDate(lead.meetingDate) : formatDate(lead.followUpDate)}
                            {' at '}
                            {lead.meetingTime ? formatTime(lead.meetingTime) : formatTime(lead.followUpTime)}
                          </p>
                          <p className="text-sm text-gray-500">Meeting Date & Time</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.meetingAssignedUserName || lead.assignedUserName || 'Unassigned'}
                          </p>
                          <p className="text-sm text-gray-500">Meeting By</p>
                        </div>
                      </div>
                    </div>

                    {/* Requirements & Notes */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 break-words">
                            {lead.requirement || 'No requirement specified'}
                          </p>
                          <p className="text-sm text-gray-500">Requirement</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 break-words">
                            {lead.notes || 'No notes added'}
                          </p>
                          <p className="text-sm text-gray-500">Notes</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Meeting Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.assignedUserName || 'Unassigned'}
                          </p>
                          <p className="text-sm text-gray-500">Assigned User</p>
                        </div>
                      </div>

                      {lead.meetingLocation && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 break-words">
                              {lead.meetingLocation}
                            </p>
                            <p className="text-sm text-gray-500">Location</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Description & Status */}
                  {lead.meetingDescription && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 break-words">
                            {lead.meetingDescription}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Meeting Description</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Meeting
                    </span>
                    {lead.meetingStatus && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.meetingStatus === 'conducted' 
                          ? 'bg-blue-100 text-blue-800' 
                          : lead.meetingStatus === 'not_conducted'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.meetingStatus === 'conducted' ? 'Conducted' : 
                         lead.meetingStatus === 'not_conducted' ? 'Not Conducted' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Total: {todaysMeetings.length} meeting{todaysMeetings.length !== 1 ? 's' : ''}
          </p>
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
