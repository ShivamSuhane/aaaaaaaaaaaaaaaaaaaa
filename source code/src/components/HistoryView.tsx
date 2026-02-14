import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHistory } from '../types';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function HistoryView() {
  const { selectedMantra, setCurrentView, updateMantra, showToast } = useApp();
  const [showLogs, setShowLogs] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [remarkModal, setRemarkModal] = useState<{ date: string; remark: string } | null>(null);
  const journeyRef = useRef<HTMLDivElement>(null);

  const mantra = selectedMantra;

  if (!mantra) {
    setCurrentView('savedMantras');
    return null;
  }

  const malaSize = mantra.malaSize || 108;
  const mantraAddedDate = new Date(mantra.createdAt);
  const formattedAddedDate = mantraAddedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const daysSinceAdded = useMemo(() => {
    const today = new Date();
    const added = new Date(mantra.createdAt);
    const diff = Math.floor((today.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 1, 30);
  }, [mantra.createdAt]);

  const historyData = useMemo(() => {
    const history: DailyHistory[] = [];
    const today = new Date();
    const addedDate = new Date(mantra.createdAt);
    addedDate.setHours(0, 0, 0, 0);
    
    const daysToShow = Math.min(
      Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      30
    );
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      if (date < addedDate) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const dayName = DAYS_FULL[dayOfWeek];
      
      const isPracticeDay = mantra.practiceDays.includes(dayOfWeek);
      const existingHistory = (mantra.dailyHistory || []).find(h => h.date === dateStr);
      
      if (existingHistory) {
        history.push({
          ...existingHistory,
          dayName,
          status: {
            practiced: existingHistory.mantraCount > 0,
            beadsUpdated: existingHistory.status?.beadsUpdated || false,
            settingsUpdated: existingHistory.status?.settingsUpdated || false,
            missed: isPracticeDay && existingHistory.mantraCount === 0,
            isPracticeDay,
          }
        });
      } else {
        history.push({
          date: dateStr,
          dayName,
          mantraCount: 0,
          malaCount: 0,
          beadsPerMala: malaSize,
          remark: '',
          status: {
            practiced: false,
            beadsUpdated: false,
            settingsUpdated: false,
            missed: isPracticeDay,
            isPracticeDay,
          }
        });
      }
    }
    
    return history.reverse();
  }, [mantra, malaSize]);

  const weeklyJourney = useMemo(() => {
    const weeks: { label: string; count: number; malas: number; days: number }[] = [];
    const allHistory = [...historyData].reverse();
    
    for (let i = 0; i < allHistory.length; i += 7) {
      const weekData = allHistory.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      const totalCount = weekData.reduce((sum, h) => sum + h.mantraCount, 0);
      const totalMalas = weekData.reduce((sum, h) => sum + Math.floor(h.mantraCount / malaSize), 0);
      const practicedDays = weekData.filter(h => h.mantraCount > 0).length;
      
      weeks.push({
        label: `W${weekNum}`,
        count: totalCount,
        malas: totalMalas,
        days: practicedDays,
      });
    }
    
    return weeks;
  }, [historyData, malaSize]);

  const maxWeekCount = useMemo(() => {
    return Math.max(...weeklyJourney.map(w => w.count), 1);
  }, [weeklyJourney]);

  useEffect(() => {
    if (journeyRef.current) {
      const container = journeyRef.current;
      let scrollPos = 0;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (maxScroll > 0) {
        const interval = setInterval(() => {
          scrollPos += 1;
          if (scrollPos >= maxScroll) scrollPos = 0;
          container.scrollLeft = scrollPos;
        }, 50);
        
        return () => clearInterval(interval);
      }
    }
  }, [weeklyJourney]);

  const totalMantras = useMemo(() => {
    return historyData.reduce((sum, h) => sum + h.mantraCount, 0);
  }, [historyData]);

  const totalPracticedDays = useMemo(() => {
    return historyData.filter(h => h.mantraCount > 0).length;
  }, [historyData]);

  const getRemarkText = (entry: DailyHistory) => {
    const remarks: string[] = [];
    
    if (!entry.status.isPracticeDay) {
      remarks.push('Non Practice Day');
    } else if (!entry.status.practiced) {
      remarks.push('Non Practiced');
    }
    
    if (entry.status.beadsUpdated) {
      remarks.push('Beads Updated');
    }
    
    if (entry.status.settingsUpdated) {
      remarks.push('Settings Changed');
    }
    
    if (entry.remark) {
      remarks.push(entry.remark);
    }
    
    return remarks.length > 0 
      ? remarks.map((r, i) => `${remarks.length > 1 ? `${i + 1}. ` : ''}${r}`).join(', ')
      : '-';
  };

  const getRowClass = (entry: DailyHistory) => {
    if (!entry.status.isPracticeDay) {
      return 'bg-gray-100 dark:bg-slate-700/50';
    }
    if (!entry.status.practiced) {
      return 'bg-red-50 dark:bg-red-900/20';
    }
    return 'bg-white dark:bg-slate-800';
  };

  const saveRemark = () => {
    if (!remarkModal || !mantra) return;
    
    const dailyHistory = [...(mantra.dailyHistory || [])];
    const existingIndex = dailyHistory.findIndex(h => h.date === remarkModal.date);
    
    if (existingIndex >= 0) {
      dailyHistory[existingIndex] = {
        ...dailyHistory[existingIndex],
        remark: remarkModal.remark,
        lastUpdated: Date.now(),
      };
    } else {
      dailyHistory.push({
        date: remarkModal.date,
        mantraCount: 0,
        malaCount: 0,
        beadsPerMala: malaSize,
        remark: remarkModal.remark,
        status: { practiced: false, beadsUpdated: false, settingsUpdated: false, missed: true },
        lastUpdated: Date.now(),
      });
    }
    
    updateMantra(mantra.id, { dailyHistory });
    setRemarkModal(null);
    showToast('Remark saved!', 'success');
  };

  const generatePDF = () => {
    let dataToExport = historyData;
    if (fromDate && toDate) {
      dataToExport = historyData.filter(h => h.date >= fromDate && h.date <= toDate);
    }

    const pdfPracticedDays = dataToExport.filter(h => h.mantraCount > 0).length;
    const pdfTotalMantras = dataToExport.reduce((sum, h) => sum + h.mantraCount, 0);
    const pdfTotalMalas = dataToExport.reduce((sum, h) => sum + Math.floor(h.mantraCount / malaSize), 0);
    const pdfAvgDaily = pdfPracticedDays > 0 ? Math.round(pdfTotalMantras / pdfPracticedDays) : 0;
    const pdfAvgMala = pdfPracticedDays > 0 ? (pdfTotalMalas / pdfPracticedDays).toFixed(1) : '0';
    const pdfMissedDays = dataToExport.filter(h => h.status.isPracticeDay && !h.status.practiced).length;
    const pdfNonPracticeDays = dataToExport.filter(h => !h.status.isPracticeDay).length;

    let bestDay = { date: '-', day: '-', count: 0 };
    dataToExport.forEach(h => {
      if (h.mantraCount > bestDay.count) {
        bestDay = { date: h.date, day: h.dayName || '-', count: h.mantraCount };
      }
    });

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const practiced = dataToExport.filter(h => h.mantraCount > 0).sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < practiced.length; i++) {
      if (i === 0) { tempStreak = 1; }
      else {
        const prev = new Date(practiced[i-1].date);
        const curr = new Date(practiced[i].date);
        tempStreak = ((curr.getTime() - prev.getTime()) / 86400000) === 1 ? tempStreak + 1 : 1;
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    if (practiced.length > 0) {
      const last = new Date(practiced[practiced.length-1].date);
      const today = new Date(); today.setHours(0,0,0,0); last.setHours(0,0,0,0);
      currentStreak = ((today.getTime() - last.getTime()) / 86400000) <= 1 ? tempStreak : 0;
    }

    const dayWise = new Map<string, { count: number; days: number }>();
    DAYS_FULL.forEach(d => dayWise.set(d, { count: 0, days: 0 }));
    dataToExport.forEach(h => {
      if (h.dayName && h.mantraCount > 0) {
        const existing = dayWise.get(h.dayName) || { count: 0, days: 0 };
        existing.count += h.mantraCount;
        existing.days++;
        dayWise.set(h.dayName, existing);
      }
    });
    const maxDayCount = Math.max(...Array.from(dayWise.values()).map(v => v.count), 1);
    let mostPracticedDay = '-';
    let mostPracticedCount = 0;
    dayWise.forEach((v, k) => { if (v.count > mostPracticedCount) { mostPracticedCount = v.count; mostPracticedDay = k; } });

    const pdfWeeks: { label: string; dateRange: string; count: number; malas: number; days: number }[] = [];
    const reversedData = [...dataToExport].reverse();
    for (let i = 0; i < reversedData.length; i += 7) {
      const weekData = reversedData.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      pdfWeeks.push({
        label: `Week ${weekNum}`,
        dateRange: `${weekData[0]?.date || ''} to ${weekData[weekData.length - 1]?.date || ''}`,
        count: weekData.reduce((s, h) => s + h.mantraCount, 0),
        malas: weekData.reduce((s, h) => s + Math.floor(h.mantraCount / malaSize), 0),
        days: weekData.filter(h => h.mantraCount > 0).length,
      });
    }
    const maxWeekPdf = Math.max(...pdfWeeks.map(w => w.count), 1);

    const monthlyMap = new Map<string, { count: number; malas: number; days: number; total: number }>();
    dataToExport.forEach(h => {
      const mk = h.date.substring(0, 7);
      const ex = monthlyMap.get(mk) || { count: 0, malas: 0, days: 0, total: 0 };
      ex.count += h.mantraCount;
      ex.malas += Math.floor(h.mantraCount / malaSize);
      ex.total++;
      if (h.mantraCount > 0) ex.days++;
      monthlyMap.set(mk, ex);
    });
    const maxMonthCount = Math.max(...Array.from(monthlyMap.values()).map(v => v.count), 1);

    const totalPracticeDaysExpected = dataToExport.filter(h => h.status.isPracticeDay).length;
    const consistencyPercent = totalPracticeDaysExpected > 0 ? Math.round((pdfPracticedDays / totalPracticeDaysExpected) * 100) : 0;

    const printContent = `
      <html>
        <head>
          <title>Mantra Report - ${mantra.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #333; font-size: 13px; }
            h1 { color: #4f46e5; text-align: center; font-size: 22px; margin-bottom: 3px; }
            h2 { color: #4f46e5; font-size: 16px; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; margin: 25px 0 12px 0; }
            h3 { color: #6366f1; font-size: 14px; margin: 15px 0 8px 0; }
            .header-info { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
            .header-info p { margin: 2px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
            .stat-box { border-radius: 8px; padding: 12px 8px; text-align: center; }
            .stat-box.indigo { background: #eef2ff; border-left: 3px solid #4f46e5; }
            .stat-box.emerald { background: #ecfdf5; border-left: 3px solid #10b981; }
            .stat-box.amber { background: #fffbeb; border-left: 3px solid #f59e0b; }
            .stat-box.red { background: #fef2f2; border-left: 3px solid #ef4444; }
            .stat-box.purple { background: #faf5ff; border-left: 3px solid #a855f7; }
            .stat-box.blue { background: #eff6ff; border-left: 3px solid #3b82f6; }
            .stat-value { font-size: 22px; font-weight: bold; color: #1f2937; }
            .stat-label { font-size: 10px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
            .chart-container { margin: 12px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .bar-row { display: flex; align-items: center; margin: 6px 0; }
            .bar-label { width: 80px; font-size: 11px; font-weight: 600; color: #374151; }
            .bar-track { flex: 1; height: 22px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 0 8px; }
            .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 6px; color: white; font-size: 10px; font-weight: 600; min-width: 30px; }
            .bar-fill.indigo { background: #4f46e5; }
            .bar-fill.emerald { background: #10b981; }
            .bar-fill.amber { background: #f59e0b; }
            .bar-fill.purple { background: #a855f7; }
            .bar-fill.blue { background: #3b82f6; }
            .bar-fill.pink { background: #ec4899; }
            .bar-fill.red { background: #ef4444; }
            .bar-value { width: 60px; text-align: right; font-size: 11px; font-weight: 600; color: #374151; }
            .info-card { background: #f9fafb; border-radius: 8px; padding: 10px 14px; margin: 6px 0; border-left: 3px solid #4f46e5; display: flex; justify-content: space-between; align-items: center; }
            .info-card.gold { border-left-color: #f59e0b; background: #fffbeb; }
            .info-card.red { border-left-color: #ef4444; background: #fef2f2; }
            .info-card.green { border-left-color: #10b981; background: #ecfdf5; }
            .info-label { font-size: 11px; color: #6b7280; }
            .info-value { font-size: 13px; font-weight: 700; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #4f46e5; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
            td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #f9fafb; }
            .non-practice { background: #f3f4f6 !important; color: #9ca3af; }
            .missed { background: #fef2f2 !important; }
            .footer { text-align: center; margin-top: 25px; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <h1>🕉️ Mantra Meter - Practice Report</h1>
          <div class="header-info">
            <p><strong>Mantra:</strong> ${mantra.name}</p>
            <p><strong>Mantra Added:</strong> ${formattedAddedDate} | <strong>Beads/Mala:</strong> ${malaSize}</p>
            <p><strong>Report Period:</strong> ${dataToExport[dataToExport.length - 1]?.date || '-'} to ${dataToExport[0]?.date || '-'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>

          <h2>📊 Overall Summary</h2>
          <div class="stats-grid">
            <div class="stat-box indigo"><div class="stat-value">${pdfTotalMantras}</div><div class="stat-label">Total Mantras</div></div>
            <div class="stat-box emerald"><div class="stat-value">${pdfTotalMalas}</div><div class="stat-label">Total Malas</div></div>
            <div class="stat-box amber"><div class="stat-value">${pdfPracticedDays}</div><div class="stat-label">Days Practiced</div></div>
            <div class="stat-box purple"><div class="stat-value">${pdfAvgDaily}</div><div class="stat-label">Avg Mantra/Day</div></div>
            <div class="stat-box blue"><div class="stat-value">${pdfAvgMala}</div><div class="stat-label">Avg Mala/Day</div></div>
            <div class="stat-box red"><div class="stat-value">${consistencyPercent}%</div><div class="stat-label">Consistency</div></div>
          </div>

          <div class="info-card gold">
            <div><div class="info-label">⭐ Best Practice Day</div><div class="info-value">${bestDay.day}, ${bestDay.date}</div></div>
            <div class="info-value">${bestDay.count} mantras (${Math.floor(bestDay.count / malaSize)} malas)</div>
          </div>
          <div class="info-card red">
            <div><div class="info-label">🔥 Streak</div><div class="info-value">Current: ${currentStreak} days</div></div>
            <div class="info-value">Best: ${bestStreak} days</div>
          </div>
          <div class="info-card green">
            <div><div class="info-label">📅 Practice Summary</div><div class="info-value">Practiced: ${pdfPracticedDays} | Missed: ${pdfMissedDays} | Rest: ${pdfNonPracticeDays}</div></div>
          </div>

          <h2>📊 Day-wise Analysis</h2>
          <div class="chart-container">
            <h3>Mantras by Day of Week</h3>
            ${DAYS_FULL.map((day, i) => {
              const data = dayWise.get(day) || { count: 0, days: 0 };
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
            <p style="text-align:center; margin-top:8px; font-size:11px; color:#6b7280;">
              📌 Most Practiced: <strong>${mostPracticedDay}</strong> (${mostPracticedCount} mantras)
            </p>
          </div>

          <h2>📅 Weekly Progress</h2>
          <div class="chart-container">
            ${pdfWeeks.map((w) => {
              const pct = Math.max((w.count / maxWeekPdf) * 100, 3);
              return `
                <div class="bar-row">
                  <div class="bar-label">${w.label}</div>
                  <div class="bar-track">
                    <div class="bar-fill indigo" style="width: ${pct}%">${w.count}</div>
                  </div>
                  <div class="bar-value">${w.malas}m ${w.days}d</div>
                </div>
              `;
            }).join('')}
          </div>

          <h2>📆 Monthly Summary</h2>
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
                  <div class="bar-value">${data.malas}m ${data.days}/${data.total}d</div>
                </div>
              `;
            }).join('')}
          </div>

          <h2>🎯 Consistency Overview</h2>
          <div class="chart-container" style="text-align:center;">
            <div style="display:inline-block; width:140px; height:140px; border-radius:50%; background: conic-gradient(#10b981 0% ${consistencyPercent}%, #ef4444 ${consistencyPercent}% ${consistencyPercent + (pdfMissedDays / Math.max(totalPracticeDaysExpected, 1) * 100)}%, #d1d5db ${consistencyPercent + (pdfMissedDays / Math.max(totalPracticeDaysExpected, 1) * 100)}% 100%); margin: 0 auto;">
              <div style="width:90px; height:90px; border-radius:50%; background:white; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold; color:#10b981; margin: 25px auto 0;">
                ${consistencyPercent}%
              </div>
            </div>
            <div style="display:flex; justify-content:center; gap:20px; margin-top:12px; font-size:11px;">
              <div><span style="display:inline-block; width:12px; height:12px; background:#10b981; border-radius:3px; margin-right:4px;"></span>Practiced (${pdfPracticedDays})</div>
              <div><span style="display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:3px; margin-right:4px;"></span>Missed (${pdfMissedDays})</div>
              <div><span style="display:inline-block; width:12px; height:12px; background:#d1d5db; border-radius:3px; margin-right:4px;"></span>Rest (${pdfNonPracticeDays})</div>
            </div>
          </div>

          <div class="page-break"></div>
          <h1>🕉️ Mantra Meter - Daily Logs</h1>
          <div class="header-info">
            <p><strong>Mantra:</strong> ${mantra.name} | <strong>Added:</strong> ${formattedAddedDate}</p>
          </div>

          <h2>📜 Daily Practice Log</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Mantra Count</th>
              <th>Mala Count</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
            ${dataToExport.map(entry => {
              const status = !entry.status.isPracticeDay ? 'Rest Day' : entry.status.practiced ? '✅ Practiced' : '❌ Missed';
              const rowClass = !entry.status.isPracticeDay ? 'non-practice' : !entry.status.practiced ? 'missed' : '';
              return `
                <tr class="${rowClass}">
                  <td>${entry.date}</td>
                  <td>${entry.dayName || '-'}</td>
                  <td style="font-weight:600;">${entry.mantraCount}</td>
                  <td>${Math.floor(entry.mantraCount / malaSize)}</td>
                  <td>${status}</td>
                  <td style="font-size:10px;">${getRemarkText(entry)}</td>
                </tr>
              `;
            }).join('')}
          </table>

          <div class="footer">
            <p><strong>Report Summary:</strong> ${dataToExport.length} days | ${pdfPracticedDays} practiced | ${pdfTotalMantras} mantras | ${pdfTotalMalas} malas | ${consistencyPercent}% consistency</p>
            <p style="margin-top:5px;">🕉️ Generated by Mantra Meter App | Har Har Mahadev 🙏</p>
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
    showToast('PDF generated with charts!', 'success');
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
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
              <button onClick={() => setRemarkModal(null)} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={saveRemark} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Select Date Range</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full p-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full p-2 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDatePicker(false)} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={generatePDF} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold">
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button onClick={() => setCurrentView('mantraDetails')} className="w-full bg-slate-700 text-white py-3 flex items-center justify-center gap-2 font-semibold">
        <i className="fas fa-arrow-left"></i>
        <span>Back</span>
      </button>

      {/* Helper Message */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-800">
        <i className="fas fa-info-circle text-indigo-500"></i>
        <span className="text-sm text-indigo-700 dark:text-indigo-300">
          Mantra added: <strong>{formattedAddedDate}</strong> ({daysSinceAdded} days ago)
        </span>
      </div>

      {/* Journey Progress */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>📿</span> Your Mantra Journey
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
            {formattedAddedDate} → Today
          </span>
        </div>

        <div ref={journeyRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollBehavior: 'smooth' }}>
          {weeklyJourney.map((week, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[70px]">
              <div className="w-12 h-24 bg-gray-100 dark:bg-slate-700 rounded-lg relative overflow-hidden flex items-end">
                <div className="w-full bg-indigo-500 rounded-lg transition-all duration-1000" style={{ height: `${Math.max((week.count / maxWeekCount) * 100, 5)}%` }}></div>
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-white mt-1">{week.count}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{week.label}</span>
              <div className={`w-2 h-2 rounded-full mt-1 ${week.count > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <div className="text-center">
            <span className="text-lg font-bold text-indigo-600">{daysSinceAdded}</span>
            <span className="block text-xs text-gray-500">Days</span>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-emerald-600">{totalMantras}</span>
            <span className="block text-xs text-gray-500">Mantras</span>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-purple-600">{Math.floor(totalMantras / malaSize)}</span>
            <span className="block text-xs text-gray-500">Malas</span>
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-amber-600">{totalPracticedDays}</span>
            <span className="block text-xs text-gray-500">Practiced</span>
          </div>
        </div>
      </div>

      {/* Recent Logs Toggle */}
      <button onClick={() => setShowLogs(!showLogs)} className="w-full bg-indigo-600 text-white py-3 font-semibold flex items-center justify-center gap-2">
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
                <th className="py-2 px-2 text-center">Count</th>
                <th className="py-2 px-2 text-center">Mala</th>
                <th className="py-2 px-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((entry) => (
                <tr key={entry.date} className={`border-b border-gray-100 dark:border-slate-700 ${getRowClass(entry)}`} onClick={() => setRemarkModal({ date: entry.date, remark: entry.remark })}>
                  <td className="py-2 px-2 text-gray-800 dark:text-gray-200 text-xs">{entry.date}</td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs">{entry.dayName?.slice(0, 3)}</td>
                  <td className="py-2 px-2 text-center font-semibold text-gray-800 dark:text-white">{entry.mantraCount}</td>
                  <td className="py-2 px-2 text-center font-semibold text-gray-800 dark:text-white">{Math.floor(entry.mantraCount / malaSize)}</td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs">{getRemarkText(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Download Button */}
      <button onClick={() => setShowDatePicker(true)} className="w-full bg-emerald-600 text-white py-3 font-semibold flex items-center justify-center gap-2">
        <i className="fas fa-file-pdf"></i>
        Download History
      </button>
    </div>
  );
}