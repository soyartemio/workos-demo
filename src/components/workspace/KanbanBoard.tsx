/**
 * KanbanBoard.tsx — Trello/Monday.com-style board view
 * Four columns: Todo | In Progress | Review | Done
 * Click a card to cycle its status. Drag-drop-free for demo stability.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoStore, type TaskStatus } from '../../store/demoStore';
import { Plus } from 'lucide-react';

interface Props {
  onAddTask: (projectId: string) => void;
  onOpenTask: (taskId: string) => void;
}


const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'Todo',        label: 'To Do',      color: '#6b7280' },
  { status: 'In Progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'Review',      label: 'Review',      color: '#a855f7' },
  { status: 'Done',        label: 'Done',        color: '#22c55e' },
];

const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500',
  High:   'bg-orange-400',
  Medium: 'bg-blue-500',
  Low:    'bg-gray-500',
};

export const KanbanBoard: React.FC<Props> = ({ onAddTask, onOpenTask }) => {
  const { tasks, users, projects, departments, updateTaskStatus, currentUserId } = useDemoStore();

  const [filterDept, setFilterDept] = useState<string>('all');

  const currentUser = users.find(u => u.id === currentUserId);
  const isContributor = currentUser?.role === 'Contributor';

  const mainDepts = departments.filter(d => {
    if (d.id === 'dept-exec') return false;
    if (isContributor && currentUser?.departmentId !== d.id) return false;
    return true;
  });

  const filtered = tasks.filter(t => {
    if (filterDept !== 'all') {
      const proj = projects.find(p => p.id === t.projectId);
      if (proj?.departmentId !== filterDept) return false;
    }
    
    if (isContributor) {
      const userTasksInProj = tasks.filter(ut => ut.projectId === t.projectId && ut.assigneeId === currentUserId);
      if (userTasksInProj.length === 0) return false;
    }

    return true;
  });

  // Cycle status on card click
  const cycleStatus = (taskId: string, current: TaskStatus) => {
    const ALL: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
    const next = ALL[(ALL.indexOf(current) + 1) % ALL.length];
    updateTaskStatus(taskId, next);
  };

  const firstProject = projects[0];

  return (
    <div className="flex flex-col h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Board</h2>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} tasks — click a card to advance its status</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-base-800 border border-white/5 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Departments</option>
            {mainDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {firstProject && (
            <button
              onClick={() => onAddTask(firstProject.id)}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.25)]"
            >
              <Plus size={12} /> Task
            </button>
          )}
        </div>
      </div>

      {/* Columns — horizontal scroll with snap on mobile */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2 snap-x snap-mandatory md:snap-none">

        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.status);
          return (
            <div key={col.status} className="flex flex-col w-[85vw] md:w-72 shrink-0 snap-start">

              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{col.label}</span>
                <span className="ml-auto text-xs text-gray-600 bg-base-800 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              {/* Card list */}
              <div className="flex flex-col gap-2 flex-1">
                <AnimatePresence>
                  {colTasks.map((task, idx) => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const proj = projects.find(p => p.id === task.projectId);
                    const dept = departments.find(d => d.id === proj?.departmentId);

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => onOpenTask(task.id)}
                        className="glass-panel rounded-xl p-3 cursor-pointer hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/20 active:scale-[0.98] transition-all group select-none shadow-lg"
                      >

                        {/* Project tag */}
                        {proj && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-2 inline-block" style={{ background: `${dept?.color}18`, color: dept?.color }}>
                            {proj.name}
                          </span>
                        )}

                        {/* Title */}
                        <p className="text-sm font-medium text-gray-200 mb-2 leading-snug">{task.title}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
                            <span className="text-[10px] text-gray-600">{task.priority}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">{task.dueDate}</span>

                            {assignee && (
                              <img src={assignee.avatar} alt={assignee.name} title={assignee.name} className="w-5 h-5 rounded-full border border-white/10" />
                            )}
                          </div>
                        </div>

                        {/* Advance hint */}
                        <div 
                          onClick={(e) => { e.stopPropagation(); cycleStatus(task.id, task.status); }}
                          className="mt-2 pt-2 border-t border-white/5 text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-brand-400 transition-colors text-center"
                        >
                          Cycle Status
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="flex-1 rounded-xl border border-dashed border-white/5 flex items-center justify-center min-h-[80px]">
                    <span className="text-xs text-gray-700">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Blocked column — separate since it's less common */}
        <div className="flex flex-col w-72 shrink-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full bg-danger-500" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Blocked</span>
            <span className="ml-auto text-xs text-gray-600 bg-base-800 px-1.5 py-0.5 rounded-full">
              {filtered.filter(t => t.status === 'Blocked').length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {filtered.filter(t => t.status === 'Blocked').map((task) => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const proj = projects.find(p => p.id === task.projectId);
              const dept = departments.find(d => d.id === proj?.departmentId);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onOpenTask(task.id)}
                  className="glass-panel rounded-xl p-3 cursor-pointer hover:bg-white/[0.04] transition-all border-danger-500/30 border select-none"

                >
                  {proj && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-2 inline-block" style={{ background: `${dept?.color}18`, color: dept?.color }}>
                      {proj.name}
                    </span>
                  )}
                  <p className="text-sm font-medium text-danger-300 mb-2">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-danger-600">🔴 Blocked</span>
                    {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full border border-danger-500/30" />}
                  </div>
                </motion.div>
              );
            })}
            {filtered.filter(t => t.status === 'Blocked').length === 0 && (
              <div className="rounded-xl border border-dashed border-white/5 flex items-center justify-center min-h-[80px]">
                <span className="text-xs text-gray-700">None blocked</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
