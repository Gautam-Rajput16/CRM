import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, X, TrendingUp } from 'lucide-react';
import { useDailyPerformance } from '../hooks/useDailyPerformance';

interface PerformanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  canEdit?: boolean;
  title?: string;
  subtitle?: string;
}

interface DayPerformance {
  meetingsScheduled: number;
  meetingsDone: number;
  quotationsSent: number;
  confirmations: number;
}

type PerformanceMap = Record<string, DayPerformance>;

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildMonthCells = (monthDate: Date): (Date | null)[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

export const PerformanceCalendarModal: React.FC<PerformanceCalendarModalProps> = ({
  isOpen,
  onClose,
  userId,
  canEdit = true,
  title,
  subtitle,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledInput, setScheduledInput] = useState('');
  const [doneInput, setDoneInput] = useState('');
  const [quotationInput, setQuotationInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const { entries, isLoading, saveEntry, deleteEntry } = useDailyPerformance(userId);

  const performance: PerformanceMap = useMemo(() => {
    const map: PerformanceMap = {};
    entries.forEach(entry => {
      map[entry.date] = {
        meetingsScheduled: entry.meetingsScheduled,
        meetingsDone: entry.meetingsDone,
        quotationsSent: entry.quotationsSent,
        confirmations: entry.confirmations,
      };
    });
    return map;
  }, [entries]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      const key = getDateKey(today);
      const dayData = performance[key];
      setScheduledInput(dayData ? String(dayData.meetingsScheduled) : '');
      setDoneInput(dayData ? String(dayData.meetingsDone) : '');
      setQuotationInput(dayData ? String(dayData.quotationsSent) : '');
      setConfirmInput(dayData ? String(dayData.confirmations) : '');
    }
  }, [isOpen, performance, selectedDate]);

  if (!isOpen) return null;

  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    const key = getDateKey(date);
    const dayData = performance[key];
    setScheduledInput(dayData ? String(dayData.meetingsScheduled) : '');
    setDoneInput(dayData ? String(dayData.meetingsDone) : '');
    setQuotationInput(dayData ? String(dayData.quotationsSent) : '');
    setConfirmInput(dayData ? String(dayData.confirmations) : '');
  };

  const handleSave = () => {
    if (!selectedDate || !userId) return;
    const meetingsScheduled =
      Number.isNaN(Number(scheduledInput)) || scheduledInput === '' ? 0 : Number(scheduledInput);
    const meetingsDone = Number.isNaN(Number(doneInput)) || doneInput === '' ? 0 : Number(doneInput);
    const quotationsSent =
      Number.isNaN(Number(quotationInput)) || quotationInput === '' ? 0 : Number(quotationInput);
    const confirmations = Number.isNaN(Number(confirmInput)) || confirmInput === '' ? 0 : Number(confirmInput);
    const dateKey = getDateKey(selectedDate);
    saveEntry(dateKey, meetingsScheduled, meetingsDone, quotationsSent, confirmations, userId);
  };

  const handleClear = () => {
    if (!selectedDate || !userId) return;
    const dateKey = getDateKey(selectedDate);
    deleteEntry(dateKey, userId);
    setScheduledInput('');
    setDoneInput('');
    setQuotationInput('');
    setConfirmInput('');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      return new Date(year, month - 1, 1);
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      return new Date(year, month + 1, 1);
    });
  };

  const monthCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const selectedKey = selectedDate ? getDateKey(selectedDate) : null;
  const selectedPerformance = selectedKey ? performance[selectedKey] : undefined;

  const monthTotals = useMemo(() => {
    let meetingsScheduledTotal = 0;
    let meetingsDoneTotal = 0;
    let quotationsTotal = 0;
    let confirmationsTotal = 0;
    const monthYearKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    Object.entries(performance).forEach(([dateKey, value]) => {
      const d = new Date(dateKey);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key === monthYearKey) {
        meetingsScheduledTotal += value.meetingsScheduled;
        meetingsDoneTotal += value.meetingsDone;
        quotationsTotal += value.quotationsSent;
        confirmationsTotal += value.confirmations;
      }
    });
    return { meetingsScheduledTotal, meetingsDoneTotal, quotationsTotal, confirmationsTotal };
  }, [currentMonth, performance]);

  const headerTitle = title || 'Daily Performance Calendar';
  const headerSubtitle =
    subtitle || 'Track your daily meetings and sales pipeline stages';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{headerTitle}</h2>
              <p className="text-sm text-gray-500">{headerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 flex-1">
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={handlePrevMonth}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Prev
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{monthLabel}</p>
                <p className="text-xs text-gray-500">
                  {canEdit ? 'Tap a day to add your numbers' : 'Tap a day to view numbers'}
                </p>
              </div>
              <button
                onClick={handleNextMonth}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Next
              </button>
            </div>

            <div className="px-4 pb-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-medium text-gray-500">
                <div className="text-center">Sun</div>
                <div className="text-center">Mon</div>
                <div className="text-center">Tue</div>
                <div className="text-center">Wed</div>
                <div className="text-center">Thu</div>
                <div className="text-center">Fri</div>
                <div className="text-center">Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {monthCells.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="h-16" />;
                  }
                  const key = getDateKey(date);
                  const value = performance[key];
                  const isSelected = selectedDate && key === getDateKey(selectedDate);
                  const today = isToday(date);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDayClick(date)}
                      className={`h-16 rounded-lg border text-left px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : today
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-900">{date.getDate()}</span>
                        {value && (value.meetingsScheduled > 0 || value.meetingsDone > 0) && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            {value.meetingsDone} done
                          </span>
                        )}
                      </div>
                      {value && (value.quotationsSent > 0 || value.confirmations > 0) && (
                        <div className="text-[10px] text-emerald-700 font-medium truncate">
                          Q:{value.quotationsSent} · C:{value.confirmations}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col bg-gray-50">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">This Month</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Scheduled: {monthTotals.meetingsScheduledTotal} · Done: {monthTotals.meetingsDoneTotal}
                  </p>
                  <p className="text-xs text-gray-600">
                    Quotation sent: {monthTotals.quotationsTotal} · Confirm: {monthTotals.confirmationsTotal}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Selected Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'No date selected'}
                </p>
              </div>

              <div className="space-y-3">
                {canEdit ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meetings scheduled
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={scheduledInput}
                        onChange={e => setScheduledInput(e.target.value)}
                        placeholder="Enter number of meetings scheduled"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meetings done
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={doneInput}
                        onChange={e => setDoneInput(e.target.value)}
                        placeholder="Enter number of meetings done"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quotation sent
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={quotationInput}
                        onChange={e => setQuotationInput(e.target.value)}
                        placeholder="Enter number of quotations sent"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Confirm
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={confirmInput}
                        onChange={e => setConfirmInput(e.target.value)}
                        placeholder="Enter number of confirmations"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                      />
                    </div>

                    {selectedPerformance &&
                      (selectedPerformance.meetingsScheduled > 0 ||
                        selectedPerformance.meetingsDone > 0 ||
                        selectedPerformance.quotationsSent > 0 ||
                        selectedPerformance.confirmations > 0) && (
                        <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Saved meetings scheduled</span>
                            <span className="font-semibold">{selectedPerformance.meetingsScheduled}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Saved meetings done</span>
                            <span className="font-semibold">{selectedPerformance.meetingsDone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Saved quotations sent</span>
                            <span className="font-semibold">{selectedPerformance.quotationsSent}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Saved confirmations</span>
                            <span className="font-semibold">{selectedPerformance.confirmations}</span>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Meetings scheduled</span>
                      <span className="font-semibold">
                        {selectedPerformance ? selectedPerformance.meetingsScheduled : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Meetings done</span>
                      <span className="font-semibold">
                        {selectedPerformance ? selectedPerformance.meetingsDone : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quotation sent</span>
                      <span className="font-semibold">
                        {selectedPerformance ? selectedPerformance.quotationsSent : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confirm</span>
                      <span className="font-semibold">
                        {selectedPerformance ? selectedPerformance.confirmations : 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                <span>Blue badge shows meetings done; text shows quotation and confirm counts for that day.</span>
              </div>
              {canEdit && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading || !selectedDate}
                    className={`px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 ${
                      isLoading || !selectedDate ? 'opacity-60 cursor-not-allowed hover:bg-gray-50' : ''
                    }`}
                  >
                    Clear day
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading || !selectedDate}
                    className={`px-4 py-2 text-xs sm:text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm ${
                      isLoading || !selectedDate ? 'opacity-60 cursor-not-allowed hover:bg-blue-600' : ''
                    }`}
                  >
                    {isLoading ? 'Saving…' : 'Save day'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
