import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHistory } from '../types';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sacred messages
const SACRED_MESSAGES = [
  "Every mantra brings you closer to divine consciousness",
  "Your dedication today shapes your spiritual tomorrow",
  "Each bead is a step towards inner peace",
  "Consistency in practice leads to transformation",
  "The universe acknowledges your devotion",
  "Your spiritual journey inspires the cosmos",
  "Divine energy flows through your practice",
  "Each count is a prayer heard by the universe"
];

// ── Monday-based week helper ──────────────────────────────────────────────────
// Returns the Monday of the week containing the given date
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  // distance to previous Monday: if Sunday(0) go back 6 days, else go back (day-1) days
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
};

interface HistoryEntry {
  dateStr: string;
  displayDate: string;
  dayName: string;
  dayShort: string;
  dayOfWeek: number;
  mantraCount: number;
  malaCount: number;
  isPracticeDay: boolean;
  isToday: boolean;
  remarks: string[];
  beadsUpdated?: boolean;
  settingsUpdated?: boolean;
}

interface BarData {
  label: string;
  count: number;
  malas: number;
  activeDays: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  displayRange: string;
  isCurrent: boolean;
  weekNumber?: number;
  // drill-down context
  year?: number;
  month?: number;
  weekStart?: string;
}

type DrillLevel = 'yearly' | 'monthly' | 'weekly' | 'daily';

interface DrillState {
  level: DrillLevel;
  year?: number;
  month?: number;
  weekStart?: string;
  label?: string;
}

