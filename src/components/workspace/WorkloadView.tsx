/**
 * WorkloadView.tsx — Asana-style team workload view
 * Grouped by department, shows each member's capacity bar.
 * Click on any user to expand their active tasks.
 * Manager can drag-reassign by editing tasks inline in GridBoard.
 */

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';
import { motion } from 'framer-motion';

export const WorkloadView = () => {
  const { users, departments, getUserWorkload, tasks, isManagerView } = useDemoStore();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');

  const mainDepts = departments.filter(d => d.id !== 'dept-exec');
  const filterDepts = filterDept === 'all' ? mainDepts : mainDepts.filter(d => d.id === filterDept);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team Workload</h2>
          <p className="text-sm text-gray-500 mt-0.5">Capacity management across all departments</p>
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="bg-base-800 border border-white/5 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All Departments</option>
          {mainDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {filterDepts.map(dept => {
        const deptUsers = users.filter(u => u.departmentId === dept.id);
        const anyOverloaded = deptUsers.some(u => getUserWorkload(u.id).isOverloaded);

        return (
          <div key={dept.id} className="glass-panel rounded-xl overflow-hidden">
            {/* Dept Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-base-900/30">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.color, boxShadow: `0 0 6px ${dept.color}80` }} />
                <span className="font-semibold text-sm text-gray-200">{dept.name}</span>
                <span className="text-[10px] text-gray-600 ml-1">{deptUsers.length} members</span>
              </div>
              {anyOverloaded && (
                <span className="text-xs text-warning-500 flex items-center gap-1.5">
                  ⚠ Some members over capacity — reassign tasks in the Main Table
                </span>
              )}
              {!anyOverloaded && (
                <span className="text-xs text-success-500 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Balanced
                </span>
              )}
            </div>

            {/* Members */}
            <div className="p-5 space-y-4">
              {deptUsers.map(user => {
                const wl = getUserWorkload(user.id);
                const userTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== 'Done');
                const isExpanded = expandedUser === user.id;

                return (
                  <div key={user.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full border border-white/10 shrink-0" />
                      <div className="w-32 shrink-0">
                        <p className="text-xs font-medium text-gray-300 truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-600">{user.role}</p>
                      </div>

                      {/* Progress bar — click to expand tasks */}
                      <div
                        className="flex-1 h-6 bg-base-900 rounded-lg overflow-hidden cursor-pointer relative hover:ring-1 hover:ring-white/10 transition-all"
                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        title="Click to see active tasks"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((wl.allocated / wl.capacity) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-lg"
                          style={{
                            background: wl.isOverloaded ? '#ef4444' : dept.color,
                            opacity: 0.8,
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white/50 pointer-events-none">
                          View tasks ↓
                        </span>
                      </div>

                      <span className={`text-xs font-medium w-24 text-right shrink-0 ${wl.isOverloaded ? 'text-danger-500 font-bold' : 'text-gray-500'}`}>
                        {wl.allocated}/{wl.capacity}h {wl.isOverloaded ? '🔴' : ''}
                      </span>
                    </div>

                    {/* Expanded task breakdown */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="ml-10 mt-2 p-3 bg-base-900/60 rounded-lg border border-white/5 space-y-1.5"
                      >
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
                          Active tasks · {user.name.split(' ')[0]} ({userTasks.length})
                        </p>
                        {userTasks.map(t => {
                          const isHeavy = t.estimatedHrs >= 20;
                          return (
                            <div key={t.id} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-md ${isHeavy && wl.isOverloaded ? 'bg-danger-500/5 border border-danger-500/15' : 'hover:bg-white/5'}`}>
                              <span className={isHeavy && wl.isOverloaded ? 'text-danger-400' : 'text-gray-300'}>{t.title}</span>
                              <span className={`font-medium ${isHeavy && wl.isOverloaded ? 'text-danger-500' : 'text-gray-500'}`}>{t.estimatedHrs}h</span>
                            </div>
                          );
                        })}
                        {userTasks.length === 0 && <p className="text-xs text-gray-600 text-center py-2">No active tasks — available for new work</p>}
                        {wl.isOverloaded && isManagerView && (
                          <div className="pt-2 border-t border-danger-500/20 text-[10px] text-danger-500 font-medium flex justify-between">
                            <span>Over capacity by:</span>
                            <span>{wl.allocated - wl.capacity}h — go to Main Table to reassign</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
