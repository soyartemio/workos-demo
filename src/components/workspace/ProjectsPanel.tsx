/**
 * ProjectsPanel.tsx — "All Projects" tab in the Workspace
 * Shows all projects across departments with budget/hours/task summary
 */

import React from 'react';
import { useDemoStore } from '../../store/demoStore';
import { getVisibleDepts, buildUserProjectSet, canViewProject } from '../../utils/permissions';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, CheckCircle2, TrendingDown, Clock } from 'lucide-react';

const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

const STATUS_CFG: Record<string, { color: string; icon: React.ReactNode }> = {
  'On Track':  { color: 'text-success-500 bg-success-500/10 border-success-500/20', icon: <CheckCircle2 size={11} /> },
  'At Risk':   { color: 'text-warning-500 bg-warning-500/10 border-warning-500/20', icon: <AlertTriangle size={11} /> },
  'Off Track': { color: 'text-danger-500 bg-danger-500/10 border-danger-500/20',   icon: <TrendingDown size={11} /> },
  'Completed': { color: 'text-brand-500 bg-brand-500/10 border-brand-500/20',      icon: <CheckCircle2 size={11} /> },
};

interface Props {
  onAddTask: (projectId: string) => void;
}


export const ProjectsPanel: React.FC<Props> = ({ onAddTask }) => {
  const { departments, projects, tasks, users, isManagerView, currentUserId } = useDemoStore();
  
  const currentUser = users.find(u => u.id === currentUserId) ?? null;
  const userProjectIds = currentUserId ? buildUserProjectSet(currentUserId, tasks) : new Set<string>();

  const mainDepts = currentUser ? getVisibleDepts(currentUser, departments) : [];
  const visibleProjects = currentUser
    ? projects.filter(p => canViewProject(currentUser, p, userProjectIds))
    : [];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h2 className="text-xl font-bold text-white">All Projects</h2>
        <p className="text-sm text-gray-500 mt-0.5">{visibleProjects.length} projects across {mainDepts.length} departments</p>
      </div>

      {mainDepts.map(dept => {
        const deptProjects = visibleProjects.filter(p => p.departmentId === dept.id);
        return (
          <div key={dept.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
              <h3 className="text-sm font-semibold text-gray-300">{dept.name}</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-2">
              {deptProjects.map((proj, idx) => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const spent = projTasks.reduce((s, t) => s + t.spentAmount, 0);
                const hrsUsed = projTasks.reduce((s, t) => s + t.actualHrs, 0);
                const done = projTasks.filter(t => t.status === 'Done').length;
                const completionPct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
                const owner = users.find(u => u.id === proj.ownerId);
                const cfg = STATUS_CFG[proj.status] ?? STATUS_CFG['On Track'];
                const budgetOverrun = spent > proj.budgetAmount;

                return (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-panel rounded-xl p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-100 truncate">{proj.name}</h4>
                          <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${cfg.color}`}>
                            {cfg.icon}{proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{proj.description}</p>
                      </div>
                      <button
                        onClick={() => onAddTask(proj.id)}
                        className="glass-btn text-xs border-white/5 hover:border-brand-500/30 hover:text-brand-400 shrink-0 gap-1"
                      >
                        <Plus size={11} /> Task
                      </button>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <Stat label="Tasks" value={`${done}/${projTasks.length}`} />
                      <Stat label="Hours" value={`${hrsUsed}/${proj.budgetHrs}h`} danger={hrsUsed > proj.budgetHrs} />
                      {isManagerView ? (
                        <Stat label="Budget" value={`${fmt$(spent)}/${fmt$(proj.budgetAmount)}`} danger={budgetOverrun} />
                      ) : (
                        <Stat label="Budget" value="••••••" />
                      )}
                      <Stat label="Owner" value={owner?.name.split(' ')[0] ?? '—'} />
                    </div>

                    {/* Completion bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                        <span>Completion</span>
                        <span>{completionPct}%</span>
                      </div>
                      <div className="h-1 bg-base-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${completionPct}%`, background: proj.status === 'Off Track' ? '#ef4444' : dept.color }}
                        />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600">{proj.startDate} → {proj.endDate}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Stat = ({ label, value, danger }: { label: string; value: string; danger?: boolean }) => (
  <div>
    <p className="text-[10px] text-gray-600">{label}</p>
    <p className={`text-xs font-semibold mt-0.5 ${danger ? 'text-danger-500' : 'text-gray-300'}`}>{value}</p>
  </div>
);
