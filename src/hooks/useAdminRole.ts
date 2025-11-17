import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminRole(userId?: string | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data.role === 'admin');
        }
        setLoading(false);
      });
  }, [userId]);

  return { isAdmin, loading };
}
