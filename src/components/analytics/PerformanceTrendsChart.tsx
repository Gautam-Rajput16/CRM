import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import '../../lib/chartSetup';
import { DailyPerformance } from '../../types/DailyPerformance';

interface PerformanceTrendsChartProps {
  entries: DailyPerformance[];
}

export const PerformanceTrendsChart: React.FC<PerformanceTrendsChartProps> = ({ entries }) => {
  const { labels, scheduled, done, quotations, confirms } = useMemo(() => {
    const byDate = new Map<
      string,
      { scheduled: number; done: number; quotations: number; confirms: number }
    >();

    entries.forEach(entry => {
      const existing =
        byDate.get(entry.date) ||
        ({ scheduled: 0, done: 0, quotations: 0, confirms: 0 } as {
          scheduled: number;
          done: number;
          quotations: number;
          confirms: number;
        });

      existing.scheduled += entry.meetingsScheduled;
      existing.done += entry.meetingsDone;
      existing.quotations += entry.quotationsSent;
      existing.confirms += entry.confirmations;

      byDate.set(entry.date, existing);
    });

    const sortedDates = Array.from(byDate.keys()).sort();

    return {
      labels: sortedDates,
      scheduled: sortedDates.map(date => byDate.get(date)!.scheduled),
      done: sortedDates.map(date => byDate.get(date)!.done),
      quotations: sortedDates.map(date => byDate.get(date)!.quotations),
      confirms: sortedDates.map(date => byDate.get(date)!.confirms),
    };
  }, [entries]);

  if (!labels.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="text-sm text-gray-600">No performance data for the selected period.</div>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Meetings Scheduled',
        data: scheduled,
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.25,
      },
      {
        label: 'Meetings Done',
        data: done,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.25,
      },
      {
        label: 'Quotations Sent',
        data: quotations,
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.25,
      },
      {
        label: 'Confirmations',
        data: confirms,
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.25,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  const firstDate = labels[0];
  const lastDate = labels[labels.length - 1];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
        <div className="text-xs text-gray-500">
          {firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`}
        </div>
      </div>
      <div className="relative h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
