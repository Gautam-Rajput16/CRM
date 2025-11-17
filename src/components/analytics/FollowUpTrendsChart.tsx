import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { ChevronRight } from 'lucide-react';

interface FollowUpTrendsChartProps {
  followUpTrends: Array<{
    date: string;
    count: number;
  }>;
  onClick?: () => void;
}

export const FollowUpTrendsChart: React.FC<FollowUpTrendsChartProps> = ({
  followUpTrends,
  onClick,
}) => {
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get today's date for highlighting
  const today = new Date().toISOString().split('T')[0];
  
  // Separate overdue, today, and upcoming
  const categorizedData = followUpTrends.map(item => {
    const itemDate = new Date(item.date);
    const todayDate = new Date(today);
    
    if (itemDate < todayDate) {
      return { ...item, category: 'overdue' };
    } else if (item.date === today) {
      return { ...item, category: 'today' };
    } else {
      return { ...item, category: 'upcoming' };
    }
  });

  const data = {
    labels: followUpTrends.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Follow-ups Scheduled',
        data: followUpTrends.map(item => item.count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: followUpTrends.map(item => {
          const itemDate = new Date(item.date);
          const todayDate = new Date(today);
          
          if (itemDate < todayDate) {
            return 'rgba(239, 68, 68, 1)'; // Red for overdue
          } else if (item.date === today) {
            return 'rgba(34, 197, 94, 1)'; // Green for today
          } else {
            return 'rgba(59, 130, 246, 1)'; // Blue for upcoming
          }
        }),
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            const originalDate = followUpTrends[index].date;
            return new Date(originalDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: function (context) {
            const index = context.dataIndex;
            const item = categorizedData[index];
            let status = '';
            
            if (item.category === 'overdue') {
              status = ' (Overdue)';
            } else if (item.category === 'today') {
              status = ' (Today)';
            } else {
              status = ' (Upcoming)';
            }
            
            return `Follow-ups: ${context.parsed.y}${status}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const totalFollowUps = followUpTrends.reduce((sum, item) => sum + item.count, 0);
  const overdueCount = categorizedData
    .filter(item => item.category === 'overdue')
    .reduce((sum, item) => sum + item.count, 0);
  const todayCount = categorizedData
    .filter(item => item.category === 'today')
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Follow-up Trends</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            Total: {totalFollowUps} follow-ups
          </div>
          {onClick && (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      <div className="relative h-64">
        {followUpTrends.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📅</div>
              <div>No follow-up data available</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status indicators */}
      {followUpTrends.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-gray-600">Overdue: </span>
              <span className="font-medium text-red-600 ml-1">{overdueCount}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-600">Today: </span>
              <span className="font-medium text-green-600 ml-1">{todayCount}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-600">Upcoming: </span>
              <span className="font-medium text-blue-600 ml-1">
                {totalFollowUps - overdueCount - todayCount}
              </span>
            </div>
          </div>
          
          {onClick && (
            <div className="text-xs text-gray-500 mt-2 text-center">
              Click to view detailed timeline
            </div>
          )}
        </div>
      )}
    </div>
  );
};
