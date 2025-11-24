import { supabase } from './supabase';

export interface CallLogData {
  employee_id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  call_type?: 'outbound' | 'inbound';
  notes?: string;
}

export interface StatusChangeLogData {
  lead_id: string;
  employee_id: string;
  lead_name: string;
  old_status: string;
  new_status: string;
  change_reason?: string;
  notes?: string;
}

/**
 * Log a call made by an employee to a lead
 */
export const logCall = async (callData: CallLogData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('call_logs')
      .insert({
        employee_id: callData.employee_id,
        lead_id: callData.lead_id,
        lead_name: callData.lead_name,
        lead_phone: callData.lead_phone,
        call_type: callData.call_type || 'outbound',
        notes: callData.notes,
        call_timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging call:', error);
      throw error;
    }

    console.log('Call logged successfully');
  } catch (error) {
    console.error('Failed to log call:', error);
    // Don't throw error to prevent disrupting user experience
  }
};

/**
 * Log a status change for a lead
 */
export const logStatusChange = async (statusChangeData: StatusChangeLogData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('status_change_logs')
      .insert({
        lead_id: statusChangeData.lead_id,
        employee_id: statusChangeData.employee_id,
        lead_name: statusChangeData.lead_name,
        old_status: statusChangeData.old_status,
        new_status: statusChangeData.new_status,
        change_reason: statusChangeData.change_reason,
        notes: statusChangeData.notes,
        change_timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging status change:', error);
      throw error;
    }

    console.log('Status change logged successfully');
  } catch (error) {
    console.error('Failed to log status change:', error);
    // Don't throw error to prevent disrupting user experience
  }
};

/**
 * Get call logs for analytics
 */
export const getCallLogs = async (filters?: {
  employeeId?: string;
  leadId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    let query = supabase
      .from('call_logs')
      .select('*')
      .order('call_timestamp', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters?.startDate) {
      query = query.gte('call_timestamp', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('call_timestamp', filters.endDate);
    }

    const { data: callLogs, error } = await query;

    if (error) {
      console.error('Error fetching call logs:', error);
      throw error;
    }

    if (!callLogs || callLogs.length === 0) {
      return [];
    }

    // Get unique employee IDs to fetch their names
    const employeeIds = [...new Set(callLogs.map(log => log.employee_id))];

    // Get employee profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .in('id', employeeIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without names if profile fetch fails
    }

    // Add employee names and previous activity timestamps to call logs
    const enrichedLogs = await Promise.all(callLogs.map(async (log) => {
      const profile = profiles?.find(p => p.id === log.employee_id);

      // Get previous call for this lead
      const { data: previousCall } = await supabase
        .from('call_logs')
        .select('call_timestamp')
        .eq('lead_id', log.lead_id)
        .lt('call_timestamp', log.call_timestamp)
        .order('call_timestamp', { ascending: false })
        .limit(1);

      // Get previous status change for this lead
      const { data: previousStatus } = await supabase
        .from('status_change_logs')
        .select('change_timestamp')
        .eq('lead_id', log.lead_id)
        .lt('change_timestamp', log.call_timestamp)
        .order('change_timestamp', { ascending: false })
        .limit(1);

      return {
        ...log,
        employee_name: profile?.name || 'Unknown Employee',
        employee_role: profile?.role || 'user',
        previous_call_date: previousCall?.[0]?.call_timestamp || null,
        previous_status_date: previousStatus?.[0]?.change_timestamp || null
      };
    }));

    return enrichedLogs;
  } catch (error) {
    console.error('Failed to fetch call logs:', error);
    return [];
  }
};

/**
 * Get status change logs for analytics
 */
