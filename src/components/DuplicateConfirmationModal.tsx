import React from 'react';
import { X, AlertTriangle, User, Phone, Calendar, FileText } from 'lucide-react';
import { Lead } from '../types/Lead';

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  duplicateLead: Lead;
  newLead: Omit<Lead, 'id' | 'createdAt' | 'userId'>;
}

export const DuplicateConfirmationModal: React.FC<DuplicateConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  duplicateLead,
  newLead
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Duplicate Lead Detected</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              A lead with the same phone number already exists in the system. Please review the details below:
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Existing Lead */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-medium text-red-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Existing Lead
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name:</label>
                  <p className="text-gray-900">{duplicateLead.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {duplicateLead.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      duplicateLead.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      duplicateLead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                      duplicateLead.status === 'Interested' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {duplicateLead.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Follow-up Date:</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(duplicateLead.followUpDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes:</label>
                  <p className="text-gray-900 text-sm">
                    {duplicateLead.notes || 'No notes'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Requirement:</label>
                  <p className="text-gray-900 text-sm">
                    {duplicateLead.requirement || 'No requirement specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created:</label>
                  <p className="text-gray-900 text-sm">
                    {duplicateLead.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* New Lead */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                New Lead (Import)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name:</label>
                  <p className="text-gray-900">{newLead.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {newLead.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      newLead.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      newLead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                      newLead.status === 'Interested' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {newLead.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Follow-up Date:</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(newLead.followUpDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes:</label>
                  <p className="text-gray-900 text-sm">
                    {newLead.notes || 'No notes'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Requirement:</label>
                  <p className="text-gray-900 text-sm">
                    {newLead.requirement || 'No requirement specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">Duplicate Phone Number</h4>
                <p className="text-sm text-orange-700">
                  The phone number <strong>{newLead.phone}</strong> already exists in the system. 
                  Importing this lead will create a duplicate entry.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Skip This Lead
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
            >
              Import Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
