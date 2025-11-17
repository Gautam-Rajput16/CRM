export interface FollowUpUpdate {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
}

export interface MeetingSummary {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  status: '-' | 'Follow-up' | 'Confirmed' | 'Not Connected' | 'Interested' | 'Not - Interested' | 'Meeting' | 'Special Follow-up';
  followUpDate: string;
  followUpTime: string;
  notes: string;
  requirement: string;
  meetingDescription?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  followUpUpdates: FollowUpUpdate[];
  meetingSummaries?: MeetingSummary[];
  createdAt: Date;
  userId: string;
  assignedUserId?: string;
  assignedUserName?: string;
  meetingAssignedUserId?: string;
  meetingAssignedUserName?: string;
  meetingStatus?: 'pending' | 'conducted' | 'not_conducted';
}

export interface LeadCreate extends Omit<Lead, 'id' | 'createdAt' | 'userId' | 'followUpUpdates'> {}

export type LeadStatus = Lead['status'];

// Type for the Supabase database schema
export interface LeadDB {
  id: string;
  full_name: string;
  phone: string;
  status: LeadStatus;
  follow_up_date: string;
  follow_up_time: string;
  notes: string;
  requirement: string;
  meeting_description?: string;
  meeting_date?: string;
  meeting_time?: string;
  meeting_location?: string;
  created_at: string;
  user_id: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  meeting_assigned_user_id?: string;
  meeting_assigned_user_name?: string;
  meeting_status?: string;
}

export interface FollowUpUpdateDB {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
  user_id: string;
}