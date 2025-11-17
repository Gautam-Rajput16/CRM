import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ConversionFunnelChartProps {
  conversionData: {
    confirmed: number;
    notConnected: number;
    total: number;
  };
  conversionRate: number;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  conversionData,
  conversionRate,
}) => {
  const { confirmed, notConnected, total } = conversionData;

  const data = {
    labels: ['Confirmed', 'Not Connected'],
    datasets: [
      {
        label: 'Leads',
        data: [confirmed, notConnected],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for confirmed
          'rgba(239, 68, 68, 0.8)',  // Red for not connected
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
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
          display: false,
        },
      },
    },
  };

  // Determine conversion rate status
  const getConversionStatus = () => {
    if (conversionRate >= 70) return { status: 'excellent', color: 'text-green-600', icon: TrendingUp };
    if (conversionRate >= 50) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
    if (conversionRate >= 30) return { status: 'average', color: 'text-yellow-600', icon: TrendingUp };
    return { status: 'needs improvement', color: 'text-red-600', icon: TrendingDown };
  };

  const conversionStatus = getConversionStatus();
  const StatusIcon = conversionStatus.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
        <div className="text-sm text-gray-600">
          Total Processed: {total}
        </div>
      </div>
      
      {/* Conversion Rate Display */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <StatusIcon className={`h-6 w-6 ${conversionStatus.color} mr-2`} />
          <div className={`text-3xl font-bold ${conversionStatus.color}`}>
            {conversionRate.toFixed(1)}%
          </div>
        </div>
        <div className="text-sm text-gray-600">Conversion Rate</div>
        <div className={`text-xs ${conversionStatus.color} capitalize`}>
          {conversionStatus.status}
        </div>
      </div>
      
      <div className="relative h-48">
        {total > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div>No conversion data available</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Detailed breakdown */}
      {total > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="text-xs text-green-600">
              {total > 0 ? Math.round((confirmed / total) * 100) : 0}% of total
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{notConnected}</div>
            <div className="text-sm text-gray-600">Not Connected</div>
            <div className="text-xs text-red-600">
              {total > 0 ? Math.round((notConnected / total) * 100) : 0}% of total
            </div>
          </div>
        </div>
      )}
      
      {/* Conversion insights */}
      {total > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-1">Insights:</div>
          <div className="text-xs text-gray-600">
            {conversionRate >= 50 
              ? `Great job! Your conversion rate of ${conversionRate.toFixed(1)}% is above average.`
              : conversionRate >= 30
              ? `Your conversion rate of ${conversionRate.toFixed(1)}% has room for improvement. Consider reviewing your follow-up strategies.`
              : `Your conversion rate of ${conversionRate.toFixed(1)}% needs attention. Focus on improving lead qualification and follow-up processes.`
            }
          </div>
        </div>
      )}
    </div>
  );
};
