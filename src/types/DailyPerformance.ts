export interface DailyPerformance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meetings: number;
  salesAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPerformanceDB {
  id: string;
  user_id: string;
  date: string;
  meetings: number;
  sales_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPerformanceCreate {
  userId: string;
  date: string; // YYYY-MM-DD
  meetings: number;
  salesAmount: number;
}
