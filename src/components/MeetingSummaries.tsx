import React, { useState } from 'react';
import { Calendar, Plus, Clock, User } from 'lucide-react';
import { Lead } from '../types/Lead';

interface MeetingSummariesProps {
  lead: Lead;
  currentUser: { id: string; name: string };
  onAddSummary: (leadId: string, content: string) => Promise<void>;
}

export const MeetingSummaries: React.FC<MeetingSummariesProps> = ({
  lead,
  currentUser,
  onAddSummary,
}) => {
  const [isAddingSummary, setIsAddingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddSummary(lead.id, summaryContent.trim());
      setSummaryContent('');
      setIsAddingSummary(false);
    } catch (error) {
      console.error('Error adding meeting summary:', error);
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
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">Meeting Summaries</h3>
          <span className="text-sm text-gray-500">
            ({lead.meetingSummaries?.length || 0})
          </span>
        </div>
        <button
          onClick={() => setIsAddingSummary(!isAddingSummary)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Summary
        </button>
      </div>

      {/* Add Summary Form */}
      {isAddingSummary && (
        <form onSubmit={handleSubmitSummary} className="bg-purple-50 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="summary-content" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Summary
              </label>
              <textarea
                id="summary-content"
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                placeholder="Enter meeting summary, outcomes, next steps..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSummary(false);
                  setSummaryContent('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!summaryContent.trim() || isSubmitting}
                className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Summary'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Summaries List */}
      <div className="space-y-3">
        {lead.meetingSummaries && lead.meetingSummaries.length > 0 ? (
          lead.meetingSummaries
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((summary) => (
              <div key={summary.id} className="bg-white border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(summary.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {summary.content}
                </p>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-300" />
            <p className="text-sm">No meeting summaries yet</p>
            <p className="text-xs">Add your first summary to track meeting outcomes</p>
          </div>
        )}
      </div>
    </div>
  );
};
