import React, { useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, Filter } from 'lucide-react';

interface AssignmentPanelProps {
  selectedLeads: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({ 
  selectedLeads, 
  onClearSelection,
  onRefresh 
}) => {
  const { profiles, isLoading } = useProfiles();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  const handleBulkAssign = async () => {
    if (!selectedEmployee || selectedLeads.length === 0) return;
    
    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_user_id: selectedEmployee,
        status: '-'
      })
      .in('id', selectedLeads);
    
    setIsAssigning(false);
    
    if (!error) {
      const employeeName = profiles.find(p => p.id === selectedEmployee)?.name || 'Employee';
      toast.success(`${selectedLeads.length} lead(s) assigned to ${employeeName}`);
      onClearSelection();
      onRefresh();
    } else {
      toast.error('Failed to assign leads');
    }
  };

  const handleBulkUnassign = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ assigned_user_id: null })
      .in('id', selectedLeads);
    
    setIsAssigning(false);
    
    if (!error) {
      toast.success(`${selectedLeads.length} lead(s) unassigned`);
      onClearSelection();
      onRefresh();
    } else {
      toast.error('Failed to unassign leads');
    }
  };

  if (selectedLeads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Assignment</h3>
          <p className="text-gray-500 mb-4">
            Select one or more leads to assign them to employees quickly.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showUnassignedOnly
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              {showUnassignedOnly ? 'Show All' : 'Show Unassigned Only'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Assign {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}
          </h3>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear Selection
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || isAssigning}
            >
              <option value="">Select an employee...</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name || profile.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleBulkAssign}
              disabled={!selectedEmployee || isAssigning}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !selectedEmployee || isAssigning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAssigning ? 'Assigning...' : 'Assign Leads'}
            </button>
            
            <button
              onClick={handleBulkUnassign}
              disabled={isAssigning}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isAssigning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
              }`}
            >
              Unassign
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Use bulk assignment to quickly distribute leads among your team members.
          </p>
        </div>
      </div>
    </div>
  );
};
