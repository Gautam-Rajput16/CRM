import React from 'react';
import { AlertTriangle, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Lead } from '../../types/Lead';

interface OverdueFollowUpsCardProps {
  leads: Lead[];
  onClick?: () => void;
  currentUserId?: string;
  userRole?: string;
}

export const OverdueFollowUpsCard: React.FC<OverdueFollowUpsCardProps> = ({
  leads,
  onClick,
  currentUserId,
  userRole,
}) => {
  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0];
  
  // Filter overdue follow-ups
  const overdueFollowUps = leads.filter(lead => {
    // Only consider leads with "Follow-up" or "Special Follow-up" status
    if (lead.status !== 'Follow-up' && lead.status !== 'Special Follow-up') return false;
    
    // Role-based filtering
    if (userRole === 'sales_executive') {
      // Sales executives can only see leads assigned to them
      if (lead.assignedUserId !== currentUserId) return false;
    }
    
    // Check if follow-up date is in the past
    if (!lead.followUpDate) return false;
    
    const followUpDate = new Date(lead.followUpDate).toISOString().split('T')[0];
    return followUpDate < today;
  });

  const overdueCount = overdueFollowUps.length;
  
  // Calculate days overdue for the most overdue item
  const getMostOverdueDays = () => {
    if (overdueFollowUps.length === 0) return 0;
    
    const mostOverdue = overdueFollowUps.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.followUpDate);
      const currentDate = new Date(current.followUpDate);
      return currentDate < oldestDate ? current : oldest;
    });
    
    const daysDiff = Math.floor(
      (new Date(today).getTime() - new Date(mostOverdue.followUpDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    return daysDiff;
  };

  const mostOverdueDays = getMostOverdueDays();

  return (
    <div 
      className={`rounded-lg shadow-sm border p-6 transition-all duration-200 ${
        overdueCount > 0 
          ? 'bg-red-50 border-red-200' 
          : 'bg-white border-gray-100'
      } ${onClick && overdueCount > 0 ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
      onClick={onClick && overdueCount > 0 ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Overdue Follow-ups</h3>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${
            overdueCount > 0 
              ? 'bg-red-100' 
              : 'bg-gray-100'
          }`}>
            {overdueCount > 0 ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-gray-500" />
            )}
          </div>
          {onClick && overdueCount > 0 && (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      <div className="text-center">
        <div className={`text-4xl font-bold mb-2 ${
          overdueCount > 0 
            ? 'text-red-600' 
            : 'text-gray-400'
        }`}>
          {overdueCount}
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {overdueCount === 1 ? 'Overdue Follow-up' : 'Overdue Follow-ups'}
        </div>
        
        {overdueCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-center text-sm text-red-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                Oldest: {mostOverdueDays} day{mostOverdueDays !== 1 ? 's' : ''} overdue
              </span>
            </div>
            
            {/* Urgency indicator */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              mostOverdueDays >= 7 
                ? 'bg-red-100 text-red-800' 
                : mostOverdueDays >= 3
                ? 'bg-orange-100 text-orange-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {mostOverdueDays >= 7 
                ? '🚨 Critical' 
                : mostOverdueDays >= 3
                ? '⚠️ High Priority'
                : '📅 Needs Attention'
              }
            </div>
          </div>
        )}
        
        {overdueCount === 0 && (
          <div className="text-sm text-green-600 font-medium">
            ✅ All follow-ups are up to date!
          </div>
        )}
        
        {onClick && overdueCount > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Click to view details
          </div>
        )}
      </div>
      
      {/* Quick stats */}
      {overdueCount > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="text-xs text-gray-600 text-center">
            <span className="font-medium text-red-600">{overdueCount}</span> of{' '}
            <span className="font-medium">
              {leads.filter(lead => {
                // Include both Follow-up and Special Follow-up statuses
                if (lead.status !== 'Follow-up' && lead.status !== 'Special Follow-up') return false;
                
                // Apply same role-based filtering for total count
                if (userRole === 'sales_executive') {
                  if (lead.assignedUserId !== currentUserId) return false;
                }
                
                return true;
              }).length}
            </span>{' '}
            follow-up leads are overdue
          </div>
        </div>
      )}
    </div>
  );
};
