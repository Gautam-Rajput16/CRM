import React from 'react';
import { Users, Calendar, Phone, User, FileText, ClipboardList, MapPin } from 'lucide-react';
import { Lead } from '../types/Lead';
import { LeadRow } from './LeadRow';

interface LeadsTableProps {
  leads: Lead[];
  selectedLeads?: string[];
  onSelectLead?: (leadId: string) => void;
  onUpdateStatus?: (id: string, status: Lead['status']) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateRequirement?: (id: string, requirement: string) => void;
  onUpdateFollowUp?: (id: string, followUpDate: string, followUpTime: string) => void;
  onAddFollowUpUpdate?: (leadId: string, content: string) => Promise<void>;
  onAddMeetingSummary?: (leadId: string, content: string) => Promise<void>;
  onDelete?: (id: string) => void;
  currentUser?: { id: string; name: string } | null;
  hideAssignedTo?: boolean;
  onUpdateMeetingDetails?: (id: string, meetingDescription: string, meetingDate: string, meetingTime: string, meetingLocation: string) => void;
}

import { useProfiles } from '../hooks/useProfiles';

export const LeadsTable: React.FC<LeadsTableProps & { onAssignUser?: (leadId: string, userId: string) => void }> = ({ 
  leads, 
  selectedLeads = [], 
  onSelectLead,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateRequirement,
  onUpdateFollowUp,
  onAddFollowUpUpdate,
  onAddMeetingSummary,
  onDelete,
  currentUser,
  onAssignUser,
  hideAssignedTo = false,
  onUpdateMeetingDetails
}) => {
  const { profiles } = useProfiles();
  (window as any).profilesList = profiles;
  (window as any).onAssignUser = onAssignUser;


  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-500">Add your first lead using the form above, or adjust your search filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Leads ({leads.length})
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {onSelectLead && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600"
                    checked={selectedLeads.length === leads.length}
                    onChange={() => {
                      if (!onSelectLead) return;
                      if (selectedLeads.length === leads.length) {
                        leads.forEach(lead => onSelectLead(lead.id));
                      } else {
                        leads.forEach(lead => {
                          if (!selectedLeads.includes(lead.id)) {
                            onSelectLead(lead.id);
                          }
                        });
                      }
                    }}
                  />
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <User className="inline h-4 w-4 mr-1" />
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ClipboardList className="inline h-4 w-4 mr-1" />
                Requirement
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Calendar className="inline h-4 w-4 mr-1" />
                Follow-up Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <MapPin className="inline h-4 w-4 mr-1" />
                Meeting Details
              </th>
              {!hideAssignedTo && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              {onDelete && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selectedLeads={selectedLeads}
                onSelectLead={onSelectLead}
                onUpdateStatus={onUpdateStatus}
                onUpdateNotes={onUpdateNotes}
                onUpdateRequirement={onUpdateRequirement}
                onUpdateFollowUp={onUpdateFollowUp}
                onAddFollowUpUpdate={onAddFollowUpUpdate}
                onAddMeetingSummary={onAddMeetingSummary}
                onDelete={onDelete}
                currentUser={currentUser}
                hideAssignedTo={hideAssignedTo}
                onUpdateMeetingDetails={onUpdateMeetingDetails}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
