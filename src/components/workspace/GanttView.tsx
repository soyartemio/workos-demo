/**
 * GanttView.tsx — Timeline / Gantt chart view for Projects
 * Shows all projects on a horizontal timeline grouped by department.
 * Built with pure CSS — no external chart library needed.
 */

import React, { useMemo } from 'react';
import { useDemoStore } from '../../store/demoStore';

const STATUS_COLOR: Record<string, string> = {
  'On Track':  '#22c55e',
  'At Risk':   '#f59e0b',
  'Off Track': '#ef4444',
  'Completed': '#6366f1',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GanttView: React.FC = () => {
  const { departments, projects, tasks } = useDemoStore();

  // Determine view range: earliest start to latest end across all projects
  const { startMs, endMs } = useMemo(() => {
    const dates = projects.flatMap(p => [new Date(p.startDate).getTime(), new Date(p.endDate).getTime()]);
    const startMs = Math.min(...dates);
    const endMs   = Math.max(...dates);
    return { startMs, endMs };
  }, [projects]);


  // Build month markers for the header
  const monthMarkers = useMemo(() => {
    const markers: { label: string; leftPct: number }[] = [];
    const d = new Date(startMs);
    d.setDate(1); // Start of month
    while (d.getTime() <= endMs) {
      const pct = ((d.getTime() - startMs) / (endMs - startMs)) * 100;
      markers.push({ label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, leftPct: Math.max(0, pct) });
      d.setMonth(d.getMonth() + 1);
    }
    return markers;
  }, [startMs, endMs]);

  const getBar = (startDate: string, endDate: string) => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    const leftPct  = ((s - startMs) / (endMs - startMs)) * 100;
    const widthPct = ((e - s) / (endMs - startMs)) * 100;
    return {
      left:  `${Math.max(0, leftPct).toFixed(2)}%`,
      width: `${Math.max(1, widthPct).toFixed(2)}%`,
    };
  };

  // Today line
  const todayPct = ((Date.now() - startMs) / (endMs - startMs)) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  const mainDepts = departments.filter(d => d.id !== 'dept-exec');

  return (
    <div className="flex flex-col h-full pb-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">Timeline</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Project schedules · {new Date(startMs).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} →{' '}
          {new Date(endMs).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden flex flex-col flex-1">
        {/* Timeline header */}
        <div className="flex border-b border-white/5 bg-base-900/40 shrink-0">
          {/* Sidebar spacer */}
          <div className="w-52 shrink-0 border-r border-white/5 px-4 py-2.5">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Project</span>
          </div>
          {/* Month ticks */}
          <div className="flex-1 relative h-9 overflow-hidden">
            {monthMarkers.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center border-l border-white/5"
                style={{ left: `${m.leftPct}%` }}
              >
                <span className="text-[10px] text-gray-600 px-2 whitespace-nowrap">{m.label}</span>
              </div>
            ))}
            {/* Today line */}
            {showToday && (
              <div
                className="absolute top-0 h-full border-l-2 border-brand-500/60"
                style={{ left: `${todayPct}%` }}
                title="Today"
              >
                <span className="absolute -top-0.5 -left-3 text-[8px] bg-brand-500 text-white px-1 rounded">NOW</span>
              </div>
            )}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {mainDepts.map(dept => {
            const deptProjects = projects.filter(p => p.departmentId === dept.id);
            return (
              <React.Fragment key={dept.id}>
                {/* Department separator */}
                <div className="flex bg-base-900/60 sticky top-0 z-10">
                  <div className="w-52 shrink-0 border-r border-white/5 px-4 py-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: dept.color }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dept.name}</span>
                  </div>
                  <div className="flex-1" />
                </div>

                {deptProjects.map(proj => {
                  const bar = getBar(proj.startDate, proj.endDate);
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const done = projTasks.filter(t => t.status === 'Done').length;
                  const barColor = STATUS_COLOR[proj.status] ?? '#6b7280';

                  return (
                    <div key={proj.id} className="flex items-center hover:bg-white/[0.02] transition-colors group" style={{ minHeight: '44px' }}>
                      {/* Label */}
                      <div className="w-52 shrink-0 border-r border-white/5 px-4 py-2">
                        <p className="text-xs font-medium text-gray-300 truncate">{proj.name}</p>
                        <p className="text-[10px] text-gray-600">{done}/{projTasks.length} tasks</p>
                      </div>

                      {/* Bar track */}
                      <div className="flex-1 relative h-full py-2 px-2">
                        {/* Grid lines */}
                        {monthMarkers.map((m, i) => (
                          <div key={i} className="absolute top-0 h-full border-l border-white/[0.03]" style={{ left: `${m.leftPct}%` }} />
                        ))}

                        {/* The bar */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full flex items-center px-2 overflow-hidden transition-all duration-500 group-hover:brightness-110"
                          style={{
                            left: bar.left,
                            width: bar.width,
                            background: `${barColor}28`,
                            border: `1px solid ${barColor}50`,
                            minWidth: '40px',
                          }}
                          title={`${proj.startDate} → ${proj.endDate}`}
                        >
                          {/* Completion fill */}
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0}%`,
                              background: barColor,
                              opacity: 0.4,
                            }}
                          />
                          <span className="relative text-[9px] font-semibold text-white/80 whitespace-nowrap truncate">
                            {proj.name}
                          </span>
                        </div>

                        {/* Today indicator within track */}
                        {showToday && (
                          <div
                            className="absolute top-0 h-full border-l border-brand-500/30 pointer-events-none"
                            style={{ left: `${todayPct}%` }}
                          />
                        )}
                      </div>

                      {/* Status pill */}
                      <div className="w-24 shrink-0 pr-4 text-right">
                        <span className="text-[10px] font-medium" style={{ color: barColor }}>{proj.status}</span>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 bg-base-900/30">
          {Object.entries(STATUS_COLOR).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
          {showToday && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-3 border-t-2 border-brand-500" />
              <span className="text-[10px] text-gray-500">Today</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
