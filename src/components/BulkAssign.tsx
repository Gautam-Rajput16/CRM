import React, { useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface BulkAssignProps {
  selectedLeads: string[];
  setSelectedLeads: (ids: string[]) => void;
}

export const BulkAssign: React.FC<BulkAssignProps> = ({ selectedLeads, setSelectedLeads }) => {
  const { profiles, isLoading } = useProfiles();
 
  
  const [selectedUser, setSelectedUser] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleBulkAssign = async () => {
    if (!selectedUser || selectedLeads.length === 0) return;
    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_user_id: selectedUser,
        status: '-'
      })
      .in('id', selectedLeads);
    setIsAssigning(false);
    if (!error) {
      toast.success('Leads assigned successfully!');
      setSelectedLeads([]);
    } else {
      toast.error('Failed to assign leads');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedUser}
        onChange={e => setSelectedUser(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
        disabled={isLoading || selectedLeads.length === 0}
      >
        <option value="">Assign to...</option>
        {profiles.map(profile => (
          <option key={profile.id} value={profile.id}>
            {profile.name || profile.email}
          </option>
        ))}
      </select>
      <button
        onClick={handleBulkAssign}
        disabled={!selectedUser || selectedLeads.length === 0 || isAssigning}
        className={`px-3 py-1 rounded text-sm ${
          !selectedUser || selectedLeads.length === 0 || isAssigning
            ? 'bg-gray-200 text-gray-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAssigning ? 'Assigning...' : 'Assign'}
      </button>
    </div>
  );
};
