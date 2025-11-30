import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  UserPlus,
  TrendingUp,
  Database,
  LogOut,
  FileText,
  Info,
  Shield,
  CheckCircle,
  Upload,
  Download,
  Menu,
  X,
  Calendar,
  ListTodo,
  Clock
} from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfiles';
import { useTaskStatusNotifications } from '../hooks/useTaskStatusNotifications';
import { TaskStatusNotificationBell } from './TaskStatusNotificationBell';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ActivityAnalyticsDashboard } from './analytics/ActivityAnalyticsDashboard';
import { EmployeeAnalyticsDashboard } from './analytics/EmployeeAnalyticsDashboard';
import { PerformanceCalendarDashboard } from './analytics/PerformanceCalendarDashboard';
import { AttendanceReportDashboard } from './AttendanceReportDashboard';
import { LeadsTable } from './LeadsTable';
import { LeadForm } from './LeadForm';
import { SearchAndFilter } from './SearchAndFilter';
import { AssignmentPanel } from './AssignmentPanel';
import { EmployeeSidebar } from './EmployeeSidebar';
import { UserManagement } from './UserManagement';
import { MeetingsView } from './MeetingsView';
import { DuplicateConfirmationModal } from './DuplicateConfirmationModal';
import { TodayFollowUpsModal } from './TodayFollowUpsModal';
import { TodayMeetingsModal } from './TodayMeetingsModal';
import { TaskManagement } from './TaskManagement';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Lead } from '../types/Lead';
import { supabase } from '../lib/supabase';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize activeSection from localStorage or default to 'dashboard'
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminDashboard_activeSection');
      // We'll validate this after sidebar items are available
      return saved || 'dashboard';
    }
    return 'dashboard';
  });

  const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTodayFollowUpsModal, setShowTodayFollowUpsModal] = useState(false);
  const [showTodayMeetingsModal, setShowTodayMeetingsModal] = useState(false);

  // Refresh flags for data fetching
  const [leadsRefreshFlag, setLeadsRefreshFlag] = useState(false);
  const [profilesRefreshFlag, setProfilesRefreshFlag] = useState(false);

  const {
    leads,
    isLoading,
    addLead,
    addLeadWithDuplicateCheck,
    updateLeadStatus,
    updateLeadNotes,
    updateLeadRequirement,
    updateLeadFollowUp,
    updateMeetingDetails,
    deleteLead,
    checkDuplicatePhone,
    addFollowUpUpdate,
    addMeetingSummary
  } = useLeads(leadsRefreshFlag);

  // Unified analytics for dashboard cards
  const analyticsData = useAnalytics(leads);

  const { user } = useAuth();
  const { profiles: allProfiles } = useProfiles(true, profilesRefreshFlag);

  // Check user roles
  const currentUserProfile = allProfiles.find(profile => profile.id === user?.id);

  // Enable task status notifications for admins
  const isAdminOrTeamLeader = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'team_leader';
  useTaskStatusNotifications(user?.id, isAdminOrTeamLeader);
  const isCurrentUserAdmin = currentUserProfile?.role === 'admin';
  const isCurrentUserTeamLeader = currentUserProfile?.role === 'team_leader';
  const isCurrentUserSalesExecutive = currentUserProfile?.role === 'sales_executive';
  const canManageUsers = isCurrentUserAdmin || isCurrentUserTeamLeader;
  const canViewAllLeads = isCurrentUserAdmin || isCurrentUserTeamLeader;

  // Filter states
  const [leadFilter, setLeadFilter] = useState<'all' | 'mine' | 'others'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Bulk action states
  const [bulkAction, setBulkAction] = useState<string>('');

  // Duplicate confirmation modal states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [pendingLead, setPendingLead] = useState<Omit<Lead, 'id' | 'createdAt' | 'userId'> | null>(null);
  const [importQueue, setImportQueue] = useState<Array<{ lead: Omit<Lead, 'id' | 'createdAt' | 'userId'>; rowIndex: number }>>([]);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);

  // Refresh data when switching sections
  const refreshData = useCallback(() => {
    setLeadsRefreshFlag(prev => !prev);
    setProfilesRefreshFlag(prev => !prev);
  }, []);

  // Refresh data when active section changes to ensure fresh data
  useEffect(() => {
    refreshData();
  }, [activeSection, refreshData]);

  // Persist active section to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDashboard_activeSection', activeSection);
    }
  }, [activeSection]);

  const handleAssignMeeting = async (leadId: string, userId: string) => {
    try {
      const selectedProfile = allProfiles.find(p => p.id === userId);
      const { error } = await supabase
        .from('leads')
        .update({
          meeting_assigned_user_id: userId,
          meeting_assigned_user_name: selectedProfile?.name || null
        })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      toast.success(`Meeting assigned to ${selectedProfile?.name || 'sales executive'} successfully`);
      // Trigger leads refresh
      setLeadsRefreshFlag(flag => !flag);
    } catch (error: any) {
      console.error('Assign meeting error:', error);
      toast.error(error.message || 'Failed to assign meeting. Please try again.');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (!isCurrentUserAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    if (userId === user?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${userName || 'Unknown'}"? This action will completely remove the user from both the database and authentication. All leads assigned to this user will be unassigned. This cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // First, clean up all foreign key references to this user
      toast.loading('Cleaning up user references...', { id: 'delete-user' });

      // Update leads where this user is the creator (set to current admin user)
      const { error: updateCreatorError } = await supabase
        .from('leads')
        .update({ user_id: user?.id })
        .eq('user_id', userId);

      if (updateCreatorError) {
        console.warn('Error updating lead creators:', updateCreatorError);
      }

      // Remove assignments where this user is assigned to leads
      const { error: updateAssignedError } = await supabase
        .from('leads')
        .update({
          assigned_user_id: null,
          assigned_user_name: null
        })
        .eq('assigned_user_id', userId);

      if (updateAssignedError) {
        console.warn('Error removing lead assignments:', updateAssignedError);
      }

      // Remove meeting assignments where this user is assigned to meetings
      const { error: updateMeetingError } = await supabase
        .from('leads')
        .update({
          meeting_assigned_user_id: null,
          meeting_assigned_user_name: null
        })
        .eq('meeting_assigned_user_id', userId);

      if (updateMeetingError) {
        console.warn('Error removing meeting assignments:', updateMeetingError);
      }

      // Update follow-up updates created by this user (set to current admin user)
      const { error: updateFollowUpError } = await supabase
        .from('follow_up_updates')
        .update({ user_id: user?.id })
        .eq('user_id', userId);

      if (updateFollowUpError) {
        console.warn('Error updating follow-up updates:', updateFollowUpError);
      }

      // Update meeting summaries created by this user (set to current admin user)
      const { error: updateMeetingSummaryError } = await supabase
        .from('meeting_summaries')
        .update({ user_id: user?.id })
        .eq('user_id', userId);

      if (updateMeetingSummaryError) {
        console.warn('Error updating meeting summaries:', updateMeetingSummaryError);
      }

      toast.loading('Deleting user account...', { id: 'delete-user' });

      // Delete the user profile from the profiles table
      // The database trigger will automatically delete the auth user
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        throw profileDeleteError;
      }

      // Success - the trigger handled auth deletion automatically
      toast.success(`User "${userName || 'Unknown'}" deleted completely from both database and authentication`, { id: 'delete-user' });

      // Refresh profiles list and leads data
      setProfilesRefreshFlag(flag => !flag);
      setLeadsRefreshFlag(flag => !flag);
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(error.message || 'Failed to delete user. Please try again.', { id: 'delete-user' });
    }
  };

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role-based sidebar items
  const getAllSidebarItems = (): SidebarItem[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'leads',
      label: isCurrentUserSalesExecutive ? 'My Leads' : 'Lead Management',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'tasks',
      label: 'Task Management',
      icon: <ListTodo className="h-5 w-5" />
    },
    // Analytics - visible to all roles
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />
    },
    // Activity Analytics - visible to all roles
    {
      id: 'activity-analytics',
      label: 'Activity Tracking',
      icon: <TrendingUp className="h-5 w-5" />
    },
    // Employee Analytics - only for admins and team leaders
    ...(canManageUsers ? [{
      id: 'employee-analytics',
      label: 'Employee Analytics',
      icon: <UserCheck className="h-5 w-5" />
    }] : []),
    // Performance Calendar - only for admins and team leaders
    ...(canManageUsers ? [{
      id: 'performance-calendar',
      label: 'Performance Calendar',
      icon: <Calendar className="h-5 w-5" />
    }] : []),
    // Employees - only for admins and team leaders
    ...(canManageUsers ? [{
      id: 'employees',
      label: 'Employees',
      icon: <Users className="h-5 w-5" />
    }] : []),
    // Attendance Tracking - only for admins and team leaders
    ...(canManageUsers ? [{
      id: 'attendance-tracking',
      label: 'Attendance Tracking',
      icon: <Clock className="h-5 w-5" />
    }] : []),
    // Import/Export - only for admins and team leaders
    ...(canViewAllLeads ? [{
      id: 'import-export',
      label: 'Import/Export',
      icon: <Database className="h-5 w-5" />
    }] : [])
  ];

  const sidebarItems = getAllSidebarItems();

  // Validate and correct activeSection based on available sidebar items
  // Only validate after profiles are loaded to avoid resetting during initial load
  useEffect(() => {
    // Wait for profiles to load before validating
    if (allProfiles.length === 0) return;

    const validSectionIds = sidebarItems.map(item => item.id);
    if (!validSectionIds.includes(activeSection)) {
      // If saved section is not valid for current user role, default to 'dashboard'
      setActiveSection('dashboard');
    }
  }, [sidebarItems, activeSection, allProfiles.length]);

  // Filter leads based on user role
  const filteredLeads = leads.filter(lead => {
    // Sales executives can only see leads assigned to them
    if (isCurrentUserSalesExecutive && lead.assignedUserId !== user?.id) {
      return false;
    }

    const matchesSearch = !searchQuery ||
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

    const matchesOwnership = leadFilter === 'all' ||
      (leadFilter === 'mine' ? lead.userId === user?.id : lead.userId !== user?.id);

    const matchesEmployee =
      !employeeFilter ||
      (employeeFilter === 'unassigned' ? !lead.assignedUserId : lead.assignedUserId === employeeFilter);

    let matchesDate = true;
    if (dateFilter) {
      const createdAt = new Date(lead.createdAt);
      const now = new Date();
      let compareDate = null;
      switch (dateFilter) {
        case '1d':
          compareDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
          break;
        case '7d':
          compareDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15d':
          compareDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          compareDate = new Date(now);
          compareDate.setMonth(compareDate.getMonth() - 1);
          break;
        default:
          compareDate = null;
      }
      if (compareDate) {
        matchesDate = createdAt >= compareDate;
      }
    }

    return matchesSearch && matchesStatus && matchesOwnership && matchesEmployee && matchesDate;
  });


  const handleLogout = async () => {
    // Clear localStorage on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminDashboard_activeSection');
    }

    if (onLogout) {
      await onLogout();
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
        case 'status-special-follow-up':
          await Promise.all(selectedLeads.map(id =>
            updateLeadStatus(id, 'Special Follow-up')
          ));
          toast.success('Status updated to Special Follow-up');
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
    }
  };

  const handleExportToExcel = () => {
    const data = filteredLeads.map(lead => ({
      'Lead Name': lead.fullName,
      'Lead Phone Number': lead.phone,
      'Lead Status': lead.status,
      'Follow-up Date': lead.followUpDate,
      'Follow-up Time': lead.followUpTime,
      'Notes': lead.notes,
      'Requirement': lead.requirement || '',
      'Assigned To': lead.assignedUserName || '',
      'Created At': new Date(lead.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, 'Leads.xlsx');
  };

  const handleDownloadSample = () => {
    // Create sample data with proper format and examples
    const sampleData = [
      {
        'Lead Name': 'John Doe',
        'Lead Phone Number': '9876543210',
        'Lead Status': 'Follow-up',
        'Follow-up Date': '2025-10-05',
        'Follow-up Time': '10:00',
        'Notes': 'Interested in premium package',
        'Requirement': 'Looking for All Seo Package'
      },
      {
        'Lead Name': 'Jane Smith',
        'Lead Phone Number': '9123456789',
        'Lead Status': 'Interested',
        'Follow-up Date': '2025-10-06',
        'Follow-up Time': '14:30',
        'Notes': 'Called twice, very responsive',
        'Requirement': 'Budget under 50L, prefers All Seo Package'
      },
      {
        'Lead Name': 'Mike Johnson',
        'Lead Phone Number': '9988776655',
        'Lead Status': 'Meeting',
        'Follow-up Date': '2025-10-07',
        'Follow-up Time': '11:00',
        'Notes': 'Scheduled site visit',
        'Requirement': 'Looking for All Seo Package'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add some styling to the worksheet

    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Lead Name
      { width: 18 }, // Phone Number
      { width: 15 }, // Status
      { width: 15 }, // Follow-up Date
      { width: 15 }, // Follow-up Time
      { width: 30 }, // Notes
      { width: 40 }  // Requirement
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Leads');
    XLSX.writeFile(workbook, 'Sample_Leads_Template.xlsx');

    toast.success('Sample template downloaded successfully!');
  };

  // Helper function to process next lead in import queue
  const processNextImport = async () => {
    if (currentImportIndex >= importQueue.length) {
      // Import complete
      toast.success(`Import completed! Processed ${importQueue.length} leads.`);
      setImportQueue([]);
      setCurrentImportIndex(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const { lead } = importQueue[currentImportIndex];
    const result = await addLeadWithDuplicateCheck(lead);

    if (result.success) {
      // Lead added successfully, process next
      setCurrentImportIndex(prev => prev + 1);
      setTimeout(processNextImport, 100); // Small delay to prevent overwhelming the UI
    } else if (result.duplicate) {
      // Duplicate found, show confirmation modal
      setDuplicateLead(result.duplicate);
      setPendingLead(lead);
      setShowDuplicateModal(true);
    } else {
      // Error occurred, skip this lead and continue
      toast.error(`Failed to import lead: ${lead.fullName}`);
      setCurrentImportIndex(prev => prev + 1);
      setTimeout(processNextImport, 100);
    }
  };

  // Handle duplicate confirmation modal actions
  const handleDuplicateConfirm = async () => {
    if (pendingLead) {
      // Import the lead anyway (skip duplicate check)
      await addLeadWithDuplicateCheck(pendingLead, true);
    }
    setShowDuplicateModal(false);
    setDuplicateLead(null);
    setPendingLead(null);
    setCurrentImportIndex(prev => prev + 1);
    setTimeout(processNextImport, 100);
  };

  const handleDuplicateSkip = () => {
    setShowDuplicateModal(false);
    setDuplicateLead(null);
    setPendingLead(null);
    setCurrentImportIndex(prev => prev + 1);
    setTimeout(processNextImport, 100);
  };

  const handleDuplicateClose = () => {
    setShowDuplicateModal(false);
    setDuplicateLead(null);
    setPendingLead(null);
    // Stop the import process
    setImportQueue([]);
    setCurrentImportIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import handler with duplicate validation
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

          // Prepare import queue
          const queue: Array<{ lead: Omit<Lead, 'id' | 'createdAt' | 'userId'>; rowIndex: number }> = [];
          let validLeadsCount = 0;
          let invalidLeadsCount = 0;

          // Process each row and validate
          jsonData.forEach((row, index) => {
            const currentDate = new Date().toISOString().split('T')[0];
            const lead = {
              fullName: (row['Lead Name'] || row['Name'] || row['Full Name'] || '').toString().trim(),
              phone: (row['Lead Phone Number'] || row['Phone'] || row['Phone Number'] || '').toString().trim(),
              status: (row['Lead Status'] || row['Status'] || 'Follow-up') as Lead['status'],
              followUpDate: (row['Follow-up Date'] || currentDate) as string,
              followUpTime: (row['Follow-up Time'] || '09:00') as string,
              notes: (row['Notes'] || row['Note'] || '').toString().trim(),
              requirement: (row['Requirement'] || '').toString().trim(),
              followUpUpdates: [],
              meetingDescription: '',
              meetingDate: '',
              meetingTime: '',
              meetingLocation: '',
              meetingSummaries: [],
            };

            // Validate required fields
            if (!lead.fullName || !lead.phone) {
              console.warn(`Row ${index + 1}: Missing required fields (Name: "${lead.fullName}", Phone: "${lead.phone}")`);
              invalidLeadsCount++;
              return;
            }

            // Clean phone number and validate
            const cleanPhone = lead.phone.replace(/[\s\-\(\)\+]/g, '');

            // Validate phone number: must be exactly 10 digits
            if (!/^\d{10}$/.test(cleanPhone)) {
              console.warn(`Row ${index + 1}: Invalid phone number. Must be exactly 10 digits. Found: "${lead.phone}" (cleaned: "${cleanPhone}")`);
              invalidLeadsCount++;
              return;
            }

            // Update lead with cleaned phone number
            lead.phone = cleanPhone;

            // Validate status
            if (!['-', 'Follow-up', 'Special Follow-up', 'Confirmed', 'Not Connected', 'Interested', 'Not - Interested', 'Meeting'].includes(lead.status)) {
              lead.status = '-';
            }

            queue.push({ lead, rowIndex: index + 1 });
            validLeadsCount++;
          });

          if (queue.length === 0) {
            toast.error('No valid leads found in the file. Please check the format and required fields.');
            return;
          }

          if (invalidLeadsCount > 0) {
            toast(`Found ${invalidLeadsCount} invalid leads that will be skipped. Processing ${validLeadsCount} valid leads.`, {
              icon: '⚠️',
              duration: 4000,
            });
          }

          // Start the import process
          setImportQueue(queue);
          setCurrentImportIndex(0);
          toast.success(`Starting import of ${validLeadsCount} leads...`);

          // Begin processing
          setTimeout(processNextImport, 500);

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

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {/* Total Leads */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              {/* Follow-ups */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Follow-ups</p>
                    <p className="text-2xl font-bold text-yellow-600">{analyticsData.statusCounts['Follow-up']}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              {/* Confirmed */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-green-600">{analyticsData.statusCounts['Confirmed']}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Today's Follow-ups */}
              <div
                className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors group"
                onClick={() => setShowTodayFollowUpsModal(true)}
              >
                <div className="text-2xl font-bold text-blue-700">{analyticsData.todaysFollowUps}</div>
                <div className="text-base text-gray-700 mt-2 group-hover:text-blue-800">Today's Follow-ups</div>
                <div className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view details</div>
              </div>
              {/* Today's Meetings */}
              <div
                className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-colors group"
                onClick={() => setShowTodayMeetingsModal(true)}
              >
                <div className="text-2xl font-bold text-green-700">{analyticsData.todaysMeetings}</div>
                <div className="text-base text-gray-700 mt-2 group-hover:text-green-800">Today's Meetings</div>
                <div className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view details</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setActiveSection('leads');
                    refreshData();
                  }}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Manage Leads</p>
                    <p className="text-sm text-gray-600">View and edit all leads</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveSection('analytics');
                    refreshData();
                  }}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">View Analytics</p>
                    <p className="text-sm text-gray-600">Performance insights</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveSection('activity-analytics');
                    refreshData();
                  }}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  <div className="text-left">
                    <p className="font-medium">Activity Tracking</p>
                    <p className="text-sm text-gray-600">Call & status change logs</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Lead Management</h2>
                <div className="flex items-center gap-2">
                  {/* <button 
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
                  >Other Users' Leads</button> */}
                </div>
              </div>

              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                employeeFilter={employeeFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                profiles={allProfiles.filter(profile => profile.role === 'user').map(profile => ({ id: profile.id, name: profile.name }))}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
            </div>

            {/* Lead Form */}
            <LeadForm onAddLead={async (leadData) => {
              const leadWithUpdates = { ...leadData, followUpUpdates: [] };
              const result = await addLeadWithDuplicateCheck(leadWithUpdates);
              if (result.duplicate) {
                setDuplicateLead(result.duplicate);
                setPendingLead(leadWithUpdates);
                setShowDuplicateModal(true);
              }
            }} />

            <AssignmentPanel
              selectedLeads={selectedLeads}
              onClearSelection={() => setSelectedLeads([])}
              onRefresh={refreshData}
            />

            {/* Bulk Actions */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
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
                    <option value="status-special-follow-up">Mark as Special Follow-up</option>
                    <option value="status-confirmed">Mark as Confirmed</option>
                    <option value="status-not-connected">Mark as Not Connected</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || selectedLeads.length === 0}
                    className={`px-3 py-1 rounded text-sm ${!bulkAction || selectedLeads.length === 0
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    Apply
                  </button>
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
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="max-h-[500px] overflow-y-auto">
                <LeadsTable
                  leads={filteredLeads}
                  onUpdateStatus={(id, status) => updateLeadStatus(id, status)}
                  onUpdateNotes={(id, notes) => updateLeadNotes(id, notes)}
                  onUpdateRequirement={(id, requirement) => updateLeadRequirement(id, requirement)}
                  onUpdateMeetingDetails={updateMeetingDetails}
                  onAddFollowUpUpdate={addFollowUpUpdate}
                  onAddMeetingSummary={addMeetingSummary}
                  onDelete={deleteLead}
                  selectedLeads={selectedLeads}
                  onSelectLead={(leadId) => {
                    if (selectedLeads.includes(leadId)) {
                      setSelectedLeads(prev => prev.filter(id => id !== leadId));
                    } else {
                      setSelectedLeads(prev => [...prev, leadId]);
                    }
                  }}
                  currentUser={user}
                  onAssignUser={async (leadId, userId) => {
                    const { supabase } = await import('../lib/supabase');
                    const { error } = await supabase
                      .from('leads')
                      .update({ assigned_user_id: userId })
                      .eq('id', leadId);
                    if (!error) {
                      toast.success('Lead assignment updated');
                      // Refresh leads data
                      setLeadsRefreshFlag(flag => !flag);
                    } else {
                      toast.error('Failed to assign lead');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <AnalyticsDashboard
            leads={leads}
            isLoading={isLoading}
            currentUserId={user?.id}
            userRole={currentUserProfile?.role}
            profiles={allProfiles}
          />
        );

      case 'activity-analytics':
        return <ActivityAnalyticsDashboard />;

      case 'employee-analytics':
        return (
          <EmployeeAnalyticsDashboard
            leads={leads}
            profiles={allProfiles}
            isLoading={isLoading}
          />
        );

      case 'performance-calendar':
        return <PerformanceCalendarDashboard />;

      case 'attendance-tracking':
        return <AttendanceReportDashboard />;

      case 'meetings':
        return (
          <MeetingsView
            leads={leads}
            profiles={allProfiles.map(profile => ({
              id: profile.id,
              name: profile.name,
              role: profile.role
            }))}
            currentUser={user}
            onUpdateNotes={updateLeadNotes}
            onUpdateRequirement={updateLeadRequirement}
            onUpdateMeetingDetails={updateMeetingDetails}
            onAddFollowUpUpdate={addFollowUpUpdate}
            onAddMeetingSummary={addMeetingSummary}
            onAssignMeeting={handleAssignMeeting}
            canEdit={canManageUsers}
          />
        );

      case 'tasks':
        return <TaskManagement viewMode="admin" />;

      case 'employees':
        return (
          <div className="space-y-6">
            {/* Employee Management Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Employee Management</h2>
                <div className="flex gap-3">
                  {isCurrentUserAdmin && (
                    <button
                      onClick={() => setShowUserManagement(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add New User
                    </button>
                  )}
                  <button
                    onClick={() => setShowEmployeeSidebar(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Assign Leads
                  </button>
                </div>
              </div>
              <p className="text-gray-600">Manage your team members and assign leads to employees for better organization.</p>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-medium text-gray-900">Users ({allProfiles.length})</h4>
                </div>
              </div>

              {allProfiles.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allProfiles.map((profile) => {
                        return (
                          <tr key={profile.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                  {profile.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{profile.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${profile.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : profile.role === 'team_leader' || profile.role === 'sales_team_leader' || profile.role === 'operations_team_leader'
                                  ? 'bg-blue-100 text-blue-800'
                                  : profile.role === 'sales_executive'
                                    ? 'bg-green-100 text-green-800'
                                    : profile.role === 'operations_team'
                                      ? 'bg-teal-100 text-teal-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                {profile.role === 'admin' ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                {profile.role === 'sales_executive' ? 'Sales Executive' :
                                  profile.role === 'team_leader' ? 'Team Leader' :
                                    profile.role === 'sales_team_leader' ? 'Sales Team Leader' :
                                      profile.role === 'operations_team' ? 'Operations Team' :
                                        profile.role === 'operations_team_leader' ? 'Operations Team Leader' :
                                          profile.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {isCurrentUserAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(profile.id, profile.name)}
                                  className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                                  title="Delete user"
                                >
                                  <X className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'import-export':
        return (
          <div className="space-y-6">
            {/* Sample Template Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">New to importing leads?</h3>
                  <p className="text-blue-700 mb-4">Download our sample template to understand the correct format and see example data.</p>
                  <button
                    onClick={handleDownloadSample}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Download Sample Template
                  </button>
                </div>
              </div>
            </div>

            {/* Field Requirements Documentation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Import Format Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">✅ Required Fields</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <strong>Name, Full Name, Lead Name</strong> - Full name of the lead</li>
                    <li>• <strong>Phone, Phone Number, Lead Phone Number</strong> - Contact number (exactly 10 digits, no spaces/symbols)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">📝 Optional Fields</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <strong>Lead Status</strong> - Follow-up, Confirmed, etc.</li>
                    <li>• <strong>Follow-up Date</strong> - Format: YYYY-MM-DD</li>
                    <li>• <strong>Follow-up Time</strong> - Format: HH:MM (24-hour)</li>
                    <li>• <strong>Notes</strong> - Additional information</li>
                    <li>• <strong>Requirement</strong> - Customer requirements</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Use the exact column names shown above. Phone numbers must be exactly 10 digits (spaces/symbols will be removed automatically). Status values: -, Follow-up, Confirmed, Not Connected, Interested, Not - Interested, Meeting
                </p>
              </div>
            </div>

            {/* Import/Export Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Import/Export Data</h2>
                <button
                  onClick={() => setShowEmployeeSidebar(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Assign to Employee
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Upload className="h-6 w-6 text-blue-600" />
                    <h3 className="font-medium">Import Leads</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Upload Excel or CSV files to import leads into the system.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".xlsx,.xls,.csv"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-6 w-6 text-green-600" />
                    <h3 className="font-medium">Export Leads</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Download all leads data as an Excel file.</p>
                  <button
                    onClick={handleExportToExcel}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarCollapsed ? 'w-16' : 'w-72'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed inset-y-0 left-0 z-50
        bg-blue-900 shadow-lg transition-all duration-300 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-blue-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-blue-200">CRM Management</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-blue-800 transition-colors text-white"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Sidebar Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
                // Refresh data when switching sections
                refreshData();
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors ${activeSection === item.id
                ? 'bg-blue-600 text-white'
                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <div className={`${sidebarCollapsed ? 'scale-75' : ''} transition-transform duration-200`}>
                {item.icon}
              </div>
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-blue-800 relative">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-3`}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} w-full p-2 rounded-lg hover:bg-blue-800 transition-colors`}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-blue-200">{currentUserProfile?.role || 'User'}</p>
                </div>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && !sidebarCollapsed && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                {/* Profile Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                  {/* <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div> */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user?.name || 'User'}</h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${currentUserProfile?.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : currentUserProfile?.role === 'team_leader'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {currentUserProfile?.role === 'admin' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {currentUserProfile?.role || 'user'}
                    </span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Info className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Account Info</p>
                      <p className="text-xs text-gray-600">ID: {user?.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-colors text-red-300 hover:bg-red-900 hover:text-white`}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <div className={`${sidebarCollapsed ? 'scale-75' : ''} transition-transform duration-200`}>
              <LogOut className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h2>
                <p className="text-gray-600 hidden sm:block">Manage your CRM efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Task Status Notification Bell - Admin Only */}
              <TaskStatusNotificationBell isAdmin={isAdminOrTeamLeader} />
              <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.name}</span>
              <span className="text-sm text-gray-600 sm:hidden">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-auto p-4 lg:p-6"
          onClick={() => setShowProfileDropdown(false)}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading...</div>
              </div>
            </div>
          ) : (
            renderMainContent()
          )}
        </main>
      </div>

      {/* Employee Sidebar */}
      <EmployeeSidebar
        isOpen={showEmployeeSidebar}
        onClose={() => setShowEmployeeSidebar(false)}
        refreshTrigger={leadsRefreshFlag}
      />

      {/* User Management Modal */}
      <UserManagement
        isOpen={showUserManagement}
        onClose={() => {
          setShowUserManagement(false);
          // Refresh profiles when user management modal closes
          setProfilesRefreshFlag(flag => !flag);
        }}
      />

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && duplicateLead && pendingLead && (
        <DuplicateConfirmationModal
          isOpen={showDuplicateModal}
          onClose={handleDuplicateClose}
          onConfirm={handleDuplicateConfirm}
          onSkip={handleDuplicateSkip}
          duplicateLead={duplicateLead}
          newLead={pendingLead}
        />
      )}


      {/* Today's Follow-ups Modal */}
      <TodayFollowUpsModal
        isOpen={showTodayFollowUpsModal}
        onClose={() => setShowTodayFollowUpsModal(false)}
        leads={leads}
      />

      {/* Today's Meetings Modal */}
      <TodayMeetingsModal
        isOpen={showTodayMeetingsModal}
        onClose={() => setShowTodayMeetingsModal(false)}
        leads={leads}
      />
    </div>
  );
};

export default AdminDashboard;
