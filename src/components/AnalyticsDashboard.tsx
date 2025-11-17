import React, { useState } from 'react';
import { Lead } from '../types/Lead';
import { useAnalytics } from '../hooks/useAnalytics';
import '../lib/chartSetup'; // Import chart setup to register components
import { TotalLeadsCard } from './analytics/TotalLeadsCard';
import { OverdueFollowUpsCard } from './analytics/OverdueFollowUpsCard';
import { OverdueLeadsModal } from './analytics/OverdueLeadsModal';
import { FollowUpTimelineModal } from './analytics/FollowUpTimelineModal';
import { LeadStatusModal } from './analytics/LeadStatusModal';
import { LeadsByStatusChart } from './analytics/LeadsByStatusChart';
import { EmployeeLeadsChart } from './analytics/EmployeeLeadsChart';
import { FollowUpTrendsChart } from './analytics/FollowUpTrendsChart';

import { BarChart3, Users, Calendar, Target } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  role?: string;
}

interface AnalyticsDashboardProps {
  leads: Lead[];
  isLoading?: boolean;
  currentUserId?: string;
  userRole?: string;
  profiles?: Profile[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  leads,
  isLoading = false,
  currentUserId,
  userRole,
  profiles = [],
}) => {
  const analyticsData = useAnalytics(leads);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Filter overdue follow-ups for the modal
  const getOverdueLeads = () => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(lead => {
      // Only consider leads with "Follow-up" or "Special Follow-up" status
      if (lead.status !== 'Follow-up' && lead.status !== 'Special Follow-up') return false;
      
      // Role-based filtering
      if (userRole === 'sales_executive') {
        // Sales executives can only see leads assigned to them
        if (lead.assignedUserId !== currentUserId) return false;
      }
      
      if (!lead.followUpDate) return false;
      const followUpDate = new Date(lead.followUpDate).toISOString().split('T')[0];
      return followUpDate < today;
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Comprehensive insights into your CRM performance and lead management
        </p>
      </div>

      {/* Overview Cards - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Leads Overview - Takes 2 columns */}
        <div className="lg:col-span-2">
          <TotalLeadsCard
            totalLeads={analyticsData.totalLeads}
            statusCounts={analyticsData.statusCounts}
            onStatusClick={(status) => {
              setSelectedStatus(status);
              setShowStatusModal(true);
            }}
          />
        </div>
      
        {/* Overdue Follow-ups Card - Takes 1 column */}
        <div className="lg:col-span-1">
          <OverdueFollowUpsCard 
            leads={leads} 
            onClick={() => setShowOverdueModal(true)}
            currentUserId={currentUserId}
            userRole={userRole}
          />
        </div>
      </div>

      {/* Charts Grid - 2x2 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Leads by Status Chart */}
        <div className="flex flex-col">
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Status Distribution</h2>
          </div>
          <LeadsByStatusChart statusCounts={analyticsData.statusCounts} />
        </div>

        {/* Employee-wise Leads Chart */}
        <div className="flex flex-col">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Employee Performance</h2>
          </div>
          <EmployeeLeadsChart employeeLeads={analyticsData.employeeLeads} />
        </div>

        {/* Follow-up Trends Chart */}
        <div className="flex flex-col">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Follow-up Timeline</h2>
          </div>
          <FollowUpTrendsChart 
            followUpTrends={analyticsData.followUpTrends}
            onClick={() => setShowTimelineModal(true)}
          />
        </div>

        {/* Conversion Funnel Chart */}
        {/* <div className="flex flex-col">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Conversion Analysis</h2>
          </div>
          <ConversionFunnelChart
            conversionData={analyticsData.conversionData}
            conversionRate={analyticsData.conversionRate}
          />
        </div> */}
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.totalLeads}
            </div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analyticsData.statusCounts['Follow-up']}
            </div>
            <div className="text-sm text-gray-600">Pending Follow-ups</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData.employeeLeads.length}
            </div>
            <div className="text-sm text-gray-600">Active Employees</div>
          </div>
        </div>
      </div>

      {/* Data freshness indicator */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Data updated in real-time • Last refresh: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Overdue Leads Modal */}
      <OverdueLeadsModal
        isOpen={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        overdueLeads={getOverdueLeads()}
        profiles={profiles}
      />

      {/* Follow-up Timeline Modal */}
      <FollowUpTimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        leads={leads}
        currentUserId={currentUserId}
        userRole={userRole}
        profiles={profiles}
      />

      {/* Lead Status Modal */}
      <LeadStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        leads={leads}
        status={selectedStatus}
        profiles={profiles}
      />
    </div>
  );
};
