import React, { useState } from 'react';
import { MessageSquare, Plus, Clock, User } from 'lucide-react';
import { Lead } from '../types/Lead';

interface FollowUpUpdatesProps {
  lead: Lead;
  currentUser: { id: string; name: string };
  onAddUpdate: (leadId: string, content: string) => Promise<void>;
}

export const FollowUpUpdates: React.FC<FollowUpUpdatesProps> = ({
  lead,
  currentUser,
  onAddUpdate,
}) => {
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [updateContent, setUpdateContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddUpdate(lead.id, updateContent.trim());
      setUpdateContent('');
      setIsAddingUpdate(false);
    } catch (error) {
      console.error('Error adding update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Follow-up Updates</h3>
          <span className="text-sm text-gray-500">
            ({lead.followUpUpdates?.length || 0})
          </span>
        </div>
        <button
          onClick={() => setIsAddingUpdate(!isAddingUpdate)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Update
        </button>
      </div>

      {/* Add Update Form */}
      {isAddingUpdate && (
        <form onSubmit={handleSubmitUpdate} className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Update
              </label>
              <textarea
                id="update-content"
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="Enter your follow-up update..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingUpdate(false);
                  setUpdateContent('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!updateContent.trim() || isSubmitting}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Update'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Updates List */}
      <div className="space-y-3">
        {lead.followUpUpdates && lead.followUpUpdates.length > 0 ? (
          lead.followUpUpdates
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((update) => (
              <div key={update.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(update.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {update.content}
                </p>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No follow-up updates yet</p>
            <p className="text-xs">Add your first update to track progress</p>
          </div>
        )}
      </div>
    </div>
  );
};
