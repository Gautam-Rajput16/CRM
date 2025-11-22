export interface DailyPerformance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meetingsScheduled: number;
  meetingsDone: number;
  quotationsSent: number;
  confirmations: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPerformanceDB {
  id: string;
  user_id: string;
  date: string;
  meetings_scheduled: number;
  meetings_done: number;
  quotations_sent: number;
  confirmations: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPerformanceCreate {
  userId: string;
  date: string; // YYYY-MM-DD
  meetingsScheduled: number;
  meetingsDone: number;
  quotationsSent: number;
  confirmations: number;
}
