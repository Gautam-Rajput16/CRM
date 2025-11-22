import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Phone, User, MapPin, Clock } from 'lucide-react';
import { Lead } from '../types/Lead';

interface MeetingNotificationBellProps {
  leads: Lead[];
  currentUserId: string;
}

export const MeetingNotificationBell: React.FC<MeetingNotificationBellProps> = ({ leads, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get today's meetings - using current date dynamically
  const getCurrentDate = () => {
    const now = new Date();
    // Ensure we get the local date, not UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getCurrentDate();
  
  const todaysMeetings = leads.filter(lead => {
    // RESTRICTIVE FILTERING: Only show meetings assigned to current user
    // Check if lead is assigned to current user (either assignedUserId or meetingAssignedUserId)
    const isAssignedToUser = lead.assignedUserId === currentUserId || lead.meetingAssignedUserId === currentUserId;
    if (!isAssignedToUser) return false;
    
    // Check if lead has meeting date OR is a Meeting status lead
    let meetingDate = lead.meetingDate;
    
    // If no meeting date but status is "Meeting", check follow-up date
    if (!meetingDate && lead.status === 'Meeting') {
      meetingDate = lead.followUpDate;
    }
    
    if (!meetingDate) return false;
    
    // Normalize the date format
    meetingDate = String(meetingDate);
    if (meetingDate.includes('T')) {
      meetingDate = meetingDate.split('T')[0];
    }
    
    const isToday = meetingDate === today;
    return isToday;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Calendar Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex flex-col items-center p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={`${todaysMeetings.length} meetings today`}
      >
        <Calendar className="h-6 w-6" />
        {/* Red Dot Indicator */}
        {todaysMeetings.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {todaysMeetings.length > 9 ? '9+' : todaysMeetings.length}
          </span>
        )}
        <span className="mt-0.5 text-[10px] font-medium text-gray-700 md:hidden">
          Meetings
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Today's Meetings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {todaysMeetings.length} meeting{todaysMeetings.length !== 1 ? 's' : ''} scheduled for today
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {todaysMeetings.length > 0 ? (
              <div className="p-2">
                {todaysMeetings.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                    </div>

                    {/* Meeting Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lead.fullName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <Phone className="h-3 w-3" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                      </div>
                      
                      {lead.meetingTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Clock className="h-3 w-3" />
                          <span>Time: {lead.meetingTime}</span>
                        </div>
                      )}
                      
                      {lead.meetingLocation && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <MapPin className="h-3 w-3" />
                          <span>Location: {lead.meetingLocation}</span>
                        </div>
                      )}
                      
                      {lead.meetingDescription && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border-l-2 border-green-200">
                          <span className="font-medium">Description:</span> {lead.meetingDescription}
                        </p>
                      )}
                      
                      {lead.requirement && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Requirement:</span> {lead.requirement}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        lead.meetingStatus === 'conducted' 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : lead.meetingStatus === 'not_conducted'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {lead.meetingStatus === 'conducted' 
                          ? 'Conducted'
                          : lead.meetingStatus === 'not_conducted'
                          ? 'Not Conducted'
                          : 'Pending'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No meetings scheduled for today</p>
                <p className="text-xs text-gray-400 mt-1">Your schedule is clear! 📅</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {todaysMeetings.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-600 text-center">
                Click on phone numbers to call directly
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
