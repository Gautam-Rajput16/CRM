import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export const useProfiles = (includeAdmins: boolean = false, refreshFlag?: boolean) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setIsLoading(true);
    
    // Function to fetch all profiles using pagination
    const fetchAllProfiles = async () => {
      let allProfiles: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .order('name')
          .range(from, from + pageSize - 1);

        if (pageError) {
          throw pageError;
        }

        if (pageData && pageData.length > 0) {
          allProfiles = [...allProfiles, ...pageData];
          from += pageSize;
          hasMore = pageData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return allProfiles;
    };

    try {
      const data = await fetchAllProfiles();
      // Filter based on includeAdmins parameter
      const filteredProfiles = includeAdmins 
        ? (data || [])
        : (data || []).filter(profile => profile.role === 'user' || profile.role === 'sales_executive');
      setProfiles(filteredProfiles);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      setError(error.message || 'Failed to fetch profiles');
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [includeAdmins, refreshFlag]);

  const refreshProfiles = () => {
    fetchProfiles();
  };

  const addProfile = async (profileData: Omit<Profile, 'id'>) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await refreshProfiles();
    return data;
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await refreshProfiles();
    return data;
  };

  const deleteProfile = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    await refreshProfiles();
  };

  return { 
    profiles, 
    isLoading, 
    error, 
    refreshProfiles,
    addProfile,
    updateProfile,
    deleteProfile
  };
};
