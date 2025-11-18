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
  meetings: number;
  salesAmount: number;
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
  const [meetingsInput, setMeetingsInput] = useState('');
  const [salesInput, setSalesInput] = useState('');
  const { entries, isLoading, saveEntry, deleteEntry } = useDailyPerformance(userId);

  const performance: PerformanceMap = useMemo(() => {
    const map: PerformanceMap = {};
    entries.forEach(entry => {
      map[entry.date] = {
        meetings: entry.meetings,
        salesAmount: entry.salesAmount,
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
      setMeetingsInput(dayData ? String(dayData.meetings) : '');
      setSalesInput(dayData ? String(dayData.salesAmount) : '');
    }
  }, [isOpen, performance, selectedDate]);

  if (!isOpen) return null;

  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    const key = getDateKey(date);
    const dayData = performance[key];
    setMeetingsInput(dayData ? String(dayData.meetings) : '');
    setSalesInput(dayData ? String(dayData.salesAmount) : '');
  };

  const handleSave = () => {
    if (!selectedDate || !userId) return;
    const meetings = Number.isNaN(Number(meetingsInput)) || meetingsInput === '' ? 0 : Number(meetingsInput);
    const salesAmount = Number.isNaN(Number(salesInput)) || salesInput === '' ? 0 : Number(salesInput);
    const dateKey = getDateKey(selectedDate);
    saveEntry(dateKey, meetings, salesAmount, userId);
  };

  const handleClear = () => {
    if (!selectedDate || !userId) return;
    const dateKey = getDateKey(selectedDate);
    deleteEntry(dateKey, userId);
    setMeetingsInput('');
    setSalesInput('');
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
    let meetingsTotal = 0;
    let salesTotal = 0;
    const monthYearKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    Object.entries(performance).forEach(([dateKey, value]) => {
      const d = new Date(dateKey);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key === monthYearKey) {
        meetingsTotal += value.meetings;
        salesTotal += value.salesAmount;
      }
    });
    return { meetingsTotal, salesTotal };
  }, [currentMonth, performance]);

  const headerTitle = title || 'Daily Performance Calendar';
  const headerSubtitle =
    subtitle || 'Track meetings fixed and sales from your calls';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
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

        <div className="grid grid-cols-1 lg:grid-cols-5 flex-1 overflow-hidden">
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
                        {value && value.meetings > 0 && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            {value.meetings} m
                          </span>
                        )}
                      </div>
                      {value && value.salesAmount > 0 && (
                        <div className="text-[10px] text-emerald-700 font-medium truncate">
                          ₹{value.salesAmount.toLocaleString('en-IN')}
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
                    {monthTotals.meetingsTotal} meetings · ₹{monthTotals.salesTotal.toLocaleString('en-IN')}
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
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meetings fixed today
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={meetingsInput}
                        onChange={e => setMeetingsInput(e.target.value)}
                        placeholder="Enter number of meetings"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sales amount from calls (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={salesInput}
                          onChange={e => setSalesInput(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none bg-white"
                        />
                      </div>
                    </div>

                    {selectedPerformance && (selectedPerformance.meetings > 0 || selectedPerformance.salesAmount > 0) && (
                      <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Saved meetings</span>
                          <span className="font-semibold">{selectedPerformance.meetings}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Saved sales</span>
                          <span className="font-semibold">₹{selectedPerformance.salesAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2 text-sm text-gray-800">
                      <div className="flex items-center justify-between">
                        <span>Meetings fixed</span>
                        <span className="font-semibold">
                          {selectedPerformance ? selectedPerformance.meetings : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sales amount (₹)</span>
                        <span className="font-semibold">
                          ₹{selectedPerformance ? selectedPerformance.salesAmount.toLocaleString('en-IN') : 0}
                        </span>
                      </div>
                    </div>
                    {!selectedPerformance && (
                      <p className="text-xs text-gray-500">
                        No performance data saved for this date.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                <span>Blue badge shows meetings; amount shows sales for that day.</span>
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
