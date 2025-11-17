import React, { useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { User, ChevronDown, Users } from 'lucide-react';

interface QuickAssignProps {
  leadId: string;
  currentAssignedUserId?: string;
  currentAssignedUserName?: string;
  onAssignmentChange?: () => void;
}

export const QuickAssign: React.FC<QuickAssignProps> = ({ 
  leadId, 
  currentAssignedUserId, 
  currentAssignedUserName,
  onAssignmentChange 
}) => {
  const { profiles, isLoading } = useProfiles();
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async (userId: string, userName: string) => {
    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_user_id: userId,
        status: '-'
      })
      .eq('id', leadId);
    
    setIsAssigning(false);
    setIsOpen(false);
    
    if (!error) {
      toast.success(`Lead assigned to ${userName}`);
      onAssignmentChange?.();
    } else {
      toast.error('Failed to assign lead');
    }
  };

  const handleUnassign = async () => {
    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ assigned_user_id: null })
      .eq('id', leadId);
    
    setIsAssigning(false);
    setIsOpen(false);
    
    if (!error) {
      toast.success('Lead unassigned');
      onAssignmentChange?.();
    } else {
      toast.error('Failed to unassign lead');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isAssigning}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentAssignedUserId
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <User className="h-4 w-4" />
        <span className="truncate max-w-24">
          {isAssigning ? 'Updating...' : currentAssignedUserName || 'Unassigned'}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {currentAssignedUserId && (
              <>
                <button
                  onClick={handleUnassign}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Unassign
                </button>
                <div className="border-t border-gray-100" />
              </>
            )}
            
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleAssign(profile.id, profile.name || profile.email)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  profile.id === currentAssignedUserId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <User className="h-4 w-4" />
                <span className="truncate">{profile.name || profile.email}</span>
                {profile.id === currentAssignedUserId && (
                  <span className="ml-auto text-xs text-blue-500">Current</span>
                )}
              </button>
            ))}
            
            {profiles.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No employees available
              </div>
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
