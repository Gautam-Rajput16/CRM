import React, { useState, useRef, useEffect } from 'react';
import { Bell, Phone, User } from 'lucide-react';
import { TodoIcon } from './TodoIcon';
import { TodoModule } from './TodoModule';
import { Lead } from '../types/Lead';

interface NotificationBellProps {
  leads: Lead[];
  currentUserId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ leads, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get today's follow-ups - using current date dynamically
  const getCurrentDate = () => {
    const now = new Date();
    // Ensure we get the local date, not UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getCurrentDate();
  
  const todaysFollowUps = leads.filter(lead => {
    // Only show leads assigned to the current user
    if (lead.assignedUserId !== currentUserId) return false;
    let leadDate = lead.followUpDate;
    if (!leadDate) return false;
    leadDate = String(leadDate);
    if (leadDate.includes('T')) {
      leadDate = leadDate.split('T')[0];
    }
    const isToday = leadDate === today;
    const isFollowUpStatus = lead.status === 'Follow-up' || lead.status === 'Special Follow-up';
    return isToday && isFollowUpStatus;
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
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={`${todaysFollowUps.length} follow-ups today`}
      >
        <Bell className="h-6 w-6" />
        {/* Red Dot Indicator */}
        {todaysFollowUps.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {todaysFollowUps.length > 9 ? '9+' : todaysFollowUps.length}
          </span>
        )}
      </button>
      {/* Todo Icon Button */}
      <button
        onClick={() => setIsTodoOpen(!isTodoOpen)}
        className="relative p-2 ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="My Tasks"
      >
        <TodoIcon className="h-6 w-6" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Today's Follow-ups
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {todaysFollowUps.length} lead{todaysFollowUps.length !== 1 ? 's' : ''} to follow up with today
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {todaysFollowUps.length > 0 ? (
              <div className="p-2">
                {todaysFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>

                    {/* Lead Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lead.fullName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                      </div>
                      {lead.followUpTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Scheduled: {lead.followUpTime}
                        </p>
                      )}
                      {lead.notes && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                          <span className="font-medium">Notes:</span> {lead.notes}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No follow-ups scheduled for today</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up! 🎉</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {todaysFollowUps.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-600 text-center">
                Click on phone numbers to call directly
              </p>
            </div>
          )}
        </div>
      )}
      {/* Todo Dropdown/Modal */}
      {isTodoOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <TodoModule userId={currentUserId} />
        </div>
      )}
    </div>
  );
};
