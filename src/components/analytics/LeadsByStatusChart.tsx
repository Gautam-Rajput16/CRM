import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface LeadsByStatusChartProps {
  statusCounts: {
    '-': number;
    'Follow-up': number;
    'Special Follow-up': number;
    'Confirmed': number;
    'Not Connected': number;
    'Interested': number;
    'Not - Interested': number;
    'Meeting': number;
  };
}

export const LeadsByStatusChart: React.FC<LeadsByStatusChartProps> = ({
  statusCounts,
}) => {
  const data = {
    labels: ['Pending', 'Follow-up', 'Special Follow-up', 'Confirmed', 'Not Connected', 'Interested', 'Not - Interested', 'Meeting'],
    datasets: [
      {
        data: [
          statusCounts['-'],
          statusCounts['Follow-up'],
          statusCounts['Special Follow-up'],
          statusCounts['Confirmed'],
          statusCounts['Not Connected'],
          statusCounts['Interested'],
          statusCounts['Not - Interested'],
          statusCounts['Meeting'],
        ],
        backgroundColor: [
          '#6B7280', // Gray for -
          '#F59E0B', // Yellow for Follow-up
          '#FB923C', // Orange for Special Follow-up
          '#10B981', // Green for Confirmed
          '#1cb0b8', // Cyan for Not Connected
          '#3B82F6', // Blue for Interested
          '#F97316', // Orange for Not - Interested
          '#8B5CF6', // Purple for Meeting
        ],
        borderColor: [
          '#6B7280',
          '#F59E0B',
          '#FB923C',
          '#10B981',
          '#1cb0b8',
          '#3B82F6',
          '#F97316',
          '#8B5CF6',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#9CA3AF',
          '#FBBF24',
          '#FDBA74',
          '#34D399',
          '#67dad9',
          '#60A5FA',
          '#FB923C',
          '#A78BFA',
        ],
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%', // Makes it a donut chart
  };

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Leads by Status</h3>
        <div className="text-sm text-gray-600">Total: {total}</div>
      </div>

      <div className="relative h-64">
        {total > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>No leads data available</div>
            </div>
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-600">
            {statusCounts['-']}
          </div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600">
            {statusCounts['Follow-up']}
          </div>
          <div className="text-xs text-gray-600">Follow-up</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-600">
            {statusCounts['Special Follow-up']}
          </div>
          <div className="text-xs text-gray-600">Special Follow-up</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">
            {statusCounts['Confirmed']}
          </div>
          <div className="text-xs text-gray-600">Confirmed</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-cyan-600">
            {statusCounts['Not Connected']}
          </div>
          <div className="text-xs text-gray-600">Not Connected</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-600">
            {statusCounts['Interested']}
          </div>
          <div className="text-xs text-gray-600">Interested</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-600">
            {statusCounts['Not - Interested']}
          </div>
          <div className="text-xs text-gray-600">Not - Interested</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-purple-600">
            {statusCounts['Meeting']}
          </div>
          <div className="text-xs text-gray-600">Meeting</div>
        </div>
      </div>
    </div>
  );
};
