import React, { useState } from 'react';
import { Users, Search, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { EmployeeAnalyticsCard } from './EmployeeAnalyticsCard';
import { Lead } from '../../types/Lead';

interface Profile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface EmployeeAnalyticsDashboardProps {
  leads: Lead[];
  profiles: Profile[];
  isLoading?: boolean;
  onEmployeeClick?: (employeeId: string) => void;
}

export const EmployeeAnalyticsDashboard: React.FC<EmployeeAnalyticsDashboardProps> = ({
  leads,
  profiles,
  isLoading = false,
  onEmployeeClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter employees (users and sales executives)
  const employees = profiles.filter(profile => 
    profile.role === 'user' || profile.role === 'sales_executive'
  );

  // Apply search and role filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchQuery || 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calculate overall statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => 
    leads.some(lead => lead.assignedUserId === emp.id)
  ).length;
  const totalAssignedLeads = leads.filter(lead => lead.assignedUserId).length;
  const avgLeadsPerEmployee = totalEmployees > 0 ? Math.round(totalAssignedLeads / totalEmployees) : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading employee analytics...</div>
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
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Employee Analytics</h1>
        </div>
        <p className="text-gray-600">
          Individual performance insights and lead distribution across your team
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-green-600">{activeEmployees}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Leads</p>
              <p className="text-2xl font-bold text-purple-600">{totalAssignedLeads}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Leads/Employee</p>
              <p className="text-2xl font-bold text-orange-600">{avgLeadsPerEmployee}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="sales_executive">Sales Executives</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Employee Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? "Try adjusting your search criteria or filters"
              : "No employees match the current filters"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeAnalyticsCard
              key={employee.id}
              employee={employee}
              leads={leads}
              onClick={onEmployeeClick ? () => onEmployeeClick(employee.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
