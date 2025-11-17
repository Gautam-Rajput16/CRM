import React, { useState } from 'react';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Lock, 
  User, 
  Shield,
  Eye,
  EyeOff,
  X,
  Check,
  Minus,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../hooks/useAuth';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'team_leader' | 'sales_executive' | 'sales_team_leader' | 'operations_team_leader' | 'operations_team';
}

// Define role permissions for display
const rolePermissions = {
  user: {
    label: 'User',
    description: 'Basic access with limited permissions',
    permissions: [
      { name: 'View own leads', granted: true },
      { name: 'Create leads', granted: true },
      { name: 'Edit own leads', granted: true },
      { name: 'View all leads', granted: false },
      { name: 'Manage users', granted: false },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: false },
      { name: 'Assign meetings', granted: false },
      { name: 'Access admin panel', granted: false },
    ],
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  sales_executive: {
    label: 'Sales Executive',
    description: 'Enhanced access for sales operations',
    permissions: [
      { name: 'View own leads', granted: true },
      { name: 'Create leads', granted: true },
      { name: 'Edit own leads', granted: true },
      { name: 'View all leads', granted: false },
      { name: 'Manage users', granted: false },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: true },
      { name: 'Assign meetings', granted: false },
      { name: 'Access admin panel', granted: false },
    ],
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  team_leader: {
    label: 'Team Leader',
    description: 'Supervisory access with team management',
    permissions: [
      { name: 'View own leads', granted: true },
      { name: 'Create leads', granted: true },
      { name: 'Edit own leads', granted: true },
      { name: 'View all leads', granted: true },
      { name: 'Manage users', granted: true },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: true },
      { name: 'Assign meetings', granted: true },
      { name: 'Access admin panel', granted: true },
    ],
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  admin: {
    label: 'Admin',
    description: 'Full system access with all permissions',
    permissions: [
      { name: 'View own leads', granted: true },
      { name: 'Create leads', granted: true },
      { name: 'Edit own leads', granted: true },
      { name: 'View all leads', granted: true },
      { name: 'Manage users', granted: true },
      { name: 'Delete users', granted: true },
      { name: 'View analytics', granted: true },
      { name: 'Assign meetings', granted: true },
      { name: 'Access admin panel', granted: true },
    ],
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  sales_team_leader: {
    label: 'Sales Team Leader',
    description: 'Lead sales team with full sales access',
    permissions: [
      { name: 'View own leads', granted: true },
      { name: 'Create leads', granted: true },
      { name: 'Edit own leads', granted: true },
      { name: 'View all leads', granted: true },
      { name: 'Manage users', granted: true },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: true },
      { name: 'Assign meetings', granted: true },
      { name: 'Access admin panel', granted: true },
    ],
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  operations_team_leader: {
    label: 'Operations Team Leader',
    description: 'Manage operations team and tasks',
    permissions: [
      { name: 'View own leads', granted: false },
      { name: 'Create leads', granted: false },
      { name: 'Edit own leads', granted: false },
      { name: 'View all leads', granted: false },
      { name: 'Manage users', granted: true },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: true },
      { name: 'Assign operations tasks', granted: true },
      { name: 'Access operations panel', granted: true },
    ],
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  operations_team: {
    label: 'Operations Team',
    description: 'Execute operations tasks and activities',
    permissions: [
      { name: 'View own leads', granted: false },
      { name: 'Create leads', granted: false },
      { name: 'Edit own leads', granted: false },
      { name: 'View all leads', granted: false },
      { name: 'Manage users', granted: false },
      { name: 'Delete users', granted: false },
      { name: 'View analytics', granted: false },
      { name: 'Complete assigned tasks', granted: true },
      { name: 'Access operations panel', granted: true },
    ],
    color: 'bg-teal-100 text-teal-800 border-teal-300'
  }
};


export const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { profiles, refreshProfiles } = useProfiles(true); // Include both admins and users
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Check if current user is admin or team leader
  const currentUserProfile = profiles.find(profile => profile.id === user?.id);
  const isAdmin = currentUserProfile?.role === 'admin';
  const isTeamLeader = currentUserProfile?.role === 'team_leader';
  const canManageUsers = isAdmin || isTeamLeader;


  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!newUser.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!newUser.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!newUser.password) {
      toast.error('Password is required');
      return false;
    }
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    
    try {
      // Store current admin session before creating new user
      const { data: currentSession } = await supabase.auth.getSession();
      const adminSession = currentSession.session;
      
      if (!adminSession) {
        toast.error('Admin session not found. Please log in again.');
        return;
      }

      // Create user using regular signUp (this will temporarily log in the new user)
      // Pass the role in user_metadata so the trigger can use it
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role, // Pass role to trigger function
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Immediately restore the admin session to prevent logout
        await supabase.auth.setSession(adminSession);
        
        // Refresh profiles to show the new user
        await refreshProfiles();
        
        // Reset form
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
        
        toast.success(`User ${newUser.name} created successfully!`);
        
        // Force reload to ensure admin session is restored and admin dashboard is shown
        window.location.reload();
      }

    } catch (error: any) {
      console.error('User creation error:', error);
    
      
      // Try to restore admin session in case of error
      try {
        const { data: currentSession } = await supabase.auth.getSession();
        if (!currentSession.session) {
          // If no session, try to get it from localStorage or refresh
          await supabase.auth.refreshSession();
        }
      } catch (sessionError) {
        console.error('Session restore error:', sessionError);
      }
    } finally {
      setIsCreating(false);
    }
  };


  if (!isOpen) return null;

  // Show access denied message for users who can't manage users
  if (!canManageUsers) {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
        
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">Only administrators and team leaders can manage users.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Add User Form */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <p className="text-sm text-gray-600 mt-1">Create a new user account for your CRM system</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter password (min 6 characters)"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Role Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          value={newUser.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="user">User</option>
                          <option value="sales_executive">Sales Executive</option>
                          <option value="operations_team">Operations Team</option>
                          {/* Only admins can create team leaders and admins */}
                          {isAdmin && (
                            <>
                              <option value="team_leader">Team Leader</option>
                              <option value="sales_team_leader">Sales Team Leader</option>
                              <option value="operations_team_leader">Operations Team Leader</option>
                              <option value="admin">Admin</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Role Permissions Display */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-5 w-5 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Role Permissions Overview</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">Review the permissions associated with each role before creating a user</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Object.entries(rolePermissions).map(([roleKey, roleData]) => {
                        const isSelected = newUser.role === roleKey;
                        const isAvailable = roleKey === 'user' || roleKey === 'sales_executive' || roleKey === 'operations_team' || isAdmin;
                        
                        return (
                          <div
                            key={roleKey}
                            className={`border-2 rounded-lg p-4 transition-all ${
                              isSelected 
                                ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' 
                                : isAvailable
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-100 opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${roleData.color}`}>
                                {roleData.label}
                              </span>
                              {isSelected && (
                                <div className="bg-blue-500 rounded-full p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-3 min-h-[32px]">{roleData.description}</p>
                            
                            <div className="space-y-1.5">
                              {roleData.permissions.map((permission, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  {permission.granted ? (
                                    <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <Minus className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span className={`text-xs ${
                                    permission.granted ? 'text-gray-700' : 'text-gray-400'
                                  }`}>
                                    {permission.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {!isAvailable && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 italic">Admin only</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Create User
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
