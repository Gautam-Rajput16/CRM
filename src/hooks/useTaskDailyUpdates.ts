import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TaskDailyUpdate, TaskDailyUpdateDB, TaskDailyUpdateCreate } from '../types/TaskDailyUpdate';
import { toast } from 'react-hot-toast';

export const useTaskDailyUpdates = (taskId?: string, userId?: string) => {
  const [updates, setUpdates] = useState<TaskDailyUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayUpdate, setTodayUpdate] = useState<TaskDailyUpdate | null>(null);

  // Convert DB update to TaskDailyUpdate
  const dbToUpdate = (dbUpdate: TaskDailyUpdateDB): TaskDailyUpdate => ({
    id: dbUpdate.id,
    taskId: dbUpdate.task_id,
    userId: dbUpdate.user_id,
    userName: dbUpdate.user_name,
    updateDate: dbUpdate.update_date,
    progressPercentage: dbUpdate.progress_percentage,
    statusUpdate: dbUpdate.status_update,
    workCompleted: dbUpdate.work_completed,
    challengesFaced: dbUpdate.challenges_faced,
    nextDayPlan: dbUpdate.next_day_plan,
    hoursWorked: dbUpdate.hours_worked,
    createdAt: new Date(dbUpdate.created_at),
    updatedAt: new Date(dbUpdate.updated_at),
  });

  // Fetch updates
  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('task_daily_updates')
        .select('*')
        .order('update_date', { ascending: false });

      // Filter by task if specified
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      // Filter by user if specified
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const updatesData = (data || []).map(dbToUpdate);
      setUpdates(updatesData);

      // Set today's update if exists
      const today = new Date().toISOString().split('T')[0];
      const todaysUpdate = updatesData.find(
        update => update.updateDate === today && 
        (!taskId || update.taskId === taskId) &&
        (!userId || update.userId === userId)
      );
      setTodayUpdate(todaysUpdate || null);

    } catch (error: any) {
      console.error('Error fetching daily updates:', error);
      toast.error('Failed to load daily updates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [taskId, userId]);

  // Create or update daily update
  const createOrUpdateDailyUpdate = async (updateData: TaskDailyUpdateCreate): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if update already exists for today
      const { data: existingUpdate } = await supabase
        .from('task_daily_updates')
        .select('id')
        .eq('task_id', updateData.taskId)
        .eq('user_id', updateData.userId)
        .eq('update_date', today)
        .single();

      const dbUpdate = {
        task_id: updateData.taskId,
        user_id: updateData.userId,
        user_name: updateData.userName,
        update_date: today,
        progress_percentage: updateData.progressPercentage,
        status_update: updateData.statusUpdate,
        work_completed: updateData.workCompleted,
        challenges_faced: updateData.challengesFaced,
        next_day_plan: updateData.nextDayPlan,
        hours_worked: updateData.hoursWorked,
      };

      let error;

      if (existingUpdate) {
        // Update existing record
        const result = await supabase
          .from('task_daily_updates')
          .update(dbUpdate)
          .eq('id', existingUpdate.id);
        error = result.error;
        toast.success('Daily update updated successfully');
      } else {
        // Create new record
        const result = await supabase
          .from('task_daily_updates')
          .insert([dbUpdate]);
        error = result.error;
        toast.success('Daily update created successfully');
      }

      if (error) throw error;

      await fetchUpdates();
      return true;
    } catch (error: any) {
      console.error('Error creating/updating daily update:', error);
      toast.error('Failed to save daily update');
      return false;
    }
  };

  // Get updates for a specific task
  const getTaskUpdates = async (taskId: string): Promise<TaskDailyUpdate[]> => {
    try {
      const { data, error } = await supabase
        .from('task_daily_updates')
        .select('*')
        .eq('task_id', taskId)
        .order('update_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(dbToUpdate);
    } catch (error: any) {
      console.error('Error fetching task updates:', error);
      return [];
    }
  };

  // Get today's update for a specific task and user
  const getTodayUpdate = async (taskId: string, userId: string): Promise<TaskDailyUpdate | null> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('task_daily_updates')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .eq('update_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      return data ? dbToUpdate(data) : null;
    } catch (error: any) {
      console.error('Error fetching today\'s update:', error);
      return null;
    }
  };

  // Delete daily update
  const deleteDailyUpdate = async (updateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_daily_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;

      toast.success('Daily update deleted successfully');
      await fetchUpdates();
      return true;
    } catch (error: any) {
      console.error('Error deleting daily update:', error);
      toast.error('Failed to delete daily update');
      return false;
    }
  };

  // Get all updates for admin view
  const getAllUpdates = async (): Promise<TaskDailyUpdate[]> => {
    try {
      const { data, error } = await supabase
        .from('task_daily_updates')
        .select(`
          *,
          tasks!inner(title, description, due_date, status, priority)
        `)
        .order('update_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...dbToUpdate(item),
        taskTitle: item.tasks.title,
        taskDescription: item.tasks.description,
        taskDueDate: item.tasks.due_date,
        taskStatus: item.tasks.status,
        taskPriority: item.tasks.priority,
      }));
    } catch (error: any) {
      console.error('Error fetching all updates:', error);
      return [];
    }
  };

  return {
    updates,
    todayUpdate,
    isLoading,
    createOrUpdateDailyUpdate,
    getTaskUpdates,
    getTodayUpdate,
    deleteDailyUpdate,
    getAllUpdates,
    refreshUpdates: fetchUpdates,
  };
};
