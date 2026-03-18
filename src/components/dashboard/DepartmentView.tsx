/**
 * DepartmentView.tsx — Director / Manager Level
 * Shows projects within a department, user workloads, task boards
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDemoStore, type TaskStatus } from '../../store/demoStore';
import { buildUserProjectSet, canViewProject } from '../../utils/permissions';
import {
  ArrowLeft, Users, Plus, ChevronDown, ChevronRight
} from 'lucide-react';

const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

const STATUS_COLORS: Record<TaskStatus, string> = {
  'Done':        'bg-success-500 text-white',
  'In Progress': 'bg-brand-500 text-white',
  'Review':      'bg-purple-500 text-white',
  'Todo':        'bg-gray-600 text-white',
  'Blocked':     'bg-danger-500 text-white',
};
const PRIORITY_COLORS: Record<string, string> = {
  'Urgent': 'text-danger-500 bg-danger-500/10 border-danger-500/20',
  'High':   'text-warning-500 bg-warning-500/10 border-warning-500/20',
  'Medium': 'text-brand-500 bg-brand-500/10 border-brand-500/20',
  'Low':    'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

interface DeptProps {
  onBack: () => void;
  onAddTask: (projectId: string) => void;
  onTaskOpen: (taskId: string) => void;
}

export const DepartmentView: React.FC<DeptProps> = ({ onBack, onAddTask, onTaskOpen }) => {
  const { activeDepartmentId, departments, projects, tasks, users, getUserWorkload, updateTaskStatus, isManagerView, currentUserId } = useDemoStore();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const dept = departments.find(d => d.id === activeDepartmentId);
  if (!dept) return null;

  const currentUser = users.find(u => u.id === currentUserId) ?? null;
  const userProjectIds = currentUserId ? buildUserProjectSet(currentUserId, tasks) : new Set<string>();

  const deptProjects = currentUser
    ? projects.filter(p => canViewProject(currentUser, p, userProjectIds))
    : [];

  const deptUsers = users.filter(u => u.departmentId === dept.id);


  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Breadcrumb Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="glass-btn border-white/5 hover:border-white/15 text-xs gap-1.5">
          <ArrowLeft size={12} /> Overview
        </button>
        <ChevronRight size={14} className="text-gray-600" />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.color, boxShadow: `0 0 6px ${dept.color}80` }} />
          <h1 className="text-xl font-bold text-white">{dept.name}</h1>
        </div>
      </div>

      {/* ── Team Workload Bar ── */}
      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Users size={14} className="text-gray-500" /> Team Workload
        </h3>
        <div className="space-y-3">
          {deptUsers.map(user => {
            const wl = getUserWorkload(user.id);
            return (
              <div key={user.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 py-1">
                <div className="flex items-center gap-3 md:w-32 shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-300 truncate">{user.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-gray-600">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 h-3 md:h-5 bg-base-800 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(wl.percentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: wl.isOverloaded ? '#ef4444' : dept.color, opacity: 0.85 }}
                    />
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium w-16 md:w-20 text-right shrink-0 ${wl.isOverloaded ? 'text-danger-500' : 'text-gray-400'}`}>
                    {wl.allocated}/{wl.capacity}h {wl.isOverloaded && '⚠️'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Project Cards ── */}
      <div className="space-y-3">
        {deptProjects.map(proj => {
          const projTasks = tasks.filter(t => t.projectId === proj.id);
          const spent = projTasks.reduce((s, t) => s + t.spentAmount, 0);
          const hrsUsed = projTasks.reduce((s, t) => s + t.actualHrs, 0);
          const isExpanded = expandedProject === proj.id;
          const budgetOverrun = spent > proj.budgetAmount;

          const statusColor: Record<string, string> = {
            'On Track': 'text-success-500 bg-success-500/10 border-success-500/20',
            'At Risk':  'text-warning-500 bg-warning-500/10 border-warning-500/20',
            'Off Track':'text-danger-500 bg-danger-500/10 border-danger-500/20',
            'Completed':'text-brand-500 bg-brand-500/10 border-brand-500/20',
          };

          return (
            <div key={proj.id} className="glass-panel rounded-xl overflow-hidden border-white/5">
              {/* Project Header */}
              <div
                className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors group gap-3"
                onClick={() => setExpandedProject(isExpanded ? null : proj.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? <ChevronDown size={14} className="text-gray-500 shrink-0" /> : <ChevronRight size={14} className="text-gray-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{proj.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{proj.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-7 md:ml-4 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[proj.status]}`}>{proj.status}</span>
                  {isManagerView && (
                    <>
                      <div className="text-right bg-base-900/40 px-2 py-1 rounded-md border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">Budget</p>
                        <p className={`text-xs font-bold ${budgetOverrun ? 'text-danger-500' : 'text-gray-300'}`}>{fmt$(spent)} / {fmt$(proj.budgetAmount)}</p>
                      </div>
                      <div className="text-right bg-base-900/40 px-2 py-1 rounded-md border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">Hours</p>
                        <p className={`text-xs font-bold ${hrsUsed > proj.budgetHrs ? 'text-danger-500' : 'text-gray-300'}`}>{hrsUsed}/{proj.budgetHrs}h</p>
                      </div>
                    </>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onAddTask(proj.id); }}
                    className="glass-btn text-xs gap-1 border-white/5 hover:border-brand-500/30 hover:text-brand-400 ml-auto md:ml-0"
                  >
                    <Plus size={11} /> Task
                  </button>
                </div>
              </div>


              {/* Expanded Task Table */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  <div className="w-full overflow-x-auto no-scrollbar pb-2">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-base-900/30">
                          <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Task</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium whitespace-nowrap">Assignee</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Status</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Priority</th>
                          {isManagerView && <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium whitespace-nowrap">Budget $</th>}
                          {isManagerView && <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Hours</th>}
                          <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projTasks.map(task => {
                          const assignee = users.find(u => u.id === task.assigneeId);
                          return (
                            <tr key={task.id} onClick={() => onTaskOpen(task.id)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                              <td className="px-4 py-2 text-gray-200 font-medium whitespace-nowrap">{task.title}</td>
                              <td className="px-4 py-2">
                                {assignee && (
                                  <div className="flex items-center gap-1.5">
                                    <img src={assignee.avatar} className="w-5 h-5 rounded-full border border-white/10 shrink-0" alt={assignee.name} />
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{assignee.name.split(' ')[0]}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const states: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'];
                                    const next = states[(states.indexOf(task.status) + 1) % states.length];
                                    updateTaskStatus(task.id, next);
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 whitespace-nowrap ${STATUS_COLORS[task.status]}`}
                                >
                                  {task.status}
                                </button>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium whitespace-nowrap ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                              </td>
                              {isManagerView && (
                                <td className={`px-4 py-2 text-right text-xs whitespace-nowrap ${task.spentAmount > task.budgetAmount ? 'text-danger-500' : 'text-gray-400'}`}>
                                  {fmt$(task.spentAmount)} / {fmt$(task.budgetAmount)}
                                </td>
                              )}
                              {isManagerView && (
                                <td className={`px-4 py-2 text-right text-xs whitespace-nowrap ${task.actualHrs > task.estimatedHrs ? 'text-danger-500' : 'text-gray-400'}`}>
                                  {task.actualHrs}/{task.estimatedHrs}h
                                </td>
                              )}
                              <td className="px-4 py-2 text-right text-xs text-gray-500 whitespace-nowrap">{task.dueDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
