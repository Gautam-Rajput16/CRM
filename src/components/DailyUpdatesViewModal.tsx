import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, TrendingUp, AlertCircle, Target, User, MessageSquare } from 'lucide-react';
import { useTaskDailyUpdates } from '../hooks/useTaskDailyUpdates';
import { TaskDailyUpdate } from '../types/TaskDailyUpdate';

interface DailyUpdatesViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export const DailyUpdatesViewModal: React.FC<DailyUpdatesViewModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const [updates, setUpdates] = useState<TaskDailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTaskUpdates } = useTaskDailyUpdates();

  useEffect(() => {
    if (isOpen && task) {
      loadUpdates();
    }
  }, [isOpen, task]);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const taskUpdates = await getTaskUpdates(task.id);
      setUpdates(taskUpdates || []);
    } catch (error) {
      console.error('Error loading daily updates:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 60) return 'text-blue-600 bg-blue-100';
    if (progress >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Daily Updates</h2>
              <p className="text-sm text-gray-600">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Task Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span><strong>Assigned to:</strong> {task.assignedToName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading updates...</span>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Daily Updates</h3>
              <p className="text-gray-500">No daily updates have been submitted for this task yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {updates.map((update, index) => (
                <div
                  key={update.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Update Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {new Date(update.updateDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {update.hoursWorked && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{update.hoursWorked}h worked</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(update.progressPercentage)}`}>
                        {update.progressPercentage}% Complete
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(update.progressPercentage)}`}
                        style={{ width: `${update.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Update Content */}
                  <div className="space-y-4">
                    {/* Work Completed */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Work Completed
                      </h4>
                      <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                        {update.workCompleted}
                      </p>
                    </div>

                    {/* Status Update */}
                    {update.statusUpdate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Status Update
                        </h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {update.statusUpdate}
                        </p>
                      </div>
                    )}

                    {/* Challenges */}
                    {update.challengesFaced && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          Challenges Faced
                        </h4>
                        <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                          {update.challengesFaced}
                        </p>
                      </div>
                    )}

                    {/* Next Day Plan */}
                    {update.nextDayPlan && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          Next Day Plan
                        </h4>
                        <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-200">
                          {update.nextDayPlan}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Update Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Update #{updates.length - index}</span>
                    <span>
                      Submitted at {new Date(update.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {updates.length > 0 ? (
                <span>{updates.length} update{updates.length !== 1 ? 's' : ''} found</span>
              ) : (
                <span>No updates available</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
