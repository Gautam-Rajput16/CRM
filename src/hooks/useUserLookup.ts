import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useUserLookup = () => {
  const [isLoading, setIsLoading] = useState(false);

  const lookupUserEmail = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // Query the profiles table which is accessible to authenticated users
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return { email: data?.name || null };
    } catch (error) {
      const err = error as { message?: string };
      if (err?.message?.includes('profiles')) {
        toast.error('The profiles system is not set up. Please contact the administrator.');
      } else {
        toast.error('Failed to lookup user');
      }
      console.error('User lookup error:', error);
      return { email: null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    lookupUserEmail,
    isLoading,
  };
};
