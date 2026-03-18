/**
 * MobileHome.tsx — Mobile-only Home Dashboard
 * Shows: Greeting, KPI cards row, Department cards, Recent Tasks
 * Based on the approved Stitch mockup design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';

const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

interface Props {
  onDeptSelect: (deptId: string) => void;
  onTaskOpen: (taskId: string) => void;
}

export const MobileHome: React.FC<Props> = ({ onDeptSelect, onTaskOpen }) => {
  const { departments, projects, tasks, users, currentUserId, getDepartmentHealth } = useDemoStore();

  const currentUser = users.find(u => u.id === currentUserId);
  const mainDepts = departments.filter(d => d.id !== 'dept-exec');

  // Global KPIs
  const totalBudget    = projects.reduce((s, p) => s + p.budgetAmount, 0);
  const totalSpent     = tasks.reduce((s, t) => s + t.spentAmount, 0);
  const budgetPct      = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const totalHrsBudget = projects.reduce((s, p) => s + p.budgetHrs, 0);
  const totalHrsSpent  = tasks.reduce((s, t) => s + t.actualHrs, 0);
  const hrsPct         = totalHrsBudget > 0 ? Math.round((totalHrsSpent / totalHrsBudget) * 100) : 0;
  const doneTasks      = tasks.filter(t => t.status === 'Done').length;
  const atRisk         = projects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Recent tasks (last 5)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const kpis = [
    { icon: <DollarSign size={14} />, label: 'Budget Used', value: fmt$(totalSpent), sub: `${budgetPct}% of ${fmt$(totalBudget)}`, color: 'text-brand-400', bg: 'bg-brand-500/10', danger: budgetPct > 80 },
    { icon: <Clock size={14} />, label: 'Hours', value: `${totalHrsSpent}h`, sub: `${hrsPct}% of ${totalHrsBudget}h`, color: 'text-purple-400', bg: 'bg-purple-500/10', danger: hrsPct > 85 },
    { icon: <CheckCircle2 size={14} />, label: 'Tasks Done', value: `${doneTasks}`, sub: `of ${tasks.length} total`, color: 'text-success-400', bg: 'bg-success-500/10', danger: false },
    { icon: <AlertTriangle size={14} />, label: 'At Risk', value: `${atRisk}`, sub: 'projects flagged', color: 'text-warning-400', bg: 'bg-warning-500/10', danger: atRisk > 0 },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{greeting}, {firstName} 👋</h2>
          <p className="text-xs text-gray-500 mt-0.5">{today}</p>
        </div>
        {currentUser && (
          <img src={currentUser.avatar} alt={currentUser.name}
            className="w-10 h-10 rounded-full border-2 border-brand-500/30 shadow-[0_0_10px_rgba(59,130,246,0.25)]" />
        )}
      </motion.div>

      {/* KPI Scroll Row */}
      <div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-panel rounded-2xl p-3.5 shrink-0 w-36 flex flex-col gap-2.5"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">{kpi.label}</p>
                <p className={`text-xl font-bold leading-tight ${kpi.danger ? 'text-danger-400' : 'text-white'}`}>{kpi.value}</p>
                <p className={`text-[10px] mt-0.5 ${kpi.danger ? 'text-danger-500' : 'text-gray-500'}`}>{kpi.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Departments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">My Departments</h3>
          <span className="text-xs text-brand-400 font-medium">{mainDepts.length} active</span>
        </div>
        <div className="flex flex-col gap-2">
          {mainDepts.map((dept, i) => {
            const health = getDepartmentHealth(dept.id);
            const deptProjects = projects.filter(p => p.departmentId === dept.id);
            const atRiskCount = deptProjects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;
            const budgetRatio = health.totalBudget > 0 ? health.spentBudget / health.totalBudget : 0;

            return (
              <motion.button
                key={dept.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                onClick={() => onDeptSelect(dept.id)}
                className="glass-panel rounded-2xl p-4 text-left hover:bg-white/[0.04] active:scale-[0.98] transition-all w-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dept.color, boxShadow: `0 0 8px ${dept.color}80` }} />
                    <span className="font-semibold text-gray-100 text-sm">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {atRiskCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning-500/10 text-warning-500 border border-warning-500/20 uppercase tracking-wide">
                        {atRiskCount} risk
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div><p className="text-[9px] text-gray-600">Projects</p><p className="text-xs font-bold text-gray-200">{deptProjects.length}</p></div>
                  <div><p className="text-[9px] text-gray-600">Team</p><p className="text-xs font-bold text-gray-200">{users.filter(u => u.departmentId === dept.id).length}</p></div>
                  <div>
                    <p className="text-[9px] text-gray-600">Efficiency</p>
                    <p className={`text-xs font-bold ${health.efficiency > 70 ? 'text-success-400' : health.efficiency > 40 ? 'text-warning-400' : 'text-danger-400'}`}>
                      {health.efficiency}%
                    </p>
                  </div>
                </div>

                {/* Budget bar */}
                <div>
                  <div className="flex justify-between text-[9px] text-gray-600 mb-1">
                    <span>Budget</span>
                    <span>{fmt$(health.spentBudget)} / {fmt$(health.totalBudget)}</span>
                  </div>
                  <div className="h-1 bg-base-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(budgetRatio * 100, 100)}%`, background: budgetRatio > 1 ? '#ef4444' : dept.color }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3">Recent Tasks</h3>
        <div className="flex flex-col gap-1.5">
          {recentTasks.map((task, i) => {
            const assignee = users.find(u => u.id === task.assigneeId);
            const proj = projects.find(p => p.id === task.projectId);
            const dept = departments.find(d => d.id === proj?.departmentId);

            const STATUS_DOT: Record<string, string> = {
              'Done': 'bg-success-500', 'In Progress': 'bg-brand-500',
              'Review': 'bg-purple-500', 'Todo': 'bg-gray-500', 'Blocked': 'bg-danger-500',
            };

            return (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => onTaskOpen(task.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all active:scale-[0.98] w-full text-left"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{task.title}</p>
                  <p className="text-[10px] text-gray-500 truncate" style={{ color: dept?.color }}>{proj?.name}</p>
                </div>
                {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full shrink-0 border border-white/10" />}
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