export const getStatusChangeLogs = async (filters?: {
  employeeId?: string;
  leadId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    let query = supabase
      .from('status_change_logs')
      .select('*')
      .order('change_timestamp', { ascending: false });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters?.startDate) {
      query = query.gte('change_timestamp', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('change_timestamp', filters.endDate);
    }

    const { data: statusLogs, error } = await query;

    if (error) {
      console.error('Error fetching status change logs:', error);
      throw error;
    }

    if (!statusLogs || statusLogs.length === 0) {
      return [];
    }

    // Get unique employee IDs to fetch their names
    const employeeIds = [...new Set(statusLogs.map(log => log.employee_id))];

    // Get employee profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .in('id', employeeIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without names if profile fetch fails
    }

    // Add employee names and previous activity timestamps to status change logs
    const enrichedLogs = await Promise.all(statusLogs.map(async (log) => {
      const profile = profiles?.find(p => p.id === log.employee_id);

      // Get previous call for this lead
      const { data: previousCall } = await supabase
        .from('call_logs')
        .select('call_timestamp')
        .eq('lead_id', log.lead_id)
        .lt('call_timestamp', log.change_timestamp)
        .order('call_timestamp', { ascending: false })
        .limit(1);

      // Get previous status change for this lead
      const { data: previousStatus } = await supabase
        .from('status_change_logs')
        .select('change_timestamp')
        .eq('lead_id', log.lead_id)
        .lt('change_timestamp', log.change_timestamp)
        .order('change_timestamp', { ascending: false })
        .limit(1);

      return {
        ...log,
        employee_name: profile?.name || 'Unknown Employee',
        employee_role: profile?.role || 'user',
        previous_call_date: previousCall?.[0]?.call_timestamp || null,
        previous_status_date: previousStatus?.[0]?.change_timestamp || null
      };
    }));

    return enrichedLogs;
  } catch (error) {
    console.error('Failed to fetch status change logs:', error);
    return [];
  }
};

/**
 * Get daily call summary for employees
 */
export const getDailyCallSummary = async (date: string) => {
  try {
    // First get call logs for the date
    const { data: callLogs, error: callError } = await supabase
      .from('call_logs')
      .select('employee_id, call_timestamp')
      .gte('call_timestamp', `${date}T00:00:00`)
      .lt('call_timestamp', `${date}T23:59:59`);

    if (callError) {
      console.error('Error fetching call logs:', callError);
      throw callError;
    }

    if (!callLogs || callLogs.length === 0) {
      return [];
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(callLogs.map(log => log.employee_id))];

    // Get employee profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .in('id', employeeIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    // Group by employee and count calls
    const summary = callLogs.reduce((acc: any, log: any) => {
      const employeeId = log.employee_id;
      if (!acc[employeeId]) {
        const profile = profiles?.find(p => p.id === employeeId);
        acc[employeeId] = {
          employee_id: employeeId,
          employee_name: profile?.name || 'Unknown',
          employee_role: profile?.role || 'user',
          call_count: 0
        };
      }
      acc[employeeId].call_count++;
      return acc;
    }, {});

    return Object.values(summary);
  } catch (error) {
    console.error('Failed to fetch daily call summary:', error);
    return [];
  }
};

/**
 * Get daily status change summary for employees
 */
export const getDailyStatusChangeSummary = async (date: string) => {
  try {
    // First get status change logs for the date
    const { data: statusLogs, error: statusError } = await supabase
      .from('status_change_logs')
      .select('employee_id, change_timestamp, new_status')
      .gte('change_timestamp', `${date}T00:00:00`)
      .lt('change_timestamp', `${date}T23:59:59`);

    if (statusError) {
      console.error('Error fetching status change logs:', statusError);
      throw statusError;
    }

    if (!statusLogs || statusLogs.length === 0) {
      return [];
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(statusLogs.map(log => log.employee_id))];

    // Get employee profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .in('id', employeeIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    // Group by employee and count status changes
    const summary = statusLogs.reduce((acc: any, log: any) => {
      const employeeId = log.employee_id;
      if (!acc[employeeId]) {
        const profile = profiles?.find(p => p.id === employeeId);
        acc[employeeId] = {
          employee_id: employeeId,
          employee_name: profile?.name || 'Unknown',
          employee_role: profile?.role || 'user',
          status_changes: 0,
          status_breakdown: {}
        };
      }
      acc[employeeId].status_changes++;

      // Track status breakdown
      const status = log.new_status;
      if (!acc[employeeId].status_breakdown[status]) {
        acc[employeeId].status_breakdown[status] = 0;
      }
      acc[employeeId].status_breakdown[status]++;

      return acc;
    }, {});

    return Object.values(summary);
  } catch (error) {
    console.error('Failed to fetch daily status change summary:', error);
    return [];
  }
};
