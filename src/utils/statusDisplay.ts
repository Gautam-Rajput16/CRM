/**
 * Utility functions for handling lead status display transformations
 * This allows us to show "Pending" in the UI while keeping "-" in the database
 */

import { Lead } from '../types/Lead';

/**
 * Transform database status to display status
 * Converts "-" to "Pending" for UI display
 */
export const getDisplayStatus = (status: Lead['status']): string => {
  return status === '-' ? 'Pending' : status;
};

/**
 * Transform display status back to database status
 * Converts "Pending" back to "-" for database operations
 */
export const getDatabaseStatus = (displayStatus: string): Lead['status'] => {
  return displayStatus === 'Pending' ? '-' : displayStatus as Lead['status'];
};

/**
 * Get all possible display statuses for dropdowns and filters
 */
export const getAllDisplayStatuses = (): string[] => {
  return [
    'Pending',
    'Follow-up',
    'Special Follow-up',
    'Confirmed',
    'Not Connected',
    'Interested',
    'Not - Interested',
    'Meeting'
  ];
};

/**
 * Get all possible database statuses
 */
export const getAllDatabaseStatuses = (): Lead['status'][] => {
  return [
    '-',
    'Follow-up',
    'Special Follow-up',
    'Confirmed',
    'Not Connected',
    'Interested',
    'Not - Interested',
    'Meeting'
  ];
};
