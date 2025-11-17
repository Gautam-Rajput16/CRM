import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskDB, TaskCreate, TaskUpdate, TaskStatus } from '../types/Task';
import { toast } from 'react-hot-toast';

export const useTasks = (userId?: string, refreshFlag?: boolean) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert DB task to Task
  const dbToTask = (dbTask: TaskDB): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    priority: dbTask.priority,
    status: dbTask.status,
    assignedTo: dbTask.assigned_to,
    assignedToName: dbTask.assigned_to_name,
    assignedBy: dbTask.assigned_by,
    assignedByName: dbTask.assigned_by_name,
    dueDate: dbTask.due_date,
    dueTime: dbTask.due_time,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    tags: dbTask.tags,
    relatedLeadId: dbTask.related_lead_id,
    relatedLeadName: dbTask.related_lead_name,
    notes: dbTask.notes,
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

      // Filter by user if specified
      if (userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tasksData = (data || []).map(dbToTask);
      setTasks(tasksData);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId, refreshFlag]);

  // Create task
  const createTask = async (taskData: TaskCreate): Promise<boolean> => {
    try {
      const dbTask = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        assigned_to: taskData.assignedTo,
        assigned_to_name: taskData.assignedToName,
        assigned_by: taskData.assignedBy,
        assigned_by_name: taskData.assignedByName,
        due_date: taskData.dueDate,
        due_time: taskData.dueTime,
        tags: taskData.tags,
        related_lead_id: taskData.relatedLeadId,
        related_lead_name: taskData.relatedLeadName,
        notes: taskData.notes,
      };

      const { error } = await supabase.from('tasks').insert([dbTask]);

      if (error) throw error;

      toast.success('Task created successfully');
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return false;
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<TaskUpdate>): Promise<boolean> => {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Map all possible update fields to database columns
      if (updates.title !== undefined) {
        dbUpdates.title = updates.title;
      }
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description;
      }
      if (updates.priority !== undefined) {
        dbUpdates.priority = updates.priority;
      }
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
        if (updates.status === 'completed') {
          dbUpdates.completed_at = new Date().toISOString();
        }
      }
      if (updates.assignedTo !== undefined) {
        dbUpdates.assigned_to = updates.assignedTo;
      }
      if (updates.assignedToName !== undefined) {
        dbUpdates.assigned_to_name = updates.assignedToName;
      }
      if (updates.dueDate !== undefined) {
        dbUpdates.due_date = updates.dueDate;
      }
      if (updates.dueTime !== undefined) {
        dbUpdates.due_time = updates.dueTime;
      }
      if (updates.tags !== undefined) {
        dbUpdates.tags = updates.tags;
      }
      if (updates.relatedLeadId !== undefined) {
        dbUpdates.related_lead_id = updates.relatedLeadId;
      }
      if (updates.relatedLeadName !== undefined) {
        dbUpdates.related_lead_name = updates.relatedLeadName;
      }
      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task updated successfully');
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return false;
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<boolean> => {
    return updateTask(taskId, { status });
  };

  // Delete task
  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted successfully');
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  };

  // Bulk update tasks
  const bulkUpdateTaskStatus = async (taskIds: string[], status: TaskStatus): Promise<boolean> => {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', taskIds);

      if (error) throw error;

      toast.success(`${taskIds.length} tasks updated successfully`);
      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error bulk updating tasks:', error);
      toast.error('Failed to update tasks');
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    bulkUpdateTaskStatus,
    refreshTasks: fetchTasks,
  };
};
