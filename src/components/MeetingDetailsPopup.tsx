import React from 'react';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { Lead } from '../types/Lead';

interface MeetingDetailsPopupProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export const MeetingDetailsPopup: React.FC<MeetingDetailsPopupProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null;

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return { date: '-', time: '-' };
    try {
      const date = new Date(`${dateString}T${timeString || '00:00'}`);
      if (isNaN(date.getTime())) return { date: '-', time: '-' };
      
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = timeString ? date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '';
      
      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: '-', time: '-' };
    }
  };

  const dateTime = formatDateTime(lead.meetingDate, lead.meetingTime);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Lead Name */}
            <div className="text-center pb-4 border-b border-gray-100">
              <h4 className="text-xl font-medium text-gray-900">{lead.fullName}</h4>
              <p className="text-sm text-gray-500">{lead.phone}</p>
            </div>
            
            {/* Meeting Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Date</p>
                <p className="text-sm text-gray-600">{dateTime.date}</p>
              </div>
            </div>
            
            {/* Meeting Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Time</p>
                <p className="text-sm text-gray-600">{dateTime.time || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Meeting Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Location</p>
                <p className="text-sm text-gray-600">{lead.meetingLocation || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Meeting Description */}
            {lead.meetingDescription && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {lead.meetingDescription}
                </p>
              </div>
            )}
            
            {/* Meeting Status */}
            {lead.meetingStatus && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lead.meetingStatus === 'conducted' 
                      ? 'bg-green-100 text-green-800' 
                      : lead.meetingStatus === 'not_conducted'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lead.meetingStatus === 'conducted' 
                      ? 'Conducted' 
                      : lead.meetingStatus === 'not_conducted'
                      ? 'Not Conducted'
                      : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <div className="flex gap-3">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Edit Meeting
                </button>
              )}
              <button
                onClick={onClose}
                className={`${onEdit ? 'flex-1' : 'w-full'} bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
