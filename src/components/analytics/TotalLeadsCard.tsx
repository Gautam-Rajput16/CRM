import React from 'react';
import { Users, UserCheck, UserX, Clock, Heart, HeartOff, Calendar, ChevronRight } from 'lucide-react';

interface TotalLeadsCardProps {
  totalLeads: number;
  statusCounts: {
    '-': number;
    'Follow-up': number;
    'Confirmed': number;
    'Not Connected': number;
    'Interested': number;
    'Not - Interested': number;
    'Meeting': number;
  };
  onStatusClick?: (status: string) => void;
}

export const TotalLeadsCard: React.FC<TotalLeadsCardProps> = ({
  totalLeads,
  statusCounts,
  onStatusClick,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Leads Overview</h3>
        <Users className="h-6 w-6 text-blue-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* Total Leads */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalLeads}</div>
          <div className="text-sm text-gray-600">Total Leads</div>
        </div>

        {/* Dash Status */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['-'] > 0
              ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['-'] > 0 && onStatusClick('-')}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="h-5 w-5 bg-gray-500 rounded mr-1"></div>
            {onStatusClick && statusCounts['-'] > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-600 mb-1">
            {statusCounts['-']}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['-'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['-'] > 0 && (
            <div className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Follow-up */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Follow-up'] > 0
              ? 'cursor-pointer hover:bg-yellow-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Follow-up'] > 0 && onStatusClick('Follow-up')}
        >
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-yellow-500 mr-1" />
            {onStatusClick && statusCounts['Follow-up'] > 0 && (
              <ChevronRight className="h-4 w-4 text-yellow-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {statusCounts['Follow-up']}
          </div>
          <div className="text-sm text-gray-600">Follow-up</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Follow-up'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Follow-up'] > 0 && (
            <div className="text-xs text-yellow-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Confirmed */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Confirmed'] > 0
              ? 'cursor-pointer hover:bg-green-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Confirmed'] > 0 && onStatusClick('Confirmed')}
        >
          <div className="flex items-center justify-center mb-2">
            <UserCheck className="h-5 w-5 text-green-500 mr-1" />
            {onStatusClick && statusCounts['Confirmed'] > 0 && (
              <ChevronRight className="h-4 w-4 text-green-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {statusCounts['Confirmed']}
          </div>
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Confirmed'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Confirmed'] > 0 && (
            <div className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Not Connected */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Not Connected'] > 0
              ? 'cursor-pointer hover:bg-cyan-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Not Connected'] > 0 && onStatusClick('Not Connected')}
        >
          <div className="flex items-center justify-center mb-2">
            <UserX className="h-5 w-5 text-cyan-500 mr-1" />
            {onStatusClick && statusCounts['Not Connected'] > 0 && (
              <ChevronRight className="h-4 w-4 text-cyan-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-cyan-600 mb-1">
            {statusCounts['Not Connected']}
          </div>
          <div className="text-sm text-gray-600">Not Connected</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Not Connected'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Not Connected'] > 0 && (
            <div className="text-xs text-cyan-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Interested */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Interested'] > 0
              ? 'cursor-pointer hover:bg-blue-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Interested'] > 0 && onStatusClick('Interested')}
        >
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-5 w-5 text-blue-500 mr-1" />
            {onStatusClick && statusCounts['Interested'] > 0 && (
              <ChevronRight className="h-4 w-4 text-blue-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {statusCounts['Interested']}
          </div>
          <div className="text-sm text-gray-600">Interested</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Interested'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Interested'] > 0 && (
            <div className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Not - Interested */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Not - Interested'] > 0
              ? 'cursor-pointer hover:bg-orange-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Not - Interested'] > 0 && onStatusClick('Not - Interested')}
        >
          <div className="flex items-center justify-center mb-2">
            <HeartOff className="h-5 w-5 text-orange-500 mr-1" />
            {onStatusClick && statusCounts['Not - Interested'] > 0 && (
              <ChevronRight className="h-4 w-4 text-orange-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {statusCounts['Not - Interested']}
          </div>
          <div className="text-sm text-gray-600">Not - Interested</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Not - Interested'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Not - Interested'] > 0 && (
            <div className="text-xs text-orange-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>

        {/* Meeting */}
        <div
          className={`text-center p-3 rounded-lg transition-all duration-200 group ${onStatusClick && statusCounts['Meeting'] > 0
              ? 'cursor-pointer hover:bg-purple-50 hover:shadow-md transform hover:scale-105'
              : ''
            }`}
          onClick={() => onStatusClick && statusCounts['Meeting'] > 0 && onStatusClick('Meeting')}
        >
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-purple-500 mr-1" />
            {onStatusClick && statusCounts['Meeting'] > 0 && (
              <ChevronRight className="h-4 w-4 text-purple-400 ml-1" />
            )}
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {statusCounts['Meeting']}
          </div>
          <div className="text-sm text-gray-600">Meeting</div>
          <div className="text-xs text-gray-500">
            {totalLeads > 0 ? Math.round((statusCounts['Meeting'] / totalLeads) * 100) : 0}%
          </div>
          {onStatusClick && statusCounts['Meeting'] > 0 && (
            <div className="text-xs text-purple-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
