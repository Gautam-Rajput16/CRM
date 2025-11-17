import { useMemo } from 'react';
import { Lead } from '../types/Lead';

export interface AnalyticsData {
  todaysFollowUps: number;
  todaysMeetings: number;
  totalLeads: number;
  statusCounts: {
    '-': number;
    'Follow-up': number;
    'Special Follow-up': number;
    'Confirmed': number;
    'Not Connected': number;
    'Interested': number;
    'Not - Interested': number;
    'Meeting': number;
  };
  employeeLeads: Array<{
    employeeName: string;
    leadCount: number;
  }>;
  followUpTrends: Array<{
    date: string;
    count: number;
  }>;
  conversionRate: number;
  conversionData: {
    confirmed: number;
    notConnected: number;
    total: number;
  };
}

export const useAnalytics = (leads: Lead[]): AnalyticsData => {
  return useMemo(() => {
    // Today's date in YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Today's follow-ups: status === 'Follow-up' or 'Special Follow-up' and followUpDate === today
    const todaysFollowUps = leads.filter(
      lead => (lead.status === 'Follow-up' || lead.status === 'Special Follow-up') && lead.followUpDate === todayStr
    ).length;

    // Today's meetings: status === 'Meeting' and meetingDate === today
    // Count meetings for today: meetingDate === today, or (if not set) followUpDate === today and status === 'Meeting'
    const todaysMeetings = leads.filter(lead => {
      if (lead.meetingDate) {
        return lead.meetingDate === todayStr;
      }
      // fallback: some meetings may only have followUpDate
      return lead.status === 'Meeting' && lead.followUpDate === todayStr;
    }).length;

    // Total leads count
    const totalLeads = leads.length;

    // Status counts
    const statusCounts = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      {
        '-': 0,
        'Follow-up': 0,
        'Special Follow-up': 0,
        'Confirmed': 0,
        'Not Connected': 0,
        'Interested': 0,
        'Not - Interested': 0,
        'Meeting': 0,
      }
    );

    // Employee-wise leads
    const employeeLeadsMap = leads.reduce((acc, lead) => {
      const employeeName = lead.assignedUserName || 'Unassigned';
      acc[employeeName] = (acc[employeeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const employeeLeads = Object.entries(employeeLeadsMap)
      .map(([employeeName, leadCount]) => ({
        employeeName,
        leadCount,
      }))
      .sort((a, b) => b.leadCount - a.leadCount);

    // Follow-up trends (group by follow-up date for leads with Follow-up or Special Follow-up status)
    const followUpTrendsMap = leads.reduce((acc, lead) => {
      if (lead.followUpDate && (lead.status === 'Follow-up' || lead.status === 'Special Follow-up')) {
        const date = lead.followUpDate;
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const followUpTrends = Object.entries(followUpTrendsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    // Conversion rate calculation
    const confirmed = statusCounts['Confirmed'];
    const interested = statusCounts['Interested'];
    const meeting = statusCounts['Meeting'];
    const notConnected = statusCounts['Not Connected'];
    const notInterested = statusCounts['Not - Interested'];
    
    // Positive outcomes: Confirmed, Interested, Meeting
    const positiveOutcomes = confirmed + interested + meeting;
    // Total processed (excluding Follow-up which is still in progress)
    const totalProcessed = confirmed + interested + meeting + notConnected + notInterested;
    const conversionRate = totalProcessed > 0 ? (positiveOutcomes / totalProcessed) * 100 : 0;

    const conversionData = {
      confirmed: positiveOutcomes,
      notConnected: notConnected + notInterested,
      total: totalProcessed,
    };

    return {
      totalLeads,
      statusCounts,
      employeeLeads,
      followUpTrends,
      conversionRate,
      conversionData,
      todaysFollowUps,
      todaysMeetings,
    };
  }, [leads]);
};
