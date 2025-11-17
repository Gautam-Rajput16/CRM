import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { useUserLookup } from '../hooks/useUserLookup';
import { LeadsTable } from './LeadsTable';
import { Upload, BarChart3, ClipboardList } from 'lucide-react';
import { AdminTodoPanel } from './AdminTodoPanel';
import { SearchAndFilter } from './SearchAndFilter';
import { toast } from 'react-hot-toast';
import { Lead } from '../types/Lead';
import { BulkAssign } from './BulkAssign';
import { AssignmentPanel } from './AssignmentPanel';
import { EmployeeSidebar } from './EmployeeSidebar';
import { AnalyticsDashboard } from './AnalyticsDashboard';

const AdminPanel: React.FC = () => {
  const {
    leads,
    isLoading,
    updateLeadStatus,
    updateLeadNotes,
    updateLeadRequirement,
    updateMeetingDetails,
    deleteLead,
    addLead,
    addFollowUpUpdate,
  } = useLeads();
  const { user } = useAuth();

  // Filter states
  const [leadFilter, setLeadFilter] = useState<'all' | 'mine' | 'others'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // View state
  const [currentView, setCurrentView] = useState<'leads' | 'analytics' | 'todos'>('leads');
  
  // User lookup states
  const [userIdToLookup, setUserIdToLookup] = useState('');
  const [userEmailResult, setUserEmailResult] = useState<string | null>(null);
  const { lookupUserEmail, isLoading: isLookupLoading } = useUserLookup();

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUserLookup = async () => {
    if (!userIdToLookup.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    const result = await lookupUserEmail(userIdToLookup);
    if (result.email) {
      setUserEmailResult(result.email);
      toast.success('User found!');
    } else {
      setUserEmailResult(null);
      toast.error('User not found');
    }
  };
  
  // Bulk action states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);

  // Export to Excel handler
  const handleExportToExcel = () => {
    // Prepare data for Excel
    const data = filteredLeads.map(lead => ({
      'Lead Name': lead.fullName,
      'Lead Phone Number': lead.phone,
      'Lead Status': lead.status,
      'Follow-up Date': lead.followUpDate,
      'Follow-up Time': lead.followUpTime,
      'Notes': lead.notes,
      'Created At': new Date(lead.createdAt).toLocaleString(),
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    // Export to Excel file
    XLSX.writeFile(workbook, 'Leads.xlsx');
  };

  // Import handler
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

          // Process each row and create leads
          for (const row of jsonData) {
            const currentDate = new Date().toISOString().split('T')[0];
            const lead = {
              fullName: (row['Lead Name'] || row['Name'] || row['Full Name'] || '') as string,
              phone: (row['Lead Phone Number'] || row['Phone'] || row['Phone Number'] || '') as string,
              status: (row['Lead Status'] || row['Status'] || 'Follow-up') as Lead['status'],
              followUpDate: (row['Follow-up Date'] || currentDate) as string, // Default to current date if no date provided
              followUpTime: (row['Follow-up Time'] || '09:00') as string, // Default to 9 AM if no time provided
              notes: (row['Notes'] || row['Note'] || '') as string,
              requirement: (row['Requirement'] || '') as string,
              followUpUpdates: [],
            };

            // Validate required fields
            if (!lead.fullName || !lead.phone) {
              toast.error('Some leads are missing required fields (Name, Phone)');
              continue;
            }

            // Validate status
            if (!['-', 'Follow-up', 'Confirmed', 'Not Connected', 'Interested', 'Not - Interested', 'Meeting'].includes(lead.status)) {
              lead.status = '-';
            }

            await addLead(lead);
          }

          toast.success('Leads imported successfully!');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          toast.error('Error processing file. Please check the file format.');
          console.error('Import error:', error);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error('Error importing file. Please try again.');
      console.error('Import error:', error);
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    } else {
      setSelectedLeads(prev => [...prev, leadId]);
    }
  };

  const handleBulkAction = async () => {
    if (!selectedLeads.length) return;

    try {
      switch (bulkAction) {
        case 'delete':
          await Promise.all(selectedLeads.map(id => deleteLead(id)));
          toast.success('Selected leads deleted successfully');
          break;
        case 'status-follow-up':
          await Promise.all(selectedLeads.map(id => 
            updateLeadStatus(id, 'Follow-up')
          ));
          toast.success('Status updated to Follow-up');
          break;
        case 'status-confirmed':
          await Promise.all(selectedLeads.map(id => 
            updateLeadStatus(id, 'Confirmed')
          ));
          toast.success('Status updated to Confirmed');
          break;
        case 'status-not-connected':
          await Promise.all(selectedLeads.map(id => 
            updateLeadStatus(id, 'Not Connected')
          ));
          toast.success('Status updated to Not Connected');
          break;
      }
      setSelectedLeads([]);
      setBulkAction('');
    } catch (error) {
      toast.error('Failed to perform bulk action');
      console.error('Bulk action error:', error);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    const matchesOwnership = leadFilter === 'all' || 
      (leadFilter === 'mine' ? lead.userId === user?.id : lead.userId !== user?.id);

    return matchesSearch && matchesStatus && matchesOwnership;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Mini CRM</h2>
          <p className="text-gray-600">Manage your leads efficiently</p>
        </div>
        <div className="flex items-center gap-4">
          <span>{user?.name}</span>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <button 
              className={`px-3 py-1 rounded ${currentView === 'leads' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setCurrentView('leads')}
            >
              Leads
            </button>
            <button 
              className={`px-3 py-1 rounded flex items-center gap-2 ${currentView === 'analytics' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setCurrentView('analytics')}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button 
              className={`px-3 py-1 rounded flex items-center gap-2 ${currentView === 'todos' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setCurrentView('todos')}
            >
              <ClipboardList className="h-4 w-4" />
              Todos
            </button>
          </div>
          
          {currentView === 'leads' && (
            <>
              <button 
                className={`px-3 py-1 rounded ${leadFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setLeadFilter('all')}
              >All Leads</button>
              <button 
                className={`px-3 py-1 rounded ${leadFilter === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setLeadFilter('mine')}
              >My Leads</button>
              <button 
                className={`px-3 py-1 rounded ${leadFilter === 'others' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setLeadFilter('others')}
              >Other Users' Leads</button>
            </>
          )}
          
          <div className="flex items-center gap-2">
            {/* Import Button */}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="file-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                title="Import leads from Excel or CSV"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
            </div>

            {/* Export to Excel Button */}
            <button
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              onClick={handleExportToExcel}
              title="Export leads to Excel"
            >
              Export
            </button>
            
            {/* Employee Management Button */}
            <button
              onClick={() => setShowEmployeeSidebar(true)}
              className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              title="Manage employees and assign leads"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Employees
            </button>
          </div>
        </div>
      </div>

      {currentView === 'leads' && (
        <>
          {/* User Lookup Section */}
          <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-3">User Lookup</h3>
            <div className="flex items-center gap-4">
              <div className="flex-grow max-w-md">
                <input
                  type="text"
                  value={userIdToLookup}
                  onChange={(e) => setUserIdToLookup(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button
                onClick={handleUserLookup}
                disabled={isLookupLoading}
                className={`px-4 py-2 rounded ${
                  isLookupLoading
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLookupLoading ? 'Looking up...' : 'Look up'}
              </button>
            </div>
            {userEmailResult && (
              <div className="mt-3 text-sm">
                <span className="font-medium">User Name:</span>{' '}
                <span className="text-blue-600">{userEmailResult}</span>
              </div>
            )}
          </div>

          {/* Search & Filter Section */}
          <div className="mb-6">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Assignment Panel */}
          <div className="mb-6">
            <AssignmentPanel 
              selectedLeads={selectedLeads}
              onClearSelection={() => setSelectedLeads([])}
              onRefresh={() => window.location.reload()}
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                disabled={selectedLeads.length === 0}
              >
                <option value="">Bulk Actions</option>
                <option value="delete">Delete Selected</option>
                <option value="status-follow-up">Mark as Follow-up</option>
                <option value="status-confirmed">Mark as Confirmed</option>
                <option value="status-not-connected">Mark as Not Connected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || selectedLeads.length === 0}
                className={`px-3 py-1 rounded text-sm ${
                  !bulkAction || selectedLeads.length === 0
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Apply
              </button>
              {/* Bulk Assignment Dropdown */}
              <BulkAssign selectedLeads={selectedLeads} setSelectedLeads={setSelectedLeads} />
            </div>

            {/* Leads Count */}
            <div className="flex items-center text-gray-600">
              <span className="mr-2">👥</span>
              <span>Leads ({filteredLeads.length})</span>
              {selectedLeads.length > 0 && (
                <span className="ml-2 text-sm">
                  ({selectedLeads.length} selected)
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {currentView === 'analytics' && (
        <AnalyticsDashboard leads={leads} isLoading={isLoading} />
      )}
      {currentView === 'todos' && (
        <AdminTodoPanel />
      )}
      {currentView !== 'analytics' && currentView !== 'todos' && (
        <>
          {isLoading ? (
            <div>Loading leads...</div>
          ) : (
            <div className="space-y-4">
              {/* Table View */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <LeadsTable 
                  leads={filteredLeads}
                  onUpdateStatus={(id, status) => updateLeadStatus(id, status)}
                  onUpdateNotes={(id, notes) => updateLeadNotes(id, notes)}
                  onUpdateRequirement={(id, requirement) => updateLeadRequirement(id, requirement)}
                  onUpdateMeetingDetails={updateMeetingDetails}
                  onAddFollowUpUpdate={addFollowUpUpdate}
                  onDelete={deleteLead}
                  selectedLeads={selectedLeads}
                  onSelectLead={handleSelectLead}
                  currentUser={user}
                  onAssignUser={async (leadId, userId) => {
                    // Update in Supabase
                    const { supabase } = await import('../lib/supabase');
                    const { error } = await supabase
                      .from('leads')
                      .update({ assigned_user_id: userId })
                      .eq('id', leadId);
                    if (!error) {
                      // Optionally, update UI state or refetch leads
                      toast.success('Lead assignment updated');
                      // Optionally, you could refetch leads here
                    } else {
                      toast.error('Failed to assign lead');
                    }
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
      {/* Employee Sidebar */}
      <EmployeeSidebar 
        isOpen={showEmployeeSidebar}
        onClose={() => setShowEmployeeSidebar(false)}
      />
    </div>
  );
};

export default AdminPanel;
