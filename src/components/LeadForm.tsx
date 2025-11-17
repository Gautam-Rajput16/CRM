import React, { useState, useEffect } from 'react';
import { LeadStatus, LeadCreate } from '../types/Lead';
import { useProfiles } from '../hooks/useProfiles';
import { getDisplayStatus, getDatabaseStatus } from '../utils/statusDisplay';
import { UserPlus, Phone, User, FileText, ClipboardList } from 'lucide-react';

interface LeadFormProps {
  onAddLead: (lead: LeadCreate) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onAddLead }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    status: '-' as LeadStatus,
    followUpDate: new Date().toISOString().split('T')[0], // Default to current date
    followUpTime: '09:00', // Default to 9 AM
    notes: '',
    requirement: '',
    assignedUserId: '',
  });

  const [displayStatus, setDisplayStatus] = useState('Pending');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch only employees with role 'user'
  const { profiles, isLoading: profilesLoading } = useProfiles(false);
  const userEmployees = profiles.filter((profile) => profile.role === 'user');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.assignedUserId) {
      newErrors.assignedUserId = 'Please assign to an employee';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Find the selected employee to get their name
    const selectedEmployee = userEmployees.find(emp => emp.id === formData.assignedUserId);
    
    // If date is selected but no time, default to 9 AM
    const submissionData = {
      ...formData,
      followUpTime: formData.followUpDate && !formData.followUpTime ? '09:00' : formData.followUpTime,
      assignedUserName: selectedEmployee?.name || undefined
    };

    // Remove assignedUserId if empty string
    const leadToSubmit = { ...submissionData };
    if (!leadToSubmit.assignedUserId) {
      (leadToSubmit as any).assignedUserId = undefined;
      (leadToSubmit as any).assignedUserName = undefined;
    }

    onAddLead(leadToSubmit);
    
    // Clear form
    setFormData({
      fullName: '',
      phone: '',
      status: '-',
      followUpDate: new Date().toISOString().split('T')[0], // Reset to current date
      followUpTime: '09:00', // Reset to 9 AM
      notes: '',
      requirement: '',
      assignedUserId: '',
    });
    setErrors({});
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  useEffect(() => {
    setDisplayStatus(getDisplayStatus(formData.status));
  }, [formData.status]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Add New Lead</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
              required
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter phone number"
              required
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="requirement" className="block text-sm font-medium text-gray-700 mb-2">
            <ClipboardList className="inline h-4 w-4 mr-1" />
            Requirement (Optional)
          </label>
          <textarea
            id="requirement"
            value={formData.requirement}
            onChange={(e) => handleChange('requirement', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Describe the lead's requirements..."
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Status *
          </label>
          <select
            id="status"
            value={displayStatus}
            onChange={(e) => handleChange('status', getDatabaseStatus(e.target.value))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="Pending">Pending</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Special Follow-up">Special Follow-up</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Not Connected">Not Connected</option>
            <option value="Interested">Interested</option>
            <option value="Not - Interested">Not - Interested</option>
            <option value="Meeting">Meeting</option>
          </select>
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status}</p>
          )}
        </div>

        <div>
          <label htmlFor="assignedUserId" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Assign to Employee *
          </label>
          <select
            id="assignedUserId"
            value={formData.assignedUserId}
            onChange={(e) => handleChange('assignedUserId', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.assignedUserId ? 'border-red-500' : 'border-gray-300'}`}
            disabled={profilesLoading || userEmployees.length === 0}
            required
          >
            <option value="">Select employee</option>
            {userEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} </option>
            ))}
          </select>
          {errors.assignedUserId && (
            <p className="text-red-500 text-sm mt-1">{errors.assignedUserId}</p>
          )}
          {profilesLoading && (
            <p className="text-gray-500 text-sm mt-1">Loading employees...</p>
          )}
          {!profilesLoading && userEmployees.length === 0 && (
            <p className="text-orange-500 text-sm mt-1">No employees with 'user' role found</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2 justify-center"
        >
          <UserPlus className="h-5 w-5" />
          Add Lead
        </button>
      </form>
    </div>
  );
};