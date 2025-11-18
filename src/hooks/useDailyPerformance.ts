import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DailyPerformance, DailyPerformanceDB } from '../types/DailyPerformance';
import { toast } from 'react-hot-toast';

const mapDbToPerformance = (row: DailyPerformanceDB): DailyPerformance => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  meetings: row.meetings,
  salesAmount: row.sales_amount,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const useDailyPerformance = (userId?: string) => {
  const [entries, setEntries] = useState<DailyPerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('daily_performance')
        .select('*')
        .order('date', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEntries((data || []).map(mapDbToPerformance));
    } catch (error: any) {
      console.error('Error loading daily performance:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = async (date: string, meetings: number, salesAmount: number, overrideUserId?: string) => {
    try {
      const targetUserId = overrideUserId || userId;
      if (!targetUserId) {
        throw new Error('Missing user id for performance entry');
      }

      const payload = {
        user_id: targetUserId,
        date,
        meetings,
        sales_amount: salesAmount,
      };

      const { error } = await supabase
        .from('daily_performance')
        .upsert(payload, { onConflict: 'user_id,date' });

      if (error) throw error;

      await fetchEntries();
      toast.success('Performance saved');
    } catch (error: any) {
      console.error('Error saving daily performance:', error);
      toast.error('Failed to save performance');
    }
  };

  const deleteEntry = async (date: string, overrideUserId?: string) => {
    try {
      const targetUserId = overrideUserId || userId;
      if (!targetUserId) {
        throw new Error('Missing user id for performance entry');
      }

      const { error } = await supabase
        .from('daily_performance')
        .delete()
        .eq('user_id', targetUserId)
        .eq('date', date);

      if (error) throw error;

      await fetchEntries();
      toast.success('Performance cleared');
    } catch (error: any) {
      console.error('Error deleting daily performance:', error);
      toast.error('Failed to clear performance');
    }
  };

  return {
    entries,
    isLoading,
    saveEntry,
    deleteEntry,
    refresh: fetchEntries,
  };
};
