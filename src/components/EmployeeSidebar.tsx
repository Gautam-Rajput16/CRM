import React, { useState, useRef, useEffect } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { useLeads } from '../hooks/useLeads';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { 
  User, 
  Users, 
  Mail, 
  Upload, 
  UserPlus, 
  FileSpreadsheet,
  X,
  Shield,
  Crown,
  Briefcase
} from 'lucide-react';

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger?: boolean;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, onClose, refreshTrigger }) => {
  const [profilesRefreshFlag, setProfilesRefreshFlag] = useState(false);
  const [leadsRefreshFlag, setLeadsRefreshFlag] = useState(false);
  
  const { profiles: allProfiles, isLoading } = useProfiles(true, profilesRefreshFlag); // Fetch all users
  const { leads } = useLeads(leadsRefreshFlag);
  
  // Filter to show only users with 'user' role
  const profiles = allProfiles.filter(profile => profile.role === 'user');
  
  // Refresh data when the sidebar opens or when refreshTrigger changes
  useEffect(() => {
    if (isOpen || refreshTrigger !== undefined) {
      setProfilesRefreshFlag(prev => !prev);
      setLeadsRefreshFlag(prev => !prev);
    }
  }, [isOpen, refreshTrigger]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get role badge information
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { icon: <Crown className="h-3 w-3" />, label: 'Admin', color: 'bg-purple-100 text-purple-800' };
      case 'team_leader':
        return { icon: <Shield className="h-3 w-3" />, label: 'Team Leader', color: 'bg-blue-100 text-blue-800' };
      case 'sales_executive':
        return { icon: <Briefcase className="h-3 w-3" />, label: 'Sales Executive', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: <User className="h-3 w-3" />, label: 'User', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get employee stats
  const getEmployeeStats = (employeeId: string) => {
    const employeeLeads = leads.filter(lead => lead.assignedUserId === employeeId);
    return {
      total: employeeLeads.length,
      pending: employeeLeads.filter(lead => lead.status === '-').length,
      followUp: employeeLeads.filter(lead => lead.status === 'Follow-up').length,
      confirmed: employeeLeads.filter(lead => lead.status === 'Confirmed').length,
      notConnected: employeeLeads.filter(lead => lead.status === 'Not Connected').length,
      interested: employeeLeads.filter(lead => lead.status === 'Interested').length,
      notInterested: employeeLeads.filter(lead => lead.status === 'Not - Interested').length,
      meeting: employeeLeads.filter(lead => lead.status === 'Meeting').length,
    };
  };

  // Import leads for specific employee
  const handleImportForEmployee = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEmployee) return;
    
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

          setIsAssigning(true);
          let successCount = 0;

          for (const row of jsonData) {
            const currentDate = new Date().toISOString().split('T')[0];
            
            // Create lead with assignment to selected employee
            const { error } = await supabase
              .from('leads')
              .insert({
                full_name: row['Lead Name'] || row['Name'] || row['Full Name'] || '',
                phone: row['Lead Phone Number'] || row['Phone'] || row['Phone Number'] || '',
                status: row['Lead Status'] || row['Status'] || '-',
                follow_up_date: row['Follow-up Date'] || currentDate,
                follow_up_time: row['Follow-up Time'] || '09:00',
                notes: row['Notes'] || row['Note'] || '',
                assigned_user_id: selectedEmployee.id,
                user_id: selectedEmployee.id // Creator ID
              });

            if (!error) {
              successCount++;
            }
          }

          setIsAssigning(false);
          toast.success(`${successCount} leads imported and assigned to ${selectedEmployee.name || selectedEmployee.email}`);
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          setIsAssigning(false);
          toast.error('Error processing file. Please check the file format.');
          console.error('Import error:', error);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      setIsAssigning(false);
      toast.error('Error importing file. Please try again.');
      console.error('Import error:', error);
    }
  };

  // Assign all unassigned leads to selected employee
  const handleAssignAllUnassigned = async () => {
    if (!selectedEmployee) return;

    const unassignedLeads = leads.filter(lead => !lead.assignedUserId);
    if (unassignedLeads.length === 0) {
      toast('No unassigned leads found', { icon: 'ℹ️' });
      return;
    }

    setIsAssigning(true);
    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_user_id: selectedEmployee.id,
        status: '-'
      })
      .in('id', unassignedLeads.map(lead => lead.id));

    setIsAssigning(false);
    
    if (!error) {
      toast.success(`${unassignedLeads.length} unassigned leads assigned to ${selectedEmployee.name || selectedEmployee.email}`);
    } else {
      toast.error('Failed to assign leads');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Employee List */}
          {!selectedEmployee ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Employee</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading employees...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map(profile => {
                    const stats = getEmployeeStats(profile.id);
                    const roleBadge = getRoleBadge(profile.role || 'user');
                    return (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedEmployee(profile)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {profile.name || profile.email}
                              </p>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                                {roleBadge.icon}
                                {roleBadge.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {stats.total} leads assigned
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-1">
                              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Follow-up"></span>
                              <span className="inline-block w-2 h-2 bg-green-400 rounded-full" title="Confirmed"></span>
                              <span className="inline-block w-2 h-2 bg-red-400 rounded-full" title="Not Connected"></span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Employee Details */
            <div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Back to Employee List
              </button>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedEmployee.name || 'Employee'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedEmployee.role || 'user').color}`}>
                        {getRoleBadge(selectedEmployee.role || 'user').icon}
                        {getRoleBadge(selectedEmployee.role || 'user').label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {selectedEmployee.email}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const stats = getEmployeeStats(selectedEmployee.id);
                    return (
                      <>
                        <div className="bg-white rounded p-3 text-center col-span-2">
                          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                          <div className="text-xs text-gray-500">Total Leads</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-gray-600">{stats.pending}</div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-yellow-600">{stats.followUp}</div>
                          <div className="text-xs text-gray-500">Follow-up</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-green-600">{stats.confirmed}</div>
                          <div className="text-xs text-gray-500">Confirmed</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-red-600">{stats.notConnected}</div>
                          <div className="text-xs text-gray-500">Not Connected</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-blue-600">{stats.interested}</div>
                          <div className="text-xs text-gray-500">Interested</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-orange-600">{stats.notInterested}</div>
                          <div className="text-xs text-gray-500">Not - Interested</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-purple-600">{stats.meeting}</div>
                          <div className="text-xs text-gray-500">Meeting</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Lead Assignment Actions</h4>
                
                {/* Import Leads for Employee */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">Import & Assign Leads</h5>
                      <p className="text-sm text-gray-600">Upload Excel file and auto-assign to this employee</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportForEmployee}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAssigning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {isAssigning ? 'Importing...' : 'Import Leads'}
                  </button>
                </div>

                {/* Assign All Unassigned */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">Assign All Unassigned Leads</h5>
                      <p className="text-sm text-gray-600">
                        Assign all currently unassigned leads to this employee
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAssignAllUnassigned}
                    disabled={isAssigning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isAssigning ? 'Assigning...' : `Assign All (${leads.filter(l => !l.assignedUserId).length})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
