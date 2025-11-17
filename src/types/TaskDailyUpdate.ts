export interface TaskDailyUpdate {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  updateDate: string; // YYYY-MM-DD format
  progressPercentage: number; // 0-100
  statusUpdate?: string;
  workCompleted: string;
  challengesFaced?: string;
  nextDayPlan?: string;
  hoursWorked?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDailyUpdateDB {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  update_date: string;
  progress_percentage: number;
  status_update?: string;
  work_completed: string;
  challenges_faced?: string;
  next_day_plan?: string;
  hours_worked?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDailyUpdateCreate {
  taskId: string;
  userId: string;
  userName: string;
  updateDate: string;
  progressPercentage: number;
  statusUpdate?: string;
  workCompleted: string;
  challengesFaced?: string;
  nextDayPlan?: string;
  hoursWorked?: number;
}

export interface TaskDailyUpdateForm {
  progressPercentage: number;
  statusUpdate: string;
  workCompleted: string;
  challengesFaced: string;
  nextDayPlan: string;
  hoursWorked: string;
}

export interface TaskWithLatestUpdate extends TaskDailyUpdate {
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  taskStatus: string;
  taskPriority: string;
}
