import { useState, useMemo, useCallback, useEffect } from 'react';
import { Lead, FollowUpUpdate } from '../types/Lead';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useLeads = (refreshFlag?: boolean) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, [refreshFlag]);

  const fetchLeads = async () => {
    try {
      // Function to fetch all leads using pagination
      const fetchAllLeads = async () => {
        let allLeads: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: pageData, error: pageError } = await supabase
            .from('leads')
            .select(`
              *, 
              assigned_user:profiles!fk_leads_assigned_user_id(id, name),
              meeting_summaries(
                id,
                content,
                created_at,
                user_id
              )
            `)
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (pageError) {
            throw pageError;
          }

          if (pageData && pageData.length > 0) {
            allLeads = [...allLeads, ...pageData];
            from += pageSize;
            hasMore = pageData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        return allLeads;
      };

      // Try to fetch all leads with pagination
      let data: any[] = [];
      let error: any = null;

      try {
        data = await fetchAllLeads();
      } catch (initialError) {
        console.log('Initial paginated query failed:', initialError);
        error = initialError;
        
        // Fallback: Try simple query without joins
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.log('Fallback query failed:', fallbackError);
          // Method 2: Try RPC function if it exists
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_all_leads_for_user');
          
          if (rpcError) {
            console.log('RPC function failed, this is likely an RLS issue');
            // Show a message to user about RLS
            toast.error('Database access restricted. Please contact admin to configure Row Level Security policies.');
            data = [];
            error = null;
          } else {
            data = rpcData || [];
            error = null;
          }
        } else {
          data = fallbackData || [];
          error = null;
        }
      }

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      // Always show all leads in CRM dashboard
      let filteredData = data || [];

      // Transform the data to match our Lead type
      const transformedLeads: Lead[] = filteredData.map(lead => ({
        id: lead.id,
        fullName: lead.full_name,
        phone: lead.phone,
        status: lead.status,
        followUpDate: lead.follow_up_date || '',
        followUpTime: lead.follow_up_time || '',
        notes: lead.notes || '',
        requirement: lead.requirement || '',
        meetingDescription: lead.meeting_description || '',
        meetingDate: lead.meeting_date || '',
        meetingTime: lead.meeting_time || '',
        meetingLocation: lead.meeting_location || '',
        followUpUpdates: [], // Will be loaded separately
        meetingSummaries: lead.meeting_summaries?.map((summary: any) => ({
          id: summary.id,
          content: summary.content,
          createdAt: new Date(summary.created_at),
          userId: summary.user_id
        })) || [],
        createdAt: new Date(lead.created_at),
        userId: lead.user_id,
        assignedUserId: lead.assigned_user_id,
        assignedUserName: lead.assigned_user ? lead.assigned_user.name : undefined,
        meetingAssignedUserId: lead.meeting_assigned_user_id || undefined,
        meetingAssignedUserName: lead.meeting_assigned_user_name || undefined,
        meetingStatus: (lead.meeting_status as 'pending' | 'conducted' | 'not_conducted') || 'pending'
      }));

      setLeads(transformedLeads);
      
      // Fetch follow-up updates for all leads
      await fetchFollowUpUpdates(transformedLeads.map(lead => lead.id));
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error('Network error - please check your connection');
      } else {
        toast.error('Failed to fetch leads');
        console.error('Error fetching leads:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowUpUpdates = async (leadIds: string[]) => {
    // Skip if no lead IDs
    if (leadIds.length === 0) {
      return;
    }

    try {
      // Function to fetch all follow-up updates using pagination
      const fetchAllUpdates = async () => {
        let allUpdates: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: pageData, error: pageError } = await supabase
            .from('follow_up_updates')
            .select('*')
            .in('lead_id', leadIds)
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (pageError) {
            throw pageError;
          }

          if (pageData && pageData.length > 0) {
            allUpdates = [...allUpdates, ...pageData];
            from += pageSize;
            hasMore = pageData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        return allUpdates;
      };

      const data = await fetchAllUpdates();

      // Group updates by lead_id
      const updatesByLeadId: Record<string, FollowUpUpdate[]> = {};
      
      data?.forEach(update => {
        if (!updatesByLeadId[update.lead_id]) {
          updatesByLeadId[update.lead_id] = [];
        }
        updatesByLeadId[update.lead_id].push({
          id: update.id,
          content: update.content,
          createdAt: new Date(update.created_at),
          userId: update.user_id
        });
      });

      // Update leads with their follow-up updates
      setLeads(prev => prev.map(lead => ({
        ...lead,
        followUpUpdates: updatesByLeadId[lead.id] || []
      })));
    } catch (error) {
      console.error('Error fetching follow-up updates:', error);
    }
  };

  const checkDuplicatePhone = useCallback(async (phone: string): Promise<Lead | null> => {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      
      // Validate phone number format (must be exactly 10 digits)
      if (!/^\d{10}$/.test(cleanPhone)) {
        console.warn(`Invalid phone number format: "${phone}" (cleaned: "${cleanPhone}"). Must be exactly 10 digits.`);
        return null;
      }
      
      // Check in current leads state first
      const existingLead = leads.find(lead => 
        lead.phone.replace(/[\s\-\(\)\+]/g, '') === cleanPhone
      );
      
      if (existingLead) {
        return existingLead;
      }

      // Check in database for leads that might not be in current state
      // Try both cleaned phone and original phone formats
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`phone.eq.${cleanPhone},phone.eq.${phone}`);

      if (error) {
        console.error('Error checking duplicate phone:', error);
        return null;
      }

      if (data && data.length > 0) {
        // Transform to Lead type
        const dbLead = data[0];
        return {
          id: dbLead.id,
          fullName: dbLead.full_name,
          phone: dbLead.phone,
          status: dbLead.status,
          followUpDate: dbLead.follow_up_date || '',
          followUpTime: dbLead.follow_up_time || '',
          notes: dbLead.notes || '',
          requirement: dbLead.requirement || '',
          meetingDescription: dbLead.meeting_description || '',
          meetingDate: dbLead.meeting_date || '',
          meetingTime: dbLead.meeting_time || '',
          meetingLocation: dbLead.meeting_location || '',
          followUpUpdates: [],
          meetingSummaries: [],
          createdAt: new Date(dbLead.created_at),
          userId: dbLead.user_id,
          assignedUserId: dbLead.assigned_user_id,
          assignedUserName: undefined,
          meetingAssignedUserId: dbLead.meeting_assigned_user_id || undefined,
          meetingAssignedUserName: dbLead.meeting_assigned_user_name || undefined,
          meetingStatus: (dbLead.meeting_status as 'pending' | 'conducted' | 'not_conducted') || 'pending'
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      return null;
    }
  }, [leads]);

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user) {
        toast.error('User not authenticated Check Email');
        throw new Error('User not authenticated');
      }

      // Ensure the date is in ISO format for the database
      const followUpDate = leadData.followUpDate ? new Date(leadData.followUpDate).toISOString().split('T')[0] : null;

      const newLead = {
        full_name: leadData.fullName,
        phone: leadData.phone,
        status: leadData.status,
        follow_up_date: followUpDate,
        follow_up_time: leadData.followUpTime,
        notes: leadData.notes,
        requirement: leadData.requirement,
        user_id: session.data.session.user.id,
        assigned_user_id: leadData.assignedUserId || null,
        assigned_user_name: leadData.assignedUserName || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform the returned data to match our Lead type
      const transformedLead: Lead = {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        status: data.status,
        followUpDate: data.follow_up_date || '',
        followUpTime: data.follow_up_time || '',
        notes: data.notes || '',
        requirement: data.requirement || '',
        followUpUpdates: [],
        createdAt: new Date(data.created_at),
        userId: data.user_id,
        assignedUserId: data.assigned_user_id || undefined,
        assignedUserName: data.assigned_user_name || undefined
      };

      setLeads(prev => [transformedLead, ...prev]);
      toast.success('Lead added successfully');
    } catch (error) {
      toast.error('Failed to add lead');
      console.error('Error adding lead:', error);
    }
  }, []);

  const addLeadWithDuplicateCheck = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt' | 'userId'>, skipDuplicateCheck = false): Promise<{ success: boolean; duplicate?: Lead }> => {
    try {
      if (!skipDuplicateCheck) {
        const duplicateLead = await checkDuplicatePhone(leadData.phone);
        if (duplicateLead) {
          return { success: false, duplicate: duplicateLead };
        }
      }

      await addLead(leadData);
      return { success: true };
    } catch (error) {
      console.error('Error adding lead with duplicate check:', error);
      return { success: false };
    }
  }, [addLead, checkDuplicatePhone]);

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      toast.success('Lead status updated successfully');
    } catch (error) {
      toast.error('Failed to update lead status');
      console.error('Error updating lead status:', error);
    }
  }, []);

  const updateLeadNotes = useCallback(async (leadId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, notes } : lead
        )
      );
      toast.success('Notes updated successfully');
    } catch (error) {
      toast.error('Failed to update notes');
      console.error('Error updating lead notes:', error);
    }
  }, []);

  const updateLeadRequirement = useCallback(async (leadId: string, requirement: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ requirement })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, requirement } : lead
        )
      );
      toast.success('Requirement updated successfully');
    } catch (error) {
      toast.error('Failed to update requirement');
      console.error('Error updating lead requirement:', error);
    }
  }, []);

  const updateLeadFollowUp = useCallback(async (leadId: string, followUpDate: string, followUpTime: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          follow_up_date: followUpDate,
          follow_up_time: followUpTime
        })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, followUpDate, followUpTime } : lead
        )
      );
      toast.success('Follow-up updated successfully');
    } catch (error) {
      toast.error('Failed to update follow-up');
      console.error('Error updating lead follow-up:', error);
    }
  }, []);

  const updateMeetingDetails = useCallback(async (leadId: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          meeting_description: meetingDescription,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          meeting_location: meetingLocation
        })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { 
            ...lead, 
            meetingDescription, 
            meetingDate, 
            meetingTime, 
            meetingLocation 
          } : lead
        )
      );
      toast.success('Meeting details updated successfully');
    } catch (error) {
      toast.error('Failed to update meeting details');
      console.error('Error updating meeting details:', error);
    }
  }, []);

  const deleteLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast.success('Lead deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lead');
      console.error('Error deleting lead:', error);
    }
  }, []);

  const addFollowUpUpdate = useCallback(async (leadId: string, content: string) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user) {
        toast.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follow_up_updates')
        .insert([{
          lead_id: leadId,
          content,
          user_id: session.data.session.user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newUpdate: FollowUpUpdate = {
        id: data.id,
        content: data.content,
        createdAt: new Date(data.created_at),
        userId: data.user_id
      };

      // Update the lead with the new follow-up update
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, followUpUpdates: [newUpdate, ...lead.followUpUpdates] }
          : lead
      ));

      toast.success('Follow-up update added successfully');
    } catch (error) {
      toast.error('Failed to add follow-up update');
      console.error('Error adding follow-up update:', error);
    }
  }, []);

  const addMeetingSummary = useCallback(async (leadId: string, content: string) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user) {
        toast.error('User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('meeting_summaries')
        .insert([{
          lead_id: leadId,
          content,
          user_id: session.data.session.user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newSummary = {
        id: data.id,
        content: data.content,
        createdAt: new Date(data.created_at),
        userId: data.user_id
      };

      // Update the lead with the new meeting summary
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, meetingSummaries: [...(lead.meetingSummaries || []), newSummary] }
          : lead
      ));

      toast.success('Meeting summary added successfully');
    } catch (error) {
      toast.error('Failed to add meeting summary');
      console.error('Error adding meeting summary:', error);
      throw error;
    }
  }, []);

  const updateMeetingStatus = useCallback(async (leadId: string, status: 'pending' | 'conducted' | 'not_conducted') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ meeting_status: status })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Update the local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, meetingStatus: status }
            : lead
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchQuery === '' || 
        lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Returns only leads assigned to the given user
  const getMyLeads = (userId: string) =>
    leads.filter(lead => lead.assignedUserId === userId);

  return {
    leads, // raw leads
    filteredLeads,
    isLoading,
    addLead,
    addLeadWithDuplicateCheck,
    checkDuplicatePhone,
    updateLeadStatus,
    updateLeadNotes,
    updateLeadRequirement,
    updateLeadFollowUp,
    updateMeetingDetails,
    deleteLead,
    addFollowUpUpdate,
    addMeetingSummary,
    updateMeetingStatus,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    getMyLeads,
  };
};