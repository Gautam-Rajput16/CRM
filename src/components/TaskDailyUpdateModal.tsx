import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  Calendar,
  Save,
  BarChart3,
} from 'lucide-react';
import { Task } from '../types/Task';
import { TaskDailyUpdate, TaskDailyUpdateForm } from '../types/TaskDailyUpdate';
import { useTaskDailyUpdates } from '../hooks/useTaskDailyUpdates';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfiles';
import { toast } from 'react-hot-toast';

interface TaskDailyUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  existingUpdate?: TaskDailyUpdate | null;
}

export const TaskDailyUpdateModal: React.FC<TaskDailyUpdateModalProps> = ({
  isOpen,
  onClose,
  task,
  existingUpdate,
}) => {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const { createOrUpdateDailyUpdate } = useTaskDailyUpdates();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<TaskDailyUpdateForm>({
    progressPercentage: 0,
    statusUpdate: '',
    workCompleted: '',
    challengesFaced: '',
    nextDayPlan: '',
    hoursWorked: '',
  });

  // Load existing update data when modal opens
  useEffect(() => {
    if (existingUpdate) {
      setFormData({
        progressPercentage: existingUpdate.progressPercentage,
        statusUpdate: existingUpdate.statusUpdate || '',
        workCompleted: existingUpdate.workCompleted,
        challengesFaced: existingUpdate.challengesFaced || '',
        nextDayPlan: existingUpdate.nextDayPlan || '',
        hoursWorked: existingUpdate.hoursWorked?.toString() || '',
      });
    } else {
      // Reset form for new update
      setFormData({
        progressPercentage: 0,
        statusUpdate: '',
        workCompleted: '',
        challengesFaced: '',
        nextDayPlan: '',
        hoursWorked: '',
      });
    }
  }, [existingUpdate, isOpen]);

  const handleSubmit = async () => {
    if (!formData.workCompleted.trim()) {
      toast.error('Please describe the work completed today');
      return;
    }

    if (formData.progressPercentage < 0 || formData.progressPercentage > 100) {
      toast.error('Progress percentage must be between 0 and 100');
      return;
    }

    const hoursWorked = formData.hoursWorked ? parseFloat(formData.hoursWorked) : undefined;
    if (hoursWorked && (hoursWorked < 0 || hoursWorked > 24)) {
      toast.error('Hours worked must be between 0 and 24');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createOrUpdateDailyUpdate({
        taskId: task.id,
        userId: user?.id || '',
        userName: profiles.find(p => p.id === user?.id)?.name || 'Unknown User',
        updateDate: new Date().toISOString().split('T')[0],
        progressPercentage: formData.progressPercentage,
        statusUpdate: formData.statusUpdate.trim() || undefined,
        workCompleted: formData.workCompleted.trim(),
        challengesFaced: formData.challengesFaced.trim() || undefined,
        nextDayPlan: formData.nextDayPlan.trim() || undefined,
        hoursWorked,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Daily Progress Update</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{today}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Task Info */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                <span>Priority: {task.priority}</span>
                <span>Status: {task.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Progress Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Progress Percentage <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progressPercentage}
                onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className={`px-3 py-2 rounded-lg font-semibold text-sm min-w-[80px] text-center ${getProgressColor(formData.progressPercentage)}`}>
                {formData.progressPercentage}%
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Status/Milestone
              </div>
            </label>
            <input
              type="text"
              value={formData.statusUpdate}
              onChange={(e) => setFormData({ ...formData, statusUpdate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Completed design phase, Started development, etc."
            />
          </div>

          {/* Work Completed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Completed Today <span className="text-red-500">*</span>
              </div>
            </label>
            <textarea
              value={formData.workCompleted}
              onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what you accomplished today in detail..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Challenges Faced */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Challenges/Blockers
                </div>
              </label>
              <textarea
                value={formData.challengesFaced}
                onChange={(e) => setFormData({ ...formData, challengesFaced: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any challenges or blockers you faced..."
              />
            </div>

            {/* Next Day Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tomorrow's Plan
                </div>
              </label>
              <textarea
                value={formData.nextDayPlan}
                onChange={(e) => setFormData({ ...formData, nextDayPlan: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What you plan to work on tomorrow..."
              />
            </div>
          </div>

          {/* Hours Worked */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours Worked Today
              </div>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formData.hoursWorked}
              onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0"
            />
            <span className="ml-2 text-sm text-gray-500">hours</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {existingUpdate ? 'Update your daily progress' : 'Submit your daily progress'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.workCompleted.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : existingUpdate ? 'Update' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