export function HistoryView() {
  const { selectedMantra, setCurrentView, userName, showToast, updateMantra } = useApp();
  const [filterType, setFilterType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(-1);
  const [showLogs, setShowLogs] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewEntry, setViewEntry] = useState<HistoryEntry | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ date: string; remark: string } | null>(null);
  const barsContainerRef = useRef<HTMLDivElement>(null);

  // Drill-down state (null = normal filterType view)
  const [drillState, setDrillState] = useState<DrillState | null>(null);

  // Double-click tracking
  const lastClickTime = useRef<{ index: number; time: number }>({ index: -1, time: 0 });

  // Swipe states for filter buttons
  const [filterTouchStart, setFilterTouchStart] = useState<number | null>(null);
  const [filterTouchEnd, setFilterTouchEnd] = useState<number | null>(null);
  const [isFilterSwiping, setIsFilterSwiping] = useState(false);

  // Swipe states for bars
  const [barTouchStart, setBarTouchStart] = useState<number | null>(null);
  const [barTouchEnd, setBarTouchEnd] = useState<number | null>(null);
  const [isBarSwiping, setIsBarSwiping] = useState(false);

  const minSwipeDistance = 40;

  const mantra = selectedMantra;

  if (!mantra) {
    setCurrentView('dashboard');
    return null;
  }

  // ── Filter swipe handlers ─────────────────────────────────────────────────────
  const handleFilterTouchStart = (e: React.TouchEvent) => {
    setFilterTouchEnd(null);
    setFilterTouchStart(e.targetTouches[0].clientX);
    setIsFilterSwiping(true);
  };

  const handleFilterTouchMove = (e: React.TouchEvent) => {
    setFilterTouchEnd(e.targetTouches[0].clientX);
  };

  const handleFilterTouchEnd = () => {
    setIsFilterSwiping(false);
    if (!filterTouchStart || !filterTouchEnd) return;

    const distance = filterTouchStart - filterTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe) {
      if (filterType === 'weekly') setFilterType('monthly');
      else if (filterType === 'monthly') setFilterType('yearly');
    }
    if (isLeftSwipe) {
      if (filterType === 'yearly') setFilterType('monthly');
      else if (filterType === 'monthly') setFilterType('weekly');
    }

    setFilterTouchStart(null);
    setFilterTouchEnd(null);
  };

  // ── Bar swipe handlers ────────────────────────────────────────────────────────
  const handleBarTouchStart = (e: React.TouchEvent) => {
    setBarTouchEnd(null);
    setBarTouchStart(e.targetTouches[0].clientX);
    setIsBarSwiping(true);
  };

  const handleBarTouchMove = (e: React.TouchEvent) => {
    setBarTouchEnd(e.targetTouches[0].clientX);
  };

  const handleBarTouchEnd = () => {
    setIsBarSwiping(false);
    if (!barTouchStart || !barTouchEnd) return;

    const distance = barTouchStart - barTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && selectedBarIndex < barsData.length - 1) {
      const newIndex = selectedBarIndex + 1;
      setSelectedBarIndex(newIndex);
      scrollToBar(newIndex);
    }
    if (isLeftSwipe && selectedBarIndex > 0) {
      const newIndex = selectedBarIndex - 1;
      setSelectedBarIndex(newIndex);
      scrollToBar(newIndex);
    }

    setBarTouchStart(null);
    setBarTouchEnd(null);
  };

  const scrollToBar = (index: number) => {
    if (barsContainerRef.current) {
      const barElements = barsContainerRef.current.children;
      if (barElements[index]) {
        (barElements[index] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  };

  // ── Date helpers ──────────────────────────────────────────────────────────────
  const formatDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}/${m}/${y}`;
  };

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const parseCreatedAt = (createdAt: string): Date => {
    if (createdAt.includes('T')) {
      const d = new Date(createdAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return parseDate(createdAt);
  };

  const today = new Date();
  const todayStr = formatDateStr(today);

  const mantraAddedDate = parseCreatedAt(mantra.createdAt);
  const mantraAddedStr = formatDateStr(mantraAddedDate);
  const mantraAddedDisplay = formatDate(mantraAddedDate);

  const daysSinceAdded = Math.floor(
    (today.getTime() - mantraAddedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ── Get count for any date string ────────────────────────────────────────────
  const getDayCount = (dStr: string): number => {
    if (dStr === todayStr) return mantra.todayCount || 0;
    const entry = mantra.dailyHistory?.find(h => h.date === dStr);
    return entry?.mantraCount || 0;
  };

  // ── History data — up to 30 days, never before mantra added date ──────────────
  const historyData = useMemo(() => {
    const data: HistoryEntry[] = [];
    const maxDays = 30;

    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateStr = formatDateStr(date);

      if (date < mantraAddedDate) break;

      const dayOfWeek = date.getDay();
      const isPracticeDay = mantra.practiceDays.includes(dayOfWeek);
      const isToday = dateStr === todayStr;

      let mantraCount = 0;
      let beadsUpdated = false;
      let settingsUpdated = false;

      if (isToday) {
        mantraCount = mantra.todayCount || 0;
        const todayEntry = mantra.dailyHistory?.find(h => h.date === dateStr);
        if (todayEntry?.status) {
          beadsUpdated = todayEntry.status.beadsUpdated || false;
          settingsUpdated = todayEntry.status.settingsUpdated || false;
        }
      } else {
        const historyEntry = mantra.dailyHistory?.find(h => h.date === dateStr);
        mantraCount = historyEntry?.mantraCount || 0;
        if (historyEntry?.status) {
          beadsUpdated = historyEntry.status.beadsUpdated || false;
          settingsUpdated = historyEntry.status.settingsUpdated || false;
        }
      }

      const malaCount = Math.floor(mantraCount / mantra.malaSize);

      const remarks: string[] = [];
      if (dateStr === mantraAddedStr) remarks.push('🆕 Journey Started');
      if (malaCount > 0) remarks.push(`🎯 ${malaCount} Mala${malaCount > 1 ? 's' : ''}`);
      else if (mantraCount > 0) remarks.push('✅ Practiced');
      else if (isPracticeDay) remarks.push('❌ Missed');
      else remarks.push('⏸️ Rest Day');
      if (beadsUpdated) remarks.push('🔄 Beads Updated');
      if (settingsUpdated) remarks.push('⚙️ Settings Changed');

      data.push({
        dateStr,
        displayDate: formatDate(date),
        dayName: DAYS_FULL[dayOfWeek],
        dayShort: DAYS_SHORT[dayOfWeek],
        dayOfWeek,
        mantraCount,
        malaCount,
        isPracticeDay,
        isToday,
        remarks,
        beadsUpdated,
        settingsUpdated,
      });
    }

    return data;
  }, [mantra, todayStr, mantraAddedStr]);

  // ── barsData with drill-down support — Monday-based weeks ────────────────────
  const barsData = useMemo(() => {
    const bars: BarData[] = [];
    const addedDate = mantraAddedDate;

    // ── DRILL: daily (week → 7 days Mon–Sun) ─────────────────────────────────
    if (drillState?.level === 'daily' && drillState.weekStart) {
      const weekStartDate = parseDate(drillState.weekStart); // this is always a Monday
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        if (d < addedDate || d > today) continue;
        const dStr = formatDateStr(d);
        const count = getDayCount(dStr);
        bars.push({
          label: DAYS_SHORT[d.getDay()],
          count,
          malas: Math.floor(count / mantra.malaSize),
          activeDays: count > 0 ? 1 : 0,
          totalDays: 1,
          startDate: dStr,
          endDate: dStr,
          displayRange: `${DAYS_FULL[d.getDay()]}, ${formatDate(d)}`,
          isCurrent: dStr === todayStr,
        });
      }
      return bars;
    }

    // ── DRILL: weekly (month → Monday-based weeks) ────────────────────────────
    if (
      drillState?.level === 'weekly' &&
      drillState.year !== undefined &&
      drillState.month !== undefined
    ) {
      const monthStart = new Date(drillState.year, drillState.month, 1);
      const monthEnd = new Date(drillState.year, drillState.month + 1, 0);

      // Find Monday of the week containing monthStart
      let wStart = getMondayOfWeek(monthStart);

      let weekNum = 1;
      while (wStart <= monthEnd) {
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6); // Sunday

        const effStart = new Date(
          Math.max(wStart.getTime(), addedDate.getTime(), monthStart.getTime())
        );
        const effEnd = new Date(
          Math.min(wEnd.getTime(), today.getTime(), monthEnd.getTime())
        );

        if (effStart <= effEnd) {
          let count = 0, activeDays = 0, totalDays = 0;
          for (let d = new Date(effStart); d <= effEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dc = getDayCount(formatDateStr(d));
            count += dc;
            if (dc > 0) activeDays++;
          }
          const wEndOfDay = new Date(wEnd);
          wEndOfDay.setHours(23, 59, 59, 999);
          const isCurrent = today >= wStart && today <= wEndOfDay;
          bars.push({
            label: `W${weekNum}`,
            count,
            malas: Math.floor(count / mantra.malaSize),
            activeDays,
            totalDays,
            startDate: formatDateStr(effStart),
            endDate: formatDateStr(effEnd),
            displayRange: `${formatDate(effStart)} → ${formatDate(effEnd)}`,
            isCurrent,
            weekNumber: weekNum,
            year: drillState.year,
            month: drillState.month,
            weekStart: formatDateStr(wStart),
          });
          weekNum++;
        }
        wStart.setDate(wStart.getDate() + 7);
      }
      return bars;
    }

    // ── DRILL: monthly (year → months) ───────────────────────────────────────
    if (drillState?.level === 'monthly' && drillState.year !== undefined) {
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(drillState.year, m, 1);
        const mEnd = new Date(drillState.year, m + 1, 0);

        if (mStart > today || mEnd < addedDate) continue;

        const effStart = new Date(Math.max(mStart.getTime(), addedDate.getTime()));
        const effEnd = new Date(Math.min(mEnd.getTime(), today.getTime()));

        if (effStart <= effEnd) {
          let count = 0, activeDays = 0, totalDays = 0;
          for (let d = new Date(effStart); d <= effEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dc = getDayCount(formatDateStr(d));
            count += dc;
            if (dc > 0) activeDays++;
          }
          const isCurrent =
            m === today.getMonth() && drillState.year === today.getFullYear();
          bars.push({
            label: MONTHS_SHORT[m],
            count,
            malas: Math.floor(count / mantra.malaSize),
            activeDays,
            totalDays,
            startDate: formatDateStr(effStart),
            endDate: formatDateStr(effEnd),
            displayRange: `${formatDate(effStart)} → ${formatDate(effEnd)}`,
            isCurrent,
            year: drillState.year,
            month: m,
          });
        }
      }
      return bars;
    }

    // ── NORMAL: weekly — Monday-based ─────────────────────────────────────────
    if (filterType === 'weekly') {
      // Start from the Monday of the week when mantra was added
      let weekStart = getMondayOfWeek(addedDate);

      let weekNumber = 1;
      while (weekStart <= today) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

        const effectiveStart = weekStart < addedDate ? addedDate : weekStart;
        const effectiveEnd = weekEnd > today ? today : weekEnd;

        if (effectiveStart <= effectiveEnd) {
          let count = 0, activeDays = 0, totalDays = 0;
          for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dc = getDayCount(formatDateStr(d));
            count += dc;
            if (dc > 0) activeDays++;
          }
          // Extend weekEnd to end of Sunday so time comparison works correctly
          const weekEndOfDay = new Date(weekEnd);
          weekEndOfDay.setHours(23, 59, 59, 999);
          const isCurrent = today >= weekStart && today <= weekEndOfDay;
          bars.push({
            label: `W${weekNumber}`,
            count,
            malas: Math.floor(count / mantra.malaSize),
            activeDays,
            totalDays,
            startDate: formatDateStr(effectiveStart),
            endDate: formatDateStr(effectiveEnd),
            displayRange: `${formatDate(effectiveStart)} → ${formatDate(effectiveEnd)}`,
            isCurrent,
            weekNumber,
            weekStart: formatDateStr(weekStart),
          });
          weekNumber++;
        }
        weekStart.setDate(weekStart.getDate() + 7);
      }

    // ── NORMAL: monthly ───────────────────────────────────────────────────────
    } else if (filterType === 'monthly') {
      let currentMonth = new Date(addedDate.getFullYear(), addedDate.getMonth(), 1);
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      let monthNumber = 1;

      while (currentMonth <= todayMonth) {
        const monthStart = new Date(currentMonth);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const effectiveStart = monthStart < addedDate ? addedDate : monthStart;
        const effectiveEnd = monthEnd > today ? today : monthEnd;

        if (effectiveStart <= effectiveEnd) {
          let count = 0, activeDays = 0, totalDays = 0;
          for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dc = getDayCount(formatDateStr(d));
            count += dc;
            if (dc > 0) activeDays++;
          }
          const isCurrent =
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
          bars.push({
            label: `M${monthNumber}`,
            count,
            malas: Math.floor(count / mantra.malaSize),
            activeDays,
            totalDays,
            startDate: formatDateStr(effectiveStart),
            endDate: formatDateStr(effectiveEnd),
            displayRange: `${formatDate(effectiveStart)} → ${formatDate(effectiveEnd)}`,
            isCurrent,
            year: currentMonth.getFullYear(),
            month: currentMonth.getMonth(),
          });
          monthNumber++;
        }
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

    // ── NORMAL: yearly ────────────────────────────────────────────────────────
    } else {
      let currentYear = addedDate.getFullYear();
      const todayYear = today.getFullYear();
      let yearNumber = 1;

      while (currentYear <= todayYear) {
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);

        const effectiveStart = yearStart < addedDate ? addedDate : yearStart;
        const effectiveEnd = yearEnd > today ? today : yearEnd;

        if (effectiveStart <= effectiveEnd) {
          let count = 0, activeDays = 0, totalDays = 0;
          for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
            totalDays++;
            const dc = getDayCount(formatDateStr(d));
            count += dc;
            if (dc > 0) activeDays++;
          }
          const isCurrent = currentYear === today.getFullYear();
          bars.push({
            label: `Y${yearNumber}`,
            count,
            malas: Math.floor(count / mantra.malaSize),
            activeDays,
            totalDays,
            startDate: formatDateStr(effectiveStart),
            endDate: formatDateStr(effectiveEnd),
            displayRange: `${formatDate(effectiveStart)} → ${formatDate(effectiveEnd)}`,
            isCurrent,
            year: currentYear,
          });
          yearNumber++;
        }
        currentYear++;
      }
    }

    return bars;
  }, [mantra, filterType, todayStr, drillState]);

  const maxCount = useMemo(
    () => Math.max(...barsData.map(b => b.count), 1),
    [barsData]
  );

  // ── Auto-scroll to current/latest bar ────────────────────────────────────────
  useEffect(() => {
    if (barsData.length > 0) {
      const currentIndex = barsData.findIndex(bar => bar.isCurrent);
      const indexToSelect = currentIndex >= 0 ? currentIndex : barsData.length - 1;
      setSelectedBarIndex(indexToSelect);

      setTimeout(() => {
        if (barsContainerRef.current) {
          const barElements = barsContainerRef.current.children;
          if (barElements.length > 0) {
            const targetBar = barElements[indexToSelect] as HTMLElement;
            if (targetBar) {
              targetBar.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: indexToSelect === barsData.length - 1 ? 'end' : 'center',
              });
            }
          }
        }
      }, 100);
    }
  }, [barsData, filterType, drillState]);

  // ── Handle bar click — single select + double-click drill-down ────────────────
  const handleBarClick = (index: number, bar: BarData) => {
    const now = Date.now();
    const isDoubleClick =
      lastClickTime.current.index === index && now - lastClickTime.current.time < 400;

    if (isDoubleClick) {
      lastClickTime.current = { index: -1, time: 0 };

      if (!drillState) {
        if (filterType === 'yearly' && bar.year !== undefined) {
          setDrillState({ level: 'monthly', year: bar.year, label: `${bar.year}` });
        } else if (filterType === 'monthly' && bar.year !== undefined && bar.month !== undefined) {
          setDrillState({
            level: 'weekly',
            year: bar.year,
            month: bar.month,
            label: `${MONTHS_SHORT[bar.month]} ${bar.year}`,
          });
        } else if (filterType === 'weekly' && bar.weekStart) {
          setDrillState({ level: 'daily', weekStart: bar.weekStart, label: bar.displayRange });
        }
      } else if (drillState.level === 'monthly' && bar.year !== undefined && bar.month !== undefined) {
        setDrillState({
          level: 'weekly',
          year: bar.year,
          month: bar.month,
          label: `${drillState.label} > ${MONTHS_SHORT[bar.month]}`,
        });
      } else if (drillState.level === 'weekly' && bar.weekStart) {
        setDrillState({
          level: 'daily',
          weekStart: bar.weekStart,
          label: `${drillState.label} > ${bar.label}`,
        });
      }
      // daily level — no further drill
    } else {
      lastClickTime.current = { index, time: now };
      setSelectedBarIndex(index);
    }
  };

  // ── Drill back one level ──────────────────────────────────────────────────────
  const handleDrillBack = () => {
    if (!drillState) return;
    if (drillState.level === 'monthly') {
      setDrillState(null);
    } else if (drillState.level === 'weekly') {
      if (drillState.year !== undefined) {
        setDrillState({ level: 'monthly', year: drillState.year, label: `${drillState.year}` });
      } else {
        setDrillState(null);
      }
    } else if (drillState.level === 'daily') {
      if (drillState.year !== undefined && drillState.month !== undefined) {
        setDrillState({
          level: 'weekly',
          year: drillState.year,
          month: drillState.month,
          label: drillState.label?.split(' > ').slice(0, -1).join(' > ') || '',
        });
      } else {
        setDrillState(null);
      }
    }
  };

  const selectedStats = barsData[selectedBarIndex] || {
    label: '-',
    count: 0,
    malas: 0,
    activeDays: 0,
    totalDays: 0,
    displayRange: '-',
    isCurrent: false,
  };

  const getRandomSacredMessage = () =>
    SACRED_MESSAGES[Math.floor(Math.random() * SACRED_MESSAGES.length)];

  // ── Save remark ───────────────────────────────────────────────────────────────
  const saveRemark = () => {
    if (!remarkModal || !mantra) return;

    const dailyHistory = [...(mantra.dailyHistory || [])];
    const existingIndex = dailyHistory.findIndex(h => h.date === remarkModal.date);

    if (existingIndex >= 0) {
      dailyHistory[existingIndex] = {
        ...dailyHistory[existingIndex],
        remark: remarkModal.remark,
      };
    } else {
      dailyHistory.push({
        date: remarkModal.date,
        mantraCount: 0,
        malaCount: 0,
        beadsPerMala: mantra.malaSize,
        remark: remarkModal.remark,
        status: { practiced: false, beadsUpdated: false, settingsUpdated: false, missed: true },
      });
    }

    updateMantra(mantra.id, { dailyHistory });
    setRemarkModal(null);
    showToast('Remark saved! 🙏', 'success');
  };

  // ── Row highlight class ───────────────────────────────────────────────────────
  const getRowClass = (entry: HistoryEntry) => {
    if (entry.mantraCount > 0) return 'bg-green-50 dark:bg-green-900/10';
    if (entry.isPracticeDay) return 'bg-red-50 dark:bg-red-900/10';
    return 'bg-gray-50 dark:bg-gray-800/50';
  };

  // ── Label helpers ─────────────────────────────────────────────────────────────
  const getDrillLevelLabel = () => {
    if (!drillState) {
      if (filterType === 'weekly') return 'Weekly';
      if (filterType === 'monthly') return 'Monthly';
      return 'Yearly';
    }
    if (drillState.level === 'monthly') return `${drillState.year} — Months`;
    if (drillState.level === 'weekly') return `${drillState.label} — Weeks`;
    if (drillState.level === 'daily') return `${drillState.label} — Days`;
    return '';
  };

  const getBarsCountLabel = () => {
    if (drillState?.level === 'daily') return 'DAYS';
    if (drillState?.level === 'weekly') return 'WEEKS';
    if (drillState?.level === 'monthly') return 'MONTHS';
    if (filterType === 'weekly') return 'WEEKS';
    if (filterType === 'monthly') return 'MONTHS';
    return 'YEARS';
  };

  const getSelectedLabel = () => {
    if (drillState?.level === 'daily') return 'Day';
    if (drillState?.level === 'weekly') return 'Week';
    if (drillState?.level === 'monthly') return 'Month';
    if (filterType === 'weekly') return 'Week';
    if (filterType === 'monthly') return 'Month';
    return 'Year';
  };

  // ── PDF Report ────────────────────────────────────────────────────────────────
  const generatePDFReport = () => {
    if (!fromDate || !toDate) {
      showToast('Please select date range', 'warning');
      return;
    }

    const start = parseDate(fromDate);
    const end = parseDate(toDate);

    if (start > end) {
      showToast('From date cannot be after to date', 'error');
      return;
    }

    showToast('Generating your spiritual report... 📄', 'info');

    const filteredData = historyData
      .filter(entry => {
        const entryDate = parseDate(entry.dateStr);
        return entryDate >= start && entryDate <= end;
      })
      .reverse();

    const totalMantras = filteredData.reduce((sum, d) => sum + d.mantraCount, 0);
    const totalMalas = Math.floor(totalMantras / mantra.malaSize);
    const practicedDays = filteredData.filter(d => d.mantraCount > 0).length;
    const missedDays = filteredData.filter(d => d.isPracticeDay && d.mantraCount === 0).length;
    const restDays = filteredData.filter(d => !d.isPracticeDay).length;
    const totalDays = filteredData.length;
    const practiceRate = totalDays > 0 ? Math.round((practicedDays / totalDays) * 100) : 0;
    const avgPerDay = totalDays > 0 ? Math.round(totalMantras / totalDays) : 0;

    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;
    for (let i = 0; i < filteredData.length; i++) {
      if (filteredData[i].mantraCount > 0) {
        streakCount++;
        longestStreak = Math.max(longestStreak, streakCount);
        if (i === filteredData.length - 1) currentStreak = streakCount;
      } else {
        streakCount = 0;
      }
    }

    let bestDay = { date: '', day: '', count: 0, malas: 0 };
    filteredData.forEach(day => {
      if (day.mantraCount > bestDay.count) {
        bestDay = {
          date: day.displayDate,
          day: day.dayName,
          count: day.mantraCount,
          malas: Math.floor(day.mantraCount / mantra.malaSize),
        };
      }
    });

    const dayWiseData: { [key: string]: { count: number; days: number } } = {};
    DAYS_FULL.forEach(day => (dayWiseData[day] = { count: 0, days: 0 }));
    filteredData.forEach(day => {
      if (day.mantraCount > 0) {
        dayWiseData[day.dayName].count += day.mantraCount;
        dayWiseData[day.dayName].days++;
      }
    });
    const maxDayCount = Math.max(...Object.values(dayWiseData).map(v => v.count), 1);

    let mostPracticedDay = '';
    let mostPracticedCount = 0;
    Object.entries(dayWiseData).forEach(([day, data]) => {
      if (data.count > mostPracticedCount) {
        mostPracticedCount = data.count;
        mostPracticedDay = day;
      }
    });

    const weeklyData: { label: string; count: number; malas: number; days: number }[] = [];
    for (let i = 0; i < filteredData.length; i += 7) {
      const weekData = filteredData.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      weeklyData.push({
        label: `Week ${weekNum}`,
        count: weekData.reduce((s, d) => s + d.mantraCount, 0),
        malas: weekData.reduce((s, d) => s + Math.floor(d.mantraCount / mantra.malaSize), 0),
        days: weekData.filter(d => d.mantraCount > 0).length,
      });
    }
    const maxWeekCount = Math.max(...weeklyData.map(w => w.count), 1);

    const monthlyMap = new Map<string, { count: number; malas: number; days: number; total: number }>();
    filteredData.forEach(day => {
      const monthKey = day.dateStr.substring(0, 7);
      const existing = monthlyMap.get(monthKey) || { count: 0, malas: 0, days: 0, total: 0 };
      existing.count += day.mantraCount;
      existing.malas += Math.floor(day.mantraCount / mantra.malaSize);
      existing.total++;
      if (day.mantraCount > 0) existing.days++;
      monthlyMap.set(monthKey, existing);
    });
    const maxMonthCount = Math.max(...Array.from(monthlyMap.values()).map(v => v.count), 1);

    const yearlyMap = new Map<string, { count: number; malas: number; days: number; total: number }>();
    filteredData.forEach(day => {
      const yearKey = day.dateStr.substring(0, 4);
      const existing = yearlyMap.get(yearKey) || { count: 0, malas: 0, days: 0, total: 0 };
      existing.count += day.mantraCount;
      existing.malas += Math.floor(day.mantraCount / mantra.malaSize);
      existing.total++;
      if (day.mantraCount > 0) existing.days++;
      yearlyMap.set(yearKey, existing);
    });
    const maxYearCount = Math.max(...Array.from(yearlyMap.values()).map(v => v.count), 1);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mantra Report - ${mantra.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #333; font-size: 13px; background: #fff; }
            h1 { color: #4f46e5; text-align: center; font-size: 24px; margin-bottom: 5px; }
            h2 { color: #4f46e5; font-size: 18px; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; margin: 25px 0 15px 0; }
            h3 { color: #6366f1; font-size: 15px; margin: 15px 0 10px 0; }
            .header-info { text-align: center; color: #666; margin-bottom: 25px; font-size: 13px; }
            .header-info p { margin: 3px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
            .stat-box { border-radius: 8px; padding: 15px 8px; text-align: center; }
            .stat-box.indigo { background: #eef2ff; border-left: 4px solid #4f46e5; }
            .stat-box.emerald { background: #ecfdf5; border-left: 4px solid #10b981; }
            .stat-box.amber { background: #fffbeb; border-left: 4px solid #f59e0b; }
            .stat-box.purple { background: #faf5ff; border-left: 4px solid #a855f7; }
            .stat-box.blue { background: #eff6ff; border-left: 4px solid #3b82f6; }
            .stat-box.red { background: #fef2f2; border-left: 4px solid #ef4444; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .stat-label { font-size: 11px; color: #6b7280; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-card { background: #f9fafb; border-radius: 8px; padding: 12px 15px; margin: 10px 0; border-left: 4px solid #4f46e5; display: flex; justify-content: space-between; align-items: center; }
            .info-card.gold { border-left-color: #f59e0b; background: #fffbeb; }
            .info-card.green { border-left-color: #10b981; background: #ecfdf5; }
            .info-card.red { border-left-color: #ef4444; background: #fef2f2; }
            .info-label { font-size: 12px; color: #6b7280; }
            .info-value { font-size: 14px; font-weight: 700; color: #1f2937; }
            .chart-container { margin: 15px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .bar-row { display: flex; align-items: center; margin: 8px 0; }
            .bar-label { width: 80px; font-size: 12px; font-weight: 600; color: #374151; }
            .bar-track { flex: 1; height: 24px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 0 10px; }
            .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; color: white; font-size: 11px; font-weight: 600; min-width: 30px; }
            .bar-fill.indigo { background: #4f46e5; }
            .bar-fill.emerald { background: #10b981; }
            .bar-fill.amber { background: #f59e0b; }
            .bar-fill.purple { background: #a855f7; }
            .bar-fill.blue { background: #3b82f6; }
            .bar-fill.pink { background: #ec4899; }
            .bar-fill.red { background: #ef4444; }
            .bar-value { width: 100px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; }
            .indicator-note { background: #eef2ff; padding: 10px 15px; border-radius: 6px; margin: 10px 0; font-size: 11px; color: #4f46e5; border-left: 3px solid #4f46e5; }
            .indicator-note strong { color: #1f2937; }
            .pie-container { display: flex; flex-direction: column; align-items: center; margin: 20px 0; }
            .pie-chart { width: 160px; height: 160px; border-radius: 50%; background: conic-gradient(#10b981 0% ${practiceRate}%, #ef4444 ${practiceRate}% ${practiceRate + (missedDays / Math.max(totalDays, 1) * 100)}%, #d1d5db ${practiceRate + (missedDays / Math.max(totalDays, 1) * 100)}% 100%); margin: 0 auto; }
            .pie-inner { width: 100px; height: 100px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #10b981; margin: 30px auto 0; }
            .legend { display: flex; justify-content: center; gap: 20px; margin-top: 15px; font-size: 12px; }
            .legend-item { display: flex; align-items: center; gap: 5px; }
            .legend-color { width: 14px; height: 14px; border-radius: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; font-size: 12px; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #f9fafb; }
            .non-practice { background: #f3f4f6 !important; color: #9ca3af; }
            .missed { background: #fef2f2 !important; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <h1>🕉️ MANTRA METER - SPIRITUAL REPORT</h1>
          <div class="header-info">
            <p><strong>Mantra:</strong> ${mantra.name}</p>
            <p><strong>Mantra Added:</strong> ${mantraAddedDisplay} | <strong>Beads/Mala:</strong> ${mantra.malaSize}</p>
            <p><strong>Report Period:</strong> ${fromDate} to ${toDate} (${totalDays} days)</p>
            <p><strong>Generated:</strong> ${DAYS_FULL[today.getDay()]}, ${formatDate(today)} at ${today.toLocaleTimeString()}</p>
            <p><strong>Practitioner:</strong> ${userName || 'Guest User'}</p>
          </div>

          <div class="indicator-note">
            <strong>📊 How to read these indicators:</strong><br>
            • <strong>21 (1d)</strong> = 21 mantras practiced on 1 day<br>
            • <strong>4m | 3d</strong> = 4 malas completed across 3 active days<br>
            • <strong>5m | 5/13d</strong> = 5 malas, practiced on 5 out of 13 total days
          </div>

          <h2>📊 OVERALL SUMMARY</h2>
          <div class="stats-grid">
            <div class="stat-box indigo"><div class="stat-value">${totalMantras}</div><div class="stat-label">Total Mantras</div></div>
            <div class="stat-box emerald"><div class="stat-value">${totalMalas}</div><div class="stat-label">Total Malas</div></div>
            <div class="stat-box amber"><div class="stat-value">${practicedDays}</div><div class="stat-label">Days Practiced</div></div>
            <div class="stat-box purple"><div class="stat-value">${avgPerDay}</div><div class="stat-label">Avg/Day</div></div>
            <div class="stat-box blue"><div class="stat-value">${Math.round(totalMantras / (practicedDays || 1))}</div><div class="stat-label">Avg/Practice Day</div></div>
            <div class="stat-box red"><div class="stat-value">${practiceRate}%</div><div class="stat-label">Consistency</div></div>
          </div>

          <div class="info-card gold">
            <div><span class="info-label">⭐ BEST PRACTICE DAY</span><div class="info-value">${bestDay.day}, ${bestDay.date}</div></div>
            <div class="info-value">${bestDay.count} mantras (${bestDay.malas} malas)</div>
          </div>

          <div class="info-card green">
            <div><span class="info-label">🔥 STREAK</span><div class="info-value">Current: ${currentStreak} days</div></div>
            <div class="info-value">Best: ${longestStreak} days</div>
          </div>

          <div class="info-card red">
            <div><span class="info-label">📅 PRACTICE SUMMARY</span><div class="info-value">Practiced: ${practicedDays} | Missed: ${missedDays} | Rest: ${restDays}</div></div>
          </div>

          <h2>📊 DAY-WISE ANALYSIS</h2>
          <div class="chart-container">
            <h3>Mantras by Day of Week</h3>
            ${DAYS_FULL.map((day, i) => {
              const data = dayWiseData[day] || { count: 0, days: 0 };
              const pct = Math.max((data.count / maxDayCount) * 100, 3);
              const colors = ['indigo', 'emerald', 'amber', 'purple', 'blue', 'pink', 'red'];
              return `
                <div class="bar-row">
                  <div class="bar-label">${day.slice(0, 3)}</div>
                  <div class="bar-track">
                    <div class="bar-fill ${colors[i]}" style="width: ${pct}%">${data.count > 0 ? data.count : ''}</div>
                  </div>
                  <div class="bar-value">${data.count} (${data.days}d)</div>
                </div>
              `;
            }).join('')}
            <p style="text-align:center; margin-top:15px; font-size:12px; color:#6b7280;">
              📌 Most Practiced: <strong>${mostPracticedDay}</strong> (${mostPracticedCount} mantras)
            </p>
          </div>

          <h2>📅 WEEKLY PROGRESS</h2>
          <div class="chart-container">
            ${weeklyData.map((w) => {
              const pct = Math.max((w.count / maxWeekCount) * 100, 3);
              return `
                <div class="bar-row">
                  <div class="bar-label">${w.label}</div>
                  <div class="bar-track">
                    <div class="bar-fill indigo" style="width: ${pct}%">${w.count}</div>
                  </div>
                  <div class="bar-value">${w.malas}m | ${w.days}d</div>
                </div>
              `;
            }).join('')}
          </div>

          <h2>📆 MONTHLY SUMMARY</h2>
          <div class="chart-container">
            ${Array.from(monthlyMap.entries()).map(([month, data]) => {
              const pct = Math.max((data.count / maxMonthCount) * 100, 3);
              const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return `
                <div class="bar-row">
                  <div class="bar-label">${monthName}</div>
                  <div class="bar-track">
                    <div class="bar-fill emerald" style="width: ${pct}%">${data.count}</div>
                  </div>
                  <div class="bar-value">${data.malas}m | ${data.days}/${data.total}d</div>
                </div>
              `;
            }).join('')}
          </div>

          <h2>📆 YEARLY SUMMARY</h2>
          <div class="chart-container">
            ${Array.from(yearlyMap.entries()).map(([year, data]) => {
              const pct = Math.max((data.count / maxYearCount) * 100, 3);
              return `
                <div class="bar-row">
                  <div class="bar-label">${year}</div>
                  <div class="bar-track">
                    <div class="bar-fill purple" style="width: ${pct}%">${data.count}</div>
                  </div>
                  <div class="bar-value">${data.malas}m | ${data.days}/${data.total}d</div>
                </div>
              `;
            }).join('')}
          </div>

          <h2>🎯 CONSISTENCY OVERVIEW</h2>
          <div class="chart-container">
            <div class="pie-container">
              <div class="pie-chart">
                <div class="pie-inner">${practiceRate}%</div>
              </div>
              <div class="legend">
                <div class="legend-item"><span class="legend-color" style="background:#10b981;"></span> Practiced (${practicedDays})</div>
                <div class="legend-item"><span class="legend-color" style="background:#ef4444;"></span> Missed (${missedDays})</div>
                <div class="legend-item"><span class="legend-color" style="background:#d1d5db;"></span> Rest (${restDays})</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <h1>🕉️ MANTRA METER - DAILY LOGS</h1>
          <div class="header-info">
            <p><strong>Mantra:</strong> ${mantra.name} | <strong>Added:</strong> ${mantraAddedDisplay}</p>
          </div>

          <h2>📜 DAILY PRACTICE LOG</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Mantras</th>
              <th>Malas</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
            ${filteredData.map(entry => {
              const status = entry.mantraCount > 0 ? '✅ Practiced' : entry.isPracticeDay ? '❌ Missed' : '⏸️ Rest';
              const rowClass = !entry.isPracticeDay ? 'non-practice' : !entry.mantraCount ? 'missed' : '';
              return `
                <tr class="${rowClass}">
                  <td>${entry.displayDate}</td>
                  <td>${entry.dayShort}</td>
                  <td style="font-weight:600;">${entry.mantraCount}</td>
                  <td>${entry.malaCount}</td>
                  <td>${status}</td>
                  <td style="font-size:11px;">${entry.remarks.join(', ')}</td>
                </tr>
              `;
            }).join('')}
          </table>

          <div class="footer">
            <p><strong>Report Summary:</strong> ${totalDays} days | ${practicedDays} practiced | ${totalMantras} mantras | ${totalMalas} malas | ${practiceRate}% consistency</p>
            <p style="margin-top:8px;">🕉️ Generated by Mantra Meter App | Developed by Shivam Suhane for spiritual wellness</p>
            <p style="margin-top:5px; font-style:italic;">"${getRandomSacredMessage()}"</p>
            <p style="margin-top:8px;">Har Har Mahadev 🙏</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    setShowDatePicker(false);
    showToast('PDF Report generated successfully! 📄', 'success');
  };

  // Set default dates for PDF
  useEffect(() => {
    if (showDatePicker) {
      setToDate(todayStr);
      setFromDate(mantraAddedStr);
    }
  }, [showDatePicker]);

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">

      {/* Remark Modal */}
      {remarkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
              Add Remark - {remarkModal.date}
            </h3>
            <textarea
              value={remarkModal.remark}
              onChange={(e) => setRemarkModal({ ...remarkModal, remark: e.target.value })}
              placeholder="How did you feel today? Any insights?"
              rows={4}
              className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRemarkModal(null)}
                className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveRemark}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setCurrentView('mantraDetails')}
        className="w-full bg-slate-800 text-white py-4 flex items-center justify-center gap-2 font-semibold"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Sacred Records</span>
      </button>

      {/* Helper Message */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-800">
        <i className="fas fa-info-circle text-indigo-500"></i>
        <span className="text-sm text-indigo-700 dark:text-indigo-300">
          Mantra added: <strong>{mantraAddedDisplay}</strong> (
          {daysSinceAdded === 0
            ? 'Today'
            : `${daysSinceAdded} day${daysSinceAdded > 1 ? 's' : ''} ago`}
          )
        </span>
      </div>

      {/* Mantra Info Row */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 flex justify-center gap-6 text-xs border-b border-gray-100 dark:border-slate-700">
        <span className="text-gray-600 dark:text-gray-400">
          <i className="fas fa-pray text-indigo-500 mr-1"></i>
          {mantra.malaSize} Beads
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          <i className="fas fa-calendar text-indigo-500 mr-1"></i>
          {mantra.practiceDays.length === 7
            ? 'All Days'
            : mantra.practiceDays.map(d => DAYS_SHORT[d]).join(', ')}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          <i className="fas fa-clock text-indigo-500 mr-1"></i>
          {daysSinceAdded + 1}d Active
        </span>
      </div>

      {/* Filter Buttons — hidden during drill-down */}
      {!drillState && (
        <div
          className={`flex bg-gray-100 dark:bg-slate-800 select-none transition-opacity duration-150 ${isFilterSwiping ? 'opacity-80' : ''}`}
          onTouchStart={handleFilterTouchStart}
          onTouchMove={handleFilterTouchMove}
          onTouchEnd={handleFilterTouchEnd}
        >
          {(['weekly', 'monthly', 'yearly'] as const).map((type, index) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-200
                ${filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }
                ${index > 0 ? 'border-l border-gray-300 dark:border-slate-600' : ''}
              `}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Drill-down breadcrumb bar */}
      {drillState && (
        <div className="flex items-center bg-indigo-600 text-white text-sm">
          {/* CHANGE 3: Back and Reset buttons equal size */}
          <button
            onClick={handleDrillBack}
            className="flex items-center justify-center gap-1 bg-white/20 py-2 px-4 font-semibold active:bg-white/30 transition-all w-16 flex-shrink-0"
          >
            <i className="fas fa-arrow-left text-xs"></i>
            <span className="text-xs">Back</span>
          </button>
          <span className="flex-1 text-center font-semibold truncate text-sm px-2">
            📊 {drillState.label}
          </span>
          {/* CHANGE 3: Reset button same width as Back */}
          <button
            onClick={() => setDrillState(null)}
            className="flex items-center justify-center bg-white/20 py-2 px-4 font-semibold text-xs active:bg-white/30 transition-all w-16 flex-shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Journey Timeline */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-center gap-2 text-sm border-b border-gray-100 dark:border-slate-700">
        <span className="text-xl">📿</span>
        <span className="text-gray-500 dark:text-gray-400">Your Mantra Journey:</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">{mantraAddedDisplay}</span>
        <span className="text-indigo-500">→</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">Today</span>
      </div>

      {/* Progress Bars Section */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">
            {getDrillLevelLabel()} Progress
          </h3>
          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-bold">
            {barsData.length} {getBarsCountLabel()}
          </span>
        </div>

        {/* CHANGE 2: daily drill bars fill full width — use justify between with flex-1 */}
        {/* Bars Container with Swipe */}
        <div
          ref={barsContainerRef}
          className={`pb-4 select-none transition-all duration-200 ${isBarSwiping ? 'scale-[0.99]' : ''}
            ${drillState?.level === 'daily'
              ? 'flex gap-1'                          // daily: 7 bars, edge-to-edge, equal width
              : 'flex gap-3 overflow-x-auto scrollbar-thin scroll-smooth cursor-grab active:cursor-grabbing'
            }
          `}
          style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
            userSelect: 'none',
          }}
          onTouchStart={handleBarTouchStart}
          onTouchMove={handleBarTouchMove}
          onTouchEnd={handleBarTouchEnd}
        >
          {barsData.map((bar, index) => {
            const heightPercent = Math.max((bar.count / maxCount) * 100, 8);
            const isDaily = drillState?.level === 'daily';
            return (
              <div
                key={index}
                onClick={() => handleBarClick(index, bar)}
                className={`flex flex-col items-center cursor-pointer transition-all duration-200
                  ${isDaily ? 'flex-1' : 'min-w-[50px]'}
                  ${selectedBarIndex === index ? 'scale-105' : 'opacity-60'}
                `}
              >
                <div
                  className={`w-full h-24 rounded-lg relative overflow-visible flex items-end transition-all duration-200
                    ${isDaily ? 'max-w-[44px] mx-auto' : 'w-10'}
                    ${selectedBarIndex === index
                      ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg'
                      : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                >
                  <div
                    className={`w-full transition-all duration-300 rounded-t-sm
                      ${selectedBarIndex === index
                        ? 'bg-gradient-to-t from-amber-400 to-orange-500'
                        : 'bg-indigo-400'
                      }`}
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  />
                  {selectedBarIndex === index && bar.count > 0 && (
                    <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {bar.count}
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs mt-2 font-semibold transition-colors duration-200
                    ${selectedBarIndex === index
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400'
                    }
                  `}
                >
                  {bar.label}
                </span>

                {bar.isCurrent && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* CHANGE 1: Slider with ⏮ ⏭ — zero padding on buttons so they touch screen edges */}
        <div className="flex items-center mt-2 -mx-4">
          {/* ⏮ Jump to first bar — flush to left edge */}
          <button
            onClick={() => {
              if (barsData.length === 0) return;
              setSelectedBarIndex(0);
              scrollToBar(0);
            }}
            disabled={barsData.length === 0 || selectedBarIndex === 0}
            className="text-xl text-indigo-500 dark:text-indigo-400 disabled:opacity-25 active:scale-90 transition-transform flex-shrink-0 w-10 flex items-center justify-center select-none leading-none h-8"
            title="Go to first"
          >
            ⏮
          </button>

          {/* Slider track */}
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(20, (100 / Math.max(barsData.length, 1)))}%`,
                marginLeft: `${
                  (selectedBarIndex / Math.max(barsData.length - 1, 1)) *
                  (100 - Math.max(20, 100 / Math.max(barsData.length, 1)))
                }%`,
              }}
            />
          </div>

          {/* ⏭ Jump to last bar — flush to right edge */}
          <button
            onClick={() => {
              if (barsData.length === 0) return;
              const last = barsData.length - 1;
              setSelectedBarIndex(last);
              scrollToBar(last);
            }}
            disabled={barsData.length === 0 || selectedBarIndex === barsData.length - 1}
            className="text-xl text-indigo-500 dark:text-indigo-400 disabled:opacity-25 active:scale-90 transition-transform flex-shrink-0 w-10 flex items-center justify-center select-none leading-none h-8"
            title="Go to latest"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Selected Stats */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Selected {getSelectedLabel()}
          </p>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center justify-center gap-2">
            <span>📿</span>
            {selectedStats.displayRange}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{selectedStats.count.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Mantras</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{selectedStats.malas}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Malas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{selectedStats.activeDays}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Days</p>
          </div>
        </div>
      </div>

      {/* Recent Logs Toggle */}
      <button
        onClick={() => setShowLogs(!showLogs)}
        className="w-full bg-indigo-600 text-white py-3 font-semibold flex items-center justify-center gap-2"
      >
        <i className={`fas fa-chevron-${showLogs ? 'up' : 'down'}`}></i>
        Recent Logs ({historyData.length} Days)
        <i className={`fas fa-chevron-${showLogs ? 'up' : 'down'}`}></i>
      </button>

      {/* Logs Table */}
      {showLogs && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-700 text-white">
                <th className="py-2 px-2 text-left">Date</th>
                <th className="py-2 px-2 text-left">Day</th>
                <th className="py-2 px-2 text-center">Mantras</th>
                <th className="py-2 px-2 text-center">Malas</th>
                <th className="py-2 px-2 text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((entry) => (
                <tr
                  key={entry.dateStr}
                  className={`border-b border-gray-100 dark:border-slate-700 cursor-pointer ${getRowClass(entry)}`}
                  onClick={() =>
                    setRemarkModal({ date: entry.displayDate, remark: entry.remarks.join(', ') })
                  }
                >
                  <td className="py-2 px-2 text-gray-800 dark:text-gray-200 text-xs">
                    {entry.displayDate}
                    {entry.isToday && (
                      <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs">{entry.dayShort}</td>
                  <td className="py-2 px-2 text-center font-semibold text-gray-800 dark:text-white">
                    {entry.mantraCount}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-gray-800 dark:text-white">
                    {entry.malaCount}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewEntry(entry);
                      }}
                      className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                    >
                      <i className="fas fa-eye text-sm"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={() => setShowDatePicker(true)}
        className="w-full bg-emerald-600 text-white py-4 font-semibold flex items-center justify-center gap-2"
      >
        <i className="fas fa-file-pdf"></i>
        Download History Report
      </button>

      {/* View Modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 text-center">
              <p className="text-lg font-bold">
                {viewEntry.displayDate}, {viewEntry.dayName}
              </p>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400 text-sm">📿 Mantras Counted</span>
                <span className="font-bold text-gray-800 dark:text-white">{viewEntry.mantraCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400 text-sm">🎯 Malas Completed</span>
                <span className="font-bold text-gray-800 dark:text-white">{viewEntry.malaCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400 text-sm">📅 Day Type</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {viewEntry.isPracticeDay ? 'Practice Day' : 'Rest Day'}
                </span>
              </div>

              <div className="py-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">📝 Remarks</p>
                {viewEntry.remarks.map((remark, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-xs text-indigo-600 font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 text-sm">{remark}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                <p className="text-amber-700 dark:text-amber-400 text-sm italic">
                  "{getRandomSacredMessage()}"
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewEntry(null)}
              className="w-full py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 text-center">
              <p className="text-lg font-bold">Generate PDF Report</p>
              <p className="text-sm text-white/80">Select date range</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  min={mantraAddedStr}
                  max={toDate || todayStr}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || mantraAddedStr}
                  max={todayStr}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <button
                onClick={generatePDFReport}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                Generate Report
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
