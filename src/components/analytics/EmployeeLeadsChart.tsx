import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface EmployeeLeadsChartProps {
  employeeLeads: Array<{
    employeeName: string;
    leadCount: number;
  }>;
}

export const EmployeeLeadsChart: React.FC<EmployeeLeadsChartProps> = ({
  employeeLeads,
}) => {
  // Take top 10 employees to avoid overcrowding
  const topEmployees = employeeLeads.slice(0, 10);
  
  const data = {
    labels: topEmployees.map(emp => emp.employeeName),
    datasets: [
      {
        label: 'Number of Leads',
        data: topEmployees.map(emp => emp.leadCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
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
            return `Leads: ${context.parsed.y}`;
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
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const totalEmployees = employeeLeads.length;
  const totalLeads = employeeLeads.reduce((sum, emp) => sum + emp.leadCount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Employee-wise Leads</h3>
        <div className="text-sm text-gray-600">
          {totalEmployees} employees, {totalLeads} leads
        </div>
      </div>
      
      <div className="relative h-64">
        {topEmployees.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <div>No employee data available</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Top performers summary */}
      {topEmployees.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Top Performers:</div>
          <div className="flex flex-wrap gap-2">
            {topEmployees.slice(0, 3).map((emp, index) => (
              <div
                key={emp.employeeName}
                className="flex items-center bg-blue-50 rounded-full px-3 py-1 text-sm"
              >
                <span className="font-medium text-blue-700">
                  #{index + 1} {emp.employeeName}
                </span>
                <span className="ml-2 text-blue-600">({emp.leadCount})</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {employeeLeads.length > 10 && (
        <div className="mt-2 text-xs text-gray-500">
          Showing top 10 employees. Total: {totalEmployees} employees.
        </div>
      )}
    </div>
  );
};
