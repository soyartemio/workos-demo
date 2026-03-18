/**
 * CEODashboard.tsx — Executive Level Overview
 * Shows department health, budget status, workload distribution, top risks.
 * Designed for the CEO: global picture, drill-down to departments.
 */

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { motion } from 'framer-motion';
import {
  TrendingDown, AlertTriangle, CheckCircle2,
  DollarSign, Clock, ChevronRight, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, Radar, PolarAngleAxis } from 'recharts';

// ── Utility ──────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
const fmtPct = (n: number) => `${n}%`;

// Status config
const PROJECT_STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'On Track':  { color: 'text-success-500', bg: 'bg-success-500/10 border-success-500/25', icon: <CheckCircle2 size={12} /> },
  'At Risk':   { color: 'text-warning-500', bg: 'bg-warning-500/10 border-warning-500/25', icon: <AlertTriangle size={12} /> },
  'Off Track': { color: 'text-danger-500',  bg: 'bg-danger-500/10 border-danger-500/25',   icon: <TrendingDown size={12} /> },
  'Completed': { color: 'text-brand-500',   bg: 'bg-brand-500/10 border-brand-500/25',     icon: <CheckCircle2 size={12} /> },
};

// ── Custom Tooltip for Charts ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">{typeof p.value === 'number' && p.name?.includes('$') ? fmt$(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const CEODashboard: React.FC = () => {
  const { departments, projects, tasks, users, getDepartmentHealth, setActiveDepartment, resetToDefaults } = useDemoStore();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => { resetToDefaults(); setIsResetting(false); }, 1200);
  };

  // ── Computed headline metrics ──────────────────────────────────────────────
  const totalBudget = projects.reduce((s, p) => s + p.budgetAmount, 0);
  const totalSpent  = tasks.reduce((s, t) => s + t.spentAmount, 0);
  const budgetPct   = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const totalHrsBudget = projects.reduce((s, p) => s + p.budgetHrs, 0);
  const totalHrsSpent  = tasks.reduce((s, t) => s + t.actualHrs, 0);
  const hrsPct         = totalHrsBudget > 0 ? Math.round((totalHrsSpent / totalHrsBudget) * 100) : 0;
  const doneTasks      = tasks.filter(t => t.status === 'Done').length;
  const atRiskProjects = projects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const mainDepts = departments.filter(d => d.id !== 'dept-exec');

  const workloadData = mainDepts.map(dept => {
    const deptUsers = users.filter(u => u.departmentId === dept.id);
    const totalAllocated = deptUsers.reduce((s, u) => {
      const activeTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'Done');
      return s + activeTasks.reduce((a, t) => a + t.estimatedHrs, 0);
    }, 0);
    const totalCapacity = deptUsers.reduce((s, u) => s + u.capacityHrs, 0);
    return { name: dept.name, 'Hours Used': totalAllocated, 'Capacity': totalCapacity, color: dept.color };
  });

  const budgetData = mainDepts.map(dept => {
    const health = getDepartmentHealth(dept.id);
    return { name: dept.name, 'Budget': health.totalBudget, 'Spent': health.spentBudget, color: dept.color };
  });

  const radarData = mainDepts.map(dept => {
    const health = getDepartmentHealth(dept.id);
    return { dept: dept.name, Efficiency: health.efficiency };
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time across all {mainDepts.length} departments · {projects.length} active projects</p>
        </div>
        <button
          onClick={handleReset}
          className="glass-btn text-xs gap-1.5 border-white/5 hover:border-white/15"
          title="Reset to demo defaults"
        >
          <RefreshCw size={12} className={isResetting ? 'animate-spin' : ''} />
          Reset Demo
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={<DollarSign size={16} />} label="Budget Used" value={fmt$(totalSpent)} sub={`of ${fmt$(totalBudget)} · ${fmtPct(budgetPct)}`} trend={budgetPct > 80 ? 'danger' : 'ok'} />
        <KPICard icon={<Clock size={16} />} label="Hours Consumed" value={`${totalHrsSpent}h`} sub={`of ${totalHrsBudget}h · ${fmtPct(hrsPct)}`} trend={hrsPct > 85 ? 'warn' : 'ok'} />
        <KPICard icon={<CheckCircle2 size={16} />} label="Tasks Completed" value={String(doneTasks)} sub={`of ${tasks.length} total tasks`} trend="ok" />
        <KPICard icon={<AlertTriangle size={16} />} label="Projects at Risk" value={String(atRiskProjects)} sub={`of ${projects.length} projects`} trend={atRiskProjects > 0 ? 'danger' : 'ok'} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workload Bar Chart */}
        <ChartPanel title="Team Workload vs Capacity" subtitle="Hours (active tasks)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workloadData} barGap={4} barCategoryGap="35%">
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Capacity" fill="#1b1b1e" radius={[3, 3, 0, 0]} name="Capacity" />
              <Bar dataKey="Hours Used" radius={[3, 3, 0, 0]} name="Hours Used">
                {workloadData.map((entry, i) => {
                  const isOver = entry['Hours Used'] > entry['Capacity'];
                  return <Cell key={i} fill={isOver ? '#ef4444' : entry.color} fillOpacity={0.85} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Efficiency Radar */}
        <ChartPanel title="Dept. Efficiency Score" subtitle="Based on budget & completion rate">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="dept" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Radar dataKey="Efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* ── Budget Bar Chart ── */}
      <ChartPanel title="Budget: Allocated vs. Spent" subtitle="By Department (USD)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={budgetData} barGap={4} barCategoryGap="35%">
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => fmt$(v)} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="Budget" fill="rgba(255,255,255,0.06)" radius={[3, 3, 0, 0]} name="Budget $" />
            <Bar dataKey="Spent" radius={[3, 3, 0, 0]} name="Spent $">
              {budgetData.map((entry, i) => {
                const isOver = entry['Spent'] > entry['Budget'];
                return <Cell key={i} fill={isOver ? '#ef4444' : entry.color} fillOpacity={0.85} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      {/* ── Department Cards (Drill-down) ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Department Status · Click to Drill Down</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mainDepts.map(dept => (
            <DeptCard key={dept.id} deptId={dept.id} onDrillDown={() => setActiveDepartment(dept.id)} />
          ))}
        </div>
      </div>

      {/* ── Project Risk Table ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">All Projects · Status Overview</h2>
        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Project</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Dept</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Budget</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Used</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                const dept = departments.find(d => d.id === proj.departmentId);
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const spent = projTasks.reduce((s, t) => s + t.spentAmount, 0);
                const hrsUsed = projTasks.reduce((s, t) => s + t.actualHrs, 0);
                const cfg = PROJECT_STATUS_CONFIG[proj.status] ?? PROJECT_STATUS_CONFIG['On Track'];
                return (
                  <tr key={proj.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-2.5 font-medium text-gray-200">{proj.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${dept?.color}22`, color: dept?.color }}>
                        {dept?.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}{proj.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{fmt$(proj.budgetAmount)}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${spent > proj.budgetAmount ? 'text-danger-500' : 'text-gray-300'}`}>
                      {fmt$(spent)}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${hrsUsed > proj.budgetHrs ? 'text-danger-500' : 'text-gray-400'}`}>
                      {hrsUsed}/{proj.budgetHrs}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const KPICard = ({ icon, label, value, sub, trend }: {
  icon: React.ReactNode; label: string; value: string; sub: string; trend: 'ok' | 'warn' | 'danger';
}) => {
  const colors = { ok: 'text-success-500', warn: 'text-warning-500', danger: 'text-danger-500' };
  const iconBgs = { ok: 'bg-success-500/10', warn: 'bg-warning-500/10', danger: 'bg-danger-500/10' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 flex flex-col gap-3 border-white/5"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgs[trend]} ${colors[trend]}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        <p className={`text-xs mt-0.5 ${colors[trend]}`}>{sub}</p>
      </div>
    </motion.div>
  );
};

const ChartPanel = ({ title, subtitle, children, className = '' }: {
  title: string; subtitle: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`glass-panel rounded-xl p-4 ${className}`}>
    <p className="text-sm font-semibold text-gray-200">{title}</p>
    <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
    {children}
  </div>
);

const DeptCard = ({ deptId, onDrillDown }: { deptId: string; onDrillDown: () => void }) => {
  const { departments, projects, users, getDepartmentHealth } = useDemoStore();
  const dept = departments.find(d => d.id === deptId);
  const health = getDepartmentHealth(deptId);
  const deptProjects = projects.filter(p => p.departmentId === deptId);
  const deptUsers = users.filter(u => u.departmentId === deptId);
  if (!dept) return null;

  const atRisk = deptProjects.filter(p => p.status === 'At Risk' || p.status === 'Off Track').length;
  const budgetRatio = health.totalBudget > 0 ? health.spentBudget / health.totalBudget : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onDrillDown}
      className="glass-panel rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-all hover:border-white/10 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ background: dept.color, boxShadow: `0 0 8px ${dept.color}80` }} />
          <span className="font-semibold text-gray-100">{dept.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {atRisk > 0 && (
            <span className="text-xs text-warning-500 bg-warning-500/10 px-2 py-0.5 rounded-full border border-warning-500/20">
              {atRisk} at risk
            </span>
          )}
          <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat label="Projects" value={deptProjects.length} />
        <Stat label="Team" value={deptUsers.length} />
        <Stat label="Efficiency" value={`${health.efficiency}%`} highlight={health.efficiency > 70 ? 'ok' : health.efficiency > 40 ? 'warn' : 'danger'} />
      </div>

      {/* Budget mini-bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Budget</span>
          <span className={budgetRatio > 1 ? 'text-danger-500' : 'text-gray-400'}>{fmt$(health.spentBudget)} / {fmt$(health.totalBudget)}</span>
        </div>
        <div className="h-1.5 bg-base-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(budgetRatio * 100, 100)}%`,
              background: budgetRatio > 1 ? '#ef4444' : dept.color,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const Stat = ({ label, value, highlight }: { label: string; value: string | number; highlight?: 'ok' | 'warn' | 'danger' }) => {
  const c = highlight ? { ok: 'text-success-500', warn: 'text-warning-500', danger: 'text-danger-500' }[highlight] : 'text-gray-100';
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${c}`}>{value}</p>
    </div>
  );
};
