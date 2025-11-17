import React, { useState } from 'react';
import { Calendar, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { DailyActivityReport } from './DailyActivityReport';
import { ActivityLogsViewer } from './ActivityLogsViewer';

export const ActivityAnalyticsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'daily' | 'logs'>('daily');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Activity Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Track employee calls and lead status changes for better performance insights
            </p>
          </div>
          
          {/* Date Selector for Daily Report */}
          {activeView === 'daily' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveView('daily')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeView === 'daily'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Daily Summary
          </button>
          <button
            onClick={() => setActiveView('logs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeView === 'logs'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            Activity Logs
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'daily' ? (
        <DailyActivityReport selectedDate={selectedDate} />
      ) : (
        <ActivityLogsViewer />
      )}
    </div>
  );
};
