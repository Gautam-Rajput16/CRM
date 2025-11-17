export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string; // User ID
  assignedToName: string; // User name for display
  assignedBy: string; // Admin/Team Leader ID
  assignedByName: string; // Admin name for display
  dueDate: string;
  dueTime?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
  relatedLeadId?: string; // Optional: Link to a specific lead
  relatedLeadName?: string;
  notes?: string;
}

export interface TaskDB {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  due_date: string;
  due_time?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  tags?: string[];
  related_lead_id?: string;
  related_lead_name?: string;
  notes?: string;
}

export interface TaskCreate extends Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'> {}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  dueTime?: string;
  tags?: string[];
  relatedLeadId?: string;
  relatedLeadName?: string;
  notes?: string;
  completedAt?: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
