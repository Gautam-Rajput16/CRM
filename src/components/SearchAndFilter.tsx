import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  employeeFilter?: string;
  onEmployeeFilterChange?: (employeeId: string) => void;
  profiles?: { id: string; name: string }[];
  dateFilter?: string;
  onDateFilterChange?: (dateFilter: string) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  employeeFilter = '',
  onEmployeeFilterChange,
  profiles = [],
  dateFilter = '',
  onDateFilterChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Search className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="-">Pending</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Special Follow-up">Special Follow-up</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Not Connected">Not Connected</option>
            <option value="Interested">Interested</option>
            <option value="Not - Interested">Not - Interested</option>
            <option value="Meeting">Meeting</option>
          </select>
        </div>
        {profiles.length > 0 && onEmployeeFilterChange && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={employeeFilter}
              onChange={(e) => onEmployeeFilterChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Employees</option>
              <option value="unassigned">Unassigned</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </div>
        )}
        {onDateFilterChange && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Dates</option>
              <option value="1d">1 Day Ago</option>
              <option value="7d">Last Week</option>
              <option value="15d">Last 15 Days</option>
              <option value="1m">Last 1 Month</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};