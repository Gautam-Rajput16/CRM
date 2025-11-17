import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { CRMDashboard } from './components/CRMDashboard';
import AdminDashboard from './components/AdminDashboard';
import SalesExecutiveDashboard from './components/SalesExecutiveDashboard';
import OperationsDashboard from './components/OperationsDashboard';
import OperationsTeamLeaderDashboard from './components/OperationsTeamLeaderDashboard';
import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useAuth } from './hooks/useAuth';
import { useUserRole } from './hooks/useUserRole';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const { user, isAuthenticated, isLoading, login, signup, logout, resetPassword } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');

  // Check URL for reset password flow
  useEffect(() => {
    // Check URL parameters for reset password flow
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setAuthMode('reset-password');
    }
  }, []);

  // Use dynamic role check based on user role in the database
  const { role, isAdmin, isTeamLeader, isSalesExecutive, isSalesTeamLeader, isOperationsTeamLeader, isOperationsTeam, canManageUsers, canAccessOperations, loading: roleLoading } = useUserRole(user?.id);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await login(credentials);
    if (result.success) {
      toast.success('Welcome back! Successfully logged in.');
    } else {
      if (result.error?.includes('Invalid')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (result.error?.includes('not found')) {
        toast.error('Account not found. Please sign up first.');
      } else {
        toast.error(result.error || 'Failed to log in. Please try again.');
      }
    }
    return result;
  };

  const handleSignup = async (signupData: { name: string; email: string; password: string }) => {
    const result = await signup(signupData);
    if (result.success) {
      toast.success('Please Check the Email for Verification.');
    } else {
      if (result.error?.includes('already registered')) {
        toast.error('This email is already registered. Please log in instead.');
      } else if (result.error?.includes('Password')) {
        toast.error(result.error);
      } else {
        toast.error(result.error || 'Failed to create account. Please try again.');
      }
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Successfully logged out. See you again!');
  };

  const handleResetPassword = async (email: string) => {
    const result = await resetPassword(email);
    if (result.success) {
      toast.success('Password reset email sent! Check your inbox.');
    } else {
      toast.error(result.error || 'Failed to send reset email. Please try again.');
    }
    return result;
  };

  const handlePasswordReset = () => {
    setAuthMode('login');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    toast.success('Password updated successfully! Please log in with your new password.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#10B981',
              color: 'white',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
              color: 'white',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#EF4444',
            },
          },
          duration: 3000,
        }}
      />

      <Routes>
        {/* Reset Password Route - accessible without authentication */}
        <Route 
          path="/reset-password" 
          element={<ResetPasswordForm />} 
        />
        
        {/* Authenticated Routes */}
        {isAuthenticated && user ? (
          <>
            {/* Admin and Team Leader Routes */}
            {(isAdmin || isTeamLeader || isSalesTeamLeader) ? (
              <>
                <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
                {/* Redirect any non-/admin route to /admin for admins and team leaders */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            ) : isOperationsTeamLeader ? (
              /* Operations Team Leader Routes */
              <>
                <Route path="/operations-leader" element={<OperationsTeamLeaderDashboard onLogout={handleLogout} />} />
                {/* Redirect any non-/operations-leader route to /operations-leader for operations team leaders */}
                <Route path="*" element={<Navigate to="/operations-leader" replace />} />
              </>
            ) : isOperationsTeam ? (
              /* Operations Team Routes */
              <>
                <Route path="/operations" element={<OperationsDashboard userRole={role || 'operations_team'} userId={user?.id || ''} />} />
                {/* Redirect any non-/operations route to /operations for operations team */}
                <Route path="*" element={<Navigate to="/operations" replace />} />
              </>
            ) : isSalesExecutive ? (
              /* Sales Executive Routes */
              <>
                <Route path="/sales" element={<SalesExecutiveDashboard onLogout={handleLogout} />} />
                {/* Redirect any non-/sales route to /sales for sales executives */}
                <Route path="*" element={<Navigate to="/sales" replace />} />
              </>
            ) : (
              /* Regular User Routes */
              <>
                <Route path="/" element={
                  <>
                    <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
                    <CRMDashboard user={user} onLogout={handleLogout} />
                  </>
                } />
                {/* Redirect admin/sales routes to / if regular user */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="/sales" element={<Navigate to="/" replace />} />
                {/* Catch-all route for authenticated users */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}

          </>
        ) : (
          /* Unauthenticated Routes */
          <>
            <Route path="/" element={
              authMode === 'signup' ? (
                <SignupForm
                  onSignup={handleSignup}
                  onSwitchToLogin={() => setAuthMode('login')}
                  isLoading={isLoading}
                />
              ) : authMode === 'forgot-password' ? (
                <ForgotPasswordForm
                  onResetPassword={handleResetPassword}
                  onBackToLogin={() => setAuthMode('login')}
                  isLoading={isLoading}
                />
              ) : (
                <LoginForm
                  onLogin={handleLogin}
                  onSwitchToSignup={() => setAuthMode('signup')}
                  onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
                  isLoading={isLoading}
                />
              )
            } />
            {/* Redirect all other routes to login for unauthenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      
      {/* PWA Install Prompt - Show only when authenticated */}
      {isAuthenticated && <PWAInstallPrompt />}
    </Router>
  );
}

export default App;