import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, X, Save } from 'lucide-react';
import { Lead } from '../types/Lead';

interface MeetingDetailsFormProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadId: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => void;
}

export const MeetingDetailsForm: React.FC<MeetingDetailsFormProps> = ({
  lead,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    meetingDescription: lead.meetingDescription || '',
    meetingDate: lead.meetingDate || '',
    meetingTime: lead.meetingTime || '',
    meetingLocation: lead.meetingLocation || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.meetingDescription.trim()) {
      newErrors.meetingDescription = 'Meeting description is required';
    }

    if (!formData.meetingDate) {
      newErrors.meetingDate = 'Meeting date is required';
    } else {
      const selectedDate = new Date(formData.meetingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.meetingDate = 'Meeting date cannot be in the past';
      }
    }

    if (!formData.meetingTime) {
      newErrors.meetingTime = 'Meeting time is required';
    }

    if (!formData.meetingLocation.trim()) {
      newErrors.meetingLocation = 'Meeting location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(
      lead.id,
      formData.meetingDescription,
      formData.meetingDate,
      formData.meetingTime,
      formData.meetingLocation
    );
    
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
              <p className="text-sm text-gray-500 mt-1">
                {lead.fullName} • {lead.phone}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Meeting Description */}
            <div>
              <label htmlFor="meetingDescription" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Meeting Description *
              </label>
              <textarea
                id="meetingDescription"
                value={formData.meetingDescription}
                onChange={(e) => handleChange('meetingDescription', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.meetingDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the purpose and agenda of the meeting..."
              />
              {errors.meetingDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.meetingDescription}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Meeting Date *
                </label>
                <input
                  type="date"
                  id="meetingDate"
                  value={formData.meetingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleChange('meetingDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.meetingDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.meetingDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.meetingDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Meeting Time *
                </label>
                <input
                  type="time"
                  id="meetingTime"
                  value={formData.meetingTime}
                  onChange={(e) => handleChange('meetingTime', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.meetingTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.meetingTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.meetingTime}</p>
                )}
              </div>
            </div>

            {/* Meeting Location */}
            <div>
              <label htmlFor="meetingLocation" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Meeting Location *
              </label>
              <input
                type="text"
                id="meetingLocation"
                value={formData.meetingLocation}
                onChange={(e) => handleChange('meetingLocation', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.meetingLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter meeting location (office, online, client location, etc.)"
              />
              {errors.meetingLocation && (
                <p className="text-red-500 text-sm mt-1">{errors.meetingLocation}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Meeting Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
