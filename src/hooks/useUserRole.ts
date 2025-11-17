import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'user' | 'admin' | 'team_leader' | 'sales_executive' | 'sales_team_leader' | 'operations_team_leader' | 'operations_team';

export interface UserRoleData {
  role: UserRole | null;
  isAdmin: boolean;
  isTeamLeader: boolean;
  isSalesExecutive: boolean;
  isSalesTeamLeader: boolean;
  isOperationsTeamLeader: boolean;
  isOperationsTeam: boolean;
  canManageUsers: boolean;
  canViewAllLeads: boolean;
  canAccessOperations: boolean;
  loading: boolean;
}

export function useUserRole(userId?: string | null): UserRoleData {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    if (!userId) {
      setRole(null);
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
          setRole(null);
        } else {
          setRole(data.role as UserRole || 'user');
        }
        setLoading(false);
      });
  }, [userId]);

  // Compute derived permissions
  const isAdmin = role === 'admin';
  const isTeamLeader = role === 'team_leader';
  const isSalesExecutive = role === 'sales_executive';
  const isSalesTeamLeader = role === 'sales_team_leader';
  const isOperationsTeamLeader = role === 'operations_team_leader';
  const isOperationsTeam = role === 'operations_team';
  const canManageUsers = isAdmin || isTeamLeader || isSalesTeamLeader || isOperationsTeamLeader;
  const canViewAllLeads = isAdmin || isTeamLeader || isSalesTeamLeader;
  const canAccessOperations = isAdmin || isOperationsTeamLeader || isOperationsTeam;

  return {
    role,
    isAdmin,
    isTeamLeader,
    isSalesExecutive,
    isSalesTeamLeader,
    isOperationsTeamLeader,
    isOperationsTeam,
    canManageUsers,
    canViewAllLeads,
    canAccessOperations,
    loading
  };
}
